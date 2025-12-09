# 🚀 Quick Start & Reference Guide

**For**: New developers joining the project  
**Date**: November 29, 2025  
**Time to Read**: 5-10 minutes

---

## ⚡ 60-Second Overview

**Love Journey Diary** is a web app for couples to:
- 📝 Write and save memories
- 📸 Upload and organize photos
- 🗓️ Track anniversaries
- 🎨 Customize with themes
- 📄 Export to PDF

**Tech Stack**: React + TypeScript + Firebase + Cloudinary + Vercel

---

## 🔧 Getting Started (5 minutes)

### 1. Clone & Install

```bash
git clone <repo-url>
cd diary_2
npm install
```

### 2. Create .env.local

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your credentials:
VITE_FIREBASE_API_KEY=your_key_here
VITE_FIREBASE_PROJECT_ID=your_project
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Start Development

```bash
npm run dev

# Opens automatically at http://localhost:3000
```

---

## 📁 Where to Find Things

### Common Tasks

| Task | File | Line Count |
|------|------|-----------|
| Create new page | `src/` | Create `.tsx` |
| Add icon | `lucide-react` import | - |
| Style component | `src/styles/` | Create `.css` |
| Create hook | `src/hooks/` | Create `.ts` |
| API function | `src/apis/` | Create `.ts` |
| Backend handler | `api/cloudinary/` | Create `.js` |

### Key Files to Know

```
App.tsx                    → Main routing
LoginPage.tsx              → Authentication
CreateMemory.tsx           → Write memories
ViewMemory.tsx             → Photo gallery
SettingPage.tsx            → User settings

useCurrentUserId.ts        → Get logged-in user
useMemoriesCache.ts        → Get memories from cache
cloudinaryGalleryApi.ts    → Types for Cloudinary
```

---

## 🎯 Common Tasks

### Task 1: Create a New Page

```typescript
// src/NewPage.tsx
import { useState } from 'react';
import { Heart } from 'lucide-react';
import './styles/NewPage.css';

interface NewPageProps {
  onBack?: () => void;
  currentTheme: 'happy' | 'calm' | 'romantic';
}

const themes = {
  happy: { background: 'linear-gradient(135deg, #FFFDE4 0%, #FEF08A 100%)' },
  calm: { background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)' },
  romantic: { background: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)' }
};

function NewPage({ onBack, currentTheme }: NewPageProps) {
  const theme = themes[currentTheme];
  const [state, setState] = useState('');

  return (
    <div style={{ background: theme.background }}>
      <button onClick={onBack}>Back</button>
      <h1>New Page</h1>
      {/* Your content here */}
    </div>
  );
}

export default NewPage;
```

### Task 2: Add Route to App

```typescript
// App.tsx
import NewPage from './NewPage';

// Inside App component, add to <Routes>:
<Route path="/new-page" element={<NewPage 
  onBack={() => navigate('/')} 
  currentTheme={currentTheme} 
/>} />
```

### Task 3: Fetch Data from API

```typescript
// Example: Fetch memories
const { memoriesByYear, isLoading, error } = useMemoriesCache(userId, loading);

// Example: Fetch images
const response = await fetch('/api/cloudinary/images?max_results=20');
const data = await response.json();
console.log(data.resources); // Array of images
```

### Task 4: Create an API Endpoint

```javascript
// api/cloudinary/myendpoint.js
export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Your logic here
      res.status(200).json({ data: 'result' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
```

### Task 5: Use Custom Hook

```typescript
// In any component
import { useCurrentUserId } from './hooks/useCurrentUserId';

function MyComponent() {
  const { userId, loading } = useCurrentUserId();

  if (loading) return <div>Loading...</div>;
  if (!userId) return <div>Not logged in</div>;

  return <div>Welcome, {userId}</div>;
}
```

---

## 🎨 Styling Guide

### Using Themes

```typescript
const themes = {
  happy: {
    background: 'linear-gradient(135deg, #FFFDE4 0%, #FEF08A 100%)',
    textPrimary: '#78350f',
    border: '#FEF08A'
  },
  calm: {
    background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
    textPrimary: '#3730a3',
    border: '#E0E7FF'
  },
  romantic: {
    background: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)',
    textPrimary: '#831843',
    border: '#FCE7F3'
  }
};

// Apply theme
const theme = themes[currentTheme];
<div style={{ background: theme.background, color: theme.textPrimary }}>
  Content
</div>
```

### CSS Classes (Tailwind)

