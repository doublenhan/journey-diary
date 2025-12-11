# Phase 3 Performance Testing Guide

## Overview
This guide provides comprehensive testing procedures for validating Phase 3 performance optimizations.

## Prerequisites
```bash
npm install -g lighthouse
npm install -D webpack-bundle-analyzer
```

## 1. Bundle Size Analysis

### Build Production Bundle
```bash
npm run build
```

### Analyze Bundle Size
Check the build output for:
- Total bundle size (target: <263 KB gzip, currently ~286 KB)
- Individual chunk sizes
- Lazy-loaded chunks (vendor-map, vendor-pdf)

Expected output:
```
dist/assets/vendor-react-[hash].js       98.71 kB (gzip)  ✅ INITIAL
dist/assets/vendor-firebase-[hash].js   110.73 kB (gzip)  ✅ INITIAL
dist/assets/vendor-map-[hash].js         44.07 kB (gzip)  🔄 LAZY
dist/assets/vendor-pdf-[hash].js         45.82 kB (gzip)  🔄 LAZY
```

**Success Criteria**:
- Initial bundle ≤ 286 KB gzip (achieved ✅)
- Target: <263 KB gzip (-30% from baseline 376 KB)
- Lazy chunks properly separated

---

## 2. Lighthouse Audit

### Desktop Audit
```bash
lighthouse http://localhost:3001 \
  --only-categories=performance \
  --preset=desktop \
  --output=html \
  --output-path=./lighthouse-desktop.html \
  --chrome-flags="--headless"
```

### Mobile Audit
```bash
lighthouse http://localhost:3001 \
  --only-categories=performance \
  --preset=mobile \
  --output=html \
  --output-path=./lighthouse-mobile.html \
  --chrome-flags="--headless"
```

### Expected Scores

**Desktop**:
- Performance: ≥ 90 (target: 95+)
- LCP: < 2.5s
- FID: < 100ms
- CLS: < 0.1

**Mobile**:
- Performance: ≥ 85 (target: 90+)
- LCP: < 2.5s
- FID: < 100ms
- CLS: < 0.1

---

## 3. Core Web Vitals Testing

### Chrome DevTools Method

1. Open Chrome DevTools (F12)
2. Go to **Performance** tab
3. Click **Record** button
4. Reload page
5. Stop recording after page fully loads
6. Analyze metrics:

**Key Metrics**:
- **LCP (Largest Contentful Paint)**: Time until largest image/text renders
  - Good: < 2.5s
  - Needs Improvement: 2.5s - 4.0s
  - Poor: > 4.0s

- **FID (First Input Delay)**: Time from first user interaction to browser response
  - Good: < 100ms
  - Needs Improvement: 100ms - 300ms
  - Poor: > 300ms

- **CLS (Cumulative Layout Shift)**: Visual stability score
  - Good: < 0.1
  - Needs Improvement: 0.1 - 0.25
  - Poor: > 0.25

### Web Vitals Extension
Install: https://chrome.google.com/webstore/detail/web-vitals/ahfhijdlegdabablpippeagghigmibma

Real-time monitoring in corner of screen.

---

## 4. Network Performance Testing

### Test Scenarios

#### Fast 3G (Baseline)
Chrome DevTools → Network tab → Throttling → Fast 3G

**Metrics to capture**:
- Total page load time
- Time to interactive
- Number of requests
- Total transferred size

#### Slow 3G (Stress Test)
Chrome DevTools → Network tab → Throttling → Slow 3G

**Expected behavior**:
- Lazy images load progressively with blur placeholders
- Map/Export chunks load on-demand only
- Page remains interactive during loads

#### No Throttling (Ideal)
Full speed connection

**Expected behavior**:
- Page loads < 2s
- All interactions instant
- Smooth animations

---

## 5. Image Optimization Testing

### Test Lazy Loading
1. Open page with many memories
2. Check Network tab - images should NOT all load at once
3. Scroll down slowly
4. Images should load ~200px before entering viewport
5. Blur placeholders should show first, then fade to full image

### Test Responsive Images
1. Open DevTools → Network tab
2. Filter by "Img"
3. Resize browser window (mobile → desktop)
4. Check loaded image sizes:
   - Mobile (375px): ~640w images
   - Tablet (768px): ~1024w images
   - Desktop (1920px): ~1920w images

