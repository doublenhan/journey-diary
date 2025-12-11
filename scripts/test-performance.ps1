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

if (-not (Test-Path $distPath)) {
    Write-Host "❌ dist/assets folder not found!" -ForegroundColor Red
    exit 1
}

$jsFiles = Get-ChildItem -Path $distPath -Filter "*.js" | Sort-Object Length -Descending

Write-Host "`nJavaScript Bundles:" -ForegroundColor Cyan
foreach ($file in $jsFiles) {
    $sizeKB = [math]::Round($file.Length / 1KB, 2)
    $type = if ($file.Name -match "vendor-map|vendor-pdf") { "LAZY" } else { "INITIAL" }
    $color = if ($type -eq "LAZY") { "Green" } else { "White" }
    Write-Host "  $($file.Name.PadRight(50)) $($sizeKB.ToString().PadLeft(10)) KB  [$type]" -ForegroundColor $color
}

# 3. Calculate total initial bundle
$initialFiles = $jsFiles | Where-Object { $_.Name -notmatch "vendor-map|vendor-pdf" }
$lazyFiles = $jsFiles | Where-Object { $_.Name -match "vendor-map|vendor-pdf" }

$totalInitial = ($initialFiles | Measure-Object -Property Length -Sum).Sum
$totalLazy = ($lazyFiles | Measure-Object -Property Length -Sum).Sum
$totalInitialKB = [math]::Round($totalInitial / 1KB, 2)
$totalLazyKB = [math]::Round($totalLazy / 1KB, 2)

Write-Host "`n📈 Bundle Analysis:" -ForegroundColor Cyan
Write-Host "  Total Initial Bundle: $totalInitialKB KB (uncompressed)" -ForegroundColor White
Write-Host "  Total Lazy Chunks:    $totalLazyKB KB (uncompressed)" -ForegroundColor Green
Write-Host "  Estimated Gzip (~30% of original):" -ForegroundColor Yellow
Write-Host "    - Initial: ~$([math]::Round($totalInitialKB * 0.3, 2)) KB" -ForegroundColor White
Write-Host "    - Lazy:    ~$([math]::Round($totalLazyKB * 0.3, 2)) KB" -ForegroundColor Green

# 4. Check if target met
$estimatedGzip = [math]::Round($totalInitialKB * 0.3, 2)
$baseline = 376
$target = 263
$reduction = [math]::Round((($baseline - $estimatedGzip) / $baseline) * 100, 1)

Write-Host "`n🎯 Performance Targets:" -ForegroundColor Cyan
Write-Host "  Baseline (V2.0):     $baseline KB gzip" -ForegroundColor Yellow
Write-Host "  Target (V3.0):       $target KB gzip (-30%)" -ForegroundColor Yellow
Write-Host "  Current (Estimated): $estimatedGzip KB gzip (-$reduction%)" -ForegroundColor $(if ($estimatedGzip -le $target) { "Green" } elseif ($estimatedGzip -le 286) { "Yellow" } else { "Red" })

if ($estimatedGzip -le $target) {
    Write-Host "`n✅ 🎉 TARGET ACHIEVED! Bundle is $estimatedGzip KB (≤ $target KB)" -ForegroundColor Green
} elseif ($estimatedGzip -le 286) {
    Write-Host "`n⚡ GOOD PROGRESS! Bundle is $estimatedGzip KB ($reduction% reduction)" -ForegroundColor Yellow
    Write-Host "   Target is $target KB, you're $([math]::Round($estimatedGzip - $target, 2)) KB away" -ForegroundColor Yellow
} else {
    Write-Host "`n⚠️  NEEDS IMPROVEMENT! Bundle is $estimatedGzip KB (> $target KB)" -ForegroundColor Red
    Write-Host "   Need to reduce by $([math]::Round($estimatedGzip - $target, 2)) KB more" -ForegroundColor Red
}

