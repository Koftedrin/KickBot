const WebSocket = require("ws");
const axios = require("axios");

const sessionToken = "229957468%7CtrefP0GzQmXEw8wNQ7X8emI5LcbEw5HyhBQFYfWS";
const channel = "smauf"; // основной канал
const webhook = "https://sergeifrolov.app.n8n.cloud/webhook/9ca5226c-4baa-4b9e-8ccd-81ba2856a405";

const ws = new WebSocket("wss://chat.kick.com");

ws.on("open", () => {
  console.log("✅ Connected to Kick chat");

  // Авторизация от имени Skin and Bones
  ws.send(JSON.stringify({
    event: "auth",
    data: {
      token: decodeURIComponent(sessionToken),
    }
  }));

  // Присоединение к каналу smauf
  ws.send(JSON.stringify({
    event: "join",
    data: { room: channel }
  }));
});

ws.on("message", async (rawData) => {
  try {
    const msg = JSON.parse(rawData);

    if (msg.event === "message") {
      const { username, content } = msg.data;

      console.log(`${username}: ${content}`);

      if (content.toLowerCase() === "!стример") {
        sendChat("Стример Smauf сейчас с вами! Поддержите подпиской 💪");
      }

      if (content.toLowerCase().startsWith("!вопрос")) {
        const clean_message = content.replace("!вопрос", "").trim();

        try {
          await axios.post(webhook, {
            broadcaster_id: "smauf",
            sender_id: username,
            message: clean_message
          });
          console.log("📨 Вопрос отправлен в n8n");
        } catch (err) {
          console.error("❌ Ошибка при отправке в n8n:", err.message);
        }
      }
    }
  } catch (err) {
    console.error("💥 Ошибка обработки сообщения:", err.message);
  }
});

function sendChat(message) {
  ws.send(JSON.stringify({
    event: "message",
    data: {
      content: message,
      room: channel
    }
  }));
}

ws.on("close", () => {
  console.log("🔌 Disconnected from chat");
});

ws.on("error", (err) => {
  console.error("❌ Chat error:", err.message);
});
