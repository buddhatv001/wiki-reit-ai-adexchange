/**
 * ============================================================================
 * WIKI REIT AI AD EXCHANGE - Discord Operations Bot
 * Smart Money Media AI / Buddha Digital Temple
 * 
 * COMMANDS:
 *   !revenue          - Today's revenue across all brands
 *   !revenue [brand]  - Revenue for specific brand
 *   !bids             - Live bid activity summary
 *   !topbidders       - Top performing SSP/DSP partners
 *   !health           - System health check
 *   !brands           - List all active brands & CPMs
 *   !floor [brand] [amount] - Update floor CPM for a brand
 *   !alert [threshold] - Set revenue alert threshold
 *   !weekly           - Weekly performance report
 * ============================================================================
 */

const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const Redis = require('ioredis');
const cron = require('node-cron');

// ============================================================================
// CONFIGURATION
// ============================================================================
const config = {
  discord: {
    token: process.env.DISCORD_TOKEN,
    channelId: process.env.DISCORD_CHANNEL_ID,
    alertChannelId: process.env.DISCORD_ALERT_CHANNEL_ID || process.env.DISCORD_CHANNEL_ID,
  },
  prebidServer: process.env.PREBID_SERVER_URL || 'http://prebid-server:8000',
  rtbBidder: process.env.RTB_BIDDER_URL || 'http://rtb-bidder:8080',
  redis: {
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  // Revenue alert: notify when daily revenue exceeds or drops below thresholds
  alerts: {
    dailyRevenueTarget: 500,    // $500/day target
    lowRevenueThreshold: 100,   // Alert if below $100
    highCPMAlert: 20,           // Alert on CPMs above $20
    bidErrorThreshold: 0.15,    // Alert if error rate > 15%
  }
};

// ============================================================================
// BRAND DATA (mirrors Prebid.js config)
// ============================================================================
const BRANDS = {
  gourmet:          { name: 'Gourmet',              emoji: '🍽️',  floor: 3.00, active: true },
  mademoiselle:     { name: 'Mademoiselle',          emoji: '👗',  floor: 2.50, active: true },
  smartmoney:       { name: 'SmartMoney',            emoji: '💰',  floor: 5.00, active: true },
  modernbride:      { name: 'Modern Bride',          emoji: '💍',  floor: 4.00, active: true },
  familycircle:     { name: 'Family Circle',         emoji: '👨‍👩‍👧‍👦', floor: 2.00, active: true },
  blender:          { name: 'Blender',               emoji: '🎵',  floor: 1.50, active: false },
  ladieshomejournal:{ name: "Ladies' Home Journal",  emoji: '🏡',  floor: 2.00, active: false },
  business20:       { name: 'Business 2.0',          emoji: '📊',  floor: 4.50, active: false },
  teenpeople:       { name: 'Teen People',           emoji: '⭐',  floor: 1.00, active: false },
};

// ============================================================================
// DISCORD CLIENT
// ============================================================================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

const redis = new Redis(config.redis);

// ============================================================================
// ANALYTICS DATA LAYER
// ============================================================================
class AdExchangeAnalytics {
  
  // Record a bid event (called by analytics webhook)
  async recordBid(data) {
    const today = new Date().toISOString().split('T')[0];
    const brand = data.brand || 'unknown';
    
    // Increment bid count
    await redis.hincrby(`bids:${today}`, brand, 1);
    await redis.hincrby(`bids:${today}`, 'total', 1);
    
    // Track revenue (winning bids only)
    if (data.won && data.cpm > 0) {
      const revenueMicros = Math.round(data.cpm * 1000); // Store as microdollars
      await redis.hincrby(`revenue:${today}`, brand, revenueMicros);
      await redis.hincrby(`revenue:${today}`, 'total', revenueMicros);
      
      // Track by bidder
      await redis.hincrby(`bidders:${today}`, data.bidder, revenueMicros);
    }
    
    // Track bid errors
    if (data.error) {
      await redis.hincrby(`errors:${today}`, brand, 1);
    }

    // Set 48-hour TTL on all daily keys
    await redis.expire(`bids:${today}`, 172800);
    await redis.expire(`revenue:${today}`, 172800);
    await redis.expire(`bidders:${today}`, 172800);
    await redis.expire(`errors:${today}`, 172800);
  }

  async getTodayRevenue(brand = null) {
    const today = new Date().toISOString().split('T')[0];
    if (brand) {
      const micros = parseInt(await redis.hget(`revenue:${today}`, brand) || '0');
      return micros / 1000;
    }
    const micros = parseInt(await redis.hget(`revenue:${today}`, 'total') || '0');
    return micros / 1000;
  }

  async getTodayBids(brand = null) {
    const today = new Date().toISOString().split('T')[0];
    if (brand) {
      return parseInt(await redis.hget(`bids:${today}`, brand) || '0');
    }
    return parseInt(await redis.hget(`bids:${today}`, 'total') || '0');
  }

  async getRevenueByBrand() {
    const today = new Date().toISOString().split('T')[0];
    const all = await redis.hgetall(`revenue:${today}`);
    const result = {};
    for (const [key, val] of Object.entries(all)) {
      if (key !== 'total') {
        result[key] = parseInt(val) / 1000;
      }
    }
    return result;
  }

  async getTopBidders() {
    const today = new Date().toISOString().split('T')[0];
    const all = await redis.hgetall(`bidders:${today}`);
    return Object.entries(all)
      .map(([bidder, micros]) => ({ bidder, revenue: parseInt(micros) / 1000 }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }

  async getWeeklyRevenue() {
    const results = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const micros = parseInt(await redis.hget(`revenue:${dateStr}`, 'total') || '0');
      results.push({ date: dateStr, revenue: micros / 1000 });
    }
    return results;
  }
}

const analytics = new AdExchangeAnalytics();

// ============================================================================
// DISCORD COMMAND HANDLERS
// ============================================================================

async function handleRevenue(message, args) {
  const brand = args[0]?.toLowerCase();
  
  if (brand && BRANDS[brand]) {
    const revenue = await analytics.getTodayRevenue(brand);
    const bids = await analytics.getTodayBids(brand);
    const avgCPM = bids > 0 ? (revenue / bids * 1000).toFixed(2) : '0.00';

    const embed = new EmbedBuilder()
      .setColor(0xD4AF37)
      .setTitle(`${BRANDS[brand].emoji} ${BRANDS[brand].name} - Today's Revenue`)
      .addFields(
        { name: '💵 Revenue', value: `$${revenue.toFixed(2)}`, inline: true },
        { name: '📊 Impressions', value: bids.toLocaleString(), inline: true },
        { name: '📈 Avg CPM', value: `$${avgCPM}`, inline: true },
        { name: '🔻 Floor CPM', value: `$${BRANDS[brand].floor.toFixed(2)}`, inline: true },
        { name: '🟢 Status', value: BRANDS[brand].active ? 'ACTIVE' : 'PENDING', inline: true },
      )
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }

  // All brands summary
  const totalRevenue = await analytics.getTodayRevenue();
  const totalBids = await analytics.getTodayBids();
  const byBrand = await analytics.getRevenueByBrand();

  let brandLines = '';
  for (const [key, brand] of Object.entries(BRANDS)) {
    const rev = byBrand[key] || 0;
    const status = brand.active ? '🟢' : '⚪';
    brandLines += `${status} ${brand.emoji} **${brand.name}**: $${rev.toFixed(2)}\n`;
  }

  const embed = new EmbedBuilder()
    .setColor(0x1B2A4A)
    .setTitle('📊 Wiki REIT AI Ad Exchange - Daily Revenue')
    .setDescription(`**Total Revenue: $${totalRevenue.toFixed(2)}**\n**Total Impressions: ${totalBids.toLocaleString()}**`)
    .addFields(
      { name: 'Revenue by Brand', value: brandLines || 'No data yet' },
      { name: '🎯 Daily Target', value: `$${config.alerts.dailyRevenueTarget} | ${((totalRevenue / config.alerts.dailyRevenueTarget) * 100).toFixed(0)}% achieved`, inline: false },
    )
    .setFooter({ text: 'Smart Money Media AI | 508(c)(1)(A)' })
    .setTimestamp();

  return message.reply({ embeds: [embed] });
}

async function handleBids(message) {
  const totalBids = await analytics.getTodayBids();
  const totalRevenue = await analytics.getTodayRevenue();
  const avgCPM = totalBids > 0 ? (totalRevenue / totalBids * 1000).toFixed(2) : '0.00';

  const embed = new EmbedBuilder()
    .setColor(0x2E5090)
    .setTitle('⚡ Live Bid Activity')
    .addFields(
      { name: 'Total Bids Today', value: totalBids.toLocaleString(), inline: true },
      { name: 'Revenue', value: `$${totalRevenue.toFixed(2)}`, inline: true },
      { name: 'Avg CPM', value: `$${avgCPM}`, inline: true },
      { name: 'Bid Rate', value: `${(totalBids / 24).toFixed(0)}/hour avg`, inline: true },
    )
    .setTimestamp();

  return message.reply({ embeds: [embed] });
}

async function handleTopBidders(message) {
  const topBidders = await analytics.getTopBidders();
  
  let bidderLines = '';
  topBidders.forEach((b, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
    bidderLines += `${medal} **${b.bidder}**: $${b.revenue.toFixed(2)}\n`;
  });

  const embed = new EmbedBuilder()
    .setColor(0xD4AF37)
    .setTitle('🏆 Top SSP/DSP Partners Today')
    .setDescription(bidderLines || 'No bid data yet')
    .setFooter({ text: 'Revenue contribution by demand partner' })
    .setTimestamp();

  return message.reply({ embeds: [embed] });
}

async function handleHealth(message) {
  let prebidStatus = '❌ Down';
  let rtbStatus = '❌ Down';

  try {
    const resp = await fetch(`${config.prebidServer}/status`);
    if (resp.ok) prebidStatus = '✅ Online';
  } catch (e) { /* offline */ }

  try {
    const resp = await fetch(`${config.rtbBidder}/info`);
    if (resp.ok) rtbStatus = '✅ Online';
  } catch (e) { /* offline */ }

  const redisInfo = await redis.info('server');
  const redisStatus = redisInfo ? '✅ Online' : '❌ Down';

  const embed = new EmbedBuilder()
    .setColor(prebidStatus.includes('✅') ? 0x00FF00 : 0xFF0000)
    .setTitle('🏥 System Health Check')
    .addFields(
      { name: 'Prebid Server', value: prebidStatus, inline: true },
      { name: 'RTB Bidder (DSP)', value: rtbStatus, inline: true },
      { name: 'Redis Cache', value: redisStatus, inline: true },
    )
    .setTimestamp();

  return message.reply({ embeds: [embed] });
}

async function handleBrands(message) {
  let lines = '';
  for (const [key, brand] of Object.entries(BRANDS)) {
    const status = brand.active ? '🟢 ACTIVE' : '⚪ PENDING';
    lines += `${brand.emoji} **${brand.name}** | Floor: $${brand.floor.toFixed(2)} CPM | ${status}\n`;
  }

  const embed = new EmbedBuilder()
    .setColor(0x1B2A4A)
    .setTitle('📰 Magazine Brands & Floor Prices')
    .setDescription(lines)
    .addFields(
      { name: 'Active Brands', value: `${Object.values(BRANDS).filter(b => b.active).length} / ${Object.keys(BRANDS).length}`, inline: true },
    )
    .setTimestamp();

  return message.reply({ embeds: [embed] });
}

async function handleWeekly(message) {
  const weekly = await analytics.getWeeklyRevenue();
  const totalWeek = weekly.reduce((sum, d) => sum + d.revenue, 0);

  let chart = '';
  const maxRev = Math.max(...weekly.map(d => d.revenue), 1);
  weekly.forEach(d => {
    const bars = Math.round((d.revenue / maxRev) * 20);
    const barStr = '█'.repeat(bars) + '░'.repeat(20 - bars);
    const dayName = new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });
    chart += `${dayName} ${barStr} $${d.revenue.toFixed(2)}\n`;
  });

  const embed = new EmbedBuilder()
    .setColor(0x2E5090)
    .setTitle('📅 Weekly Performance Report')
    .setDescription(`\`\`\`\n${chart}\`\`\``)
    .addFields(
      { name: '💰 Weekly Total', value: `$${totalWeek.toFixed(2)}`, inline: true },
      { name: '📈 Daily Average', value: `$${(totalWeek / 7).toFixed(2)}`, inline: true },
      { name: '🎯 Weekly Target', value: `$${(config.alerts.dailyRevenueTarget * 7).toFixed(2)}`, inline: true },
    )
    .setTimestamp();

  return message.reply({ embeds: [embed] });
}

