# Environment Setup Guide

## Tách biệt DEV/PROD với Free Plan

Dự án sử dụng **Environment Variables** để tách biệt data DEV/PROD trong cùng 1 Firebase project và 1 Cloudinary account (phù hợp với free plan).

## Cách hoạt động

### Firebase Collections
- **PROD**: `users`, `userEffects`, `AnniversaryEvent`
- **DEV**: `dev_users`, `dev_userEffects`, `dev_AnniversaryEvent`

### Cloudinary Folders
- **PROD**: `production/love-journal`
- **DEV**: `dev/love-journal`

## Setup Local Development

1. **Copy file .env.development**
   ```bash
   cp .env.development .env.local
   ```

2. **Điền thông tin Firebase vào .env.local**
   - Lấy config từ Firebase Console
   - Sử dụng chung config với PROD

3. **Run development**
   ```bash
   npm run dev
   ```
   → Data sẽ tự động lưu vào `dev_*` collections

## Setup Vercel Environment

### Production (main branch)
Trong Vercel → Settings → Environment Variables:
```
VITE_ENV_PREFIX=                    (empty - không có prefix)
CLOUDINARY_FOLDER_PREFIX=production
```

### Preview (dev branch)  
Trong Vercel → Settings → Environment Variables → Preview:
```
VITE_ENV_PREFIX=dev_
CLOUDINARY_FOLDER_PREFIX=dev
```

## Firestore Security Rules

Cập nhật rules để cho phép DEV collections:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Production collections
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /userEffects/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /AnniversaryEvent/{docId} {
      allow read, write: if request.auth != null;
    }
    
    // Development collections (with dev_ prefix)
    match /dev_users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /dev_userEffects/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /dev_AnniversaryEvent/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Testing

### Local Development
```bash
npm run dev
```
→ Check Firebase Console → `dev_*` collections có data

### Vercel Preview
```bash
git push origin dev
```
→ Check Vercel deployment URL → Test features
→ Check Firebase Console → `dev_*` collections có data mới

### Production
```bash
git checkout main
git merge dev
git push origin main
```
→ Check PROD URL → Verify
→ Check Firebase Console → main collections không bị ảnh hưởng

## Lưu ý

- **Không cần tạo Firebase project mới** (tiết kiệm free quota)
- **Không cần Cloudinary account mới** (tiết kiệm storage)
- **Data hoàn toàn tách biệt** giữa DEV và PROD
- **Dễ dàng cleanup** DEV data (xóa `dev_*` collections)
- **Auth users dùng chung** (có thể login cả DEV và PROD)

## Cleanup DEV Data

Khi muốn xóa data DEV:
1. Firebase Console → Firestore Database
2. Xóa các collections: `dev_users`, `dev_userEffects`, `dev_AnniversaryEvent`
3. Cloudinary → Media Library → Xóa folder `dev`
