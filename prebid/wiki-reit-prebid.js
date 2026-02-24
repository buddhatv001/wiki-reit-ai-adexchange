/**
 * ============================================================================
 * WIKI REIT AI - UNIVERSAL PREBID.JS HEADER BIDDING CONFIGURATION
 * Smart Money Media AI / Buddha Digital Temple
 * 
 * DEPLOY: Add this script tag to <head> of every site:
 * <script src="https://cdn.yourdomain.com/prebid/wiki-reit-prebid.js"></script>
 * 
 * SUPPORTED BRANDS: Gourmet, Mademoiselle, SmartMoney, Modern Bride, 
 *                   Family Circle, Blender, Ladies' Home Journal, 
 *                   Business 2.0, Teen People
 * ============================================================================
 */

// ============================================================================
// 1. BRAND CONFIGURATION - CPM floors & categories per magazine
// ============================================================================
const BRAND_CONFIG = {
  'gourmet': {
    name: 'Gourmet Magazine',
    siteId: 'gourmet-001',
    category: 'IAB8',  // Food & Drink
    floorCPM: 3.00,    // Premium niche = higher floor
    keywords: 'food,cooking,gourmet,recipes,fine dining,wine',
  },
  'mademoiselle': {
    name: 'Mademoiselle Magazine', 
    siteId: 'mademoiselle-001',
    category: 'IAB18',  // Style & Fashion
    floorCPM: 2.50,
    keywords: 'fashion,style,beauty,women,lifestyle',
  },
  'smartmoney': {
    name: 'SmartMoney Magazine',
    siteId: 'smartmoney-001', 
    category: 'IAB13',  // Personal Finance
    floorCPM: 5.00,    // Finance = highest CPMs
    keywords: 'finance,investing,money,stocks,wealth,retirement',
  },
  'modernbride': {
    name: 'Modern Bride Magazine',
    siteId: 'modernbride-001',
    category: 'IAB14',  // Society (Weddings)
    floorCPM: 4.00,    // Wedding industry = high CPMs
    keywords: 'wedding,bride,marriage,engagement,bridal',
  },
  'familycircle': {
    name: 'Family Circle Magazine',
    siteId: 'familycircle-001',
    category: 'IAB6',  // Family & Parenting
    floorCPM: 2.00,
    keywords: 'family,parenting,home,cooking,health,kids',
  },
  'blender': {
    name: 'Blender Magazine',
    siteId: 'blender-001',
    category: 'IAB1',  // Arts & Entertainment
    floorCPM: 1.50,
    keywords: 'music,entertainment,culture,artists,albums',
  },
  'ladieshomejournal': {
    name: "Ladies' Home Journal",
    siteId: 'lhj-001',
    category: 'IAB10',  // Home & Garden
    floorCPM: 2.00,
    keywords: 'home,women,lifestyle,cooking,health,family',
  },
  'business20': {
    name: 'Business 2.0 Magazine',
    siteId: 'biz20-001',
    category: 'IAB3',  // Business
    floorCPM: 4.50,    // Business/tech = high CPMs
    keywords: 'business,technology,innovation,startups,enterprise',
  },
  'teenpeople': {
    name: 'Teen People Magazine',
    siteId: 'teenpeople-001',
    category: 'IAB1',  // Arts & Entertainment  
    floorCPM: 1.00,    // Note: COPPA compliance required
    keywords: 'teens,culture,entertainment,music,fashion',
    coppa: true,        // Flag for COPPA compliance
  },
  // Default for Wiki REIT AI network sites
  'default': {
    name: 'Wiki REIT AI Network',
    siteId: 'wikireит-default',
    category: 'IAB1',
    floorCPM: 0.50,
    keywords: 'news,information,digital,media',
  }
};

// ============================================================================
// 2. AUTO-DETECT BRAND FROM DOMAIN
// ============================================================================
function detectBrand() {
  const hostname = window.location.hostname.toLowerCase();
  
  const domainMap = {
    'gourmet': 'gourmet',
    'mademoiselle': 'mademoiselle', 
    'smartmoney': 'smartmoney',
    'modernbride': 'modernbride',
    'familycircle': 'familycircle',
    'blender': 'blender',
    'ladieshomejournal': 'ladieshomejournal',
    'lhj': 'ladieshomejournal',
    'business2': 'business20',
    'biz20': 'business20',
    'teenpeople': 'teenpeople',
  };

  for (const [key, brand] of Object.entries(domainMap)) {
    if (hostname.includes(key)) return BRAND_CONFIG[brand];
  }
  
  return BRAND_CONFIG['default'];
}

