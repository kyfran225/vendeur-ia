const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const SystemSettingsSchema = new mongoose.Schema({
  metaConfig: {
    whatsappDefaults: {
      phoneNumberId: String,
      accessToken: String
    }
  }
});

const SystemSettingsModel = mongoose.model("SystemSettings", SystemSettingsSchema);

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vendeuria-local');
    const settings = await SystemSettingsModel.findOne();
    console.log('--- SYSTEM SETTINGS ---');
    console.log(JSON.stringify(settings, null, 2));
    console.log('--- ENV VALUES ---');
    console.log('WHATSAPP_PHONE_ID:', process.env.WHATSAPP_PHONE_ID);
    console.log('AI_MOCK_MODE:', process.env.AI_MOCK_MODE);
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

check();
