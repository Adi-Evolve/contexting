#!/usr/bin/env pwsh
# VOID Deployment Script
# Prepares and deploys the project to Vercel

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║              VOID - Deployment Preparation                 ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$ErrorActionPreference = "Stop"

# Step 1: Add all changes
Write-Host "📦 Step 1: Adding all changes to Git..." -ForegroundColor Yellow
git add .

# Step 2: Commit changes
Write-Host "`n✍️  Step 2: Committing changes..." -ForegroundColor Yellow
$commitMessage = "Deploy: VOID website with extension downloads - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
git commit -m $commitMessage

# Step 3: Push to GitHub
Write-Host "`n🚀 Step 3: Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

Write-Host "`n✅ Git operations complete!" -ForegroundColor Green
Write-Host "`n════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "NEXT STEPS - Deploy to Vercel:" -ForegroundColor White
Write-Host "════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "Option 1: Vercel Dashboard (Recommended)" -ForegroundColor Yellow
Write-Host "  1. Go to: https://vercel.com/dashboard"
Write-Host "  2. Click 'Add New...' → 'Project'"
Write-Host "  3. Import your GitHub repository: 'contexting'"
Write-Host "  4. Set Root Directory: 'website'"
Write-Host "  5. Click 'Deploy'`n"

Write-Host "Option 2: Vercel CLI" -ForegroundColor Yellow
Write-Host "  1. Install: npm install -g vercel"
Write-Host "  2. Navigate: cd website"
Write-Host "  3. Deploy: vercel --prod`n"

Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "DEPLOYMENT CHECKLIST:" -ForegroundColor White
Write-Host "════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

$checklist = @(
    "✅ Extension ZIP created: website/public/void-chrome-extension.zip",
    "✅ Git repository updated and pushed",
    "✅ vercel.json configuration added",
    "✅ Download paths updated in website",
    "⏳ Vercel deployment (next step)",
    "⏳ Test extension downloads",
    "⏳ Verify all pages load correctly"
)

foreach ($item in $checklist) {
    if ($item.StartsWith("✅")) {
        Write-Host $item -ForegroundColor Green
    } else {
        Write-Host $item -ForegroundColor Yellow
    }
}

Write-Host "`n════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📚 Documentation: See DEPLOYMENT_GUIDE.md for full details" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "🎉 Ready to deploy to Vercel! Follow the steps above." -ForegroundColor Green
