#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════
 * BDT AFFILIATE COMMERCE AGENT — Clone Blueprint #2
 * Cloned from: Future PLC (Hawk) + Dotdash Meredith
 * Amazon Associates Tag: buddhadigital-20
 * Revenue: $1–12 per click-through (varies by category)
 * ═══════════════════════════════════════════════════════════════
 * Usage:
 *   node affiliate-agent.js --brand gourmet --file article.html
 *   node affiliate-agent.js --brand modern_bride --text "article text"
 *   node affiliate-agent.js --batch --input-dir ./articles/ --brand smart_money
 * ═══════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

// ─── AMAZON ASSOCIATES TAG ─────────────────────────────────────────────────
const AMAZON_TAG = 'buddhadigital-20';
const AMAZON_BASE = `https://www.amazon.com/s?tag=${AMAZON_TAG}&k=`;

// ─── BRAND VERTICAL MAPPINGS ───────────────────────────────────────────────
// Each brand has: product keywords → Amazon search terms + affiliate programs
const BRAND_MAPPINGS = {

  gourmet: {
    name: 'Gourmet Magazine',
    programs: ['amazon', 'williams_sonoma', 'sur_la_table'],
    categories: {
      cookware: {
        keywords: ['cast iron', 'dutch oven', 'skillet', 'sauté pan', 'wok', 'stockpot', 'saucepan', 'baking sheet', 'roasting pan'],
        amazonSearch: (k) => `${k} cookware`,
        commission: '4-8%',
        template: (kw, url) => `<a href="${url}" class="bdt-affiliate" data-brand="gourmet" target="_blank" rel="noopener sponsored">${kw}</a>`
      },
      knives: {
        keywords: ['chef knife', 'bread knife', 'paring knife', 'santoku', 'cleaver', 'knife set', 'sharpening'],
        amazonSearch: (k) => `professional ${k}`,
        commission: '4-8%',
        template: (kw, url) => `<a href="${url}" class="bdt-affiliate" data-brand="gourmet" target="_blank" rel="noopener sponsored">${kw}</a>`
      },
      appliances: {
        keywords: ['stand mixer', 'food processor', 'blender', 'immersion blender', 'instant pot', 'air fryer', 'sous vide', 'coffee maker', 'espresso'],
        amazonSearch: (k) => `${k} kitchen`,
        commission: '4-8%',
        template: (kw, url) => `<a href="${url}" class="bdt-affiliate" data-brand="gourmet" target="_blank" rel="noopener sponsored">${kw}</a>`
      },
      wine: {
        keywords: ['wine', 'decanter', 'wine glasses', 'sommelier', 'corkscrew', 'wine rack', 'cellar', 'bordeaux', 'burgundy', 'chardonnay', 'cabernet'],
        amazonSearch: (k) => `${k} wine accessories`,
        commission: '4-8%',
        template: (kw, url) => `<a href="${url}" class="bdt-affiliate" data-brand="gourmet" target="_blank" rel="noopener sponsored">${kw}</a>`
      }
    }
  },

  modern_bride: {
    name: 'Modern Bride',
    programs: ['amazon', 'zola', 'anthropologie', 'nordstrom'],
    categories: {
      wedding_rings: {
        keywords: ['engagement ring', 'wedding band', 'diamond ring', 'solitaire', 'halo ring', 'eternity band', 'platinum ring', 'gold ring'],
        amazonSearch: (k) => `${k} jewelry`,
        commission: '4-8%',
        template: (kw, url) => `<a href="${url}" class="bdt-affiliate" data-brand="modern_bride" target="_blank" rel="noopener sponsored">${kw}</a>`
      },
      bridal_fashion: {
        keywords: ['bridesmaid dress', 'wedding veil', 'bridal shoes', 'bridal jewelry', 'wedding clutch', 'garter', 'bridal robe'],
        amazonSearch: (k) => `bridal ${k}`,
        commission: '4-8%',
        template: (kw, url) => `<a href="${url}" class="bdt-affiliate" data-brand="modern_bride" target="_blank" rel="noopener sponsored">${kw}</a>`
      },
      decor: {
        keywords: ['wedding centerpiece', 'table runner', 'candle holder', 'floral arrangement', 'wedding arch', 'photo booth', 'card box', 'unity candle'],
        amazonSearch: (k) => `wedding ${k}`,
        commission: '4-8%',
        template: (kw, url) => `<a href="${url}" class="bdt-affiliate" data-brand="modern_bride" target="_blank" rel="noopener sponsored">${kw}</a>`
      },
      honeymoon: {
        keywords: ['luggage', 'travel bag', 'honeymoon', 'passport holder', 'travel pillow', 'packing cubes'],
        amazonSearch: (k) => `${k} travel`,
        commission: '4-8%',
        template: (kw, url) => `<a href="${url}" class="bdt-affiliate" data-brand="modern_bride" target="_blank" rel="noopener sponsored">${kw}</a>`
      }
    }
  },

  smart_money: {
    name: 'Smart Money Media',
    programs: ['amazon', 'quickbooks', 'nerdwallet'],
    categories: {
      books: {
        keywords: ['investing', 'stock market', 'real estate', 'passive income', 'financial planning', 'retirement', 'tax strategy', 'wealth building', 'budgeting'],
        amazonSearch: (k) => `best books ${k}`,
        commission: '4-8%',
        template: (kw, url) => `<a href="${url}" class="bdt-affiliate" data-brand="smart_money" target="_blank" rel="noopener sponsored">${kw}</a>`
      },
      software: {
        keywords: ['accounting software', 'tax software', 'CRM', 'project management', 'payroll', 'invoicing', 'bookkeeping'],
        amazonSearch: (k) => `${k} business`,
        commission: '4-8%',
        template: (kw, url) => `<a href="${url}" class="bdt-affiliate" data-brand="smart_money" target="_blank" rel="noopener sponsored">${kw}</a>`
      },
      office: {
        keywords: ['standing desk', 'ergonomic chair', 'monitor', 'laptop', 'printer', 'scanner', 'shredder', 'filing cabinet', 'webcam', 'headset'],
        amazonSearch: (k) => `${k} home office`,
        commission: '4-8%',
        template: (kw, url) => `<a href="${url}" class="bdt-affiliate" data-brand="smart_money" target="_blank" rel="noopener sponsored">${kw}</a>`
      }
    }
  },

  blender: {
    name: 'Blender Magazine',
    programs: ['amazon', 'guitar_center', 'sweetwater'],
    categories: {
      instruments: {
        keywords: ['guitar', 'bass', 'drums', 'keyboard', 'piano', 'violin', 'saxophone', 'trumpet', 'ukulele', 'synthesizer'],
        amazonSearch: (k) => `${k} musical instrument`,
        commission: '4-8%',
        template: (kw, url) => `<a href="${url}" class="bdt-affiliate" data-brand="blender" target="_blank" rel="noopener sponsored">${kw}</a>`
      },
      audio: {
        keywords: ['headphones', 'speaker', 'microphone', 'audio interface', 'studio monitor', 'mixer', 'DAW', 'amp', 'pedal', 'vinyl'],
        amazonSearch: (k) => `${k} audio`,
        commission: '4-8%',
        template: (kw, url) => `<a href="${url}" class="bdt-affiliate" data-brand="blender" target="_blank" rel="noopener sponsored">${kw}</a>`
      },
      merch: {
        keywords: ['band shirt', 'concert ticket', 'music poster', 'vinyl record', 'CD', 'merchandise'],
        amazonSearch: (k) => `${k} music`,
        commission: '4-8%',
        template: (kw, url) => `<a href="${url}" class="bdt-affiliate" data-brand="blender" target="_blank" rel="noopener sponsored">${kw}</a>`
      }
    }
  },

  ladies_home_journal: {
    name: "Ladies Home Journal",
    programs: ['amazon', 'wayfair', 'pottery_barn'],
    categories: {
      home_decor: {
        keywords: ['throw pillow', 'area rug', 'curtains', 'wall art', 'picture frame', 'candle', 'vase', 'lamp', 'mirror', 'storage basket'],
        amazonSearch: (k) => `${k} home decor`,
        commission: '4-8%',
        template: (kw, url) => `<a href="${url}" class="bdt-affiliate" data-brand="lhj" target="_blank" rel="noopener sponsored">${kw}</a>`
      },
      kitchen: {
        keywords: ['slow cooker', 'coffee maker', 'toaster', 'can opener', 'dish rack', 'cutting board', 'spice rack', 'food storage'],
        amazonSearch: (k) => `${k} kitchen`,
        commission: '4-8%',
        template: (kw, url) => `<a href="${url}" class="bdt-affiliate" data-brand="lhj" target="_blank" rel="noopener sponsored">${kw}</a>`
      },
      garden: {
        keywords: ['planter', 'garden tools', 'seeds', 'raised bed', 'compost', 'watering can', 'bird feeder', 'outdoor furniture'],
        amazonSearch: (k) => `${k} garden`,
        commission: '4-8%',
        template: (kw, url) => `<a href="${url}" class="bdt-affiliate" data-brand="lhj" target="_blank" rel="noopener sponsored">${kw}</a>`
      }
    }
  },

  teen_people: {
    name: 'Teen People',
    programs: ['amazon', 'ulta', 'sephora'],
    categories: {
      beauty: {
        keywords: ['lip gloss', 'mascara', 'foundation', 'concealer', 'blush', 'eyeshadow', 'skincare', 'moisturizer', 'sunscreen', 'toner', 'serum'],
        amazonSearch: (k) => `${k} teen beauty`,
        commission: '4-8%',
        template: (kw, url) => `<a href="${url}" class="bdt-affiliate" data-brand="teen_people" target="_blank" rel="noopener sponsored">${kw}</a>`
      },
      fashion: {
        keywords: ['sneakers', 'backpack', 'hoodie', 'jeans', 'crop top', 'denim jacket', 'boots', 'hair accessories', 'scrunchie'],
        amazonSearch: (k) => `teen ${k} fashion`,
        commission: '4-8%',
        template: (kw, url) => `<a href="${url}" class="bdt-affiliate" data-brand="teen_people" target="_blank" rel="noopener sponsored">${kw}</a>`
      },
      tech: {
        keywords: ['earbuds', 'phone case', 'ring light', 'tripod', 'laptop', 'tablet', 'portable charger', 'gaming'],
        amazonSearch: (k) => `${k} teen`,
        commission: '4-8%',
        template: (kw, url) => `<a href="${url}" class="bdt-affiliate" data-brand="teen_people" target="_blank" rel="noopener sponsored">${kw}</a>`
      }
    }
  }
};

