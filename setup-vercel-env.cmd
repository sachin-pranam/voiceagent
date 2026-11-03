@echo off
echo 🚀 Setting up Awaaz AI environment variables in Vercel...

REM Check if logged in to Vercel
vercel whoami
if %errorlevel% neq 0 (
    echo 🔑 Please login to Vercel first...
    vercel login
)

echo ✅ Setting up environment variables...

REM Public Supabase variables
echo Setting VITE_SUPABASE_URL...
echo https://jsckymgdeeykmlcpuztv.supabase.co | vercel env add VITE_SUPABASE_URL production

echo Setting VITE_SUPABASE_PUBLISHABLE_KEY...
echo sb_publishable_ZpyV74737YDxWcghTi8UvQ_Slk2DSqf | vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production

echo Setting VITE_SUPABASE_PROJECT_ID...
echo jsckymgdeeykmlcpuztv | vercel env add VITE_SUPABASE_PROJECT_ID production

REM Server-side Supabase variables
echo Setting SUPABASE_URL...
echo https://jsckymgdeeykmlcpuztv.supabase.co | vercel env add SUPABASE_URL production

echo Setting SUPABASE_PUBLISHABLE_KEY...
echo sb_publishable_ZpyV74737YDxWcghTi8UvQ_Slk2DSqf | vercel env add SUPABASE_PUBLISHABLE_KEY production

echo Setting SUPABASE_PROJECT_ID...
echo jsckymgdeeykmlcpuztv | vercel env add SUPABASE_PROJECT_ID production

echo Setting SUPABASE_SERVICE_ROLE_KEY...
echo eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzY2t5bWdkZWV5a21sY3B1enR2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDk1NDU0NywiZXhwIjoyMTA2NTMwNTQ3fQ.jUIxmnt1JoZDxvTxthfw1OjdtcNZzqAabQ-fX_72JxY | vercel env add SUPABASE_SERVICE_ROLE_KEY production

REM Vapi Configuration
echo Setting VAPI_PRIVATE_KEY...
echo 50f6ec09-2a16-4698-8561-b246989758cf | vercel env add VAPI_PRIVATE_KEY production

echo Setting VAPI_ASSISTANT_ID...
echo e9159617-a567-4623-97ad-75a0c140fa3c | vercel env add VAPI_ASSISTANT_ID production

echo Setting VAPI_SERVER_SECRET...
echo 6zjy30dxl2iec4ruwv8pm9qakt7bghfn | vercel env add VAPI_SERVER_SECRET production

echo.
echo ✅ All environment variables have been set in Vercel!
echo.
echo 📋 Verifying environment variables...
vercel env ls

echo.
echo 🎯 Ready to deploy! Run 'vercel --prod' to deploy to production.
echo    Or run 'vercel' for a preview deployment.
pause