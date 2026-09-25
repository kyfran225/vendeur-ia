import axios from "axios";

async function main() {
  const baseUrl = "https://vendeuria-api.maatfeed.com";

  try {
    console.log("Attempting founder login with pin...");
    const loginRes = await axios.post(`${baseUrl}/api/auth/founder-login`, {
      phoneNumber: "2250505111157",
      pinOrPassword: "777888"
    });

    const accessToken = loginRes.data.accessToken;
    console.log("Login successful! User ID:", loginRes.data.user?.id || loginRes.data.user?._id, "Name:", loginRes.data.user?.displayName);

    const authHeaders = { headers: { Authorization: `Bearer ${accessToken}` } };

    console.log("\nCalling GET /api/copilot/suggestions?pageRoute=/admin...");
    try {
      const suggestionsAdmin = await axios.get(`${baseUrl}/api/copilot/suggestions?pageRoute=%2Fadmin`, authHeaders);
      console.log("Suggestions /admin SUCCESS:", suggestionsAdmin.data);
    } catch (err: any) {
      console.error("Suggestions /admin ERROR 500:", err.response?.status, err.response?.data || err.message);
    }

    console.log("\nCalling GET /api/copilot/suggestions?pageRoute=/settings...");
    try {
      const suggestionsSettings = await axios.get(`${baseUrl}/api/copilot/suggestions?pageRoute=%2Fsettings`, authHeaders);
      console.log("Suggestions /settings SUCCESS:", suggestionsSettings.data);
    } catch (err: any) {
      console.error("Suggestions /settings ERROR 500:", err.response?.status, err.response?.data || err.message);
    }

    console.log("\nCalling GET /api/commerce/knowledge...");
    try {
      const knowledge = await axios.get(`${baseUrl}/api/commerce/knowledge`, authHeaders);
      console.log("Knowledge SUCCESS:", knowledge.data?._id);
    } catch (err: any) {
      console.error("Knowledge ERROR 500:", err.response?.status, err.response?.data || err.message);
    }

  } catch (err: any) {
    console.error("Login Error:", err.response?.status, err.response?.data || err.message);
  }
}

main();
