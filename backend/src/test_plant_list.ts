import { connectDB } from './config/db';
import { plantService } from './services/plantService';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

async function testList() {
  await connectDB();
  try {
    const result = await plantService.list({ page: 1, limit: 20 });
    fs.writeFileSync('../tmp/test_result.txt', `Success! Found ${result.plants.length} plants.`);
  } catch (err) {
    fs.writeFileSync('../tmp/test_result.txt', `Error Object: ${err}\nMessage: ${err instanceof Error ? err.message : String(err)}\nStack: ${err instanceof Error ? err.stack : ''}`);
  }
  await mongoose.disconnect();
  process.exit();
}

testList();
