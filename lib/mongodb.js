import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const options = {};
let client;
let clientPromise;

if (!uri) {
  clientPromise = Promise.resolve(null);
} else if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function getCollection(name) {
  const connected = await clientPromise;
  if (!connected) return null;
  const db = connected.db(process.env.MONGODB_DB || "dailykit");
  return db.collection(name);
}
