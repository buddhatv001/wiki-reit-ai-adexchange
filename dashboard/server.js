const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({
    service: 'Wiki REIT AI Ad Exchange Dashboard',
    status: 'online',
    version: '1.0.0',
    endpoints: {
      prebid_server: 'http://prebid-server:8000',
      campaign_manager: 'http://campaign-manager:3000',
      analytics: 'http://kibana:5601',
    },
    brands: ['gourmet','mademoiselle','smartmoney','modernbride','familycircle'],
    message: 'Full React dashboard coming soon. Use Campaign Manager at :3000 for now.'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(4000, () => console.log('[Wiki REIT AI] Dashboard API on :4000'));