// ============================================================================
// MESSAGE HANDLER
// ============================================================================
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/\s+/);
  const command = args.shift().toLowerCase();

  try {
    switch (command) {
      case 'revenue': return handleRevenue(message, args);
      case 'bids': return handleBids(message);
      case 'topbidders': return handleTopBidders(message);
      case 'health': return handleHealth(message);
      case 'brands': return handleBrands(message);
      case 'weekly': return handleWeekly(message);
      case 'help':
        const embed = new EmbedBuilder()
          .setColor(0xD4AF37)
          .setTitle('🤖 Wiki REIT AI Ad Exchange Bot')
          .setDescription([
            '`!revenue` - Today\'s revenue (all brands)',
            '`!revenue [brand]` - Revenue for specific brand',
            '`!bids` - Live bid activity',
            '`!topbidders` - Top SSP/DSP partners',
            '`!health` - System health check',
            '`!brands` - All brands & floor prices',
            '`!weekly` - Weekly performance report',
          ].join('\n'))
          .setFooter({ text: 'Smart Money Media AI | Buddha Digital Temple' });
        return message.reply({ embeds: [embed] });
    }
  } catch (err) {
    console.error(`Command error: ${command}`, err);
    message.reply('⚠️ Error processing command. Check system logs.');
  }
});

