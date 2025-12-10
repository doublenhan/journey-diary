# 🗺️ API Endpoints to Firebase SDK Mapping

**Date**: December 10, 2025  
**Purpose**: Detailed migration guide from API routes to Firebase Direct SDK  
**Status**: Complete Mapping

---

## 📊 Current Bundle Analysis (V2.0)

### Build Output Summary
```
Total CSS: 230.04 KB (raw) │ 48.28 KB (gzip)
Total JS:  1,284.04 KB (raw) │ 376.37 KB (gzip)

Key Bundles:
- vendor-firebase: 366.19 KB │ 110.73 KB (gzip)
- vendor-react: 343.60 KB │ 98.71 KB (gzip)
- vendor-pdf: 197.59 KB │ 45.82 KB (gzip)
- vendor-map: 152.98 KB │ 44.07 KB (gzip)
```

**Optimization Opportunities:**
- Firebase bundle is large but necessary (authentication + Firestore)
- PDF vendor can be lazy-loaded (not used on initial page)
- Map vendor can be lazy-loaded (only for location features)
- React bundle is standard size

---

## 🔄 API Endpoint Migration Map

### 1. Authentication Endpoints

#### Current: `/api/auth/session` (POST)
**Location**: `api/auth/session.js`  
**Purpose**: Create server-side session after Firebase Auth login

**Current Implementation:**
```javascript
// api/auth/session.js
export default async function handler(req, res) {
  const { idToken } = req.body;
  const decodedToken = await admin.auth().verifyIdToken(idToken);
  // Create session...
  res.json({ sessionId, userId });
}
```

**Usage in Frontend:**
```typescript
// src/hooks/useCurrentUserId.ts (Line 32)
const response = await fetch('/api/auth/session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ idToken }),
});
```

**V3.0 Direct Firebase:**
```typescript
// No API needed - Firebase Auth handles this directly
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const auth = getAuth();
onAuthStateChanged(auth, (user) => {
  if (user) {
    const userId = user.uid;
    const idToken = await user.getIdToken();
    // Use directly, no session API needed
  }
});
```

**Benefits:**
- ✅ Remove entire API route
- ✅ Reduce latency (no server round-trip)
- ✅ Firebase handles session management
- ✅ Built-in token refresh

---

#### Current: `/api/auth/session` (DELETE)
**Purpose**: Delete server-side session on logout

**Current Implementation:**
```typescript
// src/hooks/useCurrentUserId.ts (Line 60)
await fetch('/api/auth/session', { method: 'DELETE' });
```

**V3.0 Direct Firebase:**
```typescript
import { getAuth, signOut } from 'firebase/auth';

const auth = getAuth();
await signOut(auth);
// Firebase automatically clears client-side tokens
```

---

### 2. Cloudinary Upload Endpoints

#### Current: `/api/cloudinary/upload` (POST)
**Location**: `api/cloudinary/upload.js`  
**Purpose**: Upload image to Cloudinary via server

**Current Implementation:**
```javascript
// api/cloudinary/upload.js
export default async function handler(req, res) {
  const upload = multer({ storage: multer.memoryStorage() });
  // Process multipart form data
  const result = await cloudinary.uploader.upload(fileBuffer, {
    folder: `memories/${userId}`,
    transformation: [{ width: 1920, quality: 'auto' }]
  });
  res.json({ url: result.secure_url, publicId: result.public_id });
}
```

**Usage in Frontend:**
```typescript
// src/hooks/useCloudinary.ts (Line 85)
// src/components/EditMemoryModal.tsx (Line 239)
const formData = new FormData();
formData.append('file', file);
formData.append('userId', userId);

const response = await fetch('/api/cloudinary/upload', {
  method: 'POST',
  body: formData,
});
```

**V3.0 Direct Cloudinary:**
```typescript
// Use Cloudinary Upload Widget (client-side, no API needed)
import { uploadToCloudinary } from './services/cloudinaryDirectService';

// Direct upload with unsigned preset
const result = await uploadToCloudinary(file, {
  folder: `memories/${userId}`,
  transformation: [{ width: 1920, quality: 'auto', fetch_format: 'auto' }],
  upload_preset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
});

// Result: { url, publicId, width, height, format }
```

**Required Setup:**
```javascript
// Cloudinary Dashboard → Settings → Upload → Upload presets
// Create unsigned upload preset with:
{
  "name": "diary_unsigned_upload",
  "unsigned": true,
  "folder": "memories",
  "allowed_formats": ["jpg", "jpeg", "png", "gif", "webp"],
  "max_file_size": 10000000,  // 10MB
  "transformation": [
    { "quality": "auto", "fetch_format": "auto" },
    { "width": 1920, "height": 1080, "crop": "limit" }
  ]
}
```

