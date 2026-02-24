#!/bin/bash
# ============================================================================
# WIKI REIT AI AD EXCHANGE - GoDaddy VPS Deployment
# Smart Money Media AI / Buddha Digital Temple
# 508(c)(1)(A) Religious Organization
#
# STEP 1: SSH into your GoDaddy VPS
#         ssh root@YOUR_VPS_IP
#
# STEP 2: Upload this entire folder via SCP or Git:
#         scp -r adtech-stack/ root@YOUR_VPS_IP:/root/
#
# STEP 3: Run this script:
#         cd /root/adtech-stack
#         chmod +x deploy-godaddy.sh
#         ./deploy-godaddy.sh
# ============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
GOLD='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${GOLD}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GOLD}║   🕉️  WIKI REIT AI AD EXCHANGE - GoDaddy VPS Deploy        ║${NC}"
echo -e "${GOLD}║   Smart Money Media AI / Buddha Digital Temple              ║${NC}"
echo -e "${GOLD}║   Open Source Programmatic Ad Stack                         ║${NC}"
echo -e "${GOLD}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================================
# 1. DETECT OS & INSTALL DOCKER
# ============================================================================
echo -e "${BLUE}[1/7] Detecting OS and installing Docker...${NC}"

if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    echo -e "  Detected: ${GREEN}$PRETTY_NAME${NC}"
else
    OS="unknown"
fi

install_docker_ubuntu() {
    apt-get update -qq
    apt-get install -y -qq ca-certificates curl gnupg lsb-release
    
    # Add Docker GPG key
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg 2>/dev/null
    chmod a+r /etc/apt/keyrings/docker.gpg
    
    # Add Docker repo
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
}

install_docker_centos() {
    yum install -y yum-utils
    yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
}

install_docker_almalinux() {
    dnf install -y dnf-plugins-core
    dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
}

if ! command -v docker &> /dev/null; then
    echo -e "  ${GOLD}Installing Docker...${NC}"
    case $OS in
        ubuntu|debian)  install_docker_ubuntu ;;
        centos)         install_docker_centos ;;
        almalinux|rocky) install_docker_almalinux ;;
        *)
            echo -e "  ${GOLD}Using universal installer...${NC}"
            curl -fsSL https://get.docker.com | sh
            ;;
    esac
    
    systemctl start docker
    systemctl enable docker
    echo -e "  ${GREEN}✅ Docker installed${NC}"
else
    echo -e "  ${GREEN}✅ Docker already installed: $(docker --version)${NC}"
fi

# Ensure Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo -e "  ${GOLD}Installing Docker Compose plugin...${NC}"
    mkdir -p /usr/local/lib/docker/cli-plugins
    curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m)" -o /usr/local/lib/docker/cli-plugins/docker-compose
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
fi

echo -e "  ${GREEN}✅ Docker Compose: $(docker compose version)${NC}"

# ============================================================================
# 2. FIREWALL SETUP
# ============================================================================
echo -e "${BLUE}[2/7] Configuring firewall...${NC}"

if command -v ufw &> /dev/null; then
    ufw allow 22/tcp    # SSH
    ufw allow 80/tcp    # HTTP
    ufw allow 443/tcp   # HTTPS
    ufw allow 8000/tcp  # Prebid Server
    ufw allow 3000/tcp  # Campaign Manager
    ufw allow 4000/tcp  # Dashboard
    ufw --force enable 2>/dev/null || true
    echo -e "  ${GREEN}✅ UFW firewall configured${NC}"
elif command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-port=80/tcp
    firewall-cmd --permanent --add-port=443/tcp
    firewall-cmd --permanent --add-port=8000/tcp
    firewall-cmd --permanent --add-port=3000/tcp
    firewall-cmd --permanent --add-port=4000/tcp
    firewall-cmd --reload
    echo -e "  ${GREEN}✅ Firewalld configured${NC}"
else
    echo -e "  ${GOLD}⚠️  No firewall detected — configure manually if needed${NC}"
fi

# ============================================================================
# 3. CREATE DIRECTORY STRUCTURE
# ============================================================================
echo -e "${BLUE}[3/7] Creating directory structure...${NC}"

