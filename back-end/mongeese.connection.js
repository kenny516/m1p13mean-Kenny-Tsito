// mongeese.connection.js
import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";

dotenv?.config();

/**
 * Configuration mongeese-cli
 * Utilise MONGO_URI et DB_NAME depuis .env
 */
export async function getDbWithClient(dbName) {
  // Utiliser MONGO_URI du projet (ou fallback local)
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
  const client = new MongoClient(uri);

  await client.connect();

  // Utiliser le dbName passé en paramètre ou DB_NAME de .env
  const finalDbName = dbName || process.env.DB_NAME || "m1p13mean-kenny-tsito";
  const db = client.db(finalDbName);

  // Attacher le client pour les transactions
  db.client = client;

  return db;
}
