const { createClient } = require("@retconned/kick-js");
const axios = require("axios");

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
        // readOnly: false означает, что мы сможем писать в чат (через n8n)
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
            // client.user.tag содержит имя бота, под которым мы вошли
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
                // channel_id больше не нужен, так как n8n будет использовать API v1
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

startBot();
