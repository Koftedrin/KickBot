const { Kick } = require('kick.js');
const axios = require('axios');

// --- КОНФИГУРАЦИЯ ИЗ ПЕРЕМЕННЫХ ОКРУЖЕНИЯ RENDER ---
const KICK_CHANNEL_NAME = process.env.KICK_CHANNEL_NAME;
const KICK_SESSION_TOKEN = process.env.KICK_SESSION_TOKEN;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

// Проверка, что все переменные заданы в Render
if (!KICK_CHANNEL_NAME || !KICK_SESSION_TOKEN || !N8N_WEBHOOK_URL) {
    console.error('❌ ОШИБКА: Одна или несколько переменных окружения (KICK_CHANNEL_NAME, KICK_SESSION_TOKEN, N8N_WEBHOOK_URL) не заданы в настройках Render!');
    process.exit(1); // Завершаем работу, если нет конфигурации
}

async function startBot() {
    try {
        // Авторизуемся под аккаунтом бота, используя токен
        const client = new Kick({
            token: decodeURIComponent(KICK_SESSION_TOKEN),
            log: false,
        });

        client.on('ready', () => {
            console.log('✅ Бот успешно авторизован.');
        });

        client.on('error', (error) => {
            console.error('❌ Ошибка клиента Kick.js:', error.message);
        });

        console.log(`[INFO] Подключение к каналу: ${KICK_CHANNEL_NAME}...`);
        
        const channel = await client.api.channel(KICK_CHANNEL_NAME);
        if (!channel) {
            console.error(`❌ Не удалось найти канал "${KICK_CHANNEL_NAME}". Проверьте правильность названия.`);
            return;
        }

        console.log(`[OK] Успешно подключен к чату канала ID: ${channel.id}`);

        // Слушаем сообщения
        channel.on('message', (message) => {
            const senderUsername = message.sender.username;
            const messageContent = message.content;

            console.log(`[${senderUsername}]: ${messageContent}`);

            // Отправляем данные в n8n
            axios.post(N8N_WEBHOOK_URL, {
                channel_id: channel.id,
                sender_username: senderUsername,
                message: messageContent
            }).catch(err => {
                console.error('❌ Ошибка отправки данных в n8n:', err.message);
            });
        });

    } catch (e) {
        console.error("Критическая ошибка при запуске бота:", e.message);
    }
}

startBot();
