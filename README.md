# 🕉️ WIKI REIT AI AD EXCHANGE
## Open Source Programmatic Advertising Stack
### Smart Money Media AI / Buddha Digital Temple | 508(c)(1)(A)

---

## What This Is

A complete, open-source programmatic advertising platform that replaces the need 
for third-party SSPs and DSPs. Deploy on your GoDaddy VPS and keep 100% of ad revenue 
across your entire network: 9 magazine brands, 3,000 publications, 100M+ sites.

## Architecture

```
[User visits GourmetMagazine.com]
         │
         ▼
[Prebid.js in page header]  ◄── Deployed on ALL your sites
         │
         ├──► Client-side bids (fast SSPs)
         │
         ▼
[YOUR Prebid Server]  ◄── Running on GoDaddy VPS
         │
         ├──► Server-side bids to 15+ SSPs/DSPs simultaneously
         │
         ▼
[Auction Engine]  ◄── Picks highest bidder
         │
         ▼
[Google Ad Manager]  ◄── Final decision: programmatic vs direct-sold
         │
         ▼
[Ad displays in ~200ms] ──► Revenue → Stripe → 508(c)(1)(A) accounts
         │
         ▼
[Discord Bot]  ◄── Real-time revenue alerts
```

## Components (ALL Open Source)

| Component | License | Purpose |
|-----------|---------|---------|
| Prebid.js | Apache 2.0 | Client-side header bidding (300+ adapters) |
| Prebid Server | Apache 2.0 | Server-side auctions (Go, Docker) |
| RTB4FREE | Open Source | DSP - Lets advertisers buy your inventory |
| Revive Adserver | GPL v2 | Ad creative serving & tracking |
| ELK Stack | Open Source | Analytics / Data Management Platform |
| Redis | BSD | High-speed bid caching |
| PostgreSQL | PostgreSQL | Campaign & revenue database |
| Nginx | BSD | Reverse proxy, SSL, rate limiting |
| Discord Bot | Custom | Revenue monitoring & alerts |

## Quick Start (GoDaddy VPS)

### Prerequisites
- GoDaddy VPS with root/SSH access (Ubuntu or AlmaLinux)
- At least 4GB RAM, 2 CPU cores recommended
- A domain with DNS access

### Deploy in 3 Commands

```bash
# 1. SSH into your GoDaddy VPS
ssh root@YOUR_VPS_IP

# 2. Upload or clone the stack
git clone https://github.com/YOUR_REPO/adtech-stack.git
cd adtech-stack

# 3. Run the deployment
chmod +x deploy-godaddy.sh
./deploy-godaddy.sh
```

### After Deployment

1. **Edit `.env`** with your Discord bot token and SSP partner IDs
2. **Point DNS** in GoDaddy to your VPS IP:
   - `pbs.wikireit.ai` → VPS IP
   - `campaigns.wikireit.ai` → VPS IP
   - `ads.wikireit.ai` → VPS IP
   - `analytics.wikireit.ai` → VPS IP
3. **Install SSL**: `certbot --nginx`
4. **Apply for SSP accounts** (free):
   - Index Exchange (no minimum traffic)
   - PubMatic
   - OpenX
   - Magnite
5. **Add Prebid.js** to your magazine sites (see `prebid/wiki-reit-prebid.js`)

## File Structure

```
adtech-stack/
├── deploy-godaddy.sh              # One-click GoDaddy deployment
├── docker-compose.yml             # All services orchestration
├── .env                           # Credentials (auto-generated)
├── README.md                      # This file
│
├── prebid/
│   └── wiki-reit-prebid.js        # Universal Prebid.js for all brands
│
├── discord-bot/
│   ├── bot.js                     # Discord revenue monitor
│   ├── package.json
│   └── Dockerfile
│
├── config/
│   ├── prebid-server/
│   │   ├── pbs.yaml               # Prebid Server config (15+ SSPs)
│   │   └── stored-requests/       # Pre-configured ad units per brand
│   ├── nginx/
│   │   └── nginx.conf             # Reverse proxy & rate limiting
│   └── postgres/
│       └── init.sql               # Database schema
│
└── logs/                          # Log storage
```

## Discord Bot Commands

| Command | Description |
|---------|-------------|
| `!revenue` | Today's revenue across all brands |
| `!revenue gourmet` | Revenue for Gourmet specifically |
| `!bids` | Live bid activity summary |
| `!topbidders` | Top SSP/DSP partners by revenue |
| `!health` | System health check |
| `!brands` | All brands with floor CPMs |
| `!weekly` | 7-day performance chart |
| `!help` | Show all commands |

## Brand Configuration

| Brand | Floor CPM | Category | Status |
|-------|-----------|----------|--------|
| Gourmet | $3.00 | Food & Drink | 🟢 Active |
| Mademoiselle | $2.50 | Fashion | 🟢 Active |
| SmartMoney | $5.00 | Finance | 🟢 Active |
| Modern Bride | $4.00 | Weddings | 🟢 Active |
| Family Circle | $2.00 | Family | 🟢 Active |
| Blender | $1.50 | Music | ⚪ Pending |
| Ladies' Home Journal | $2.00 | Home | ⚪ Pending |
| Business 2.0 | $4.50 | Business | ⚪ Pending |
| Teen People | $1.00 | Teen/COPPA | ⚪ Pending |

## Revenue Projections

| Scale | Monthly Impressions | Est. Monthly Revenue |
|-------|--------------------|--------------------|
| 5 Active Brands | 5M | $12,500 |
| All 9 Brands | 15M | $45,000 |
| + Wiki REIT Network (1K sites) | 50M | $100,000 |
| + Full 100M Network | 500M | $750,000 |

## Support

Built with 🕉️ by Buddha Digital Temple for the spiritual technology enterprise.

All core components are open source. You own everything.
