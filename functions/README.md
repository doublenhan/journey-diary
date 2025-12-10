# Firebase Cloud Functions - Deployment Guide

## Setup & Deploy

### 1. Install Firebase CLI (nếu chưa có)
```bash
npm install -g firebase-tools
firebase login
```

### 2. Install Functions Dependencies
```bash
cd functions
npm install
```

### 3. Set Environment Variables
```bash
# Set Cloudinary credentials
firebase functions:config:set \
  cloudinary.cloud_name="dhelefhv1" \
  cloudinary.api_key="296369272882129" \
  cloudinary.api_secret="YOUR_ACTUAL_SECRET_HERE"

# View current config
firebase functions:config:get
```

### 4. Build & Deploy
```bash
# Build TypeScript
npm run build

# Deploy to Firebase
cd ..
firebase deploy --only functions
```

### 5. Verify Deployment
Check Firebase Console → Functions → `deleteCloudinaryImage` should be deployed

## Local Testing (Optional)

```bash
cd functions
npm run serve
```

## Environment Variables on Firebase

Firebase Functions sử dụng `functions:config` thay vì `.env` files:

```bash
# View all config
firebase functions:config:get

# Set individual values
firebase functions:config:set key.subkey="value"

# Unset values
firebase functions:config:unset key.subkey
```

## Required Environment Variables

- `cloudinary.cloud_name` - Cloudinary cloud name
- `cloudinary.api_key` - Cloudinary API key  
- `cloudinary.api_secret` - **Cloudinary API secret** (get from Dashboard → Settings → API Keys)

## Advantages over Vercel Serverless

1. **Integrated Authentication**: Automatic Firebase Auth token verification
2. **Single Ecosystem**: All backend in Firebase (Firestore + Functions + Auth)
3. **Simpler Deployment**: Single `firebase deploy` command
4. **Better Security**: Cloud Functions have direct access to Firestore with security rules
5. **Cost Efficiency**: Firebase free tier includes 125K function invocations/month

## Function Details

**Name**: `deleteCloudinaryImage`  
**Type**: Callable HTTPS function  
**Auth**: Required (Firebase Authentication)  
**Input**: `{ publicId: string }`  
**Output**: `{ success: boolean, result: string, message: string }`

## Client Usage

The function is automatically called from `cloudinaryDirectService.ts`:

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const deleteImage = httpsCallable(functions, 'deleteCloudinaryImage');
const result = await deleteImage({ publicId: 'image-id' });
```
