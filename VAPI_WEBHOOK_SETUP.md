# 🎯 Vapi Webhook - Final Setup Steps

## ✅ Environment Variables - DONE!

Aapki `.env` file mein ye add ho gaye:
```
VAPI_PRIVATE_KEY=50f6ec09-2a16-4698-8561-b246989758cf
VAPI_ASSISTANT_ID=e9159617-a567-4623-97ad-75a0c140fa3c
VAPI_SERVER_SECRET=6zjy30dxl2iec4ruwv8pm9qakt7bghfn
```

## ✅ Server Restarted - DONE!

Server chal raha hai:
- Local: http://localhost:8080/
- Network: http://192.168.0.7:8080/

---

## 🔗 AB YE IMPORTANT STEP KARO

### Vapi Dashboard Mein Webhook Configure Karo

#### Step 1: Vapi Dashboard Kholo
```
https://dashboard.vapi.ai
```

#### Step 2: Settings/Configuration Mein Jao
- Left sidebar → **Settings** ⚙️
- Ya **Assistant Settings** → **Server URL**

#### Step 3: Webhook URL Set Karo

**Server URL field mein ye paste karo:**
```
https://gap-whenever-extradite.ngrok-free.dev/api/public/vapi-webhook
```

#### Step 4: Server Secret Set Karo

**Server Secret field mein ye paste karo:**
```
6zjy30dxl2iec4ruwv8pm9qakt7bghfn
```

#### Step 5: Save Karo
- Click **"Save"** ya **"Update"**
- ✅ Success message aana chahiye!

---

## 🧪 TEST CONNECTION

### Browser Mein Test Karo

1. **Browser kholo:**
   ```
   http://localhost:8080/
   ```

2. **Admin login karo** (agar nahi kiya to pehle account banao)

3. **Settings page par jao**
   - Sidebar → Settings

4. **"Test connection" button click karo**

5. **Success message dikhna chahiye:**
   ```
   ✅ Connected — assistant "Your Assistant Name"
   ```

---

## 📞 TEST CALL

### Option 1: Vapi Dashboard Se Test

1. Vapi Dashboard → **Assistants** → Apna assistant
2. **"Test"** ya **"Try Call"** button
3. Microphone allow karo
4. Baat karo: "Hello, what are your store hours?"

### Option 2: Phone Call (If Available)

1. Vapi dashboard mein phone number check karo
2. Us number par call karo
3. AI se baat karo

### Option 3: Web Widget

1. Vapi Dashboard → Assistant → **Embed** tab
2. Test widget use karo browser mein

---

## ✅ VERIFICATION

Call ke baad (15-30 seconds wait):

1. **Dashboard par jao**
   - http://localhost:8080/
   - New call dikhna chahiye!

2. **Calls page check karo**
   - Complete call details
   - Status, duration, cost

3. **Call details dekho**
   - Recording play karo
   - Transcript padho
   - "View Call Response" test karo

---

## 🆘 Troubleshooting

### Problem: "Test connection" fails

**Check:**
1. ✅ `.env` file mein sahi keys hain?
2. ✅ Server restart kiya?
3. ✅ Vapi private key sahi hai?

**Solution:**
```bash
# Server restart
Ctrl+C
npm run dev
```

### Problem: Webhook not receiving calls

**Check:**
1. ✅ ngrok running hai?
2. ✅ Webhook URL sahi hai? (ending: `/api/public/vapi-webhook`)
3. ✅ Server secret match kar raha hai?

**Solution:**
- Vapi dashboard mein webhook URL/secret verify karo
- ngrok terminal check karo (requests dikh rahe hain?)

### Problem: Call dashboard mein nahi aaya

**Check:**
1. Wait karo 30 seconds (processing time)
2. Dashboard refresh karo
3. "Sync Vapi calls" button try karo (Calls page)

**Manual Sync:**
- Calls page → "Sync Vapi calls" button
- Manually fetch kar lo

---

## 🎉 COMPLETE SETUP CHECKLIST

### Backend
- [x] Supabase database setup
- [x] Environment variables configured
- [x] Server running
- [x] Vapi keys added

### Vapi
- [ ] Webhook URL configured in Vapi
- [ ] Server secret configured in Vapi
- [ ] "Test connection" successful
- [ ] Test call made

### Dashboard
- [ ] Admin account created
- [ ] Dashboard loads
- [ ] Settings shows "Connected"
- [ ] Test call appears in calls list
- [ ] Transcript visible
- [ ] Recording playable

---

## 📝 YOUR CONFIGURATION

**Save this information:**

```
Project Name: AI Call Assistant

Supabase:
- URL: https://jsckymgdeeykmlcpuztv.supabase.co
- Project: jsckymgdeeykmlcpuztv

Vapi:
- Private Key: 50f6ec09-2a16-4698-8561-b246989758cf
- Assistant ID: e9159617-a567-4623-97ad-75a0c140fa3c
- Webhook Secret: 6zjy30dxl2iec4ruwv8pm9qakt7bghfn

ngrok:
- Public URL: https://gap-whenever-extradite.ngrok-free.dev
- Webhook: https://gap-whenever-extradite.ngrok-free.dev/api/public/vapi-webhook

Local:
- Dashboard: http://localhost:8080/
- Network: http://192.168.0.7:8080/
```

---

## 🚀 NEXT STEPS

### For Testing (Local):
1. Keep ngrok running
2. Make test calls
3. Monitor dashboard

### For Production:
1. Deploy to Vercel/Netlify (see DEPLOYMENT.md)
2. Update Vapi webhook to production URL
3. Remove ngrok dependency

---

## 💡 TIPS

1. **ngrok Free Tier:**
   - URL changes on restart
   - Update Vapi webhook har baar
   - Production ke liye paid plan ya deployment

2. **Monitor Calls:**
   - Realtime updates enabled hai
   - Auto-refresh hoga
   - Manual refresh bhi kar sakte ho

3. **Knowledge Base:**
   - Sample articles available
   - Add more for better AI responses
   - AI automatically references them

4. **Users:**
   - Add team members
   - Assign viewer roles
   - Track who accessed what

---

**Ab bas ek step baki hai - Vapi mein webhook configure karo! 🎊**
