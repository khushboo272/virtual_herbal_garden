import { connectDB } from './config/db';
import { plantController } from './controllers/plantController';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

// Mock Request and Response
const req = {
  query: { page: 1, limit: 20 }
} as any;

const res = {
  status: function(code: number) { this.statusCode = code; return this; },
  json: function(data: any) { this.data = data; return this; }
} as any;

async function testList() {
  await connectDB();
  try {
    await plantController.list(req, res);
    fs.writeFileSync('../tmp/test_result_controller.txt', `Success! JSON stringified: ${JSON.stringify(res.data).substring(0, 500)}`);
  } catch (err) {
    fs.writeFileSync('../tmp/test_result_controller.txt', `Error Object: ${err}\nMessage: ${err instanceof Error ? err.message : String(err)}\nStack: ${err instanceof Error ? err.stack : ''}`);
  }
  await mongoose.disconnect();
  process.exit();
}

testList();
