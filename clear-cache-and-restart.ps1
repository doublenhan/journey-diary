#!/usr/bin/env pwsh
<#
.SYNOPSIS
Clear browser and dev server cache - Fix INTERNAL_ASSERTION_FAILED errors

.DESCRIPTION
This script will:
1. Stop all Node processes
2. Clear Vite cache
3. Restart dev server with clean state
4. Provide instructions for browser cache clearing

.EXAMPLE
.\clear-cache-and-restart.ps1
#>

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🧹 CACHE CLEARING SCRIPT - Fix Firebase Errors" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# Step 1: Stop Node processes
Write-Host "`n[1/4] Stopping Node processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "✅ Node processes stopped" -ForegroundColor Green

# Step 2: Clear Vite cache
Write-Host "`n[2/4] Clearing Vite cache..." -ForegroundColor Yellow
Remove-Item -Path "node_modules/.vite" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "✅ Vite cache cleared" -ForegroundColor Green

# Step 3: Clear dist folder
Write-Host "`n[3/4] Clearing build artifacts..." -ForegroundColor Yellow
Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "✅ Build artifacts cleared" -ForegroundColor Green

# Step 4: Restart dev server
Write-Host "`n[4/4] Starting fresh dev server..." -ForegroundColor Yellow
Start-Sleep -Seconds 1

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ SERVER CACHE CLEARED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green

Write-Host "`n⚠️  BROWSER CACHE - Làm theo các bước sau:" -ForegroundColor Yellow
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host "`n📋 OPTION 1: Hard Refresh (Nhanh nhất)" -ForegroundColor Cyan
Write-Host "   1. Mở Chrome" -ForegroundColor White
Write-Host "   2. Vào: http://localhost:3001" -ForegroundColor White
Write-Host "   3. Nhấn: Ctrl + Shift + R" -ForegroundColor Green
Write-Host "   4. Đợi page reload hoàn toàn" -ForegroundColor White

Write-Host "`n📋 OPTION 2: Clear Storage (Triệt để)" -ForegroundColor Cyan
Write-Host "   1. Mở Chrome DevTools (F12)" -ForegroundColor White
Write-Host "   2. Application tab" -ForegroundColor White
Write-Host "   3. Clear storage (sidebar trái)" -ForegroundColor White
Write-Host "   4. Click 'Clear site data' button" -ForegroundColor Green
Write-Host "   5. Reload page (F5)" -ForegroundColor White

Write-Host "`n📋 OPTION 3: Incognito Mode (Sạch nhất)" -ForegroundColor Cyan
Write-Host "   1. Nhấn: Ctrl + Shift + N" -ForegroundColor Green
Write-Host "   2. Vào: http://localhost:3001" -ForegroundColor White
Write-Host "   3. Test app trong Incognito" -ForegroundColor White

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host "`n✅ Expected Result (sau khi clear cache):" -ForegroundColor Green
Write-Host "   • Không còn INTERNAL_ASSERTION_FAILED" -ForegroundColor White
Write-Host "   • Không còn enableIndexedDbPersistence errors" -ForegroundColor White
Write-Host "   • App login bình thường" -ForegroundColor White
Write-Host "   • Console sạch (không có red errors)" -ForegroundColor White

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

# Start dev server
Write-Host "`n🚀 Starting dev server in 3 seconds..." -ForegroundColor Cyan
Start-Sleep -Seconds 3
npm run dev
