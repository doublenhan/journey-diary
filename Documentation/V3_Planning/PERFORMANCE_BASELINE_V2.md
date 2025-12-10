# 📊 Performance Baseline Audit - V2.0

**Date**: December 10, 2025  
**Branch**: dev  
**Purpose**: Establish baseline metrics before V3.0 migration

---

## 🎯 Audit Objectives

Measure current performance to compare against V3.0 improvements:
- Bundle size and composition
- API latency and response times
- Core Web Vitals (LCP, FID, CLS)
- Lighthouse scores
- Network requests analysis
- Vercel serverless function costs

---

## 📦 Bundle Size Analysis

### Current Build Output

Run build command to analyze:
```bash
npm run build
```

**Expected Output Structure:**
```
dist/
├── index.html (5-10 KB)
├── assets/
│   ├── index-[hash].js (Main bundle)
│   ├── vendor-[hash].js (Third-party libs)
│   ├── CreateMemory-[hash].js (Lazy loaded)
│   ├── ViewMemory-[hash].js (Lazy loaded)
│   └── ... other chunks
```

### Bundle Size Targets (Current vs V3.0)

| Asset | Current (V2.0) | Target (V3.0) | Improvement |
|-------|----------------|---------------|-------------|
| Main JS Bundle | ~350-450 KB | < 300 KB | -30% |
| Vendor Bundle | ~500-600 KB | < 400 KB | -25% |
| Total JS | ~1.2 MB | < 800 KB | -33% |
| CSS | ~50 KB | < 40 KB | -20% |
| HTML | ~8 KB | ~8 KB | 0% |

### Dependencies Analysis

**Large Dependencies to Analyze:**
```json
{
  "firebase": "^12.0.0",        // ~400 KB (tree-shakeable)
  "firebase-admin": "^13.6.0",  // REMOVE in V3 (server-side only)
  "cloudinary": "^2.7.0",       // ~200 KB (replace with Upload Widget)
  "lucide-react": "latest",     // ~100 KB (icons, tree-shakeable)
  "react": "^18.3.1",           // ~130 KB
  "react-dom": "^18.3.1"        // ~130 KB
}
```

**Removable in V3:**
- `express` (server-side, not bundled)
- `cors` (server-side, not bundled)
- `multer` (server-side, not bundled)
- `formidable` (server-side, not bundled)
- Server-side Cloudinary SDK (replace with client widget)

---

## ⚡ Performance Metrics

### Core Web Vitals

**Measurement Method:**
1. Use Lighthouse in Chrome DevTools
2. Test on production URL: https://your-app.vercel.app
3. Run on both Desktop and Mobile
4. Test with throttling (Fast 3G, Slow 4G)

**Current Baseline (to be measured):**

| Metric | Desktop | Mobile | Target V3.0 |
|--------|---------|--------|-------------|
| **LCP (Largest Contentful Paint)** | ⏱️ TBD | ⏱️ TBD | < 2.5s |
| **FID (First Input Delay)** | ⏱️ TBD | ⏱️ TBD | < 100ms |
| **CLS (Cumulative Layout Shift)** | ⏱️ TBD | ⏱️ TBD | < 0.1 |
| **FCP (First Contentful Paint)** | ⏱️ TBD | ⏱️ TBD | < 1.8s |
| **TTI (Time to Interactive)** | ⏱️ TBD | ⏱️ TBD | < 3.8s |
| **Speed Index** | ⏱️ TBD | ⏱️ TBD | < 3.4s |

### Lighthouse Scores

**Categories to Measure:**

| Category | Current | Target V3.0 |
|----------|---------|-------------|
| **Performance** | 🔍 TBD | > 90 |
| **Accessibility** | 🔍 TBD | > 95 |
| **Best Practices** | 🔍 TBD | > 95 |
| **SEO** | 🔍 TBD | > 90 |
| **PWA** | 🔍 TBD | > 80 |

---

## 🌐 Network Analysis

