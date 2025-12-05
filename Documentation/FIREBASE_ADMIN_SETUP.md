# Firebase Admin Setup Instructions

## Get Service Account Credentials

1. Go to Firebase Console: https://console.firebase.google.com/project/love-journal-2025/settings/serviceaccounts/adminsdk

2. Click "Generate new private key" button

3. Download the JSON file (e.g., `love-journal-2025-firebase-adminsdk-xxxxx.json`)

4. Open the JSON file and extract these values:
   - `project_id`
   - `client_email`  
   - `private_key`

5. Add to `.env.development` and `.env.production`:

```bash
# Firebase Admin SDK (for server-side Firestore access)
FIREBASE_PROJECT_ID=love-journal-2025
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@love-journal-2025.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----\n"
```

6. **IMPORTANT**: Add the JSON file to `.gitignore`:
```
*.json
!package.json
!package-lock.json
!tsconfig.json
!firebase.json
```

7. For Vercel deployment, add these as Environment Variables in Vercel dashboard:
   - FIREBASE_PROJECT_ID
   - FIREBASE_CLIENT_EMAIL
   - FIREBASE_PRIVATE_KEY (paste the entire key with \n characters)

## Why This Fix is Needed

- Previously: Title, location, text stored in Cloudinary context (limited to ~30 chars each)
- Now: Full data stored in Firestore, only minimal data in Cloudinary
- API needs to fetch from both:
  - Cloudinary: Images
  - Firestore: Title, location, text (full length, no truncation)
