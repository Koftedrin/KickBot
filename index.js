const { KickChat } = require('kick-chat');
const axios = require('axios');
const express = require('express');

// --- КОНФИГУРАЦИЯ ---
const KICK_CHANNEL_NAME = process.env.KICK_CHANNEL_NAME;
const KICK_SESSION_COOKIE = process.env.KICK_SESSION_COOKIE;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

if (!KICK_CHANNEL_NAME || !KICK_SESSION_COOKIE || !N8N_WEBHOOK_URL) {
    console.error('❌ ОШИБКА: Задай все переменные в разделе Secrets!');
    process.exit(1);
}

// --- ЗАПУСК БОТА (с правильным синтаксисом) ---
const client = new KickChat({
    kick_session: KICK_SESSION_COOKIE,

    onReady: () => {
        console.log('✅ Бот готов и слушает!');
        client.joinChannel(KICK_CHANNEL_NAME);
    },

    onError: (error) => {
        console.error('❌ Ошибка бота:', error);
    },

    onMessage: (message) => {
        console.log(`[${message.author.username}]: ${message.content}`);

        axios.post(N8N_WEBHOOK_URL, {
            channel_name: KICK_CHANNEL_NAME,
            sender_username: message.author.username,
            message: message.content
        }).catch(err => {
            console.error('❌ Ошибка отправки данных в n8n:', err.message);
        });
    }
});

// --- ВЕБ-СЕРВЕР ДЛЯ RENDER ---
const app = express();
app.get('/', (req, res) => {
  res.send('Bot listener is alive!');
});

app.listen(3000, () => {
  console.log('[INFO] Web server запущен.');
});
