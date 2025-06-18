const { createClient } = require("@retconned/kick-js");
const axios = require("axios");
const express = require('express');

let isBotReady = false; // Флаг готовности бота

// ... (весь остальной код бота без изменений) ...
const KICK_CHANNEL_NAME = process.env.KICK_CHANNEL_NAME;
const BEARER_TOKEN = process.env.BEARER_TOKEN;
const COOKIES = process.env.COOKIES;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

if (!KICK_CHANNEL_NAME || !BEARER_TOKEN || !COOKIES || !N8N_WEBHOOK_URL) {
    console.error('❌ ОШИБКА: Задайте все переменные в Render!');
    process.exit(1);
}

async function startBot() {
    try {
        const client = createClient(KICK_CHANNEL_NAME, {
            readOnly: false,
            puppeteer: {
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--single-process'
                ]
            }
        });

        console.log('[INFO] Клиент бота создан. Попытка авторизации...');

        await client.login({
            type: 'tokens',
            credentials: {
                bearerToken: BEARER_TOKEN,
                cookies: COOKIES,
            },
        });

        client.on('ready', () => {
            console.log(`✅ Бот успешно авторизован как ${client.user.tag}!`);
            console.log(`[INFO] Слушаем чат канала: ${KICK_CHANNEL_NAME}`);
            isBotReady = true; // <--- ПОДНИМАЕМ ФЛАГ
        });

        client.on('close', () => {
            console.log('🔌 Соединение с чатом закрыто.');
            isBotReady = false;
        });
        
        client.on('error', (err) => {
            console.error('❌ Произошла ошибка:', err);
        });

        client.on('ChatMessage', (message) => {
            const senderUsername = message.sender.username;
            const messageContent = message.content;

            console.log(`[${senderUsername}]: ${messageContent}`);

            axios.post(N8N_WEBHOOK_URL, {
                channel_name: KICK_CHANNEL_NAME,
                sender_username: senderUsername,
                message: messageContent
            }).catch(err => {
                console.error('❌ Ошибка отправки данных в n8n:', err.message);
            });
        });

    } catch (e) {
        console.error("❌ Критическая ошибка при запуске бота:", e.message);
    }
}

// --- ВЕБ-СЕРВЕР ДЛЯ RENDER ---
const app = express();
const port = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.send('Bot listener is alive!');
});

// СПЕЦИАЛЬНЫЙ ПУТЬ ДЛЯ ПРОВЕРКИ RENDER
app.get('/health', (req, res) => {
  if (isBotReady) {
    res.status(200).send('OK');
  } else {
    res.status(503).send('Bot not ready');
  }
});

app.listen(port, () => {
  console.log(`[INFO] Web server started on port ${port}.`);
  startBot();
});