**Benefits:**
- ✅ Remove API route
- ✅ Direct upload (faster, no server hop)
- ✅ Cloudinary handles validation
- ✅ Built-in progress tracking

---

#### Current: `/api/cloudinary/delete` (POST)
**Location**: `api/cloudinary/delete.js`  
**Purpose**: Delete image from Cloudinary (requires API secret)

**Current Implementation:**
```javascript
// api/cloudinary/delete.js
export default async function handler(req, res) {
  const { publicId } = req.body;
  // Verify user owns this image
  const result = await cloudinary.uploader.destroy(publicId);
  res.json({ result });
}
```

**Usage in Frontend:**
```typescript
// src/components/EditMemoryModal.tsx (Line 95)
// src/hooks/useCloudinary.ts (Line 109)
// src/utils/memoryOperations.ts (Line 23)
await fetch('/api/cloudinary/delete', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ publicId }),
});
```

**V3.0 Solution:**
```typescript
// Use Firebase Cloud Function (requires API secret, cannot be client-side)
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const deleteImage = httpsCallable(functions, 'deleteCloudinaryImage');

const result = await deleteImage({ 
  publicId,
  userId: auth.currentUser.uid 
});
```

**Firebase Function:**
```typescript
// functions/src/index.ts
import { onCall } from 'firebase-functions/v2/https';
import { v2 as cloudinary } from 'cloudinary';

export const deleteCloudinaryImage = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be logged in');
  }
  
  const { publicId } = request.data;
  const userId = request.auth.uid;
  
  // Verify user owns this image (check Firestore)
  const memoryRef = await admin.firestore()
    .collection('memories')
    .where('userId', '==', userId)
    .where('photos', 'array-contains-any', [publicId])
    .get();
  
  if (memoryRef.empty) {
    throw new HttpsError('permission-denied', 'Image not found or not owned');
  }
  
  // Delete from Cloudinary
  const result = await cloudinary.uploader.destroy(publicId);
  return { result: result.result };
});
```

**Note:** This is the ONLY API that needs to remain (as Firebase Function) because:
- Cloudinary delete requires API secret
- Cannot expose secret to client
- Firebase Function provides secure server-side execution

---

### 3. Memory CRUD Endpoints

#### Current: `/api/cloudinary/memory` (POST)
**Location**: `api/cloudinary/memory.js`  
**Purpose**: Save new memory to Firestore + Cloudinary metadata

**Current Implementation:**
```javascript
// api/cloudinary/memory.js
export default async function handler(req, res) {
  const { userId, title, text, location, photos, date } = req.body;
  
  // Save to Firestore
  const docRef = await admin.firestore().collection('memories').add({
    userId,
    title,
    text,
    location,
    photos,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  res.json({ id: docRef.id });
}
```

**Usage in Frontend:**
```typescript
// src/CreateMemory.tsx (Line 373)
const response = await fetch('/api/cloudinary/memory', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId, title, text, location, photos, date }),
});
```

**V3.0 Direct Firebase:**
```typescript
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase/firebaseConfig';

const docRef = await addDoc(collection(db, 'memories'), {
  userId: auth.currentUser.uid,
  title,
  text,
  location,
  photos,  // Array of { url, publicId, width, height }
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

// docRef.id is the document ID
```

**Benefits:**
- ✅ Remove API route
- ✅ Direct write (faster)
- ✅ Firestore Security Rules validate data
- ✅ Offline support built-in

---

#### Current: `/api/cloudinary/memories` (GET)
**Location**: `api/cloudinary/memories.js`  
**Purpose**: Fetch all memories for current user

**Current Implementation:**
```javascript
// api/cloudinary/memories.js
export default async function handler(req, res) {
  const { userId } = req.query;
  
  const snapshot = await admin.firestore()
    .collection('memories')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();
  
  const memories = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  res.json({ memories });
}
```

**V3.0 Direct Firebase:**
```typescript
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

const q = query(
  collection(db, 'memories'),
  where('userId', '==', auth.currentUser.uid),
  orderBy('createdAt', 'desc')
);

const snapshot = await getDocs(q);
const memories = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));
```

**With Real-time Updates (Bonus):**
```typescript
import { onSnapshot } from 'firebase/firestore';

const unsubscribe = onSnapshot(q, (snapshot) => {
  const memories = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  setMemories(memories);
});

// Cleanup
return () => unsubscribe();
```

---

