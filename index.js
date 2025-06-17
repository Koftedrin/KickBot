const WebSocket = require('ws');
const axios = require('axios');

const channel = process.env.CHANNEL;
const webhookUrl = process.env.WEBHOOK_URL;

const getChannelId = async () => {
  const res = await axios.get(`https://kick.com/${channel}`);
  const match = res.data.match(/"channel_id":(\d+)/);
  if (!match) throw new Error('❌ Channel ID not found');
  return match[1];
};

getChannelId().then((channelId) => {
  const ws = new WebSocket(`wss://ir.kick.com/${channelId}`);

  ws.on('open', () => console.log('✅ Connected to Kick chat'));

  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data);
      if (msg.type === 'message') {
        const message = msg.data.content;
        if (message.startsWith('!')) {
          await axios.post(webhookUrl, { message });
          console.log('📤 Sent to n8n:', message);
        }
      }
    } catch (e) {
      console.error('❌ Message error:', e.message);
    }
  });

  ws.on('close', () => {
    console.log('🔌 Disconnected. Reconnecting in 5s...');
    setTimeout(() => process.exit(1), 5000); // Render auto-restart
  });

  ws.on('error', (err) => {
    console.error('❌ WebSocket error:', err.message);
  });
}).catch(err => {
  console.error('❌ Error:', err.message);
});
