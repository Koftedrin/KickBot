const Kick = require("kick.js");
const axios = require("axios");

const bot = new Kick.Bot({
  username: "SkinandBones",         // твой бот-аккаунт
  channel: "smauf",                 // основной канал
  joinChat: true,
});

const WEBHOOK_URL = "https://sergeifrolov.app.n8n.cloud/webhook/...."; // сюда вставь свой Webhook из n8n

bot.on("message", async (msg) => {
  if (!msg.content || !msg.sender) return;

  console.log(`[${msg.sender.username}]: ${msg.content}`);

  // Отправка текста в n8n
  try {
    await axios.post(WEBHOOK_URL, {
      username: msg.sender.username,
      message: msg.content,
    });
  } catch (err) {
    console.error("❌ Webhook error:", err.message);
  }
});

bot.connect().then(() => {
  console.log("✅ Бот подключён к чату Kick");
});