const CURRENT_BRAND = detectBrand();

// ============================================================================
// 3. PREBID.JS INITIALIZATION
// ============================================================================
var pbjs = pbjs || {};
pbjs.que = pbjs.que || [];

pbjs.que.push(function() {
  
  // --------------------------------------------------------------------------
  // 3a. Server-Side Bidding Configuration (Prebid Server)
  // --------------------------------------------------------------------------
  pbjs.setConfig({
    
    // Server-to-server bidding via YOUR Prebid Server
    s2sConfig: [{
      accountId: 'wiki-reit-ai',
      bidders: ['appnexus', 'pubmatic', 'ix', 'rubicon', 'openx', 'criteo'],
      defaultVendor: 'appnexus',
      enabled: true,
      timeout: 1000,
      adapter: 'prebidServer',
      endpoint: {
        p1Consent: 'https://pbs.wikireit.ai/openrtb2/auction',
        noP1Consent: 'https://pbs.wikireит.ai/openrtb2/auction'
      },
      syncEndpoint: {
        p1Consent: 'https://pbs.wikireit.ai/cookie_sync',
        noP1Consent: 'https://pbs.wikireит.ai/cookie_sync'
      },
    }],

    // Price Granularity - capture precise bid values
    priceGranularity: {
      buckets: [
        { precision: 2, min: 0, max: 5, increment: 0.01 },
        { precision: 2, min: 5, max: 20, increment: 0.05 },
        { precision: 2, min: 20, max: 50, increment: 0.50 },
      ]
    },

    // Currency
    currency: {
      adServerCurrency: 'USD',
      defaultRates: { 'USD': { 'USD': 1 } }
    },

    // Timeouts
    bidderTimeout: 1500,
    
    // Dynamic Price Floors
    floors: {
      enforcement: { floorDeals: true },
      data: {
        currency: 'USD',
        schema: { fields: ['mediaType'] },
        values: {
          'banner': CURRENT_BRAND.floorCPM,
          'video': CURRENT_BRAND.floorCPM * 3,  // Video commands 3x
          'native': CURRENT_BRAND.floorCPM * 0.8,
        }
      }
    },

    // COPPA compliance for Teen People
    ...(CURRENT_BRAND.coppa ? { coppa: true } : {}),

    // First-Party Data - YOUR competitive advantage
    ortb2: {
      site: {
        name: CURRENT_BRAND.name,
        cat: [CURRENT_BRAND.category],
        keywords: CURRENT_BRAND.keywords,
        publisher: {
          name: 'Smart Money Media AI',
          domain: 'smartmoneymedia.ai',
          cat: [CURRENT_BRAND.category],
        },
        content: {
          language: 'en',
        }
      }
    },

    // User ID modules for cookieless future
    userSync: {
      userIds: [
        { name: 'unifiedId', params: { partner: 'wikireait' } },
        { name: 'id5Id', params: { partner: 1234 } },
        { name: 'pubCommonId' },
      ],
      syncDelay: 3000,
      syncsPerBidder: 5,
    },
  });

  // --------------------------------------------------------------------------
  // 3b. Ad Unit Definitions - Standard IAB sizes
  // --------------------------------------------------------------------------
  const adUnits = [
    {
      code: 'wiki-reit-leaderboard',
      mediaTypes: {
        banner: {
          sizes: [[728, 90], [970, 90], [970, 250]],
        }
      },
      bids: getBidders('leaderboard'),
    },
    {
      code: 'wiki-reit-rectangle',
      mediaTypes: {
        banner: {
          sizes: [[300, 250], [336, 280]],
        }
      },
      bids: getBidders('rectangle'),
    },
    {
      code: 'wiki-reit-sidebar',
      mediaTypes: {
        banner: {
          sizes: [[160, 600], [300, 600]],
        }
      },
      bids: getBidders('sidebar'),
    },
    {
      code: 'wiki-reit-mobile-banner',
      mediaTypes: {
        banner: {
          sizes: [[320, 50], [320, 100], [300, 250]],
        }
      },
      bids: getBidders('mobile'),
    },
    {
      code: 'wiki-reit-native',
      mediaTypes: {
        native: {
          title: { required: true, len: 100 },
          body: { required: true, len: 200 },
          image: { required: true, sizes: [300, 250] },
          sponsoredBy: { required: true },
          clickUrl: { required: true },
        }
      },
      bids: getBidders('native'),
    },
  ];

  // --------------------------------------------------------------------------
  // 3c. Bidder Configuration Function
  // --------------------------------------------------------------------------
  function getBidders(placement) {
    const bidders = [];

    // Xandr / AppNexus (client-side complement to server-side)
    bidders.push({
      bidder: 'appnexus',
      params: {
        placementId: `wikireит-${CURRENT_BRAND.siteId}-${placement}`,
      }
    });

    // PubMatic
    bidders.push({
      bidder: 'pubmatic',
      params: {
        publisherId: 'PUBMATIC_PUBLISHER_ID',  // Get from PubMatic
        adSlot: `${CURRENT_BRAND.siteId}_${placement}`,
      }
    });

    // Index Exchange
    bidders.push({
      bidder: 'ix',
      params: {
        siteId: 'INDEX_SITE_ID',  // Get from Index Exchange
        size: placement === 'leaderboard' ? [728, 90] : [300, 250],
      }
    });

    // OpenX
    bidders.push({
      bidder: 'openx',
      params: {
        unit: 'OPENX_UNIT_ID',  // Get from OpenX
        delDomain: 'OPENX_DEL_DOMAIN',
      }
    });

    // Sovrn
    bidders.push({
      bidder: 'sovrn',
      params: {
        tagid: 'SOVRN_TAG_ID',  // Get from Sovrn
      }
    });

    // Triplelift (great for native)
    if (placement === 'native' || placement === 'rectangle') {
      bidders.push({
        bidder: 'triplelift',
        params: {
          inventoryCode: `wikireait_${CURRENT_BRAND.siteId}_${placement}`,
        }
      });
    }

    return bidders;
  }

  // --------------------------------------------------------------------------
  // 3d. Run the Auction
  // --------------------------------------------------------------------------
  pbjs.addAdUnits(adUnits);

  pbjs.requestBids({
    bidsBackHandler: function(bidResponses) {
      // Send winning bids to Google Ad Manager
      initAdserver(bidResponses);
      
      // Log analytics to your Prebid Server
      logAnalytics(bidResponses);
    },
    timeout: 2000,
  });
});

