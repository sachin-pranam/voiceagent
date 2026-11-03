# Vapi.ai Setup - Step by Step (Hindi)

## Step 1: Account Banao (2 min) 📝

1. **Website par jao:**
   ```
   https://vapi.ai
   ```

2. **Sign Up karo:**
   - Click: **"Start for Free"** ya **"Get Started"**
   - Email se sign up karo
   - Verification email check karo aur verify karo

3. **Dashboard khulega** ✅

---

## Step 2: AI Assistant Banao (5 min) 🤖

### 2.1 New Assistant Create Karo

1. Dashboard par click: **"Create Assistant"** ya **"New Assistant"**

2. **Basic Information:**
   ```
   Name: Customer Support Assistant
   Description: Handles customer calls
   ```

3. **Voice Settings:**
   - Voice: Koi bhi natural voice select karo (e.g., "Samantha")
   - Language: English (ya jo chahiye)
   - Speed: Normal

4. **First Message:**
   ```
   "Hello! Thank you for calling. How can I help you today?"
   ```

5. **System Prompt (Important!):**
   ```
   You are a helpful customer support assistant. 
   You provide information about:
   - Store hours: Monday-Friday 9 AM to 6 PM EST
   - Returns: 30 days with receipt
   - Shipping: 5-7 days standard, 2-3 days express
   
   Be friendly, concise, and helpful.
   ```

6. Click: **"Save"** ya **"Create Assistant"**

### 2.2 Assistant ID Copy Karo

