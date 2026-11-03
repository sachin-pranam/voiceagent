# Awaaz AI - Vercel Deployment Script
# This script pushes all environment variables to Vercel

Write-Host "🚀 Deploying Awaaz AI to Vercel..." -ForegroundColor Green
Write-Host ""

# First, login to Vercel (if not already logged in)
Write-Host "📝 Checking Vercel login status..." -ForegroundColor Blue
vercel whoami

if ($LASTEXITCODE -ne 0) {
    Write-Host "🔑 Please login to Vercel first..." -ForegroundColor Yellow
    vercel login
}

Write-Host ""
Write-Host "🔧 Setting up environment variables..." -ForegroundColor Blue

# Public Supabase variables (available to browser)
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production  
vercel env add VITE_SUPABASE_PROJECT_ID production

# Server-side Supabase variables
vercel env add SUPABASE_URL production
vercel env add SUPABASE_PUBLISHABLE_KEY production
vercel env add SUPABASE_PROJECT_ID production
vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Vapi/AI Configuration (Secret)
vercel env add VAPI_PRIVATE_KEY production
vercel env add VAPI_ASSISTANT_ID production  
vercel env add VAPI_SERVER_SECRET production

Write-Host ""
Write-Host "📋 Environment variables to set:" -ForegroundColor Yellow
Write-Host "VITE_SUPABASE_URL = https://jsckymgdeeykmlcpuztv.supabase.co"
Write-Host "VITE_SUPABASE_PUBLISHABLE_KEY = sb_publishable_ZpyV74737YDxWcghTi8UvQ_Slk2DSqf"
Write-Host "VITE_SUPABASE_PROJECT_ID = jsckymgdeeykmlcpuztv"
Write-Host "SUPABASE_URL = https://jsckymgdeeykmlcpuztv.supabase.co"
Write-Host "SUPABASE_PUBLISHABLE_KEY = sb_publishable_ZpyV74737YDxWcghTi8UvQ_Slk2DSqf"
Write-Host "SUPABASE_PROJECT_ID = jsckymgdeeykmlcpuztv"
Write-Host "SUPABASE_SERVICE_ROLE_KEY = [SECRET - will prompt]"
Write-Host "VAPI_PRIVATE_KEY = [SECRET - will prompt]"
Write-Host "VAPI_ASSISTANT_ID = e9159617-a567-4623-97ad-75a0c140fa3c"
Write-Host "VAPI_SERVER_SECRET = [SECRET - will prompt]"
Write-Host ""

Write-Host "⚠️  Note: You'll be prompted to enter secret values manually for security." -ForegroundColor Red
Write-Host "📝 Copy the values from your .env file when prompted." -ForegroundColor Yellow
Write-Host ""

Read-Host "Press Enter to continue with environment variable setup"

Write-Host ""
Write-Host "🎯 After setting env vars, deploying the application..." -ForegroundColor Green
vercel --prod

Write-Host ""
Write-Host "✅ Deployment complete! Check your Vercel dashboard for the live URL." -ForegroundColor Green