// ============================================================================
// 4. GOOGLE AD MANAGER INTEGRATION
// ============================================================================
var googletag = googletag || {};
googletag.cmd = googletag.cmd || [];

function initAdserver(bidResponses) {
  if (pbjs.initAdserverSet) return;
  pbjs.initAdserverSet = true;

  googletag.cmd.push(function() {
    pbjs.que.push(function() {
      pbjs.setTargetingForGPTAsync();
      googletag.pubads().refresh();
    });
  });
}

// Failsafe timeout - show ads even if bids are slow
setTimeout(function() {
  if (!pbjs.initAdserverSet) {
    initAdserver({});
  }
}, 2500);

// ============================================================================
// 5. ANALYTICS & REVENUE TRACKING
// ============================================================================
function logAnalytics(bidResponses) {
  const analytics = {
    timestamp: new Date().toISOString(),
    brand: CURRENT_BRAND.name,
    siteId: CURRENT_BRAND.siteId,
    page: window.location.pathname,
    bids: [],
    totalBids: 0,
    winningBid: 0,
  };

  for (const [adUnit, bids] of Object.entries(bidResponses)) {
    if (bids && bids.bids) {
      bids.bids.forEach(bid => {
        analytics.bids.push({
          bidder: bid.bidderCode,
          cpm: bid.cpm,
          size: `${bid.width}x${bid.height}`,
          timeToRespond: bid.timeToRespond,
          won: bid.status === 'rendered',
        });
        analytics.totalBids++;
        if (bid.cpm > analytics.winningBid) {
          analytics.winningBid = bid.cpm;
        }
      });
    }
  }

  // Send to your analytics endpoint
  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      'https://analytics.wikireit.ai/prebid/event',
      JSON.stringify(analytics)
    );
  }
}

// ============================================================================
// 6. AD SLOT HTML TEMPLATES
// ============================================================================
/*
  Add these div elements where you want ads to appear on your pages:

  <!-- Leaderboard (top of page) -->
  <div id="wiki-reit-leaderboard"></div>

  <!-- Rectangle (in-content) -->
  <div id="wiki-reit-rectangle"></div>

  <!-- Sidebar (right rail) -->
  <div id="wiki-reit-sidebar"></div>

  <!-- Mobile Banner -->
  <div id="wiki-reit-mobile-banner"></div>

  <!-- Native Ad -->
  <div id="wiki-reit-native"></div>
*/

console.log(`[Wiki REIT AI] Prebid initialized for ${CURRENT_BRAND.name} | Floor: $${CURRENT_BRAND.floorCPM} CPM`);
