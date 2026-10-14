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
    const collection = await getCollection("notes");
    if (!collection) return NextResponse.json({ error: "MongoDB is not configured" }, { status: 503 });
    const notes = await collection.find({ clientId }).sort({ updatedAt: -1 }).limit(200).toArray();
    return NextResponse.json({ notes: notes.map(({ _id, ...note }) => ({ id: String(_id), ...note })) });
  } catch {
    return NextResponse.json({ error: "Could not load notes. Check MongoDB configuration." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { clientId, title, content } = body || {};
    if (!validClientId(clientId) || typeof title !== "string" || typeof content !== "string") {
      return NextResponse.json({ error: "Invalid note data" }, { status: 400 });
    }
    if (title.length > 180 || content.length > 50000) return NextResponse.json({ error: "Note is too large" }, { status: 413 });
    const collection = await getCollection("notes");
    if (!collection) return NextResponse.json({ error: "MongoDB is not configured" }, { status: 503 });
    const doc = { clientId, title: title.trim() || "Untitled note", content, updatedAt: new Date() };
    const result = await collection.insertOne(doc);
    return NextResponse.json({ note: { id: String(result.insertedId), ...doc } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not save note" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { clientId, id, title, content } = body || {};
    if (!validClientId(clientId) || typeof id !== "string" || typeof title !== "string" || typeof content !== "string") {
      return NextResponse.json({ error: "Invalid note data" }, { status: 400 });
    }
    if (title.length > 180 || content.length > 50000) return NextResponse.json({ error: "Note is too large" }, { status: 413 });
    const { ObjectId } = await import("mongodb");
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid note ID" }, { status: 400 });
    const collection = await getCollection("notes");
    if (!collection) return NextResponse.json({ error: "MongoDB is not configured" }, { status: 503 });
    const result = await collection.updateOne({ _id: new ObjectId(id), clientId }, { $set: { title: title.trim() || "Untitled note", content, updatedAt: new Date() } });
    if (!result.matchedCount) return NextResponse.json({ error: "Note not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not update note" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    const { clientId, id } = body || {};
    if (!validClientId(clientId) || typeof id !== "string") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    const { ObjectId } = await import("mongodb");
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid note ID" }, { status: 400 });
    const collection = await getCollection("notes");
    if (!collection) return NextResponse.json({ error: "MongoDB is not configured" }, { status: 503 });
    await collection.deleteOne({ _id: new ObjectId(id), clientId });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not delete note" }, { status: 500 });
  }
}
