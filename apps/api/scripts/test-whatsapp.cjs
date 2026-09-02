const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const phoneNumberId = process.env.WHATSAPP_PHONE_ID || "1283754474826620";
const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
const to = "2250102273966"; 
const text = "Test Vendeur IA: Service WhatsApp opérationnel";

async function test() {
  console.log('Testing WhatsApp Cloud API connectivity...');
  try {
    const res = await axios.post(
      `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "text",
        text: { body: text },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log('SUCCESS:', res.data);
  } catch (error) {
    console.error('ERROR:', error.response ? error.response.data : error.message);
  }
}

test();