// ============================================================================
// SCHEDULED ALERTS
// ============================================================================

// Daily revenue report at 11 PM CT
cron.schedule('0 23 * * *', async () => {
  const channel = client.channels.cache.get(config.discord.channelId);
  if (!channel) return;

  const revenue = await analytics.getTodayRevenue();
  const bids = await analytics.getTodayBids();
  const byBrand = await analytics.getRevenueByBrand();

  let brandSummary = '';
  for (const [key, brand] of Object.entries(BRANDS)) {
    if (brand.active) {
      const rev = byBrand[key] || 0;
      brandSummary += `${brand.emoji} ${brand.name}: $${rev.toFixed(2)}\n`;
    }
  }

  const embed = new EmbedBuilder()
    .setColor(revenue >= config.alerts.dailyRevenueTarget ? 0x00FF00 : 0xFF9800)
    .setTitle('📊 Daily Revenue Report - End of Day')
    .setDescription(`**Total: $${revenue.toFixed(2)}** | ${bids.toLocaleString()} impressions`)
    .addFields(
      { name: 'By Brand', value: brandSummary || 'No active data' },
      { name: 'Target Status', value: revenue >= config.alerts.dailyRevenueTarget ? '✅ TARGET MET' : `⚠️ ${((revenue / config.alerts.dailyRevenueTarget) * 100).toFixed(0)}% of target` },
    )
    .setTimestamp();

  channel.send({ embeds: [embed] });
}, { timezone: 'America/Chicago' });