```typescript
// Use Tailwind utilities
<div className="p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
  <h2 className="text-xl font-bold text-center">Title</h2>
  <p className="text-gray-600">Description</p>
</div>

// Responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Items */}
</div>
```

---

## 🔌 API Endpoints Quick Reference

### Image Operations

```bash
# Upload image
POST /api/cloudinary/upload
Content-Type: multipart/form-data
Body: file, folder, tags, userId

# Get images
GET /api/cloudinary/images?max_results=20&folder=love-journal

# Delete image
DELETE /api/cloudinary/delete
Body: { public_id: "..." }

# Health check
GET /api/cloudinary/health
```

### Memory Operations

```bash
# Get all memories
GET /api/cloudinary/memories?userId=user123

# Response:
{
  "memories": [
    {
      "id": "...",
      "title": "...",
      "date": "2025-11-29",
      "text": "...",
      "images": [...],
      "location": "..."
    }
  ]
}
```

---

## 🔐 Authentication Patterns

### Check if User is Logged In

```typescript
const { userId, loading } = useCurrentUserId();

if (loading) return <Loading />;
if (!userId) return <Redirect to="/login" />;

return <ProtectedContent />;
```

### Login

```typescript
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth();
await signInWithEmailAndPassword(auth, email, password);
// User is now logged in
```

### Logout

```typescript
import { getAuth, signOut } from 'firebase/auth';

const auth = getAuth();
await signOut(auth);
// User is now logged out
```

---

## 🐛 Debugging Tips

### View Console Logs

```bash
# Open browser DevTools: F12 or Cmd+Option+I
# Check Console tab for:
# ✅ API /health ok
# ❌ API errors
# Memory data logs
```

### Check Network Requests

```bash
# DevTools > Network tab
# Look for failed requests (red)
# Check response data
# Verify status codes (200, 400, 500)
```

### Check LocalStorage

```bash
# DevTools > Application > Storage > Local Storage
# Look for:
# - userIdSession (user ID)
# - memoriesCache_${userId} (cached memories)
# - currentTheme (selected theme)
```

### Test API Endpoints

```bash
# In browser console or Postman
fetch('/api/cloudinary/health')
  .then(r => r.json())
  .then(data => console.log(data));

# Test upload
const fd = new FormData();
fd.append('file', fileInput.files[0]);
fetch('/api/cloudinary/upload', { method: 'POST', body: fd })
  .then(r => r.json())
  .then(data => console.log(data));
```

---

## 📊 Environment Variables

### Required for Development

```bash
# Firebase (VITE_ prefix = exposed to frontend)
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID

# Cloudinary (Backend only)
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

### Get Your Keys

1. **Firebase**
   - Go to Firebase Console
   - Project Settings
   - General tab
   - Copy config object

2. **Cloudinary**
   - Go to Cloudinary Dashboard
   - Account settings
   - Copy Cloud Name, API Key, API Secret

---

## 🚀 NPM Scripts Reference

```bash
# Development
npm run dev              # Start dev server
npm run dev:watch       # Dev with forced refresh

# Building
npm run build           # Production build
npm run build:watch    # Watch mode build

# Checking
npm run lint           # Run ESLint
npm run preview        # Preview production build

# Full Stack
npm start              # Start with Vercel dev
```

---

## 📱 Component Props Reference

### Page Component Props

```typescript
interface PageProps {
  onBack?: () => void;                    // Called when back button clicked
  currentTheme: 'happy' | 'calm' | 'romantic'; // Active theme
}

// Usage
<CreateMemory onBack={() => navigate('/')} currentTheme={currentTheme} />
```

### Theme Configuration

```typescript
// Access in component:
const theme = themes[currentTheme];

// Available colors:
theme.background    // Background gradient
theme.cardBg       // Card background
theme.textPrimary  // Primary text color
theme.border       // Border color
```

---

## 🎯 Development Workflow

### Daily Workflow

```bash
# 1. Start the dev server
npm run dev

# 2. Make changes to files
# - src/components/
# - src/pages/
# - src/styles/

# 3. Changes auto-reload in browser

# 4. Run linter before commit
npm run lint

# 5. Build for production when ready
npm run build
```

### Before Committing

```bash
# 1. Run linter
npm run lint

# 2. Check for errors
npm run build

# 3. Test manually in browser

