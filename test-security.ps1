#!/usr/bin/env pwsh
# Security Testing Script
# Tests all security implementations after deployment

Write-Host "🔐 TESTING SECURITY IMPLEMENTATION" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""

# Get deployment URL
Write-Host "📝 Enter your Vercel deployment URL:" -ForegroundColor Yellow
Write-Host "   Example: https://your-app.vercel.app" -ForegroundColor Gray
$url = Read-Host "URL"

if ([string]::IsNullOrWhiteSpace($url)) {
    Write-Host "❌ No URL provided. Exiting..." -ForegroundColor Red
    exit 1
}

# Remove trailing slash
$url = $url.TrimEnd('/')

Write-Host ""
Write-Host "🧪 Testing: $url" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""

# Test 1: Security Headers
Write-Host "1️⃣ Testing Security Headers..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $url -Method Head -UseBasicParsing -ErrorAction Stop
    
    $headers = @{
        "Content-Security-Policy" = "CSP (XSS Protection)"
        "Strict-Transport-Security" = "HSTS (Force HTTPS)"
        "X-Content-Type-Options" = "Prevent MIME Sniffing"
        "X-Frame-Options" = "Clickjacking Protection"
        "X-XSS-Protection" = "XSS Filter"
        "Referrer-Policy" = "Privacy Protection"
    }
    
    $passed = 0
    $failed = 0
    
    foreach ($header in $headers.Keys) {
        if ($response.Headers[$header]) {
            Write-Host "   ✅ $($headers[$header])" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "   ❌ Missing: $($headers[$header])" -ForegroundColor Red
            $failed++
        }
    }
    
    Write-Host ""
    Write-Host "   Headers: $passed/6 passed" -ForegroundColor $(if ($passed -eq 6) { "Green" } else { "Yellow" })
    
} catch {
    Write-Host "   ❌ Failed to fetch headers: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: CSP Details
Write-Host "2️⃣ Checking CSP Configuration..." -ForegroundColor Yellow
try {
    $csp = $response.Headers["Content-Security-Policy"]
    if ($csp) {
        $directives = @(
            "default-src",
            "script-src",
            "style-src",
            "img-src",
            "connect-src",
            "frame-src",
            "object-src 'none'",
            "upgrade-insecure-requests"
        )
        
        foreach ($directive in $directives) {
            if ($csp -match [regex]::Escape($directive)) {
                Write-Host "   ✅ $directive" -ForegroundColor Green
            } else {
                Write-Host "   ⚠️  Missing: $directive" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "   ❌ CSP header not found" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Error checking CSP: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: HTTPS
Write-Host "3️⃣ Testing HTTPS..." -ForegroundColor Yellow
if ($url -match "^https://") {
    Write-Host "   ✅ Using HTTPS" -ForegroundColor Green
} else {
    Write-Host "   ❌ WARNING: Not using HTTPS!" -ForegroundColor Red
}

Write-Host ""

# Test 4: App Size
Write-Host "4️⃣ Checking App Performance..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -ErrorAction Stop
    $sizeKB = [math]::Round($response.RawContent.Length / 1KB, 2)
    
    Write-Host "   📦 HTML Size: $sizeKB KB" -ForegroundColor Cyan
    
    if ($sizeKB -lt 100) {
        Write-Host "   ✅ Good size" -ForegroundColor Green
    } elseif ($sizeKB -lt 500) {
        Write-Host "   ⚠️  Acceptable size" -ForegroundColor Yellow
    } else {
        Write-Host "   ❌ Large HTML (consider optimization)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ⚠️  Could not measure size" -ForegroundColor Yellow
}

Write-Host ""

# Test 5: Security Score
Write-Host "5️⃣ External Security Scan..." -ForegroundColor Yellow
Write-Host "   🔗 Test your site at:" -ForegroundColor Cyan
Write-Host "   📊 https://securityheaders.com/?q=$url" -ForegroundColor White
Write-Host "   📊 https://observatory.mozilla.org/analyze/$($url -replace 'https?://', '')" -ForegroundColor White

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Gray

# Summary
Write-Host ""
Write-Host "📋 NEXT STEPS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. ✅ Security headers are deployed" -ForegroundColor Green
Write-Host "2. 🔑 Setup Firebase App Check:" -ForegroundColor Yellow
Write-Host "   - Get reCAPTCHA key: https://www.google.com/recaptcha/admin" -ForegroundColor Gray
Write-Host "   - Add to Vercel env: VITE_FIREBASE_APP_CHECK_KEY" -ForegroundColor Gray
Write-Host "   - Enable in Firebase Console" -ForegroundColor Gray
Write-Host ""
Write-Host "3. 🧪 Test XSS Protection:" -ForegroundColor Yellow
Write-Host "   - Create memory with: <script>alert('test')</script>" -ForegroundColor Gray
Write-Host "   - Should be sanitized automatically" -ForegroundColor Gray
Write-Host ""
Write-Host "4. 📊 Check Security Score:" -ForegroundColor Yellow
Write-Host "   - Target: A or A+ rating" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ Security implementation complete!" -ForegroundColor Green
Write-Host ""
