# Awaaz AI - Automated Vercel Environment Setup
# This script automatically sets all environment variables in Vercel

Write-Host "🚀 Setting up Awaaz AI environment variables in Vercel..." -ForegroundColor Green

# Check if logged in to Vercel
vercel whoami
if ($LASTEXITCODE -ne 0) {
    Write-Host "🔑 Please login to Vercel first..." -ForegroundColor Yellow
    vercel login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Vercel login failed. Exiting." -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Vercel login confirmed" -ForegroundColor Green
Write-Host ""

# Set all environment variables using echo to pipe values
Write-Host "📝 Setting public Supabase variables..." -ForegroundColor Blue

echo "https://jsckymgdeeykmlcpuztv.supabase.co" | vercel env add VITE_SUPABASE_URL production
echo "sb_publishable_ZpyV74737YDxWcghTi8UvQ_Slk2DSqf" | vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production  
echo "jsckymgdeeykmlcpuztv" | vercel env add VITE_SUPABASE_PROJECT_ID production

Write-Host "📝 Setting server-side Supabase variables..." -ForegroundColor Blue

echo "https://jsckymgdeeykmlcpuztv.supabase.co" | vercel env add SUPABASE_URL production
echo "sb_publishable_ZpyV74737YDxWcghTi8UvQ_Slk2DSqf" | vercel env add SUPABASE_PUBLISHABLE_KEY production
echo "jsckymgdeeykmlcpuztv" | vercel env add SUPABASE_PROJECT_ID production

Write-Host "🔐 Setting secret variables..." -ForegroundColor Blue

echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzY2t5bWdkZWV5a21sY3B1enR2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDk1NDU0NywiZXhwIjoyMTA2NTMwNTQ3fQ.jUIxmnt1JoZDxvTxthfw1OjdtcNZzqAabQ-fX_72JxY" | vercel env add SUPABASE_SERVICE_ROLE_KEY production

echo "50f6ec09-2a16-4698-8561-b246989758cf" | vercel env add VAPI_PRIVATE_KEY production
echo "e9159617-a567-4623-97ad-75a0c140fa3c" | vercel env add VAPI_ASSISTANT_ID production  
echo "6zjy30dxl2iec4ruwv8pm9qakt7bghfn" | vercel env add VAPI_SERVER_SECRET production

Write-Host ""
Write-Host "✅ All environment variables have been set in Vercel!" -ForegroundColor Green
Write-Host ""

# Verify the environment variables were set
Write-Host "📋 Verifying environment variables..." -ForegroundColor Blue
vercel env ls

Write-Host ""
Write-Host "🎯 Ready to deploy! Run 'vercel --prod' to deploy to production." -ForegroundColor Yellow
Write-Host "   Or run 'vercel' for a preview deployment." -ForegroundColor Yellow