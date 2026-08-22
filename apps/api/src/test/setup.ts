import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach } from 'vitest';

let mongo: MongoMemoryServer;

beforeAll(async () => {
  if (!mongo) {
    mongo = await MongoMemoryServer.create();
  }
  const uri = mongo.getUri();
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
});

beforeEach(async () => {
  if (mongoose.connection.db) {
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
      await collection.deleteMany({});
    }
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongo) {
    await mongo.stop();
  }
});