### 4. Geolocation Endpoint

#### Current: `/api/geo` (GET)
**Location**: `api/geo.js`  
**Purpose**: Reverse geocoding (coordinates → address)

**Current Implementation:**
```javascript
// api/geo.js (if exists)
export default async function handler(req, res) {
  const { lat, lng } = req.query;
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
  const data = await response.json();
  res.json({ address: data.display_name });
}
```

**V3.0 Direct Call:**
```typescript
// Already using direct call in src/services/geoService.ts
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
    {
      headers: {
        'User-Agent': 'LoveJournal/2.0',
      },
    }
  );
  const data = await response.json();
  return data.display_name;
}
```

**Status:** ✅ Already direct, no API route needed

---

## 📝 Migration Summary

### Files Requiring Changes

| File | Current API Calls | V3.0 Changes |
|------|-------------------|--------------|
| `src/CreateMemory.tsx` | `POST /api/cloudinary/memory` | Use `addDoc()` |
| `src/components/EditMemoryModal.tsx` | `POST /api/cloudinary/upload`<br>`POST /api/cloudinary/delete` | Use `uploadToCloudinary()`<br>Use Firebase Function |
| `src/hooks/useCurrentUserId.ts` | `POST /api/auth/session`<br>`DELETE /api/auth/session` | Use `onAuthStateChanged()`<br>Use `signOut()` |
| `src/hooks/useCloudinary.ts` | `POST /api/cloudinary/upload`<br>`POST /api/cloudinary/delete` | Use `uploadToCloudinary()`<br>Use Firebase Function |
| `src/utils/memoryOperations.ts` | `POST /api/cloudinary/delete` | Use Firebase Function |

### API Routes to Delete

1. ✅ `api/auth/session.js` - Replace with Firebase Auth
2. ✅ `api/cloudinary/config.js` - Not needed (client-side config)
3. ✅ `api/cloudinary/upload.js` - Replace with direct upload
4. ❌ `api/cloudinary/delete.js` - **Move to Firebase Function**
5. ✅ `api/cloudinary/memory.js` - Replace with Firestore SDK
6. ✅ `api/cloudinary/memories.js` - Replace with Firestore SDK
7. ✅ `api/cloudinary/images.js` - Replace with Firestore SDK
8. ✅ `api/middleware/rateLimiter.js` - Replace with Firestore rules
9. ✅ `api/middleware/sessionAuth.js` - Replace with Firebase Auth
10. ✅ `api/geo.js` - Already direct (no API needed)

**Total API routes to delete: 9**  
**Total Firebase Functions needed: 1** (deleteCloudinaryImage)

---

## 🚀 Implementation Order

### Phase 1: Firebase Auth (Week 3)
1. Update `useCurrentUserId.ts` to use `onAuthStateChanged()`
2. Remove `/api/auth/session` calls
3. Test authentication flow
4. Remove `api/auth/` folder

### Phase 2: Firestore Direct (Week 3-4)
1. Update `CreateMemory.tsx` to use `addDoc()`
2. Update memory fetch hooks to use Firestore queries
3. Test CRUD operations
4. Remove `api/cloudinary/memory.js` and `memories.js`

### Phase 3: Cloudinary Direct Upload (Week 5)
1. Setup Cloudinary unsigned upload preset
2. Update `uploadToCloudinary()` in services
3. Update `useCloudinary.ts` hook
4. Update `EditMemoryModal.tsx`
5. Test image uploads
6. Remove `api/cloudinary/upload.js`

### Phase 4: Firebase Function for Delete (Week 5)
1. Create `deleteCloudinaryImage` Firebase Function
2. Deploy to Firebase
3. Update all delete calls to use function
4. Test delete functionality
5. Remove `api/cloudinary/delete.js` (API route)

### Phase 5: Cleanup (Week 6)
1. Remove entire `/api` folder
2. Remove `api-server.js`
3. Update `vercel.json` (remove API rewrites)
4. Remove unused dependencies (express, multer, etc.)
5. Update documentation

---

## ✅ Verification Checklist

- [ ] All API calls replaced with Firebase SDK
- [ ] Authentication working without session API
- [ ] Memory CRUD operations working
- [ ] Image upload working with direct Cloudinary
- [ ] Image delete working with Firebase Function
- [ ] Security Rules enforcing all validations
- [ ] No errors in console
- [ ] Performance improved (latency, bundle size)
- [ ] All tests passing
- [ ] Documentation updated

---

**Status**: 🟢 Mapping Complete - Ready for Implementation

**Next Phase**: Begin Phase 1 - Firebase Auth Migration
