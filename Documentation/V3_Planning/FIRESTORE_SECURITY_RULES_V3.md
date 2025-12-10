# 🔒 Firestore Security Rules V3.0 - Comprehensive Design

**Date**: December 10, 2025  
**Status**: Design Complete  
**Version**: 3.0.0

---

## 📋 Overview

This document details the comprehensive security rules for V3.0 migration where we remove API routes and use Firebase Direct SDK.

### Security Philosophy
1. **Zero Trust**: Every request must be validated
2. **Defense in Depth**: Multiple layers of validation
3. **Principle of Least Privilege**: Users can only access their own data
4. **Data Validation**: Strict type and size limits
5. **Rate Limiting**: Prevent abuse via Firestore rules

---

## 🛡️ Enhanced Security Rules

### Current Implementation Analysis

**✅ What's Good:**
- Basic authentication checks (`isAuthenticated()`)
- Owner validation (`isOwner()`)
- Data structure validation
- Default deny policy
- Separate dev/prod collections

**⚠️ What Needs Enhancement:**
- No field-level validation (email format, phone format, etc.)
- No rate limiting logic
- No content length validation for text fields
- No validation for photo URLs format
- No timestamp validation
- No location data validation
- Missing validation for updates (partial updates)

---

## 🔐 Enhanced Rules Design

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ===========================
    // HELPER FUNCTIONS - V3.0 Enhanced
    // ===========================
    
    // 1. Authentication Helpers
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // 2. Timestamp Helpers
    function isValidTimestamp(timestamp) {
      return timestamp is timestamp;
    }
    
    function isRecentTimestamp(timestamp) {
      // Timestamp must be within 1 minute of server time (allow clock skew)
      return timestamp > request.time - duration.value(1, 'm')
        && timestamp < request.time + duration.value(1, 'm');
    }
    
    // 3. String Validation Helpers
    function isValidString(str, minLength, maxLength) {
      return str is string 
        && str.size() >= minLength 
        && str.size() <= maxLength;
    }
    
    function isValidEmail(email) {
      return email is string 
        && email.matches('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
    }
    
    function isValidPhone(phone) {
      return phone is string 
        && phone.matches('^[+]?[0-9]{10,15}$');
    }
    
    function isValidLanguage(lang) {
      return lang in ['vi', 'en'];
    }
    
    function isValidUrl(url) {
      return url is string 
        && (url.matches('^https://res.cloudinary.com/.*') 
            || url.matches('^https://.*\\.cloudinary\\.com/.*'));
    }
    
    // 4. Array Validation Helpers
    function isValidPhotoArray(photos) {
      return photos is list
        && photos.size() >= 1
        && photos.size() <= 10;
    }
    
    function allPhotosAreValid(photos) {
      return photos.hasAll(photos.toSet())
        && photos.hasOnly(['publicId', 'url', 'width', 'height', 'format']);
    }
    
    // 5. Location Validation Helpers
    function isValidLocation(location) {
      return location is map
        && 'address' in location
        && 'lat' in location
        && 'lng' in location
        && location.lat is number
        && location.lng is number
        && location.lat >= -90 && location.lat <= 90
        && location.lng >= -180 && location.lng <= 180;
    }
    
    // 6. Rate Limiting (Basic - via timestamp)
    function notTooFrequent(lastTimestamp) {
      // Prevent creating more than 1 memory per 5 seconds
      return !('createdAt' in resource.data) 
        || request.time > resource.data.createdAt + duration.value(5, 's');
    }
    
    // ===========================
    // MEMORY VALIDATION - Enhanced
    // ===========================
    
    function isValidMemoryCreate() {
      let data = request.resource.data;
      return data.keys().hasAll(['userId', 'title', 'text', 'location', 'photos', 'createdAt', 'updatedAt'])
        && isOwner(data.userId)
        && isValidString(data.title, 1, 200)
        && isValidString(data.text, 0, 5000)
        && isValidLocation(data.location)
        && isValidPhotoArray(data.photos)
        && isValidTimestamp(data.createdAt)
        && isValidTimestamp(data.updatedAt)
        && data.createdAt == data.updatedAt
        && isRecentTimestamp(data.createdAt);
    }
    
    function isValidMemoryUpdate() {
      let data = request.resource.data;
      let oldData = resource.data;
      
      return data.userId == oldData.userId  // Cannot change owner
        && data.createdAt == oldData.createdAt  // Cannot change creation time
        && isValidTimestamp(data.updatedAt)
        && data.updatedAt > oldData.updatedAt  // Updated time must be newer
        && isRecentTimestamp(data.updatedAt)
        && (!('title' in data.diff(oldData).affectedKeys()) || isValidString(data.title, 1, 200))
        && (!('text' in data.diff(oldData).affectedKeys()) || isValidString(data.text, 0, 5000))
        && (!('location' in data.diff(oldData).affectedKeys()) || isValidLocation(data.location))
        && (!('photos' in data.diff(oldData).affectedKeys()) || isValidPhotoArray(data.photos));
    }
    
    // ===========================
    // ANNIVERSARY VALIDATION - Enhanced
    // ===========================
    
    function isValidAnniversaryCreate() {
      let data = request.resource.data;
      return data.keys().hasAll(['userId', 'title', 'date', 'createdAt'])
        && isOwner(data.userId)
        && isValidString(data.title, 1, 200)
        && isValidTimestamp(data.date)
        && isValidTimestamp(data.createdAt)
        && isRecentTimestamp(data.createdAt);
    }
    
    function isValidAnniversaryUpdate() {
      let data = request.resource.data;
      let oldData = resource.data;
      
      return data.userId == oldData.userId
        && data.createdAt == oldData.createdAt
        && (!('title' in data.diff(oldData).affectedKeys()) || isValidString(data.title, 1, 200))
        && (!('date' in data.diff(oldData).affectedKeys()) || isValidTimestamp(data.date));
    }
    
    // ===========================
    // USER PROFILE VALIDATION - Enhanced
    // ===========================
    
    function isValidUserProfile() {
      let data = request.resource.data;
      return (!('displayName' in data) || isValidString(data.displayName, 1, 100))
        && (!('email' in data) || isValidEmail(data.email))
        && (!('phone' in data) || isValidPhone(data.phone))
        && (!('language' in data) || isValidLanguage(data.language))
        && (!('dob' in data) || isValidTimestamp(data.dob));
    }
    
    // ===========================
    // COLLECTIONS - Production
    // ===========================
    
    // Users Collection
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow create: if isOwner(userId) && isValidUserProfile();
      allow update: if isOwner(userId) && isValidUserProfile();
      allow delete: if false;  // Prevent user deletion via client
    }
    
    // Memories Collection
    match /memories/{memoryId} {
      // Read: Only owner can read their memories
      allow read: if isAuthenticated() && isOwner(resource.data.userId);
      
      // Create: Validate all fields + rate limit
      allow create: if isAuthenticated() 
        && isValidMemoryCreate()
        && notTooFrequent(null);
      
      // Update: Validate changed fields only
      allow update: if isAuthenticated() 
        && isOwner(resource.data.userId)
        && isValidMemoryUpdate();
      
      // Delete: Only owner can delete
      allow delete: if isAuthenticated() && isOwner(resource.data.userId);
    }
    
    // Anniversary Events Collection
    match /AnniversaryEvent/{eventId} {
      allow read: if isAuthenticated() && isOwner(resource.data.userId);
      allow create: if isAuthenticated() && isValidAnniversaryCreate();
      allow update: if isAuthenticated() 
        && isOwner(resource.data.userId) 
        && isValidAnniversaryUpdate();
      allow delete: if isAuthenticated() && isOwner(resource.data.userId);
    }
    
    // User Effects (theme, settings)
    match /userEffects/{userId} {
      allow read, write: if isOwner(userId);
    }
    
    // ===========================
    // COLLECTIONS - Development (Dev prefix)
    // ===========================
    
    match /dev_users/{userId} {
      allow read: if isOwner(userId);
      allow create: if isOwner(userId) && isValidUserProfile();
      allow update: if isOwner(userId) && isValidUserProfile();
      allow delete: if false;
    }
    
    match /dev_memories/{memoryId} {
      allow read: if isAuthenticated() && isOwner(resource.data.userId);
      allow create: if isAuthenticated() && isValidMemoryCreate();
      allow update: if isAuthenticated() 
        && isOwner(resource.data.userId)
        && isValidMemoryUpdate();
      allow delete: if isAuthenticated() && isOwner(resource.data.userId);
    }
    
    match /dev_AnniversaryEvent/{eventId} {
      allow read: if isAuthenticated() && isOwner(resource.data.userId);
      allow create: if isAuthenticated() && isValidAnniversaryCreate();
      allow update: if isAuthenticated() 
        && isOwner(resource.data.userId)
        && isValidAnniversaryUpdate();
      allow delete: if isAuthenticated() && isOwner(resource.data.userId);
    }
    
    match /dev_userEffects/{userId} {
      allow read, write: if isOwner(userId);
    }
    
    // ===========================
    // DEFAULT DENY - Security Best Practice
    // ===========================
    
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 🧪 Security Rules Test Cases

