const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

async function check() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is undefined');
    
    console.log('Connecting to Atlas...');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ Connected!');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n--- DATA COUNTS ---');
    for (const coll of collections) {
      const count = await mongoose.connection.db.collection(coll.name).countDocuments();
      console.log(`- ${coll.name}: ${count}`);
    }
  } catch (err) {
    console.error('❌ ERROR:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

check();