# 4. Commit changes
git add .
git commit -m "Your message"
```

---

## 🆘 Common Issues & Solutions

### Issue: "Cannot find module 'firebase'"

**Solution:**
```bash
npm install
```

### Issue: Images not loading in gallery

**Check:**
1. User is logged in: `useCurrentUserId()` returns userId
2. Memories were saved: Check `/api/cloudinary/memories`
3. Cloudinary credentials are valid
4. Images exist in Cloudinary dashboard

### Issue: Memory not saving

**Check:**
1. Form is valid (title, text, date required)
2. Images uploaded successfully (check upload progress)
3. userId is available
4. Network request to `/api/cloudinary/upload` succeeds (check Network tab)

### Issue: Theme not persisting

**Check:**
1. localStorage.currentTheme is set (DevTools Application tab)
2. Browser localStorage is not disabled
3. Not in private/incognito mode

### Issue: Login not working

**Check:**
1. Firebase credentials in .env.local are correct
2. Firebase project is active
3. Email/password are correct
4. User account exists in Firebase Auth

---

## 💡 Tips & Tricks

### TypeScript Tips

```typescript
// Use type inference
const [state, setState] = useState('');  // string is inferred

// Use interfaces for props
interface Props {
  title: string;
  count: number;
}

// Use union types for variants
type Theme = 'happy' | 'calm' | 'romantic';

// Use optional properties
interface Options {
  folder?: string;
  tags?: string[];
}
```

### React Tips

```typescript
// Use useCallback for memoization
const handleClick = useCallback(() => {
  // Action
}, [dependencies]);

// Use useEffect for side effects
useEffect(() => {
  // Setup
  return () => {
    // Cleanup
  };
}, [dependencies]);

// Use early returns for cleaner code
if (!userId) return <NotLoggedIn />;
if (loading) return <Loading />;
return <Content />;
```

### Performance Tips

```typescript
// Lazy load routes
const CreateMemory = lazy(() => import('./CreateMemory'));

// Memoize components
const MemoComponent = memo(Component);

// Use key in lists
{items.map(item => <Item key={item.id} {...item} />)}

// Avoid unnecessary re-renders
const handler = useCallback(() => {...}, [deps]);
```

---

## 📚 Useful Resources

### Documentation
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [Cloudinary Docs](https://cloudinary.com/documentation)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Tools
- [VS Code](https://code.visualstudio.com)
- [React DevTools](https://react-devtools-tutorial.vercel.app)
- [FirebaseConsole](https://console.firebase.google.com)
- [CloudinaryDashboard](https://cloudinary.com/console)

---

## ✅ Pre-Commit Checklist

Before pushing code:

- [ ] No console.log() statements (remove debug logs)
- [ ] No TypeScript errors (`npm run build`)
- [ ] Code is formatted (use Prettier or VS Code format)
- [ ] Tests pass (if any)
- [ ] Components have proper PropTypes/TypeScript types
- [ ] No unused imports
- [ ] Commit message is clear

---

## 🎓 Learning Paths

### For Frontend Developers

```
Week 1:
├─ Learn React fundamentals
├─ Understand component structure
└─ Learn React hooks

Week 2:
├─ Learn TypeScript
├─ Study project structure
└─ Learn Tailwind CSS

Week 3:
├─ Study existing components
├─ Make small changes
└─ Create simple feature

Week 4:
├─ Create complex feature
├─ Handle errors properly
└─ Write tests
```

### For Backend Developers

```
Week 1:
├─ Learn Vercel functions
├─ Learn Cloudinary API
└─ Study endpoint structure

Week 2:
├─ Understand Firebase
├─ Learn request parsing
└─ Learn error handling

Week 3:
├─ Create new endpoint
├─ Test with Postman
└─ Handle edge cases

Week 4:
├─ Optimize queries
├─ Add caching
└─ Write documentation
```

---

## 📞 Quick Support

### Getting Help

1. **Check docs**: `PROJECT_DOCUMENTATION.md`
2. **Check architecture**: `TECHNICAL_ARCHITECTURE.md`
3. **Read code comments**: Look at similar code
4. **Search issues**: GitHub issues or project management
5. **Ask team**: Slack, email, or team meeting

### Filing Issues

When reporting issues, include:
- What you were doing
- What you expected
- What actually happened
- Steps to reproduce
- Error messages/logs
- Browser/OS information

---

**Questions?** Check the full `PROJECT_DOCUMENTATION.md` for detailed information!

**Ready to code?** Start with Task 1: Create a New Page above.

---

**Last Updated**: November 29, 2025  
**Status**: Ready for use ✅
