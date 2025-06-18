const { createClient } = require("@retconned/kick-js");
const axios = require("axios");
const express = require('express'); // Добавили express

// --- КОНФИГУРАЦИЯ ИЗ ПЕРЕМЕННЫХ ОКРУЖЕНИЯ RENDER ---
const KICK_CHANNEL_NAME = process.env.KICK_CHANNEL_NAME;
const BEARER_TOKEN = process.env.BEARER_TOKEN;
const COOKIES = process.env.COOKIES;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

// Проверка, что все переменные заданы
if (!KICK_CHANNEL_NAME || !BEARER_TOKEN || !COOKIES || !N8N_WEBHOOK_URL) {
    console.error('❌ ОШИБКА: Задайте все переменные в Render: KICK_CHANNEL_NAME, BEARER_TOKEN, COOKIES, N8N_WEBHOOK_URL');
    process.exit(1);
}

async function startBot() {
    try {
        // Создаем клиента для канала стримера
        const client = createClient(KICK_CHANNEL_NAME, {
            readOnly: false,
            puppeteer: {
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox'
                ]
            }
        });

        console.log('[INFO] Клиент создан. Попытка авторизации...');

        // Авторизуемся, используя токен и куки
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
        });

        client.on('close', () => {
            console.log('🔌 Соединение с чатом закрыто.');
        });
        
        client.on('error', (err) => {
            console.error('❌ Произошла ошибка:', err);
        });

        // Слушаем сообщения в чате
        client.on('ChatMessage', (message) => {
            const senderUsername = message.sender.username;
            const messageContent = message.content;

            console.log(`[${senderUsername}]: ${messageContent}`);

            // Отправляем данные в n8n
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
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot listener is alive!');
});

app.listen(port, () => {
  console.log(`[INFO] Web server started on port ${port} to keep Render happy.`);
});

// Запускаем основную логику бота
startBot();