// ─── AFFILIATE LINK GENERATOR ──────────────────────────────────────────────
function generateAmazonLink(searchTerm) {
  return `${AMAZON_BASE}${encodeURIComponent(searchTerm)}`;
}

// ─── MAIN INJECTION ENGINE ─────────────────────────────────────────────────
function injectAffiliateLinks(articleText, brandKey) {
  const brand = BRAND_MAPPINGS[brandKey];
  if (!brand) {
    console.error(`Unknown brand: ${brandKey}. Available: ${Object.keys(BRAND_MAPPINGS).join(', ')}`);
    process.exit(1);
  }

  let modifiedText = articleText;
  let injectedCount = 0;
  const injectionLog = [];

  for (const [catKey, category] of Object.entries(brand.categories)) {
    for (const keyword of category.keywords) {
      // Case-insensitive regex that won't match inside existing links
      const regex = new RegExp(`(?<!href="[^"]*?)\\b(${keyword})\\b(?![^<]*>|[^<]*<\\/a>)`, 'gi');

      if (regex.test(modifiedText)) {
        // Reset regex
        const searchTerm = category.amazonSearch(keyword);
        const affiliateUrl = generateAmazonLink(searchTerm);
        const template = category.template;

        let firstMatch = true;
        modifiedText = modifiedText.replace(
          new RegExp(`(?<!href="[^"]*?)\\b(${keyword})\\b(?![^<]*>|[^<]*<\\/a>)`, 'gi'),
          (match) => {
            if (firstMatch) {
              firstMatch = false; // Only link first occurrence
              injectedCount++;
              injectionLog.push({ keyword: match, url: affiliateUrl, category: catKey });
              return template(match, affiliateUrl);
            }
            return match;
          }
        );
      }
    }
  }

  return { modifiedText, injectedCount, injectionLog };
}