### API Request Latency

**Current Architecture (V2.0):**
```
Client → Vercel Edge → API Route → Firebase/Cloudinary
       (50ms)       (200-500ms)    (100-300ms)
Total: 350-850ms per request
```

**Endpoints to Measure:**

| Endpoint | Method | Avg Latency | P95 Latency | Notes |
|----------|--------|-------------|-------------|-------|
| `/api/cloudinary/memories` | GET | ⏱️ TBD | ⏱️ TBD | Fetch all memories |
| `/api/cloudinary/memory` | POST | ⏱️ TBD | ⏱️ TBD | Create memory |
| `/api/cloudinary/upload` | POST | ⏱️ TBD | ⏱️ TBD | Upload image |
| `/api/cloudinary/delete` | POST | ⏱️ TBD | ⏱️ TBD | Delete image |
| `/api/auth/session` | POST | ⏱️ TBD | ⏱️ TBD | Create session |

**Expected V3.0 Latency:**
```
Client → Firebase/Cloudinary Direct
       (150-300ms)
Total: 150-300ms per request (-50% improvement)
```

### Network Requests Count

**Current Page Load:**
- Initial HTML: 1 request
- CSS files: ~2-3 requests
- JS bundles: ~5-8 requests
- API calls: ~3-5 requests
- Images: Variable (lazy loaded)

**Total Initial Load:** ~15-20 requests

**V3.0 Target:**
- Remove API middleware requests
- Direct SDK reduces hop count
- Target: ~10-15 requests (-33%)

---

## 💰 Cost Analysis

### Current Vercel Costs (V2.0)

**Vercel Pro Plan Pricing:**
- Base: $20/month
- Bandwidth: $0.15/GB
- Serverless Function Executions: Included up to 1000 GB-hours
- Build minutes: 6000 minutes/month

**Estimated Monthly Usage:**

| Resource | Usage | Cost | Notes |
|----------|-------|------|-------|
| **Bandwidth** | ~100 GB | $15 | Static assets + API responses |
| **Function Executions** | ~500K invocations | $0 | Within free tier |
| **Function Compute** | ~200 GB-hours | $0 | Within free tier |
| **Build Minutes** | ~300 minutes | $0 | Within free tier |
| **Base Plan** | - | $20 | Pro plan |
| **TOTAL** | - | **~$35/month** | Estimated |

**Note:** If usage exceeds free tier, costs could reach $50-120/month

### Firebase Costs (Current)

| Service | Usage | Cost | Notes |
|---------|-------|------|-------|
| **Firestore Reads** | ~100K/month | $0.06 | 50K free tier |
| **Firestore Writes** | ~20K/month | $0.18 | 20K free tier |
| **Storage** | ~5 GB | $0.10 | |
| **Authentication** | Unlimited | $0 | Free |
| **TOTAL** | - | **~$0.34/month** | Minimal usage |

### Cloudinary Costs (Current)

| Resource | Usage | Cost | Notes |
|----------|-------|------|-------|
| **Storage** | ~10 GB | $0 | Within free tier (25 GB) |
| **Bandwidth** | ~50 GB | $0 | Within free tier (25 GB) |
| **Transformations** | ~50K/month | $0 | Within free tier (25K) |
| **TOTAL** | - | **$0/month** | Free tier sufficient |

### Total Current Costs (V2.0)
```
Vercel:     $35/month
Firebase:   $0.34/month
Cloudinary: $0/month
────────────────────────
TOTAL:      ~$35.34/month
```

### Expected V3.0 Costs

| Service | Change | New Cost | Savings |
|---------|--------|----------|---------|
| **Vercel** | Remove API functions, only static hosting | $20/month | -$15/month |
| **Firebase** | More direct reads, caching | $2-5/month | -$3/month |
| **Cloudinary** | Same usage | $0/month | $0 |
| **TOTAL** | - | **$22-25/month** | **-30% to -38%** |

