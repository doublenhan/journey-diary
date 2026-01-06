#!/usr/bin/env pwsh
# Test Firebase App Check Implementation
# Verifies if App Check is properly configured

param(
    [string]$Url = "https://journey-diary-git-dev-doublenhans-projects.vercel.app",
    [switch]$Verbose
)

Write-Host "🔐 FIREBASE APP CHECK VERIFICATION" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray
Write-Host ""

# Test 1: Check if app loads
Write-Host "1️⃣  Testing app accessibility..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ App is accessible" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Cannot reach app: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Check for App Check script in HTML
Write-Host "2️⃣  Checking for Firebase App Check in bundle..." -ForegroundColor Yellow
if ($response.Content -match "firebase.*app-check|appCheck") {
    Write-Host "   ✅ App Check code found in bundle" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  App Check code not detected (may be lazy loaded)" -ForegroundColor Yellow
}

Write-Host ""

# Test 3: Check environment variable hint
Write-Host "3️⃣  Checking App Check configuration..." -ForegroundColor Yellow
Write-Host "   ℹ️  Open browser console and check for:" -ForegroundColor Cyan
Write-Host "   Expected: '✅ Firebase App Check initialized - Rate limiting active'" -ForegroundColor Green
Write-Host "   Warning:  '⚠️  Firebase App Check not initialized - missing VITE_FIREBASE_APP_CHECK_KEY'" -ForegroundColor Yellow
Write-Host ""
Write-Host "   🌐 Open app in browser:" -ForegroundColor Cyan
Write-Host "   $Url" -ForegroundColor White

Write-Host ""

# Test 4: Instructions
Write-Host "4️⃣  Manual verification steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Step 1: Open app in browser (should open automatically)" -ForegroundColor White
Write-Host "   Step 2: Open DevTools (F12)" -ForegroundColor White
Write-Host "   Step 3: Go to Console tab" -ForegroundColor White
Write-Host "   Step 4: Look for App Check initialization message" -ForegroundColor White
Write-Host ""

# Open browser
Write-Host "5️⃣  Opening browser for manual check..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Start-Process $Url

Write-Host ""
Write-Host "=" * 70 -ForegroundColor Gray
Write-Host ""

# Setup checklist
Write-Host "📋 APP CHECK SETUP CHECKLIST:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   [ ] 1. reCAPTCHA v3 registered" -ForegroundColor White
Write-Host "        https://www.google.com/recaptcha/admin" -ForegroundColor Gray
Write-Host ""
Write-Host "   [ ] 2. VITE_FIREBASE_APP_CHECK_KEY in Vercel" -ForegroundColor White
Write-Host "        https://vercel.com/doublenhans-projects/journey-diary/settings/environment-variables" -ForegroundColor Gray
Write-Host ""
Write-Host "   [ ] 3. App Check enabled in Firebase Console" -ForegroundColor White
Write-Host "        https://console.firebase.google.com → App Check" -ForegroundColor Gray
Write-Host ""
Write-Host "   [ ] 4. Firestore enforcement: ENFORCED" -ForegroundColor White
Write-Host "   [ ] 5. Storage enforcement: ENFORCED" -ForegroundColor White
Write-Host ""

Write-Host "=" * 70 -ForegroundColor Gray
Write-Host ""

# Quick setup links
Write-Host "🔗 QUICK LINKS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   reCAPTCHA Admin:   https://www.google.com/recaptcha/admin" -ForegroundColor White
Write-Host "   Vercel Env Vars:   https://vercel.com/doublenhans-projects/journey-diary/settings/environment-variables" -ForegroundColor White
Write-Host "   Firebase Console:  https://console.firebase.google.com" -ForegroundColor White
Write-Host ""

# Expected console output
if ($Verbose) {
    Write-Host "🔍 EXPECTED CONSOLE OUTPUT:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   If App Check IS configured:" -ForegroundColor Green
    Write-Host "   ✅ Firebase App Check initialized - Rate limiting active" -ForegroundColor Green
    Write-Host ""
    Write-Host "   If App Check NOT configured:" -ForegroundColor Yellow
    Write-Host "   ⚠️ Firebase App Check not initialized - missing VITE_FIREBASE_APP_CHECK_KEY" -ForegroundColor Yellow
    Write-Host "   Add to .env file for production rate limiting and bot protection." -ForegroundColor Gray
    Write-Host "   Get key from: https://www.google.com/recaptcha/admin" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "📖 Full setup guide: Documentation/FIREBASE_APP_CHECK_SETUP.md" -ForegroundColor Cyan
Write-Host ""