// ─── BEST-OF ARTICLE GENERATOR ─────────────────────────────────────────────
function generateBestOfArticle(brandKey, category, year = 2026) {
  const brand = BRAND_MAPPINGS[brandKey];
  const cat = brand?.categories[category];
  if (!cat) return null;

  const topKeywords = cat.keywords.slice(0, 5);
  let article = `<h1>Best ${category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} of ${year} — ${brand.name} Picks</h1>\n\n`;

  for (const kw of topKeywords) {
    const url = generateAmazonLink(cat.amazonSearch(kw));
    article += `<h2>${kw.replace(/\b\w/g, c => c.toUpperCase())}</h2>\n`;
    article += `<p>Our editors tested the top ${kw} options available in ${year}. `;
    article += `Check out our top-rated pick: `;
    article += cat.template(kw, url);
    article += `. [Add review content here]\n\n`;
  }

  return article;
}

// ─── CLI ENTRY POINT ───────────────────────────────────────────────────────
const args = process.argv.slice(2);

if (args.includes('--help') || args.length === 0) {
  console.log(`
BDT Affiliate Commerce Agent (Blueprint #2)
Amazon Tag: ${AMAZON_TAG}

Usage:
  node affiliate-agent.js --brand <brand> --file <article.html>
  node affiliate-agent.js --brand <brand> --text "<article text>"
  node affiliate-agent.js --generate-best-of --brand <brand> --category <category>
  node affiliate-agent.js --list-brands

Available brands: ${Object.keys(BRAND_MAPPINGS).join(', ')}
  `);
  process.exit(0);
}

