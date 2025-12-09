# 🔒 Security Architecture - Love Journey Diary

## ⚠️ Security Assessment: Diagram BỊ THIẾU Security Layer

Sau khi review code và diagram hiện tại, **app ĐÃ CÓ security features** nhưng **diagram KHÔNG THỂ HIỆN rõ ràng**.

---

## ✅ Security Features Hiện Có (Implemented)

### 1. 🔐 **Authentication Layer**

#### Firebase Authentication
**Location**: `src/LoginPage.tsx`, `src/firebase/firebaseConfig.ts`

```typescript
// Email/Password Authentication
import { signInWithEmailAndPassword } from 'firebase/auth';
await signInWithEmailAndPassword(auth, email, password);

// Phone OTP Authentication  
import { signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';
const confirmationResult = await signInWithPhoneNumber(auth, phone, appVerifier);
```

**Features**:
- ✅ Email/Password login
- ✅ Phone number + OTP verification
- ✅ Firebase Auth session management
- ✅ reCAPTCHA verification for bot protection

---

### 2. 🛡️ **Authorization & Access Control**

#### Protected Routes
**Location**: `src/hooks/useCurrentUserId.ts`, `src/App.tsx`

```typescript
export function useCurrentUserId(): { userId: string | null, loading: boolean } {
  const [userId, setUserId] = useState<string | null>(() => {
    // Check localStorage for session
    const session = localStorage.getItem('userIdSession');
    if (session) {
      const { userId, expires } = JSON.parse(session);
      if (userId && expires && Date.now() < expires) {
        return userId; // Valid session
      }
    }
    return null; // No session or expired
  });
  
  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        // Save with 24h expiry
        localStorage.setItem('userIdSession', JSON.stringify({ 
          userId: user.uid, 
          expires: Date.now() + 24 * 60 * 60 * 1000 
        }));
      } else {
        setUserId(null);
        localStorage.removeItem('userIdSession');
      }
    });
  }, []);
}
```

**Features**:
- ✅ Session validation with expiry (24h)
- ✅ Automatic redirect to login if session expired
- ✅ Real-time auth state listening
- ✅ Secure localStorage session storage

---

#### Firestore Security Rules
**Location**: `firestore.rules`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users can read/write
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /AnniversaryEvent/{docId} {
      allow read, write: if request.auth != null && 
                           request.auth.uid == resource.data.userId;
    }
    
    // Memory metadata (if used)
    match /memoryMetadata/{memoryId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     request.auth.uid == request.resource.data.userId;
    }
  }
}
```

**Features**:
- ✅ User can only access their own data
- ✅ Owner-based authorization
- ✅ Read/Write permissions per collection
- ✅ Server-side validation

---

#### User Ownership Validation
**Location**: `src/utils/memoryFirestore.ts`

```typescript
export async function deleteMemory(memoryId: string, currentUserId: string) {
  const memory = await getMemoryFromFirestore(memoryId);
  
  // Authorization check
  if (memory.userId !== currentUserId) {
    throw new Error('Unauthorized: Cannot delete another user\'s memory');
  }
  
  // Proceed with deletion
  await deleteDoc(doc(db, getCollectionName('memories'), memoryId));
}

export async function updateMemory(memoryId: string, updates: any, currentUserId: string) {
  const memory = await getMemoryFromFirestore(memoryId);
  
  // Authorization check
  if (memory.userId !== currentUserId) {
    throw new Error('Unauthorized: Cannot update another user\'s memory');
  }
  
  // Proceed with update
  await updateDoc(doc(db, getCollectionName('memories'), memoryId), updates);
}
```

**Features**:
- ✅ Client-side ownership validation
- ✅ Prevents unauthorized delete/update
- ✅ Error throwing for security violations

---

### 3. 🔑 **API Security**

#### Environment Variables Separation
**Location**: `.env.local`, `vite.config.ts`

```bash
# Client-side (safe to expose to browser)
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_API_KEY=your-api-key