**Savings: ~$10-13/month (~35% reduction)**

---

## 📋 Measurement Checklist

### Step 1: Bundle Analysis
```bash
# Build production bundle
npm run build

# Analyze bundle size
npx vite-bundle-visualizer

# Check gzip sizes
cd dist
ls -lh assets/*.js assets/*.css
```

### Step 2: Lighthouse Audit
```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run audit on production
lighthouse https://your-app.vercel.app --view --output html --output-path ./lighthouse-report.html

# Run mobile audit
lighthouse https://your-app.vercel.app --view --preset=mobile --output html --output-path ./lighthouse-mobile.html
```

### Step 3: Network Monitoring
```javascript
// Add performance monitoring to main.tsx
if (window.performance && window.performance.getEntriesByType) {
  const resources = performance.getEntriesByType('resource');
  console.log('Total requests:', resources.length);
  
  const apiCalls = resources.filter(r => r.name.includes('/api/'));
  console.log('API calls:', apiCalls.length);
  
  apiCalls.forEach(call => {
    console.log(`${call.name}: ${call.duration}ms`);
  });
}
```

### Step 4: Web Vitals Tracking
```bash
# Install web-vitals
npm install web-vitals

# Add to main.tsx
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

### Step 5: API Latency Testing
```javascript
// Create test script: scripts/measure-api-latency.js
async function measureLatency(url, method = 'GET', body = null) {
  const start = performance.now();
  await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : null,
  });
  const end = performance.now();
  return end - start;
}

// Test each endpoint 10 times, calculate average
const endpoints = [
  '/api/cloudinary/memories',
  '/api/auth/session',
  // ... more endpoints
];

for (const endpoint of endpoints) {
  const latencies = [];
  for (let i = 0; i < 10; i++) {
    const latency = await measureLatency(endpoint);
    latencies.push(latency);
  }
  const avg = latencies.reduce((a, b) => a + b) / latencies.length;
  console.log(`${endpoint}: ${avg.toFixed(2)}ms average`);
}
```

---

## 📊 Results Summary Template

### Bundle Size Results
- [ ] Main bundle: ___ KB (gzip: ___ KB)
- [ ] Vendor bundle: ___ KB (gzip: ___ KB)
- [ ] Total JS: ___ KB (gzip: ___ KB)
- [ ] CSS: ___ KB (gzip: ___ KB)

### Lighthouse Scores
- [ ] Performance: ___/100
- [ ] Accessibility: ___/100
- [ ] Best Practices: ___/100
- [ ] SEO: ___/100

### Core Web Vitals
- [ ] LCP: ___ s
- [ ] FID: ___ ms
- [ ] CLS: ___
- [ ] FCP: ___ s
- [ ] TTI: ___ s

### API Latency
- [ ] GET /api/cloudinary/memories: ___ ms
- [ ] POST /api/cloudinary/memory: ___ ms
- [ ] POST /api/cloudinary/upload: ___ ms
- [ ] POST /api/cloudinary/delete: ___ ms
- [ ] POST /api/auth/session: ___ ms

### Cost Analysis
- [ ] Vercel monthly: $___ 
- [ ] Firebase monthly: $___
- [ ] Cloudinary monthly: $___
- [ ] Total monthly: $___

---

## 🎯 V3.0 Target Goals

Based on baseline, set aggressive but achievable goals:

- ✅ **Bundle size**: -30% reduction
- ✅ **LCP**: < 2.5s (Good)
- ✅ **FID**: < 100ms (Good)
- ✅ **CLS**: < 0.1 (Good)
- ✅ **Lighthouse Performance**: > 90
- ✅ **API Latency**: -50% reduction
- ✅ **Cost**: -35% reduction

---

**Status**: 📋 Template Ready - Awaiting Measurements

**Next Steps:**
1. Run bundle analysis
2. Execute Lighthouse audits
3. Measure API latency
4. Record cost data
5. Document all results
6. Compare with V3.0 post-migration
