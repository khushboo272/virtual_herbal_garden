import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

async function check() {
  const URI = process.env.MONGODB_URI;
  const DB_NAME = process.env.MONGODB_DB_NAME;
  
  if (!URI) {
    console.error('MONGODB_URI not found');
    process.exit(1);
  }

  console.log(`Connecting to ${DB_NAME || 'default database'}...`);
  await mongoose.connect(URI, { dbName: DB_NAME });
  
  const collections = await mongoose.connection.db!.listCollections().toArray();
  console.log('--- Collection Counts ---');
  for (const coll of collections) {
    const count = await mongoose.connection.db!.collection(coll.name).countDocuments();
    console.log(`${coll.name}: ${count}`);
  }
  
  await mongoose.disconnect();
}

check();