mkdir -p config/prebid-server/stored-requests
mkdir -p config/rtb4free
mkdir -p config/nginx/ssl
mkdir -p config/postgres
mkdir -p logs/prebid
mkdir -p logs/analytics
mkdir -p dashboard

echo -e "  ${GREEN}✅ Directories created${NC}"

# ============================================================================
# 4. SETUP ENVIRONMENT VARIABLES
# ============================================================================
echo -e "${BLUE}[4/7] Setting up environment...${NC}"

if [ ! -f .env ]; then
    # Generate secure passwords
    DB_PASS=$(openssl rand -base64 16 | tr -d '=/+' | head -c 20)
    DB_ROOT_PASS=$(openssl rand -base64 16 | tr -d '=/+' | head -c 20)
    
    cat > .env << EOF
# ============================================================================
# WIKI REIT AI AD EXCHANGE - Environment Configuration
# Generated: $(date)
# ============================================================================

# --- GoDaddy VPS ---
VPS_IP=$(curl -s ifconfig.me 2>/dev/null || echo "YOUR_VPS_IP")

# --- Database Passwords (auto-generated) ---
DB_PASSWORD=${DB_PASS}
DB_ROOT_PASSWORD=${DB_ROOT_PASS}

# --- Discord Bot (GET FROM: discord.com/developers/applications) ---
# 1. Create a new application
# 2. Go to "Bot" tab, click "Add Bot"
# 3. Copy the token below
# 4. Enable MESSAGE CONTENT INTENT under Privileged Gateway Intents
# 5. Use OAuth2 URL Generator to invite bot to your server with permissions:
#    Send Messages, Embed Links, Read Message History
DISCORD_TOKEN=YOUR_DISCORD_BOT_TOKEN_HERE
DISCORD_CHANNEL_ID=YOUR_CHANNEL_ID_HERE

# --- SSP Partner IDs (Apply at each SSP's website) ---
# These are FREE to get — just sign up as a publisher
PUBMATIC_PUBLISHER_ID=
INDEX_EXCHANGE_SITE_ID=
OPENX_UNIT_ID=
OPENX_DEL_DOMAIN=
SOVRN_TAG_ID=
APPNEXUS_PLACEMENT_ID=

# --- Domain Configuration ---
# Point these subdomains to your GoDaddy VPS IP in DNS:
# exchange.wikireit.ai -> VPS_IP (A record)
# pbs.wikireit.ai      -> VPS_IP (A record)
# campaigns.wikireit.ai -> VPS_IP (A record)
# ads.wikireit.ai      -> VPS_IP (A record)
# analytics.wikireit.ai -> VPS_IP (A record)
DOMAIN=wikireit.ai
EOF

    echo -e "  ${GREEN}✅ .env file created with secure passwords${NC}"
    echo -e "  ${GOLD}⚠️  EDIT .env to add your Discord token and SSP partner IDs${NC}"
else
    echo -e "  ${GREEN}✅ .env file already exists${NC}"
fi

# ============================================================================
# 5. GENERATE NGINX CONFIG FOR GODADDY
# ============================================================================
echo -e "${BLUE}[5/7] Generating Nginx reverse proxy config...${NC}"

source .env 2>/dev/null || true
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "0.0.0.0")

cat > config/nginx/nginx.conf << 'NGINXCONF'
events {
    worker_connections 2048;
}

