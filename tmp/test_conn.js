const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

async function test() {
  const uri = process.env.MONGODB_URI;
  console.log('Testing connection to:', uri.split('@')[1]); // Log host only for safety
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connection successful');
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    for (const coll of collections) {
      const count = await db.collection(coll.name).countDocuments();
      console.log(`${coll.name}: ${count}`);
    }
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    if (err.reason) console.error('Reason:', err.reason);
  } finally {
    process.exit(0);
  }
}

test();
