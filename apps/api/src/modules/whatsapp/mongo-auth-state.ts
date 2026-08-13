import mongoose, { Schema, Document } from "mongoose";
import { AuthenticationCreds, AuthenticationState, SignalDataTypeMap, initAuthCreds, BufferJSON } from "@whiskeysockets/baileys";

export interface IWhatsAppSession extends Document {
  sessionId: string;
  key: string;
  value: string; // JSON stringified data with BufferJSON
  updatedAt: Date;
}

const WhatsAppSessionSchema = new Schema<IWhatsAppSession>(
  {
    sessionId: { type: String, required: true, index: true },
    key: { type: String, required: true },
    value: { type: String, required: true },
  },
  { timestamps: true }
);

WhatsAppSessionSchema.index({ sessionId: 1, key: 1 }, { unique: true });

export const WhatsAppSessionModel = mongoose.model<IWhatsAppSession>(
  "WhatsAppSession",
  WhatsAppSessionSchema
);

export async function useMongoAuthState(sessionId: string): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }> {
  const writeData = async (data: any, key: string) => {
    try {
      const value = JSON.stringify(data, BufferJSON.replacer);
      await WhatsAppSessionModel.updateOne(
        { sessionId, key },
        { $set: { value, updatedAt: new Date() } },
        { upsert: true }
      );
    } catch (error) {
      console.error(`[MongoAuthState] Error writing key ${key} for session ${sessionId}:`, error);
    }
  };

  const readData = async (key: string) => {
    try {
      const doc = await WhatsAppSessionModel.findOne({ sessionId, key }).lean();
      if (!doc || !doc.value) return null;
      return JSON.parse(doc.value, BufferJSON.reviver);
    } catch (error) {
      console.error(`[MongoAuthState] Error reading key ${key} for session ${sessionId}:`, error);
      return null;
    }
  };

  const removeData = async (key: string) => {
    try {
      await WhatsAppSessionModel.deleteOne({ sessionId, key });
    } catch (error) {
      console.error(`[MongoAuthState] Error removing key ${key} for session ${sessionId}:`, error);
    }
  };

  const credsKey = "creds";
  const storedCreds = await readData(credsKey);
  const creds: AuthenticationCreds = storedCreds || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type: keyof SignalDataTypeMap, ids: string[]) => {
          const data: { [id: string]: any } = {};
          await Promise.all(
            ids.map(async (id) => {
              const value = await readData(`${type}-${id}`);
              if (type === "app-state-sync-key" && value) {
                data[id] = value;
              } else if (value) {
                data[id] = value;
              }
            })
          );
          return data;
        },
        set: async (data: any) => {
          const tasks: Promise<void>[] = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const key = `${category}-${id}`;
              if (value) {
                tasks.push(writeData(value, key));
              } else {
                tasks.push(removeData(key));
              }
            }
          }
          await Promise.all(tasks);
        },
      },
    },
    saveCreds: async () => {
      await writeData(creds, credsKey);
    },
  };
}

export async function clearMongoAuthState(sessionId: string): Promise<void> {
  try {
    await WhatsAppSessionModel.deleteMany({ sessionId });
    console.log(`[MongoAuthState] Cleared session data for ${sessionId}`);
  } catch (error) {
    console.error(`[MongoAuthState] Failed to clear session data for ${sessionId}:`, error);
  }
}