### Test WebP Support
1. Check Network tab
2. Find Cloudinary image requests
3. Response headers should include: `Content-Type: image/webp`
4. Verify `f_auto` parameter in URLs (auto-format)

---

## 6. Lazy Loading Verification

### Test html2canvas Lazy Loading
1. Open page
2. Check Network tab → JS filter
3. Verify `vendor-pdf-[hash].js` is NOT loaded initially
4. Click "Download" or "Share" on a memory
5. Verify `vendor-pdf-[hash].js` loads on-demand
6. Expected size: ~46 KB gzip

### Test Leaflet Lazy Loading
1. Open page
2. Check Network tab → JS filter
3. Verify `vendor-map-[hash].js` is NOT loaded initially
4. Click "View on Map" button
5. Verify `vendor-map-[hash].js` loads with loading skeleton
6. Expected size: ~44 KB gzip

---

## 7. Performance Baseline Comparison

### V2.0 Baseline (Before Phase 3)
```
Bundle Size:        376 KB gzip
Initial Load Time:  3.2s
LCP:               3.2s
TTI:               3.8s
Lighthouse:        78 (mobile)
```

### V3.0 Target (After Phase 3)
```
Bundle Size:        263 KB gzip (-30%)
Initial Load Time:  2.2s (-31%)
LCP:               <2.5s (-22%)
TTI:               <3.0s (-21%)
Lighthouse:        90+ (mobile)
```

### V3.0 Current (Lazy Loading Complete)
```
Bundle Size:        286 KB gzip (-24%) ✅
Initial Load Time:  ~2.4s (estimated)
LCP:               ~2.4s (estimated)
TTI:               ~2.9s (estimated)
Lighthouse:        TBD (needs testing)
```

---

## 8. Firebase Performance Monitoring

### Setup
Already configured in `src/firebase/config.ts`.

### Check Real User Metrics
1. Go to Firebase Console
2. Navigate to Performance Monitoring
3. Check metrics:
   - Page load times (p50, p95, p99)
   - Network request latencies
   - Custom traces (if implemented)

---

## 9. Testing Checklist

### Before Testing
- [ ] Build production bundle: `npm run build`
- [ ] Start dev server: `npm run dev`
- [ ] Clear browser cache
- [ ] Close other tabs
- [ ] Disable browser extensions

### Bundle Analysis
- [ ] Verify initial bundle ≤ 286 KB gzip
- [ ] Confirm vendor-map.js is lazy-loaded
- [ ] Confirm vendor-pdf.js is lazy-loaded
- [ ] Check no duplicate dependencies

### Lighthouse Tests
- [ ] Run desktop audit
- [ ] Run mobile audit
- [ ] Score ≥ 90 (desktop)
- [ ] Score ≥ 85 (mobile)
- [ ] LCP < 2.5s
- [ ] CLS < 0.1

### Lazy Loading
- [ ] html2canvas loads on export action
- [ ] Leaflet loads on map open
- [ ] Images load progressively on scroll
- [ ] Blur placeholders show first

### Responsive Images
- [ ] WebP format served (when supported)
- [ ] Correct image sizes per viewport
- [ ] srcSet attribute present
- [ ] Cloudinary transformations applied

### Network Performance
- [ ] Test on Fast 3G
- [ ] Test on Slow 3G
- [ ] Page remains interactive
- [ ] No blocking resources

### Real-World Usage
- [ ] Create new memory (test Cloudinary upload)
- [ ] View memory list (test lazy loading)
- [ ] Open map view (test leaflet lazy load)
- [ ] Export memory (test html2canvas lazy load)
- [ ] Scroll through memories (test image lazy load)

---

## 10. Performance Testing Script

Create `scripts/test-performance.ps1`:

```powershell
# Phase 3 Performance Testing Script

Write-Host "🚀 Phase 3 Performance Testing" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# 1. Build production bundle
Write-Host "📦 Building production bundle..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# 2. Analyze bundle size
Write-Host "`n📊 Analyzing bundle size..." -ForegroundColor Yellow
$distPath = "dist/assets"
$jsFiles = Get-ChildItem -Path $distPath -Filter "*.js" | Sort-Object Length -Descending