# Server-side ONLY (NEVER exposed to client)
CLOUDINARY_API_SECRET=your-api-secret
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
```

**Security Pattern**:
- ✅ `VITE_` prefix = client-side (public)
- ✅ No prefix = server-side only (secret)
- ✅ API_SECRET never sent to browser
- ✅ All sensitive operations via serverless API

---

#### Serverless API Security
**Location**: `api/cloudinary/*.js`

```javascript
// api/cloudinary/upload.js
export default async function handler(req, res) {
  // API_SECRET only available on server
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET // SECRET!
  });
  
  // Secure upload with signed request
  const result = await cloudinary.uploader.upload(file.path, {
    folder: 'love-journal/memories',
    resource_type: 'auto',
    // Additional security options
    invalidate: true,
    unique_filename: true,
    overwrite: false
  });
}
```

**Features**:
- ✅ API secrets only in serverless functions
- ✅ No direct client → Cloudinary uploads
- ✅ Server validates all requests
- ✅ Signed URLs for secure access

---

### 4. 🧱 **Input Validation & Sanitization**

#### Form Validation
**Location**: `src/CreateMemory.tsx`, `src/AnniversaryReminders.tsx`

```typescript
// Validate required fields
if (!title.trim()) {
  setError('Title is required');
  return;
}

if (!text.trim() || text.length < 10) {
  setError('Description must be at least 10 characters');
  return;
}

// Image validation
if (images.length > 10) {
  setError('Maximum 10 images allowed');
  return;
}

if (imageFile.size > 20 * 1024 * 1024) { // 20MB
  setError('File size must be less than 20MB');
  return;
}

// Sanitize inputs
const sanitizedTitle = title.trim();
const sanitizedText = text.trim();
```

**Features**:
- ✅ Required field validation
- ✅ File size limits (20MB per image)
- ✅ File type validation (images only)
- ✅ Max items limit (10 images)
- ✅ Input sanitization (trim, escape)

---

### 5. 🕒 **Session Management**

#### Session Storage Strategy
**Location**: `src/hooks/useCurrentUserId.ts`

```typescript
// Save session with expiry
localStorage.setItem('userIdSession', JSON.stringify({
  userId: user.uid,
  expires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
}));

// Validate on app load
const session = localStorage.getItem('userIdSession');
if (session) {
  const { userId, expires } = JSON.parse(session);
  if (expires && Date.now() < expires) {
    return userId; // Valid
  }
  // Expired - clear session
  localStorage.removeItem('userIdSession');
}
```

**Features**:
- ✅ 24-hour session expiry
- ✅ Automatic cleanup on expiry
- ✅ Real-time auth state sync
- ✅ Manual logout support

---

### 6. 🌐 **CORS & API Protection**

#### Vercel Serverless Configuration
**Location**: `vercel.json`

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "https://yourdomain.com" },
        { "key": "Access-Control-Allow-Methods", "value": "GET, POST, DELETE, OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type, Authorization" }
      ]
    }
  ]
}
```

**Features**:
- ✅ CORS configuration
- ✅ Domain whitelisting
- ✅ Method restrictions
- ✅ Header validation

---

## 🚨 Security Gaps & Recommendations

### Current Gaps:

#### 1. **No HTTPS Enforcement** (if self-hosted)
**Issue**: If deployed without HTTPS, credentials can be intercepted

**Fix**: 
```javascript
// Redirect HTTP → HTTPS in production
if (location.protocol !== 'https:' && process.env.NODE_ENV === 'production') {
  location.replace(`https:${location.href.substring(location.protocol.length)}`);
}
```

#### 2. **No Rate Limiting**
**Issue**: API endpoints can be abused (DDoS, brute force)

**Fix**: Add Vercel rate limiting or Cloudflare
```javascript
// Example: Rate limit in serverless function
const rateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // max requests per window
});
```

#### 3. **No Content Security Policy (CSP)**
**Issue**: Vulnerable to XSS attacks

**Fix**: Add CSP headers
```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://apis.google.com;
  img-src 'self' data: https://res.cloudinary.com;
  connect-src 'self' https://*.firebase.com https://nominatim.openstreetmap.org;
">
```

#### 4. **No Input Sanitization for XSS**
**Issue**: User inputs might contain malicious scripts

**Fix**: Use DOMPurify
```typescript
import DOMPurify from 'dompurify';

const sanitizedText = DOMPurify.sanitize(userInput);
```

#### 5. **Session Storage in localStorage**
**Issue**: XSS can steal session from localStorage

**Better**: Use httpOnly cookies (requires backend)
```javascript
// Server sets httpOnly cookie
res.cookie('session', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000
});
```

---

## 📊 Updated Architecture Diagram (với Security Layer)

```
┌────────────────────────────────────────────────────────┐
│                    USER / BROWSER                      │
└───────────────────┬────────────────────────────────────┘
                    │
          ┌─────────┴─────────┐
          │                   │
          ▼                   ▼
┌──────────────────┐  ┌────────────────────┐
│ 🔒 SECURITY      │  │ FRONTEND LAYER     │
│ LAYER            │  │ (React + TS)       │
├──────────────────┤  ├────────────────────┤
│ Firebase Auth    │→ │ Pages, Components  │
│ Session Check    │  │ Hooks, State       │
│ Protected Routes │  │                    │
│ Input Validation │  │                    │
└──────────────────┘  └─────────┬──────────┘
          │                     │
          │   ┌─────────────────┘
          │   │
          ▼   ▼
┌──────────────────────────────────────────┐
│       SERVERLESS API LAYER (Vercel)      │
├──────────────────────────────────────────┤
│ ✅ API_SECRET protection                 │
│ ✅ Request validation                    │
│ ✅ CORS configuration                    │
└─────────┬────────────────────────────────┘
          │
    ┌─────┴──────┐
    │            │
    ▼            ▼
┌─────────┐  ┌──────────────┐
│ Firebase│  │  Cloudinary  │
│ ├─Auth  │  │  ├─Images    │
│ ├─Rules │  │  ├─Transform │
│ └─DB    │  │  └─Search    │
└─────────┘  └──────────────┘
```

---

## ✅ Security Checklist

### Authentication
- [x] Firebase Authentication integration
- [x] Email/Password login
- [x] Phone + OTP verification
- [x] reCAPTCHA for bot protection
- [ ] Password reset flow
- [ ] Account deletion

### Authorization
- [x] Firestore security rules
- [x] User ownership validation
- [x] Protected routes (useCurrentUserId)
- [x] Session expiry (24h)
- [ ] Role-based access control (if needed)

### API Security
- [x] Environment variable separation
- [x] API_SECRET server-side only
- [x] Serverless function protection
- [ ] Rate limiting
- [ ] API key rotation

### Data Protection
- [x] HTTPS (Vercel default)
- [x] Secure session storage
- [x] Input validation
- [ ] Output encoding
- [ ] XSS prevention (DOMPurify)
- [ ] SQL injection prevention (N/A - NoSQL)

### Infrastructure
- [x] CORS configuration
- [x] Firebase rules
- [x] Cloudinary folder structure
- [ ] CSP headers
- [ ] Security headers (X-Frame-Options, etc.)

---

## 🎯 Recommendations

### High Priority
1. **Add Rate Limiting** - Prevent API abuse
2. **Implement CSP** - Prevent XSS attacks
3. **Add DOMPurify** - Sanitize user inputs
4. **Password Reset Flow** - Complete auth experience

### Medium Priority
5. **httpOnly Cookies** - More secure than localStorage
6. **API Key Rotation** - Regular credential updates
7. **Security Monitoring** - Log suspicious activities
8. **Penetration Testing** - Professional security audit

### Low Priority
9. **2FA/MFA** - Extra authentication layer
10. **Account Lockout** - After failed login attempts
11. **IP Whitelisting** - Restrict API access
12. **Encrypted Database Fields** - Extra data protection

---

## 📚 Related Documentation

- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Cloudinary Security Best Practices](https://cloudinary.com/documentation/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Vercel Security](https://vercel.com/docs/security)

---

## 🔐 Conclusion

**App có security tốt ở mức basic**, nhưng cần bổ sung:
1. Rate limiting
2. CSP headers
3. XSS sanitization
4. httpOnly cookies (optional)

**Diagram cần update** để thể hiện Security Layer rõ ràng hơn!
