// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium } = require('playwright');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createClient } = require('@supabase/supabase-js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

// --- Setup ---
// Before running, ensure:
//   1. npm install --save-dev playwright
//   2. npx playwright install chromium
//   3. Add SUPABASE_SERVICE_ROLE_KEY to .env.local (get it from Supabase dashboard → Settings → API)
//
// Test run (first 5 fragrances):
//   TEST=1 node scripts/verify-fragrance-images.js
//
// Full run:
//   node scripts/verify-fragrance-images.js

const DELAY_MS = 2000;
const TEST_MODE = process.env.TEST === '1';
const TEST_LIMIT = 5;

// Parse .env.local
function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env.local');
  const raw = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    'Missing required env vars. Check .env.local has:\n' +
      '  NEXT_PUBLIC_SUPABASE_URL\n' +
      '  SUPABASE_SERVICE_ROLE_KEY  ← get from Supabase dashboard → Settings → API'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// --- Fragrantica scraping ---

async function findFragranticaImageUrl(page, brand, name) {
  const query = encodeURIComponent(`${brand} ${name}`);
  const searchUrl = `https://www.fragrantica.com/search/?query=${query}`;

  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Cloudflare challenge usually resolves itself within a few seconds
  // Wait for either search results or a known result heading to appear
  try {
    await page.waitForFunction(() => !document.title.includes('Just a moment'), { timeout: 10000 });
  } catch {
    console.warn(`  ⚠ Cloudflare may still be active for "${brand} ${name}"`);
  }

  // Extract the first result's bottle image URL (hosted on fimgs.net)
  const imageUrl = await page.evaluate(() => {
    // Fragrantica search results: each perfume card contains a thumbnail
    // The bottle images are served from fimgs.net CDN
    const imgs = Array.from(document.querySelectorAll('img[src*="fimgs.net"]'));
    // Skip tiny icons — bottle images are at least 100px wide
    const bottle = imgs.find((img) => (img.naturalWidth || img.width) >= 100);
    return bottle ? bottle.src : imgs[0] ? imgs[0].src : null;
  });

  return imageUrl || null;
}

// --- Main ---

async function main() {
  console.log(`\nFragrantica image verifier`);
  console.log(`Mode: ${TEST_MODE ? `TEST (first ${TEST_LIMIT} fragrances)` : 'FULL RUN'}\n`);

  let query = supabase
    .from('fragrances')
    .select('id, brand, name, image_url')
    .order('brand')
    .order('name');

  if (TEST_MODE) query = query.limit(TEST_LIMIT);

  const { data: fragrances, error: fetchError } = await query;
  if (fetchError) {
    console.error('Failed to fetch fragrances:', fetchError.message);
    process.exit(1);
  }

  console.log(`Fetched ${fragrances.length} fragrance(s) to process.\n`);

  // Launch real (headed) browser — gives us a genuine browser fingerprint
  // which is what bypasses Cloudflare's JS challenge
  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    locale: 'en-GB',
    timezoneId: 'Europe/Dublin',
  });

  // Suppress images and CSS to speed up loads (except the fimgs.net images we need)
  await context.route('**/*.{woff,woff2,ttf,otf}', (route) => route.abort());

  const page = await context.newPage();

  let updated = 0;
  let skipped = 0;
  let failed = 0;
  const failures = [];

  try {
    for (let i = 0; i < fragrances.length; i++) {
      const { id, brand, name, image_url: currentUrl } = fragrances[i];
      const label = `[${i + 1}/${fragrances.length}] ${brand} – ${name}`;
      process.stdout.write(`${label} ... `);

      let foundUrl;
      try {
        foundUrl = await findFragranticaImageUrl(page, brand, name);
      } catch (err) {
        console.log(`FAILED (${err.message})`);
        failed++;
        failures.push({ brand, name, reason: err.message });
        await new Promise((r) => setTimeout(r, DELAY_MS));
        continue;
      }

      if (!foundUrl) {
        console.log('no image found');
        failed++;
        failures.push({ brand, name, reason: 'no fimgs.net image in search results' });
      } else if (foundUrl === currentUrl) {
        console.log(`already correct`);
        skipped++;
      } else {
        const { error: updateError } = await supabase
          .from('fragrances')
          .update({ image_url: foundUrl })
          .eq('id', id);

        if (updateError) {
          console.log(`update error: ${updateError.message}`);
          failed++;
          failures.push({ brand, name, reason: updateError.message });
        } else {
          console.log(`updated`);
          console.log(`  ${foundUrl}`);
          updated++;
        }
      }

      if (i < fragrances.length - 1) {
        await new Promise((r) => setTimeout(r, DELAY_MS));
      }
    }
  } finally {
    await browser.close();
  }

  console.log('\n--- Summary ---');
  console.log(`Updated : ${updated}`);
  console.log(`Skipped : ${skipped} (already correct)`);
  console.log(`Failed  : ${failed}`);

  if (failures.length > 0) {
    console.log('\nFailures:');
    for (const f of failures) {
      console.log(`  ${f.brand} – ${f.name}: ${f.reason}`);
    }
  }
}

main().catch((err) => {
  console.error('\nFatal error:', err);
  process.exit(1);
});