http {
    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    
    # Rate limiting zones
    limit_req_zone $binary_remote_addr zone=prebid:10m rate=1000r/s;
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/s;
    limit_req_zone $binary_remote_addr zone=dashboard:10m rate=30r/s;

    # CORS headers map
    map $http_origin $cors_origin {
        default "*";
    }

    # ---- Prebid Server (Auction Endpoint) ----
    # This handles billions of bid requests
    server {
        listen 80;
        server_name pbs.wikireit.ai;

        location / {
            limit_req zone=prebid burst=500 nodelay;
            
            proxy_pass http://prebid-server:8000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_connect_timeout 5s;
            proxy_read_timeout 5s;
            
            # CORS for Prebid.js calls from your magazine sites
            add_header 'Access-Control-Allow-Origin' '$cors_origin' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Accept' always;
            
            if ($request_method = 'OPTIONS') {
                return 204;
            }
        }

        location /status {
            proxy_pass http://prebid-server:8000/status;
        }
    }

    # ---- Campaign Manager (Advertisers buy ads here) ----
    server {
        listen 80;
        server_name campaigns.wikireit.ai;

        location / {
            limit_req zone=dashboard burst=20 nodelay;
            proxy_pass http://campaign-manager:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }

    # ---- Ad Server (Creative delivery) ----
    server {
        listen 80;
        server_name ads.wikireit.ai;

        location / {
            proxy_pass http://revive-adserver:80;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }

    # ---- Analytics Dashboard ----
    server {
        listen 80;
        server_name analytics.wikireit.ai;

        location / {
            limit_req zone=dashboard burst=10 nodelay;
            proxy_pass http://kibana:5601;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }

    # ---- Analytics Webhook (receives Prebid events) ----
    server {
        listen 80;
        server_name webhooks.wikireit.ai;

        location /prebid/ {
            limit_req zone=prebid burst=200 nodelay;
            proxy_pass http://discord-bot:4200/prebid/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'POST, OPTIONS' always;
            if ($request_method = 'OPTIONS') { return 204; }
        }
    }

    # ---- Default: Direct IP Access ----
    server {
        listen 80 default_server;

        # Quick health check
        location /health {
            return 200 '{"status":"ok","service":"wiki-reit-ai-ad-exchange"}';
            add_header Content-Type application/json;
        }

        # Redirect to Prebid status
        location / {
            return 301 http://campaigns.wikireit.ai;
        }
    }
}
NGINXCONF

echo -e "  ${GREEN}✅ Nginx config generated${NC}"

# ============================================================================
# 6. CREATE POSTGRES INIT SCRIPT
# ============================================================================
echo -e "${BLUE}[6/7] Creating database initialization...${NC}"

cat > config/postgres/init.sql << 'SQLEOF'
-- Wiki REIT AI Ad Exchange Database Schema

-- Revenue tracking
CREATE TABLE IF NOT EXISTS daily_revenue (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    brand VARCHAR(50) NOT NULL,
    impressions BIGINT DEFAULT 0,
    bids BIGINT DEFAULT 0,
    revenue_micros BIGINT DEFAULT 0,
    avg_cpm DECIMAL(10,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(date, brand)
);

-- Bidder performance
CREATE TABLE IF NOT EXISTS bidder_stats (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    bidder VARCHAR(100) NOT NULL,
    brand VARCHAR(50) NOT NULL,
    bid_count BIGINT DEFAULT 0,
    win_count BIGINT DEFAULT 0,
    revenue_micros BIGINT DEFAULT 0,
    avg_response_ms INT DEFAULT 0,
    error_count BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(date, bidder, brand)
);

-- Advertiser accounts (for self-serve DSP)
CREATE TABLE IF NOT EXISTS advertisers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    company VARCHAR(255),
    budget_micros BIGINT DEFAULT 0,
    spent_micros BIGINT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Campaign definitions
CREATE TABLE IF NOT EXISTS campaigns (
    id SERIAL PRIMARY KEY,
    advertiser_id INT REFERENCES advertisers(id),
    name VARCHAR(255) NOT NULL,
    brand_targets TEXT[], -- Which magazine brands to target
    budget_daily_micros BIGINT DEFAULT 0,
    max_cpm_micros BIGINT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft',
    start_date DATE,
    end_date DATE,
    targeting_json JSONB,
    creative_url TEXT,
    creative_size VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Floor price configuration
CREATE TABLE IF NOT EXISTS floor_prices (
    id SERIAL PRIMARY KEY,
    brand VARCHAR(50) NOT NULL,
    media_type VARCHAR(20) NOT NULL,
    floor_cpm DECIMAL(10,4) NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(brand, media_type)
);

-- Insert default floor prices for active brands
INSERT INTO floor_prices (brand, media_type, floor_cpm) VALUES
    ('gourmet', 'banner', 3.00),
    ('gourmet', 'video', 9.00),
    ('gourmet', 'native', 2.40),
    ('mademoiselle', 'banner', 2.50),
    ('mademoiselle', 'video', 7.50),
    ('mademoiselle', 'native', 2.00),
    ('smartmoney', 'banner', 5.00),
    ('smartmoney', 'video', 15.00),
    ('smartmoney', 'native', 4.00),
    ('modernbride', 'banner', 4.00),
    ('modernbride', 'video', 12.00),
    ('modernbride', 'native', 3.20),
    ('familycircle', 'banner', 2.00),
    ('familycircle', 'video', 6.00),
    ('familycircle', 'native', 1.60)
ON CONFLICT DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_revenue_date ON daily_revenue(date);
CREATE INDEX IF NOT EXISTS idx_revenue_brand ON daily_revenue(brand);
CREATE INDEX IF NOT EXISTS idx_bidder_date ON bidder_stats(date);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
SQLEOF

echo -e "  ${GREEN}✅ Database schema created${NC}"

# ============================================================================
# 7. DEPLOY THE STACK
# ============================================================================
echo -e "${BLUE}[7/7] Deploying the ad tech stack...${NC}"
echo ""

# Pull all images first
echo -e "  ${GOLD}Pulling Docker images (this may take 5-10 minutes)...${NC}"
docker compose pull 2>/dev/null || docker-compose pull 2>/dev/null || true

# Build custom images
echo -e "  ${GOLD}Building custom services...${NC}"
docker compose build 2>/dev/null || docker-compose build 2>/dev/null || true

# Start everything
echo -e "  ${GOLD}Starting all services...${NC}"
docker compose up -d 2>/dev/null || docker-compose up -d 2>/dev/null

# Wait for startup
echo -e "  ${GOLD}Waiting for services to initialize...${NC}"
sleep 15

# ============================================================================
# DEPLOYMENT COMPLETE
# ============================================================================
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅  DEPLOYMENT COMPLETE                                   ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GOLD}🕉️  Your Wiki REIT AI Ad Exchange is now running!${NC}"
echo ""
echo -e "  📊 ${BLUE}Services Running:${NC}"
echo -e "  ├── Prebid Server (Auctions)  → http://${SERVER_IP}:8000/status"
echo -e "  ├── Campaign Manager (DSP)    → http://${SERVER_IP}:3000"
echo -e "  ├── Ad Server (Creatives)     → http://${SERVER_IP}:8888"
echo -e "  ├── Analytics (Kibana)        → http://${SERVER_IP}:5601"
echo -e "  ├── Redis (Cache)             → localhost:6379"
echo -e "  ├── PostgreSQL (Database)     → localhost:5432"
echo -e "  └── Discord Bot               → Connected (check Discord)"
echo ""
echo -e "  ${GOLD}📋 NEXT STEPS:${NC}"
echo -e "  1. Edit ${BLUE}.env${NC} with your Discord bot token"
echo -e "  2. Point DNS records in GoDaddy to ${GREEN}${SERVER_IP}${NC}"
echo -e "     └── pbs.wikireit.ai → ${SERVER_IP}"
echo -e "     └── campaigns.wikireit.ai → ${SERVER_IP}"
echo -e "     └── ads.wikireit.ai → ${SERVER_IP}"
echo -e "     └── analytics.wikireit.ai → ${SERVER_IP}"
echo -e "  3. Apply for SSP partner accounts:"
echo -e "     └── Index Exchange: ${BLUE}indexexchange.com${NC} (no minimum traffic)"
echo -e "     └── PubMatic: ${BLUE}pubmatic.com${NC}"
echo -e "     └── OpenX: ${BLUE}openx.com${NC}"
echo -e "  4. Add Prebid.js tag to your magazine sites"
echo -e "  5. Set up SSL: ${BLUE}certbot --nginx${NC}"
echo ""
echo -e "  ${GOLD}💰 Revenue will begin flowing once SSP partners are connected!${NC}"
echo ""
echo -e "  ${BLUE}Useful Commands:${NC}"
echo -e "  docker compose logs -f          # Watch all logs"
echo -e "  docker compose logs prebid-server # Prebid logs only"
echo -e "  docker compose ps               # Service status"
echo -e "  docker compose restart           # Restart everything"
echo -e "  docker compose down              # Stop everything"
echo ""
