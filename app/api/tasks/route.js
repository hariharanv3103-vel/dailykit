import { NextResponse } from "next/server";
import { getCollection } from "../../../lib/mongodb";

export const runtime = "nodejs";

function validClientId(value) {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{8,100}$/.test(value);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId") || "";
  if (!validClientId(clientId)) return NextResponse.json({ error: "Valid clientId required" }, { status: 400 });
  try {
    const collection = await getCollection("tasks");
    if (!collection) return NextResponse.json({ error: "MongoDB is not configured" }, { status: 503 });
    const tasks = await collection.find({ clientId }).sort({ createdAt: -1 }).limit(500).toArray();
    return NextResponse.json({ tasks: tasks.map(({ _id, ...task }) => ({ id: String(_id), ...task })) });
  } catch {
    return NextResponse.json({ error: "Could not load tasks. Check MongoDB configuration." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { clientId, text, done = false, priority = "normal", dueDate = "" } = body || {};
    if (!validClientId(clientId) || typeof text !== "string" || !text.trim()) return NextResponse.json({ error: "Task text required" }, { status: 400 });
    if (text.length > 300) return NextResponse.json({ error: "Task text is too long" }, { status: 413 });
    const collection = await getCollection("tasks");
    if (!collection) return NextResponse.json({ error: "MongoDB is not configured" }, { status: 503 });
    const doc = { clientId, text: text.trim(), done: Boolean(done), priority: ["low", "normal", "high"].includes(priority) ? priority : "normal", dueDate: typeof dueDate === "string" ? dueDate.slice(0, 20) : "", createdAt: new Date(), updatedAt: new Date() };
    const result = await collection.insertOne(doc);
    return NextResponse.json({ task: { id: String(result.insertedId), ...doc } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not save task" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { clientId, id, done, text, priority, dueDate } = body || {};
    if (!validClientId(clientId) || typeof id !== "string") return NextResponse.json({ error: "Invalid task data" }, { status: 400 });
    const { ObjectId } = await import("mongodb");
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    const update = { updatedAt: new Date() };
    if (typeof done === "boolean") update.done = done;
    if (typeof text === "string" && text.trim() && text.length <= 300) update.text = text.trim();
    if (["low", "normal", "high"].includes(priority)) update.priority = priority;
    if (typeof dueDate === "string") update.dueDate = dueDate.slice(0, 20);
    const collection = await getCollection("tasks");
    if (!collection) return NextResponse.json({ error: "MongoDB is not configured" }, { status: 503 });
    const result = await collection.updateOne({ _id: new ObjectId(id), clientId }, { $set: update });
    if (!result.matchedCount) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not update task" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    const { clientId, id } = body || {};
    if (!validClientId(clientId) || typeof id !== "string") return NextResponse.json({ error: "Invalid task data" }, { status: 400 });
    const { ObjectId } = await import("mongodb");
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    const collection = await getCollection("tasks");
    if (!collection) return NextResponse.json({ error: "MongoDB is not configured" }, { status: 503 });
    await collection.deleteOne({ _id: new ObjectId(id), clientId });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not delete task" }, { status: 500 });
  }
}