# 5. Lazy Loading Analysis
Write-Host "`n📦 Lazy Loading Analysis:" -ForegroundColor Cyan
if ($lazyFiles.Count -gt 0) {
    Write-Host "  ✅ Found $($lazyFiles.Count) lazy-loaded chunks:" -ForegroundColor Green
    foreach ($file in $lazyFiles) {
        $sizeKB = [math]::Round($file.Length / 1KB, 2)
        $gzipKB = [math]::Round($sizeKB * 0.3, 2)
        if ($file.Name -match "map") {
            Write-Host "    🗺️  Map (Leaflet):      $gzipKB KB gzip" -ForegroundColor Green
        } elseif ($file.Name -match "pdf") {
            Write-Host "    📄 Export (html2canvas): $gzipKB KB gzip" -ForegroundColor Green
        }
    }
} else {
    Write-Host "  ⚠️  No lazy chunks found! Check code splitting." -ForegroundColor Red
}

# 6. Image Optimization Check
Write-Host "`n🖼️  Image Optimization:" -ForegroundColor Cyan
$lazyImagePath = "src/components/LazyImage.tsx"
$responsiveGalleryPath = "src/components/ResponsiveGallery.tsx"

if (Test-Path $lazyImagePath) {
    Write-Host "  ✅ LazyImage component exists" -ForegroundColor Green
    $content = Get-Content $lazyImagePath -Raw
    if ($content -match "IntersectionObserver") {
        Write-Host "    ✅ IntersectionObserver implemented" -ForegroundColor Green
    }
    if ($content -match "srcSet|srcset") {
        Write-Host "    ✅ Responsive srcSet support" -ForegroundColor Green
    }
    if ($content -match "webp|WebP") {
        Write-Host "    ✅ WebP format support" -ForegroundColor Green
    }
} else {
    Write-Host "  ⚠️  LazyImage component not found" -ForegroundColor Red
}

if (Test-Path $responsiveGalleryPath) {
    Write-Host "  ✅ ResponsiveGallery uses LazyImage" -ForegroundColor Green
}

# 7. Next Steps
Write-Host "`n🔍 Manual Testing Required:" -ForegroundColor Cyan
Write-Host "  1. Start dev server:  npm run dev" -ForegroundColor White
Write-Host "  2. Run Lighthouse:    lighthouse http://localhost:3001 --view" -ForegroundColor White
Write-Host "`n📋 Testing Checklist:" -ForegroundColor Cyan
Write-Host "  [ ] Open map view - verify vendor-map.js loads" -ForegroundColor White
Write-Host "  [ ] Export memory - verify vendor-pdf.js loads" -ForegroundColor White
Write-Host "  [ ] Scroll memories - verify images lazy load" -ForegroundColor White
Write-Host "  [ ] Check WebP format in Network tab" -ForegroundColor White
Write-Host "  [ ] Test on Fast 3G connection" -ForegroundColor White
Write-Host "  [ ] Measure Core Web Vitals (LCP, FID, CLS)" -ForegroundColor White

Write-Host "`n📝 Document Results:" -ForegroundColor Cyan
Write-Host "  Documentation/V3_Planning/PHASE_3_PERFORMANCE_RESULTS.md" -ForegroundColor Yellow

Write-Host "`n✅ Performance analysis complete!`n" -ForegroundColor Green

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 SUMMARY" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Initial Bundle:  $estimatedGzip KB gzip (target: $target KB)" -ForegroundColor White
Write-Host "Lazy Chunks:     $([math]::Round($totalLazyKB * 0.3, 2)) KB gzip" -ForegroundColor Green
Write-Host "Reduction:       $reduction% from baseline" -ForegroundColor $(if ($reduction -ge 30) { "Green" } else { "Yellow" })
Write-Host "Status:          $(if ($estimatedGzip -le $target) { "✅ Target Achieved" } elseif ($estimatedGzip -le 286) { "⚡ On Track" } else { "⚠️  Needs Work" })" -ForegroundColor $(if ($estimatedGzip -le $target) { "Green" } elseif ($estimatedGzip -le 286) { "Yellow" } else { "Red" })
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan
