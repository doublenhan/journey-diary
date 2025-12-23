# Trigger Storage Stats Calculation
# Run this script to manually trigger the Cloud Function and populate system_stats

Write-Host "Triggering storage stats calculation..." -ForegroundColor Cyan

# Get Firebase project ID
$projectId = (Get-Content firebase.json | ConvertFrom-Json).projects.default
if (-not $projectId) {
    $projectId = "love-journal-2025"
}

Write-Host "Project ID: $projectId" -ForegroundColor Yellow

# Build the function URL
$functionUrl = "https://us-central1-$projectId.cloudfunctions.net/updateStorageStats"

Write-Host "Function URL: $functionUrl" -ForegroundColor Yellow
Write-Host ""
Write-Host "Note: You need to be logged in as a SysAdmin user to trigger this function." -ForegroundColor Yellow
Write-Host "Please provide your Firebase ID token:" -ForegroundColor Cyan
Write-Host ""
Write-Host "To get your token:" -ForegroundColor Gray
Write-Host "1. Open browser DevTools (F12)" -ForegroundColor Gray
Write-Host "2. Go to Console tab" -ForegroundColor Gray
Write-Host "3. Run: await firebase.auth().currentUser.getIdToken()" -ForegroundColor Gray
Write-Host "4. Copy the token and paste it here" -ForegroundColor Gray
Write-Host ""

$token = Read-Host "Enter ID Token"

if (-not $token) {
    Write-Host "Error: Token is required" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Calling Cloud Function..." -ForegroundColor Cyan

try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri $functionUrl -Method Post -Headers $headers
    
    Write-Host "Success! Storage stats calculated and saved." -ForegroundColor Green
    Write-Host ""
    Write-Host "Stats:" -ForegroundColor Cyan
    Write-Host ($response | ConvertTo-Json -Depth 10) -ForegroundColor White
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
}
