const WebSocket = require('ws');
const axios = require('axios');

const channel = process.env.CHANNEL;
const webhookUrl = process.env.WEBHOOK_URL;

axios.get(`https://kick.com/api/v1/channels/${channel}`, {
  headers: {
    'User-Agent': 'Mozilla/5.0',
    'Referer': `https://kick.com/${channel}`
  }
}).then(res => {
  const channelId = res.data.id;
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
    setTimeout(() => process.exit(1), 5000); // Render will auto-restart
  });

  ws.on('error', (err) => {
    console.error('❌ WebSocket error:', err.message);
  });
}).catch(err => {
  console.error('Channel ID error:', err.message);
});