if (args.includes('--list-brands')) {
  console.log('\nAvailable brands and categories:');
  for (const [key, brand] of Object.entries(BRAND_MAPPINGS)) {
    console.log(`  ${key} (${brand.name}): ${Object.keys(brand.categories).join(', ')}`);
  }
  process.exit(0);
}

const brandIdx = args.indexOf('--brand');
const fileIdx = args.indexOf('--file');
const textIdx = args.indexOf('--text');
const generateIdx = args.indexOf('--generate-best-of');
const categoryIdx = args.indexOf('--category');

if (generateIdx !== -1 && brandIdx !== -1 && categoryIdx !== -1) {
  const brandKey = args[brandIdx + 1];
  const category = args[categoryIdx + 1];
  const article = generateBestOfArticle(brandKey, category);
  if (article) {
    console.log(article);
    const outFile = `best_of_${category}_${brandKey}.html`;
    fs.writeFileSync(outFile, article);
    console.error(`\n✅ Saved to: ${outFile}`);
  }
} else if (brandIdx !== -1) {
  const brandKey = args[brandIdx + 1];
  let articleText = '';

  if (fileIdx !== -1) {
    articleText = fs.readFileSync(args[fileIdx + 1], 'utf8');
  } else if (textIdx !== -1) {
    articleText = args[textIdx + 1];
  } else {
    // Read from stdin
    articleText = fs.readFileSync('/dev/stdin', 'utf8');
  }

  const { modifiedText, injectedCount, injectionLog } = injectAffiliateLinks(articleText, brandKey);
  console.log(modifiedText);

  console.error(`\n✅ Affiliate injection complete:`);
  console.error(`   Brand: ${BRAND_MAPPINGS[brandKey]?.name}`);
  console.error(`   Links injected: ${injectedCount}`);
  console.error(`   Amazon tag: ${AMAZON_TAG}`);
  if (injectionLog.length > 0) {
    console.error(`\n   Injected links:`);
    injectionLog.forEach(l => console.error(`   → "${l.keyword}" → ${l.url}`));
  }
}

module.exports = { injectAffiliateLinks, generateBestOfArticle, BRAND_MAPPINGS, AMAZON_TAG };