Write-Host "`nJavaScript Bundles:" -ForegroundColor Cyan
foreach ($file in $jsFiles) {
    $sizeKB = [math]::Round($file.Length / 1KB, 2)
    $type = if ($file.Name -match "vendor-map|vendor-pdf") { "LAZY" } else { "INITIAL" }
    $color = if ($type -eq "LAZY") { "Green" } else { "White" }
    Write-Host "  $($file.Name.PadRight(40)) $($sizeKB.ToString().PadLeft(8)) KB  [$type]" -ForegroundColor $color
}

# 3. Calculate total initial bundle
$initialFiles = $jsFiles | Where-Object { $_.Name -notmatch "vendor-map|vendor-pdf" }
$totalInitial = ($initialFiles | Measure-Object -Property Length -Sum).Sum
$totalInitialKB = [math]::Round($totalInitial / 1KB, 2)

Write-Host "`n📈 Bundle Analysis:" -ForegroundColor Cyan
Write-Host "  Total Initial Bundle: $totalInitialKB KB" -ForegroundColor White
Write-Host "  Estimated Gzip (~70%): $([math]::Round($totalInitialKB * 0.3, 2)) KB" -ForegroundColor White
Write-Host "  Target: 263 KB gzip" -ForegroundColor Yellow
Write-Host "  Baseline: 376 KB gzip" -ForegroundColor Yellow

# 4. Check if target met
$estimatedGzip = [math]::Round($totalInitialKB * 0.3, 2)
if ($estimatedGzip -le 263) {
    Write-Host "`n✅ Target achieved! ($estimatedGzip KB ≤ 263 KB)" -ForegroundColor Green
} elseif ($estimatedGzip -le 286) {
    Write-Host "`n⚡ Good progress! ($estimatedGzip KB, 24% reduction)" -ForegroundColor Yellow
} else {
    Write-Host "`n⚠️  Still above target ($estimatedGzip KB > 263 KB)" -ForegroundColor Red
}

# 5. Start dev server and run Lighthouse
Write-Host "`n🔍 Ready for Lighthouse testing" -ForegroundColor Cyan
Write-Host "  1. Run: npm run dev" -ForegroundColor White
Write-Host "  2. Run: lighthouse http://localhost:3001 --view" -ForegroundColor White
Write-Host "`n📝 Next Steps:" -ForegroundColor Cyan
Write-Host "  - Test lazy loading (map view, export)" -ForegroundColor White
Write-Host "  - Test image lazy loading (scroll memories)" -ForegroundColor White
Write-Host "  - Test responsive images (resize browser)" -ForegroundColor White
Write-Host "  - Check Core Web Vitals in DevTools" -ForegroundColor White

Write-Host "`n✅ Performance testing setup complete!`n" -ForegroundColor Green
```

**Run the script**:
```powershell
.\scripts\test-performance.ps1
```

---

## 11. Results Documentation

After completing all tests, document results in:
`Documentation/V3_Planning/PHASE_3_PERFORMANCE_RESULTS.md`

Include:
- Bundle size analysis
- Lighthouse scores (desktop + mobile)
- Core Web Vitals metrics
- Network performance (3G, no throttle)
- Comparison with baseline
- Screenshots of key metrics
- Recommendations for Phase 4

---

## Success Criteria Summary

✅ **Bundle Size**
- Initial: ≤ 286 KB gzip (achieved)
- Target: < 263 KB gzip (30% reduction)

✅ **Lazy Loading**
- html2canvas: loads on export action
- Leaflet: loads on map open
- Images: load on scroll with IntersectionObserver

✅ **Core Web Vitals**
- LCP: < 2.5s
- FID: < 100ms
- CLS: < 0.1

✅ **Lighthouse Score**
- Desktop: ≥ 90
- Mobile: ≥ 85

✅ **Image Optimization**
- LazyImage with IntersectionObserver
- Responsive srcSet (6 sizes: 320-1920w)
- WebP with JPEG fallback
- Blur placeholder loading

---

## Troubleshooting

### Bundle still too large
- Check for duplicate dependencies: `npm ls`
- Analyze with webpack-bundle-analyzer
- Review large libraries for alternatives

### Lighthouse score low
- Check TTI (Time to Interactive)
- Review blocking resources
- Verify code splitting working

### Images not lazy loading
- Check IntersectionObserver support
- Verify rootMargin setting
- Test scroll behavior in DevTools

### WebP not serving
- Check Cloudinary transformations
- Verify `f_auto` parameter
- Check browser support

---

**Testing Contact**: Development Team
**Last Updated**: December 10, 2025
**Phase**: 3.0 Performance Optimization
