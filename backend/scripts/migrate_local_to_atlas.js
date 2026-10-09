import "dotenv/config";
import mongoose from "mongoose";
import dns from "node:dns";

const SOURCE_URI =
  process.env.MIGRATION_SOURCE_URI ||
  "mongodb://127.0.0.1:27017/skillcert_ai";
const TARGET_URI = process.env.MIGRATION_TARGET_URI;

async function runMigration() {
  if (!TARGET_URI) {
    throw new Error(
      "MIGRATION_TARGET_URI backend/.env me set karein. Atlas URI code me hard-code na karein."
    );
  }

  console.log("==================================================");
  console.log("Starting Migration from Local MongoDB to MongoDB Atlas...");
  console.log("==================================================");

  // 1. Connect to Local MongoDB
  let localConn;
  try {
    localConn = await mongoose.createConnection(SOURCE_URI, {
      serverSelectionTimeoutMS: 5000,
    }).asPromise();
    console.log("✓ Connected to Local MongoDB");
  } catch (err) {
    console.error("Local MongoDB connection failed:", err.message);
    process.exit(1);
  }

  // 2. Connect to Atlas MongoDB
  let atlasConn;
  try {
    dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
    atlasConn = await mongoose.createConnection(TARGET_URI, {
      serverSelectionTimeoutMS: 15000,
    }).asPromise();
    console.log("✓ Connected to Atlas MongoDB:", atlasConn.host);
  } catch (err) {
    console.error("Atlas MongoDB connection failed:", err.message);
    await localConn.close();
    process.exit(1);
  }

  try {
    const collections = await localConn.db.listCollections().toArray();
    console.log(`\nFound ${collections.length} collections in Local DB:`, collections.map(c => c.name));

    let totalMigratedDocs = 0;

    for (const colInfo of collections) {
      const colName = colInfo.name;
      if (colName.startsWith("system.")) continue;

      const localCol = localConn.db.collection(colName);
      const atlasCol = atlasConn.db.collection(colName);

      const docs = await localCol.find({}).toArray();

      if (docs.length === 0) {
        console.log(`\nCollection '${colName}' is empty (0 docs), skipping.`);
        continue;
      }

      console.log(`\nMigrating collection '${colName}' (${docs.length} documents)...`);

      // Upsert local records by _id; never wipe existing Atlas records.
      for (let offset = 0; offset < docs.length; offset += 500) {
        const batch = docs.slice(offset, offset + 500);
        const operations = batch.map((document) => ({
          replaceOne: {
            filter: { _id: document._id },
            replacement: document,
            upsert: true,
          },
        }));
        await atlasCol.bulkWrite(operations, {
          ordered: false,
        });
      }

      console.log(`✓ Copied ${docs.length} documents into Atlas collection '${colName}'`);
      totalMigratedDocs += docs.length;
    }

    console.log(`\n==================================================`);
    console.log(`🎉 ALL LOCAL DATA SUCCESSFULLY MIGRATED TO ATLAS!`);
    console.log(`Total Collections: ${collections.length}`);
    console.log(`Total Documents Migrated: ${totalMigratedDocs}`);
    console.log(`==================================================`);
  } catch (err) {
    console.error("Error during migration:", err);
  } finally {
    await localConn.close();
    await atlasConn.close();
    console.log("Closed all database connections.");
  }
}

runMigration();