Assistant banne ke baad:
- Settings ya Details mein jao
- **Assistant ID** dikhega (looks like: `a1b2c3d4-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
- ✅ **Copy kar lo!**

---

## Step 3: API Keys Generate Karo (2 min) 🔑

### 3.1 Private API Key

1. Dashboard → **Settings** ⚙️ → **API Keys**

2. Click: **"Create New Key"** ya **"Generate API Key"**
   - Key Type: **Private Key**
   - Name: `Dashboard Integration`

3. Key generate hoga (starts with `sk_live_` ya `sk_test_`)
   - ⚠️ **IMPORTANT:** Ye key sirf ek baar dikhega!
   - ✅ **Copy karke save kar lo!**

### 3.2 Webhook Secret Generate Karo

**Computer ka terminal kholo aur ye command run karo:**

#### Windows PowerShell:
```powershell
-join ((48..57) + (97..102) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

#### Linux/Mac:
```bash
openssl rand -hex 32
```

**Ya manually banao:**
- 32 characters ka random string
- Letters aur numbers mix karo
- Example: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`

✅ **Is secret ko bhi save kar lo!**

---

## Step 4: Vapi mein Webhook Configure Karo (3 min) 🔗

### 4.1 Pehle Local URL Banao (For Testing)

**Option 1: ngrok Use Karo (Recommended for testing)**

1. **ngrok download karo:**
   ```
   https://ngrok.com/download
   ```

2. **Install karke run karo:**
   ```bash
   ngrok http 8080
   ```

3. **Public URL milega:**
   ```
   https://xxxx-xxx-xxx-xxx.ngrok-free.app
   ```
   ✅ Copy kar lo!

**Option 2: Direct localhost (Only for local testing)**
- `http://localhost:8080` (production mein kaam nahi karega)

### 4.2 Vapi Dashboard mein Webhook Set Karo

1. **Vapi Dashboard → Assistant Settings** ya **Account Settings**

2. **Server URL field mein paste karo:**
   ```
   https://your-ngrok-url.ngrok-free.app/api/public/vapi-webhook
   ```
   
   Example:
   ```
   https://abc123.ngrok-free.app/api/public/vapi-webhook
   ```

3. **Server Secret field mein:**
   - Apna generated webhook secret paste karo

4. Click: **"Save"** ✅

---

## Step 5: Environment Variables Add Karo (2 min) 💻

### 5.1 .env File Kholo

```powershell
cd d:\ai\pixel-perfect-pixels-main
notepad .env
```

### 5.2 Ye Lines Add Karo (End mein)

```env
# Vapi Configuration
VAPI_PRIVATE_KEY=sk_live_your_actual_key_here
VAPI_ASSISTANT_ID=a1b2c3d4-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VAPI_SERVER_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**Replace karo:**
- `sk_live_your_actual_key_here` → Apni actual private key
- `a1b2c3d4-xxxx-xxxx...` → Apni actual assistant ID
- `a1b2c3d4e5f6g7h8...` → Apna generated webhook secret

### 5.3 Save Karo
- Ctrl + S
- File close karo

---

## Step 6: Server Restart Karo (1 min) 🔄

Terminal mein:

```bash
# Current server band karo
Ctrl + C

# Naye environment variables ke saath start karo
npm run dev
```

Server start hone ka wait karo (5-10 seconds)

---

## Step 7: Test Karo! (5 min) 🧪

### 7.1 Dashboard Check

1. Browser kholo: `http://localhost:8080/`

2. **Settings page par jao**

3. Click: **"Test connection"**

4. **Success message dikhna chahiye:**
   ```
   ✅ Connected — assistant "Customer Support Assistant"
   ```

### 7.2 Test Call Karo

**Option 1: Vapi Dashboard se Test**
1. Vapi dashboard → Assistant
2. "Test" ya "Try" button click karo
3. Microphone allow karo
4. Baat karo!

**Option 2: Phone se Call**
1. Vapi dashboard mein phone number milega (if configured)
2. Us number par call karo

**Option 3: Web Widget**
1. Vapi dashboard → Assistant → Embed
2. Test widget use karo

### 7.3 Dashboard Mein Check Karo

Test call ke baad:
1. Apne dashboard par jao: `http://localhost:8080/`
2. **Dashboard** page → Call dikhna chahiye (15-30 seconds mein)
3. **Calls** page → Call details
4. Click karke **transcript** dekho
5. **"View Call Response"** test karo

---

## ✅ Success Checklist

- [ ] Vapi account ban gaya
- [ ] AI Assistant create kiya
- [ ] Assistant ID copy kiya
- [ ] Private API Key generate kiya
- [ ] Webhook secret generate kiya
- [ ] ngrok ya public URL set kiya
- [ ] Vapi mein webhook configure kiya
- [ ] .env file mein keys add kiye
- [ ] Server restart kiya
- [ ] "Test connection" successful
- [ ] Test call kiya
- [ ] Dashboard mein call dikhा

---

## 🆘 Troubleshooting

### Error: "Vapi private key is not set"
✅ `.env` file check karo, `VAPI_PRIVATE_KEY` add kiya?

### Error: "Connection error"
✅ API key sahi hai? Vapi dashboard mein check karo

### Error: Webhook not working
✅ URL sahi hai? `/api/public/vapi-webhook` end mein hai?
✅ ngrok running hai?
✅ Server secret match kar raha hai?

### Call dashboard mein nahi dikh raha
✅ Webhook URL accessible hai?
✅ Server running hai?
✅ "Sync Vapi calls" button try karo (Calls page)

---

## 📱 Production Deployment (Optional)

Local testing ke baad, production ke liye:

1. **Vercel/Netlify par deploy karo** (DEPLOYMENT.md dekho)
2. **Production URL milega:** `https://your-app.vercel.app`
3. **Vapi mein update karo:**
   ```
   https://your-app.vercel.app/api/public/vapi-webhook
   ```
4. ngrok ki zarurat nahi!

---

## 🎉 Done!

Ab aapka complete AI Call Assistant ready hai:
- ✅ Real-time call monitoring
- ✅ Automatic transcription
- ✅ AI summaries
- ✅ Call recordings
- ✅ Knowledge base
- ✅ User management

**Happy Calling! 🎊**
