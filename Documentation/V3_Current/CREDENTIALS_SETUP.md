# Credentials & Environment Setup Guide

**Version**: 3.0  
**Last Updated**: December 24, 2025  
**Security Level**: 🔒 CONFIDENTIAL

---

## ⚠️ IMPORTANT SECURITY NOTICE

This file contains instructions for setting up credentials. **DO NOT** commit actual credential values to Git.

All API keys, secrets, and sensitive information should be:
- Stored in `.env` files (excluded from Git via `.gitignore`)
- Managed securely by project owner only
- Never shared publicly or in documentation

---

## 📝 Required Credentials

### 1. **Cloudinary**

You need to obtain these from [Cloudinary Dashboard](https://cloudinary.com/console):

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**How to get:**
1. Login to Cloudinary
2. Go to Dashboard
3. Copy credentials from "Account Details" section

### 2. **Firebase**

```env
VITE_FIREBASE_PROJECT_ID=your-project-id
```

**How to get:**
1. Go to Firebase Console
2. Select your project
3. Project Settings → General → Project ID

---

## 🔧 Environment File Setup

### Frontend Files

Create these files in project root:

#### `.env.production`
```env
# Environment
VITE_ENV_PREFIX=

# Firebase
VITE_FIREBASE_PROJECT_ID=your-project-id

# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_API_KEY=your_api_key
VITE_CLOUDINARY_API_SECRET=your_api_secret
```

#### `.env.development`
```env
# Environment
VITE_ENV_PREFIX=dev_

# Firebase
VITE_FIREBASE_PROJECT_ID=your-project-id

# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_API_KEY=your_api_key
VITE_CLOUDINARY_API_SECRET=your_api_secret
```

#### `.env.local` (for local testing)
```env
# Same as .env.development but for local overrides
VITE_ENV_PREFIX=dev_
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_API_KEY=your_api_key
VITE_CLOUDINARY_API_SECRET=your_api_secret
```

### Backend Files (Cloud Functions)

#### `functions/.env.love-journal-2025`
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## ✅ Verify Setup

### 1. Check `.gitignore`

Ensure these patterns are in `.gitignore`:
```
.env
.env.local
.env.production
.env.development
functions/.env.*
```

### 2. Test Credentials

```bash
# Frontend
npm run dev
# Should load without credential errors

# Functions
cd functions
firebase emulators:start
# Should start without auth errors
```

### 3. Verify No Leaks

```bash
# Check if credentials are in Git
git grep "your_api_secret" 
# Should return nothing

# Check staged files
git diff --cached
# Should not contain .env files
```

---

## 🚨 Security Checklist

Before committing code:

- [ ] All `.env*` files listed in `.gitignore`
- [ ] No hardcoded credentials in source code
- [ ] No credentials in documentation
- [ ] No credentials in commit messages
- [ ] Test that app works without committed credentials

---

## 🔄 Credential Rotation

If credentials are compromised:

### Immediate Actions
1. **Revoke old credentials** in Cloudinary Dashboard
2. **Generate new credentials**
3. **Update all `.env` files** with new values
4. **Redeploy functions**: `firebase deploy --only functions`
5. **Test thoroughly** before going live

### Update Locations
- [ ] `.env.production`
- [ ] `.env.development`
- [ ] `.env.local`
- [ ] `functions/.env.love-journal-2025`
- [ ] Local team members' environments

---

## 📞 Support

**For credential issues:**
- Contact project owner directly
- Do NOT share credentials via email/chat
- Use secure credential sharing tools if needed

**For access:**
- Request access to Cloudinary account
- Request Firebase project permissions
- Verify identity before granting access

---

## 📚 Related Documentation

- [CRITICAL_NOTES.md](CRITICAL_NOTES.md) - Important setup notes
- [RELEASE_3.0.md](RELEASE_3.0.md) - Deployment guide
- Firebase Docs: https://firebase.google.com/docs/admin/setup
- Cloudinary Docs: https://cloudinary.com/documentation

---

**Remember**: Security is everyone's responsibility. Never commit secrets! 🔒