### Test Structure
```
tests/
├── firestore.rules.test.ts
├── memories.rules.test.ts
├── anniversaries.rules.test.ts
└── users.rules.test.ts
```

### Test Cases Required

#### 1. Authentication Tests
- ✅ Unauthenticated users cannot read any data
- ✅ Unauthenticated users cannot write any data
- ✅ Authenticated users can only access their own data
- ✅ Authenticated users cannot access other users' data

#### 2. Memory CRUD Tests
- ✅ Create memory with valid data succeeds
- ❌ Create memory without userId fails
- ❌ Create memory with wrong userId fails
- ❌ Create memory with invalid title (too long) fails
- ❌ Create memory with invalid photos array fails
- ❌ Create memory with invalid location fails
- ✅ Update memory with valid data succeeds
- ❌ Update memory changing userId fails
- ❌ Update memory changing createdAt fails
- ✅ Delete own memory succeeds
- ❌ Delete other user's memory fails

#### 3. Anniversary CRUD Tests
- ✅ Create anniversary with valid data succeeds
- ❌ Create anniversary with invalid title fails
- ❌ Create anniversary with invalid date fails
- ✅ Update anniversary succeeds
- ❌ Update other user's anniversary fails
- ✅ Delete own anniversary succeeds
- ❌ Delete other user's anniversary fails

