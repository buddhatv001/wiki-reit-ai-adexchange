# Wiki REIT AI Ad Exchange
### Open Source SSP + DSP + Prebid Programmatic Stack
**Buddha Digital Temple × Smart Money Media AI | 508(c)(1)(A)**

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/deploy?repo=https://github.com/buddhatv001/wiki-reit-ai-adexchange)

---

## Deploy in 3 Steps

### Option A — Railway (Recommended, fastest)
1. Click **Deploy on Railway** button above
2. Set `DISCORD_TOKEN` + `DISCORD_CHANNEL_ID` in Railway variables
3. Done — Discord bot live in ~3 minutes

### Option B — GoDaddy VPS (Full stack with all services)
```bash
ssh root@YOUR_VPS_IP
git clone https://github.com/buddhatv001/wiki-reit-ai-adexchange.git
cd wiki-reit-ai-adexchange
cp .env.example .env
nano .env   # Add DISCORD_TOKEN + DISCORD_CHANNEL_ID
chmod +x deploy-godaddy.sh
./deploy-godaddy.sh
```

### Option C — Mac mini (Local)
```bash
cd discord-bot
npm install
DISCORD_TOKEN=your_token DISCORD_CHANNEL_ID=your_channel node bot.js
```

---

## What's Included

| Service | Purpose | Port |
|---------|---------|------|
| **Prebid Server** | Server-side header bidding (Apache 2.0) | 8000 |
| **RTB4FREE DSP** | Open source demand-side platform | 8080 |
| **Campaign Manager** | Self-serve advertiser portal | 3000 |
| **Revive Adserver** | Ad creative serving | 8888 |
| **Dashboard** | Revenue command center (React) | 4000 |
| **Discord Bot** | Revenue alerts + commands | — |
| **Redis** | Bid caching | 6379 |
| **PostgreSQL** | Campaign data + revenue tracking | 5432 |
| **Elasticsearch** | Analytics DMP | 9200 |
| **Kibana** | Analytics dashboard | 5601 |
| **Nginx** | Reverse proxy + SSL | 80/443 |

---

## Discord Bot Commands
```
!revenue           — Today's revenue across all brands
!revenue gourmet   — Revenue for specific brand
!bids              — Live bid activity
!topbidders        — Top SSP/DSP partners
!health            — System health check
!brands            — All brands + CPM floors
!floor gourmet 3.5 — Update floor price
!weekly            — Weekly performance report
```

---

## DNS Setup (after VPS deploy)
Point these A records to your VPS IP in GoDaddy:
```
pbs.wikireit.ai         → VPS_IP
campaigns.wikireit.ai   → VPS_IP
ads.wikireit.ai         → VPS_IP
analytics.wikireit.ai   → VPS_IP
```

---

## Revenue Projections
| Tier | Properties | Daily Impressions | Daily Revenue |
|------|-----------|-------------------|---------------|
| Tier 1 (9 magazines) | 9 | 850K | $4,200 |
| Tier 2 (3,000 pubs) | 3,000 | 15M | $28,500 |
| Tier 3 (Wiki News) | 250 | 8M | $12,800 |
| Tier 4 (100M+ sites) | 100M+ | 500M | $187,500 |
| **TOTAL** | | **524M/day** | **$233,000/day** |

**Monthly:** $7M | **Annual:** $85M *(at full 4-tier scale)*

---

*Buddha Digital Temple × Smart Money Media AI | 508(c)(1)(A) Religious Organization*
