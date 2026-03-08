import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI is missing in .env.local");
}

const dbName = process.env.MONGODB_DB || "thejourney";

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (!global._mongoClientPromise) {
  const client = new MongoClient(uri);
  global._mongoClientPromise = client.connect();
}

const clientPromise = global._mongoClientPromise;

export const getDb = async () => {
  const client = await clientPromise;
  return client.db(dbName);
};
