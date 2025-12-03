# PowerShell script to run Cloudinary migration with Vercel environment variables
# Usage: .\runMigration.ps1 -Environment production
#        .\runMigration.ps1 -Environment preview

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("production", "preview")]
    [string]$Environment
)

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Cloudinary Migration for $Environment" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Pull environment variables from Vercel
Write-Host "📥 Pulling environment variables from Vercel..." -ForegroundColor Yellow

$envFile = ".env.vercel.$Environment"

try {
    vercel env pull $envFile --environment $Environment
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to pull environment variables from Vercel" -ForegroundColor Red
        Write-Host "Please run: vercel login" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "✅ Environment variables pulled successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Load environment variables
Write-Host ""
Write-Host "📋 Loading environment variables..." -ForegroundColor Yellow

if (-not (Test-Path $envFile)) {
    Write-Host "❌ Environment file not found: $envFile" -ForegroundColor Red
    exit 1
}

Get-Content $envFile | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        
        # Remove quotes if present
        $value = $value -replace '^"(.*)"$', '$1'
        $value = $value -replace "^'(.*)'$", '$1'
        
        [System.Environment]::SetEnvironmentVariable($key, $value, [System.EnvironmentVariableTarget]::Process)
        
        # Show loaded vars (hide secrets)
        if ($key -match 'SECRET|PASSWORD|KEY') {
            Write-Host "  $key = ****" -ForegroundColor Gray
        } else {
            Write-Host "  $key = $value" -ForegroundColor Gray
        }
    }
}

Write-Host ""
Write-Host "✅ Environment variables loaded" -ForegroundColor Green

# Step 3: Verify required variables
Write-Host ""
Write-Host "🔍 Verifying required variables..." -ForegroundColor Yellow

$cloudName = $env:CLOUDINARY_CLOUD_NAME ?? $env:VITE_CLOUDINARY_CLOUD_NAME
$apiKey = $env:CLOUDINARY_API_KEY ?? $env:VITE_CLOUDINARY_API_KEY
$apiSecret = $env:CLOUDINARY_API_SECRET ?? $env:VITE_CLOUDINARY_API_SECRET

if (-not $cloudName) {
    Write-Host "❌ CLOUDINARY_CLOUD_NAME not found" -ForegroundColor Red
    exit 1
}

if (-not $apiKey) {
    Write-Host "❌ CLOUDINARY_API_KEY not found" -ForegroundColor Red
    exit 1
}

if (-not $apiSecret) {
    Write-Host "❌ CLOUDINARY_API_SECRET not found" -ForegroundColor Red
    exit 1
}

Write-Host "✅ All required variables present" -ForegroundColor Green
Write-Host "  Cloud: $cloudName" -ForegroundColor Gray
Write-Host "  Prefix: $($env:CLOUDINARY_FOLDER_PREFIX ?? '(none)')" -ForegroundColor Gray

# Step 4: Confirm migration
Write-Host ""
Write-Host "⚠️  WARNING: This will migrate images on $Environment environment" -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "Do you want to proceed? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "❌ Migration cancelled" -ForegroundColor Red
    exit 0
}

# Step 5: Run migration
Write-Host ""
Write-Host "🚀 Starting migration..." -ForegroundColor Green
Write-Host ""

try {
    node scripts/migrateToUserFolderStructure.cjs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Migration failed with exit code $LASTEXITCODE" -ForegroundColor Red
        exit $LASTEXITCODE
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error during migration: $_" -ForegroundColor Red
    exit 1
}

# Step 6: Cleanup
Write-Host ""
Write-Host "🧹 Cleaning up..." -ForegroundColor Yellow

if (Test-Path $envFile) {
    Remove-Item $envFile -Force
    Write-Host "✅ Removed $envFile" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Migration Complete!" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
