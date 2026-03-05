# GitHub + Vercel Setup - SIMPLE GUIDE (No Tech Jargon)

**For people who don't understand tech stuff - this is for you!**

---

## WHAT WE'RE DOING

Think of it like this:

```
Your code on your computer
        ↓
Save to GitHub (like Google Drive for code)
        ↓
Vercel automatically builds and publishes
        ↓
Your app is live on the internet!
```

---

## STEP 1: CREATE GITHUB ACCOUNT (5 minutes)

### What is GitHub?
GitHub = **Google Drive for programmers**. It stores your code online.

### How to create:
1. Go to: **https://github.com**
2. Click **"Sign up"** (top right)
3. Enter your email
4. Create a password
5. Choose a username (example: `john-mechanic-helper`)
6. Click **"Create account"**
7. Verify your email

**Done!** You now have a GitHub account.

---

## STEP 2: CREATE A REPOSITORY (5 minutes)

### What is a Repository?
Repository = **A folder on GitHub where your code lives**

### How to create:
1. Log in to GitHub
2. Click **"+"** icon (top right)
3. Click **"New repository"**
4. Name it: `mechanic-helper`
5. Description: `Automotive diagnostic AI platform`
6. Click **"Create repository"**

**Done!** You now have a place to store your code.

---

## STEP 3: UPLOAD YOUR CODE TO GITHUB (10 minutes)

### Option A: Using GitHub Website (Easiest)
```
1. Go to your new repository
2. Click "Add file" → "Upload files"
3. Drag and drop your mechanic-helper folder
4. Click "Commit changes"
```

### Option B: Using Command Line (If you know how)
```
cd /home/ubuntu/mechanic-helper
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/mechanic-helper.git
git push -u origin main
```

**Done!** Your code is now on GitHub.

---

## STEP 4: CREATE VERCEL ACCOUNT (5 minutes)

### What is Vercel?
Vercel = **A company that publishes your app to the internet**

### How to create:
1. Go to: **https://vercel.com**
2. Click **"Sign up"**
3. Click **"Continue with GitHub"**
4. Click **"Authorize vercel"**
5. Done!

**Vercel is now connected to your GitHub account.**

---

## STEP 5: DEPLOY YOUR APP TO VERCEL (10 minutes)

### How to deploy:
1. Go to: **https://vercel.com/dashboard**
2. Click **"Add New"** → **"Project"**
3. Click **"Import Git Repository"**
4. Find and click **"mechanic-helper"**
5. Click **"Import"**
6. Vercel will ask for settings (just click **"Deploy"**)
7. Wait 2-3 minutes...
8. Click **"Visit"** when done

**Done!** Your app is now live on the internet!

**Your app URL:** `https://mechanic-helper.vercel.app`

---

## STEP 6: ADD SECRET KEYS (10 minutes)

### What are secret keys?
Secret keys = **Passwords that your app needs to work**

### Where to add them:
1. Go to: **https://vercel.com/dashboard**
2. Click your project: **"mechanic-helper"**
3. Click **"Settings"** (top menu)
4. Click **"Environment Variables"** (left sidebar)
5. Add each key:

```
Name: VITE_FRONTEND_FORGE_API_KEY
Value: (copy from your Manus project)

Name: VITE_FRONTEND_FORGE_API_URL
Value: (copy from your Manus project)

Name: VITE_OAUTH_PORTAL_URL
Value: (copy from your Manus project)

Name: VITE_APP_ID
Value: (copy from your Manus project)
```

6. Click **"Save"**
7. Vercel will re-deploy automatically

**Done!** Your app now has the keys it needs.

---

## STEP 7: AUTO-DEPLOY (AUTOMATIC)

### What happens now?
Every time you change your code:

1. You edit your code on your computer
2. You save it to GitHub (using `git push`)
3. Vercel sees the change automatically
4. Vercel rebuilds your app
5. Your app updates on the internet (1-2 minutes)

**No more manual uploads!**

---

## HOW TO UPDATE YOUR CODE

### Every time you make changes:

1. Edit your code locally
2. Open terminal/command prompt
3. Go to your project folder:
   ```
   cd /home/ubuntu/mechanic-helper
   ```
4. Save changes to GitHub:
   ```
   git add .
   git commit -m "Fixed diagnostic form"
   git push
   ```
5. Wait 1-2 minutes
6. Your app updates automatically!

---

## WHAT IF SOMETHING GOES WRONG?

### App doesn't work after deployment?

**Check Vercel logs:**
1. Go to: **https://vercel.com/dashboard**
2. Click your project
3. Click **"Deployments"** (top menu)
4. Click the red X deployment
5. Scroll down to see errors
6. Fix the error in your code
7. Push to GitHub again

---

## SUMMARY

| Step | What | Time | Done? |
|------|------|------|-------|
| 1 | Create GitHub account | 5 min | ☐ |
| 2 | Create repository | 5 min | ☐ |
| 3 | Upload code | 10 min | ☐ |
| 4 | Create Vercel account | 5 min | ☐ |
| 5 | Deploy to Vercel | 10 min | ☐ |
| 6 | Add secret keys | 10 min | ☐ |
| 7 | Auto-deploy setup | 5 min | ☐ |
| **TOTAL** | **Live on internet!** | **50 min** | ☐ |

---

## YOUR APP IS NOW LIVE!

```
Before:
├─ App only works on your computer
├─ Only you can see it
└─ URL: localhost:3000

After:
├─ App works everywhere
├─ Anyone can see it
├─ URL: mechanic-helper.vercel.app
└─ Updates automatically when you push code
```

---

## QUESTIONS?

**Q: Will my code be public?**
A: Yes, but only if you want. You can make the repository private.

**Q: Do I need to pay?**
A: No! GitHub and Vercel are free for basic use.

**Q: What if I break something?**
A: Vercel keeps old versions. You can rollback anytime.

**Q: How do I stop the auto-deploy?**
A: Go to Vercel Settings → Deployments → Disable auto-deploy.

**Q: Can I use my own domain?**
A: Yes! Vercel supports custom domains (costs ~$10/year).

---

## NEXT STEPS

1. ✅ Create GitHub account
2. ✅ Create repository
3. ✅ Upload code
4. ✅ Create Vercel account
5. ✅ Deploy
6. ✅ Add secret keys
7. ✅ Test your app!

**Then you can focus on:**
- Building the diagnostic engine
- Collecting data with swarm
- Adding features
- Growing your users

**Vercel handles all the hosting automatically!**

---

**That's it! You're done! 🎉**

Your app is now live on the internet and updates automatically.