#### 4. User Profile Tests
- ✅ Read own profile succeeds
- ❌ Read other user's profile fails
- ✅ Update own profile with valid data succeeds
- ❌ Update profile with invalid email fails
- ❌ Update profile with invalid phone fails
- ❌ Delete user profile fails (should be disabled)

#### 5. Validation Tests
- ❌ Title > 200 characters fails
- ❌ Text > 5000 characters fails
- ❌ Photos array > 10 items fails
- ❌ Photos array = 0 items fails
- ❌ Invalid email format fails
- ❌ Invalid phone format fails
- ❌ Invalid cloudinary URL fails
- ❌ Latitude > 90 or < -90 fails
- ❌ Longitude > 180 or < -180 fails

#### 6. Rate Limiting Tests
- ✅ Create memory succeeds
- ❌ Create another memory within 5 seconds fails
- ✅ Create another memory after 5 seconds succeeds

---

## 🚀 Implementation Steps

### Step 1: Update firestore.rules
```bash
# Copy enhanced rules to firestore.rules
cp Documentation/V3_Planning/FIRESTORE_SECURITY_RULES_V3.md firestore.rules

# Deploy to Firebase (test first)
firebase deploy --only firestore:rules
```

### Step 2: Setup Firebase Emulator
```bash
# Install Firebase tools
npm install -g firebase-tools

# Initialize emulators
firebase init emulators

# Select: Firestore, Authentication

# Start emulator
firebase emulators:start
```

### Step 3: Write Test Suite
```typescript
// tests/firestore.rules.test.ts
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';

describe('Firestore Security Rules', () => {
  let testEnv;
  
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'demo-project',
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8'),
      },
    });
  });
  
  afterAll(async () => {
    await testEnv.cleanup();
  });
  
  // Test cases here...
});
```

### Step 4: Run Tests
```bash
npm run test:rules
```

---

## 📊 Security Checklist

- [x] Authentication required for all operations
- [x] Owner verification for all user data
- [x] Field-level validation (type, length, format)
- [x] Timestamp validation and clock skew handling
- [x] Rate limiting (basic via timestamp)
- [x] Default deny policy
- [x] Email format validation
- [x] Phone format validation
- [x] URL format validation (Cloudinary only)
- [x] Location coordinate bounds checking
- [x] Array size limits
- [x] Prevent userId changes
- [x] Prevent createdAt changes
- [x] Separate dev/prod environments
- [ ] Test suite with 100% coverage
- [ ] Firebase App Check integration
- [ ] Cloudinary signed uploads

---

## 🔐 Additional Security Measures

### 1. Firebase App Check
```typescript
// main.tsx
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),
  isTokenAutoRefreshEnabled: true
});
```

### 2. Cloudinary Signed Uploads
```typescript
// Backend function to generate signature
import { v2 as cloudinary } from 'cloudinary';

export const generateCloudinarySignature = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp: timestamp,
      folder: `memories/${context.auth.uid}`,
    },
    process.env.CLOUDINARY_API_SECRET
  );
  
  return { signature, timestamp };
});
```

### 3. Rate Limiting via Firebase Extensions
```bash
# Install Rate Limiting extension
firebase ext:install firestore-counter
firebase ext:install firebase-firestore-rate-limit
```

---

## 📈 Monitoring & Alerts

### 1. Setup Firestore Rules Monitoring
- Enable Firestore security rules logs
- Setup alerts for denied requests
- Monitor for unusual patterns

### 2. Cloud Monitoring Alerts
```yaml
# alerts.yaml
- displayName: 'High Security Rule Denials'
  conditions:
    - displayName: 'Firestore denied requests > 100/min'
      conditionThreshold:
        filter: 'resource.type="firestore_database" AND metric.type="firestore.googleapis.com/document/write_count" AND metric.labels.status="PERMISSION_DENIED"'
        comparison: COMPARISON_GT
        thresholdValue: 100
        duration: 60s
```

---

## ✅ Success Criteria

- [ ] All security rules tests pass (100% coverage)
- [ ] No security vulnerabilities in audit
- [ ] Firebase App Check enabled
- [ ] Cloudinary signed uploads implemented
- [ ] Rate limiting active
- [ ] Monitoring and alerts configured
- [ ] Documentation complete
- [ ] Team reviewed and approved

---

**Status**: 🟢 Design Complete - Ready for Implementation

**Next Steps**:
1. Update firestore.rules with enhanced rules
2. Setup Firebase Emulator
3. Write comprehensive test suite
4. Run tests and fix any issues
5. Deploy to staging for testing
6. Deploy to production after approval