// Hourly check for low revenue
cron.schedule('0 * * * *', async () => {
  const hour = new Date().getHours();
  if (hour < 8 || hour > 22) return; // Only during business hours

  const revenue = await analytics.getTodayRevenue();
  const expectedByNow = (config.alerts.dailyRevenueTarget / 24) * hour;
  
  if (revenue < expectedByNow * 0.5) {
    const channel = client.channels.cache.get(config.discord.alertChannelId);
    if (channel) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('🚨 LOW REVENUE ALERT')
        .setDescription(`Revenue is significantly below pace.\n\n**Current:** $${revenue.toFixed(2)}\n**Expected by now:** $${expectedByNow.toFixed(2)}`)
        .setTimestamp();
      channel.send({ embeds: [embed] });
    }
  }
});

// ============================================================================
// BOT STARTUP
// ============================================================================
client.once('ready', () => {
  console.log(`[Wiki REIT AI] Discord bot online as ${client.user.tag}`);
  console.log(`[Wiki REIT AI] Monitoring ${Object.values(BRANDS).filter(b => b.active).length} active brands`);
  
  client.user.setActivity('Ad Exchange Revenue', { type: 3 }); // "Watching"
});

client.login(config.discord.token);

// ============================================================================
// ANALYTICS WEBHOOK RECEIVER (Express server for Prebid events)
// ============================================================================
const express = require('express');
const app = express();
app.use(express.json());

app.post('/prebid/event', async (req, res) => {
  try {
    const events = Array.isArray(req.body) ? req.body : [req.body];
    for (const event of events) {
      await analytics.recordBid(event);
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'wiki-reit-discord-bot' });
});

app.listen(4200, () => {
  console.log('[Wiki REIT AI] Analytics webhook listening on :4200');
});
