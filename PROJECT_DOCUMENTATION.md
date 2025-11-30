# 💕 Love Journey Diary - Complete Project Documentation

**Version:** 1.0.0  
**Last Updated:** November 29, 2025  
**Type:** Full-Stack React + TypeScript + Vite + Firebase + Cloudinary  

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Key Features](#key-features)
5. [Frontend Architecture](#frontend-architecture)
6. [Backend Architecture](#backend-architecture)
7. [Component Guide](#component-guide)
8. [Hooks Guide](#hooks-guide)
9. [API Reference](#api-reference)
10. [Authentication Flow](#authentication-flow)
11. [Data Models](#data-models)
12. [Deployment Guide](#deployment-guide)
13. [Development Workflow](#development-workflow)
14. [Configuration](#configuration)

---

## 🎯 Project Overview

**Love Journey Diary** is a romantic, full-featured web application designed for couples to:
- 📝 Write and preserve precious memories together
- 📸 Upload and organize photos in a beautiful gallery
- 🗓️ Track relationship milestones and anniversaries
- 🎨 Customize the app with different mood themes
- 📊 Generate romantic PDF exports of memories
- 🎉 Track love journey progression with achievements

### Core Values
- **Beautiful UI**: Romantic, responsive, and theme-based design
- **Secure**: Firebase authentication, user-isolated data
- **Scalable**: Serverless API on Vercel, cloud storage on Cloudinary
- **User-Friendly**: Intuitive navigation and smooth animations

---

## 🛠️ Tech Stack

### Frontend
```
React 18.3.1           # UI framework
TypeScript 5.5.3       # Type safety
Vite 4.x               # Build tool & dev server
Tailwind CSS 3.4.1     # Styling
React Router 7.7.0     # Routing
Lucide React 0.344.0   # Icons
html2canvas 1.4.1      # Screenshot to canvas
jsPDF 2.5.1            # PDF generation
```

### Backend
```
Vercel Serverless      # Serverless runtime
Express 5.1.0          # API framework (local)
Node.js 20.x           # Runtime
Multer 2.0.1           # File upload handling
CORS 2.8.5             # Cross-origin support
```

### Services
```
Firebase 12.0.0        # Auth, Firestore, Storage
Cloudinary 2.7.0       # Image hosting & processing
Vercel                 # Deployment & serverless APIs
```

---

## 📁 Project Structure

```
diary_2/
│
├── 📄 Project Config Files
│   ├── package.json              # Dependencies & scripts
│   ├── tsconfig.json             # TypeScript config
│   ├── vite.config.ts            # Vite build config
│   ├── tailwind.config.js        # Tailwind styling config
│   ├── postcss.config.js         # PostCSS config
│   ├── eslint.config.js          # ESLint rules
│   ├── vercel.json               # Vercel deployment config
│   └── README.md                 # Project README
│
├── 🌐 Frontend (src/)
│   ├── main.tsx                  # Entry point
│   ├── App.tsx                   # Main app component & routing
│   ├── index.css                 # Global styles
│   ├── vite-env.d.ts             # Vite type definitions
│   │
│   ├── 📄 Pages (Main Components)
│   │   ├── LoginPage.tsx          # Authentication page
│   │   ├── CreateMemory.tsx       # Create new memory
│   │   ├── ViewMemory.tsx         # View & gallery page
│   │   ├── JourneyTracker.tsx     # Milestones & achievements
│   │   ├── AnniversaryReminders.tsx # Anniversary management
│   │   ├── PDFExport.tsx          # PDF generation page
│   │   ├── PDFReview.tsx          # PDF preview & review
│   │   ├── MoodTracking.tsx       # Theme & mood settings
│   │   ├── SettingPage.tsx        # User settings & preferences
│   │   └── ProfileInformation.tsx # User profile page
│   │
│   ├── 🧩 Components
│   │   ├── EventsPage.tsx         # Events listing
│   │   ├── EventModal.tsx         # Event form modal
│   │   ├── VisualEffects.tsx      # Animation effects
│   │   └── ImageUpload/
│   │       ├── ImageUpload.tsx    # Image upload component
│   │       └── ImageUpload.css    # Upload styles
│   │
│   ├── 🔌 Hooks (Custom React Hooks)
│   │   ├── useCloudinary.ts       # Cloudinary operations
│   │   ├── useCurrentUserId.ts    # Get current user ID
│   │   └── useMemoriesCache.ts    # Cache memories locally
│   │
│   ├── 🌐 APIs (Frontend Services)
│   │   ├── cloudinaryGalleryApi.ts # Cloudinary types & interfaces
│   │   ├── memoriesApi.ts          # Journey milestones
│   │   ├── anniversaryApi.ts       # Anniversary management
│   │   └── userThemeApi.ts         # Theme preferences
│   │
│   ├── 🔥 Firebase
│   │   └── firebaseConfig.ts       # Firebase initialization
│   │
│   ├── 📊 Data
│   │   └── anniversaryTimeline.json # Pre-defined anniversary meanings
│   │
│   ├── 🎨 Styles
│   │   ├── animations.css          # Global animations
│   │   ├── App.css                 # Landing page styles
│   │   ├── CreateMemory.css        # Create memory styles
│   │   ├── ViewMemory.css          # Gallery & memory view styles
│   │   ├── JourneyTracker.css      # Milestone styles
│   │   ├── AnniversaryReminders.css # Anniversary styles
│   │   ├── PDFExport.css           # PDF export styles
│   │   ├── SettingPage.css         # Settings styles
│   │   ├── LoginPage.css           # Login styles
│   │   └── components.css          # Component styles
│   │
│   └── 📝 Types
│       └── global.d.ts             # Global type definitions
│
├── 🔧 Backend API (api/)
│   ├── test.js                    # API test file
│   └── cloudinary/
│       ├── config.js              # Cloudinary config check
│       ├── health.js              # API health check
│       ├── upload.js              # Image upload handler
│       ├── images.js              # Get images (search)
│       ├── memories.js            # Get memories grouped
│       ├── memory.js              # Get single memory
│       └── delete.js              # Delete image handler
│
├── 📝 Scripts
│   └── scripts/
│       └── updateUserIdForOldImages.cjs # Migration script
│
├── 📄 Documentation
│   ├── PROJECT_DOCUMENTATION.md   # This file
│   ├── API_INTEGRATION_COMPLETE.md
│   ├── UPDATED_REQUIREMENTS.md
│   └── .env.example               # Environment variables template
│
└── 📦 Dependencies (package.json)
```

---

## ✨ Key Features

### 1. **Love Journaling** 📝
- Create memories with title, location, text, and date
- Auto-save to Cloudinary with user context
- Rich text support with formatting

### 2. **Photo Memories** 📸
- Upload multiple photos per memory
- Automatic image optimization via Cloudinary
- Beautiful image gallery with filters
- Image search and organization

### 3. **Journey Tracker** 🗺️
- Track relationship milestones
- Achievement badges and celebrations
- Timeline visualization
- Milestone types: first_date, anniversary, trip, engagement, moving_in, special_moment

### 4. **Anniversary Reminders** 🎂
- Create custom anniversaries
- Automatic reminders (configurable days in advance)
- Anniversary timeline with years since calculation
- Types: wedding, engagement, first_date, birthday, valentine, custom

### 5. **Mood Tracking & Themes** 🎨
- 3 beautiful themes: Happy, Calm, Romantic
- Dynamic color schemes
- Theme persistence in localStorage & Firestore
- Per-user theme settings

### 6. **PDF Export** 📄
- Generate romantic PDF journals
- Multiple templates: romantic, elegant, scrapbook
- Include/exclude images, moods, dates
- Custom cover page with couple names
- Email capability integration

### 7. **User Settings** ⚙️
- Profile information management
- Visual effects toggle
- Event calendar
- Theme customization

---

## 🏗️ Frontend Architecture

### Architecture Pattern: Component-Based with Hooks

```
┌─────────────────────────────────────────────────────┐
│                  App.tsx (Main)                     │
│          Routes & Navigation Manager                │
└──────────────┬────────────────────────────────────┬─┘
               │                                    │
       ┌───────▼────────────┐          ┌───────────▼────────┐
       │   LoginPage.tsx    │          │ Protected Routes   │
       │  (Authentication)  │          │                    │
       └────────────────────┘          └──────┬─────────────┘
                                              │
        ┌─────────────────────────────────────┼────────────────────────┐
        │                                     │                        │
    ┌───▼────────────┐  ┌──────────────┐  ┌──▼─────────────┐  ┌──────▼──────┐
    │ CreateMemory   │  │ ViewMemory   │  │ JourneyTracker│  │AnniversaryR.│
    │ (Write/Upload) │  │ (Gallery)    │  │ (Milestones)  │  │ (Calendar)  │
    └───┬────────────┘  └──┬───────────┘  └───────────────┘  └─────────────┘
        │                  │
        │                  └─────────────────────┬──────────┐
        │                                        │          │
    ┌───▼────────┐  ┌──────────┐  ┌──────────────▼──┐  ┌───▼────────────┐
    │  Hooks     │  │Components│  │  SettingPage   │  │  PDFExport     │
    │            │  │          │  │  (Theme/Set.)  │  │  (Generate)    │
    └────────────┘  └──────────┘  └────────────────┘  └────────────────┘

Hooks Layer:
- useCurrentUserId()      → Get Firebase user ID
- useMemoriesCache()      → Cache memories with 10min TTL
- useCloudinary()         → Cloud image operations

Services Layer:
- cloudinaryGalleryApi    → Cloudinary types & interfaces
- anniversaryApi          → Anniversary CRUD
- memoriesApi             → Journey data
- userThemeApi            → Theme persistence
- firebaseConfig          → Firebase initialization
```

### State Management Strategy

1. **Local State**: Component-level state (useState)
2. **Session Storage**: User ID with 24h expiry
3. **Local Storage**: 10-min cache for memories & anniversaries
4. **Firebase**: Anniversary events, user theme preferences
5. **Cloudinary**: Memory data, images, metadata

---

## 🔧 Backend Architecture

### Serverless API on Vercel

```
Frontend                    Vercel Serverless APIs
(Vite + React + TS)        (Vercel Functions)          Cloudinary
     ↓                             ↓                        ↓
  /api/cloudinary/
    ├── upload     ────────────→  upload.js  ─────────→  cloudinary.uploader.upload
    ├── images     ────────────→  images.js  ─────────→  cloudinary.search
    ├── memories   ────────────→  memories.js ────────→  cloudinary.api.resources
    ├── memory     ────────────→  memory.js  ─────────→  cloudinary.api.resource
    ├── delete     ────────────→  delete.js  ─────────→  cloudinary.uploader.destroy
    ├── health     ────────────→  health.js  ────────→  Status check
    └── config     ────────────→  config.js  ────────→  Config validation

Local Backend (Optional):
- Express.js server (for development)
- Multer for file handling
- CORS middleware
- Environment variable management
```

### API Endpoints

#### **Upload API** (`/api/cloudinary/upload`)
```javascript
POST /api/cloudinary/upload
Content-Type: multipart/form-data

Parameters:
- file (File): Image file
- folder (string): 'love-journal' default
- tags (string): Comma-separated tags
- userId (string): User ID for context
- title (string): Memory title

Response:
{
  public_id: string,
  secure_url: string,
  width: number,
  height: number,
  format: string,
  created_at: string,
  tags: string[],
  folder: string
}
```

#### **Images API** (`/api/cloudinary/images`)
```javascript
GET /api/cloudinary/images?folder=love-journal&tags=memory&max_results=20

Parameters:
- folder (string): Optional folder filter
- tags (string): Comma-separated tags
- max_results (number): Default 20
- next_cursor (string): For pagination
- sort_by (string): created_at, uploaded_at, public_id
- sort_order (string): asc, desc

Response:
{
  resources: CloudinaryImage[],
  next_cursor: string,
  total_count: number
}
```

#### **Memories API** (`/api/cloudinary/memories`)
```javascript
GET /api/cloudinary/memories?userId=user123

Response:
{
  memories: SavedMemory[]
}

SavedMemory:
{
  id: string,
  title: string,
  location: string | null,
  text: string,
  date: string (YYYY-MM-DD),
  images: CloudinaryImage[],
  created_at: string,
  tags: string[],
  folder: string,
  context: Record<string, string>
}
```

#### **Delete API** (`/api/cloudinary/delete`)
```javascript
DELETE /api/cloudinary/delete

Body:
{
  public_id: string
}

Response:
{
  result: 'ok' | 'not found'
}
```

#### **Health Check** (`/api/cloudinary/health`)
```javascript
GET /api/cloudinary/health

Response:
{ status: 'ok' }
```

---

## 🧩 Component Guide

### Page Components (Main Views)

#### **1. LoginPage.tsx** (487 lines)
**Purpose**: Authentication and onboarding
- Firebase authentication with email/password
- Remember me functionality
- Love quotes rotation
- Floating heart animations
- Theme preview
- Error handling and validation
- Optional phone-based registration

**Key Props**: `currentTheme`  
**State**: email, password, showPassword, isLoading, error, isRegister  
**Firebase**: signInWithEmailAndPassword, createUserWithEmailAndPassword

#### **2. CreateMemory.tsx** (415 lines)
**Purpose**: Create new memories with images
- Title, location, memory text inputs
- Date picker (day, month, year)
- Image upload with preview
- Image removal
- Form validation
- Save to Cloudinary via API
- Success/error messaging

**Key Props**: `currentTheme`, `onBack`  
**Hooks**: useCurrentUserId, useMemoriesCache  
**API**: `/api/cloudinary/upload`, `/api/cloudinary/memories`

#### **3. ViewMemory.tsx** (404 lines)
**Purpose**: View and manage memories
- Display memories organized by year
- Photo gallery with lightbox
- Image navigation (next/previous)
- Memory filtering
- Responsive grid layout
- Loading and error states

**Key Props**: `currentTheme`, `onBack`  
**Hooks**: useCurrentUserId, useMemoriesCache  
**API**: `/api/cloudinary/memories`

#### **4. JourneyTracker.tsx** (483 lines)
**Purpose**: Track relationship milestones
- Milestone timeline visualization
- Achievement badges
- Celebration animations
- Photo galleries for milestones
- Floating elements effects
- Milestone types and icons

**Key Props**: `currentTheme`, `onBack`  
**Milestones Types**: first_date, anniversary, trip, engagement, moving_in, special_moment

#### **5. AnniversaryReminders.tsx** (931 lines)
**Purpose**: Manage and track anniversaries
- Create/edit/delete anniversaries
- Reminder configuration (days in advance)
- Calendar view
- Years since calculation
- Anniversary type templates
- Notification toggle
- Floating heart animations
- Delete confirmation modal

**Key Props**: `currentTheme`, `onBack`  
**Hooks**: useAuth (Firebase)  
**Firebase**: Firestore collection 'AnniversaryEvent'  
**Anniversary Types**: wedding, engagement, first_date, birthday, valentine, custom

#### **6. PDFExport.tsx** (736 lines)
**Purpose**: Generate romantic PDF journals
- Memory selection and filtering
- Date range picker
- Template selection (romantic, elegant, scrapbook)
- Cover page customization
- Include/exclude options (images, moods)
- Preview before generation
- PDF download

**Key Props**: `currentTheme`, `onBack`  
**External Libraries**: html2canvas, jsPDF  
**Export Settings**: dateRange, selectedMemories, template, includeImages, includeMoods

#### **7. SettingPage.tsx** (788 lines)
**Purpose**: User settings and preferences
- Profile information
- Visual effects toggle
- Event management
- Theme customization
- Mood tracking display
- Gallery display modes

**Key Props**: `currentTheme`, `setCurrentTheme`, `onBack`  
**Sub-components**: ProfileInformation, MoodTracking, EventsPage, EventModal, VisualEffects

#### **8. MoodTracking.tsx** (134 lines)
**Purpose**: Theme selection and mood customization
- Display available themes
- Theme color preview
- Gallery mode toggle
- Theme save functionality

**Key Props**: `theme`, `currentTheme`, `handleThemeChange`, `galleryMode`

### Sub-Components

#### **ImageUpload.tsx**
**Purpose**: Reusable image upload component
- Drag-and-drop support
- File preview
- Multiple file selection
- Image validation

#### **EventsPage.tsx**
**Purpose**: Event listing and management
- Display events in calendar format
- Event categorization
- Event creation/editing

#### **EventModal.tsx**
**Purpose**: Modal for event creation
- Form inputs for event details
- Type selection
- Date picker

#### **VisualEffects.tsx**
**Purpose**: Animation effects management
- Floating elements control
- Particle effects
- Animation toggles

#### **ProfileInformation.tsx**
**Purpose**: User profile management
- Display user info
- Edit user details
- Profile picture upload

---

## 🎣 Hooks Guide

### Custom React Hooks

#### **useCurrentUserId.ts**
**Purpose**: Get current Firebase user ID with session persistence

```typescript
const { userId, loading } = useCurrentUserId();

// Returns:
// userId: string | null
// loading: boolean

// Logic:
// 1. Check localStorage for valid session (24h expiry)
// 2. Listen to Firebase onAuthStateChanged
// 3. Save user ID to localStorage on login
// 4. Clear on logout
```

**Use Cases**:
- Initializing user-specific data
- Checking authentication state
- Redirecting unauthenticated users

#### **useMemoriesCache.ts**
**Purpose**: Fetch and cache memories with 10-minute TTL

```typescript
const { memoriesByYear, years, isLoading, error } = useMemoriesCache(userId, loading);

// Returns:
// memoriesByYear: Record<string, Memory[]>  // Grouped by year
// years: string[]                            // Sorted years
// isLoading: boolean
// error: string | null

// Logic:
// 1. Check localStorage cache validity (10 min)
// 2. If valid, use cached data
// 3. If expired, fetch from /api/cloudinary/memories
// 4. Group memories by year
// 5. Sort years descending
```

**Use Cases**:
- Gallery views
- Memory filtering by year
- Performance optimization
- Offline support

#### **useCloudinary.ts**
**Purpose**: Interface for Cloudinary operations

```typescript
const {
  images,
  loading,
  error,
  uploading,
  uploadProgress,
  fetchImages,
  uploadImage,
  deleteImage,
  generateImageUrl,
  generateThumbnailUrl,
  clearError,
  clearImages,
  fetchMemories
} = useCloudinary();

// Key Methods:
// fetchImages(options)      - Get images with filters
// uploadImage(file, opts)   - Upload image to Cloudinary
// deleteImage(publicId)     - Delete image
// generateImageUrl(id)      - Generate transformation URL
// generateThumbnailUrl(id)  - Generate thumbnail URL
```

**Use Cases**:
- Gallery loading
- Image uploads
- Image deletion
- URL generation for transformations

---

## 🌐 API Reference

### Frontend API Services

#### **cloudinaryGalleryApi.ts**
**Purpose**: Type definitions and interfaces for Cloudinary data

```typescript
// Key Interfaces:
CloudinaryImage {
  secure_url: string,
  public_id: string,
  width: number,
  height: number,
  format: string,
  created_at: string,
  tags: string[],
  folder?: string,
  context?: Record<string, string>
}

CloudinaryResponse {
  resources: CloudinaryImage[],
  next_cursor?: string,
  total_count: number
}

MemoryData {
  title: string,
  location?: string,
  text: string,
  date: string (YYYY-MM-DD),
  tags?: string[]
}

SavedMemory {
  id: string,
  title: string,
  location: string | null,
  text: string,
  date: string,
  images: CloudinaryImage[],
  created_at: string,
  tags: string[],
  context?: Record<string, string>,
  folder: string
}
```

#### **anniversaryApi.ts**
**Purpose**: Anniversary CRUD operations with Firestore

```typescript
// Interface:
Anniversary {
  id: string,
  userId: string,
  title: string,
  date: string (YYYY-MM-DD),
  type: AnniversaryType,
  reminderDays: number,
  isNotificationEnabled: boolean
}

// Methods:
anniversaryApi.getAll(userId)           // Get all anniversaries for user
anniversaryApi.add(userId, data)        // Create new anniversary
anniversaryApi.update(id, data)         // Update anniversary
anniversaryApi.remove(id)               // Delete anniversary

// Firestore Collection: 'AnniversaryEvent'
```

#### **memoriesApi.ts**
**Purpose**: Journey milestone data management

```typescript
// Interface:
Milestone {
  id: string,
  date: string,
  title: string,
  description: string,
  type: MilestoneType,
  mood: MoodType,
  iconType?: string,
  isUpcoming?: boolean,
  photos?: string[],
  achievement?: AchievementType
}

// Methods:
getJourneyMilestones()  // Fetch all milestones
addMilestone(milestone) // Create new milestone
updateMilestone(id, data)
removeMilestone(id)     // Delete milestone
```

#### **userThemeApi.ts**
**Purpose**: User theme preferences

```typescript
// Methods:
saveUserTheme(userId, theme)    // Save theme to Firestore
getUserTheme(userId)            // Get user's saved theme

// Firestore Collection: 'users'
// Stored at: users/{userId}/theme
```

---

## 🔐 Authentication Flow

### Firebase Authentication

```
┌─────────────────────────────────────────────────────┐
│              LoginPage (Entry)                      │
│         Email/Password Input Form                   │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
         ┌───────────────────┐
         │ loginWithFirebase │
         │ signInWithEmail   │
         │ Password          │
         └───────┬───────────┘
                 │
         ┌───────┴──────────┐
         │                  │
         ▼                  ▼
    ✅ Success          ❌ Error
         │                  │
         ▼                  ▼
    onAuthState        Show Error
    Changed Called      Message
         │
         ▼
    Save userId to
    localStorage
    (24h expiry)
         │
         ▼
    App.tsx checks:
    ├─ userId exists OR
    ├─ Session valid OR
    └─ Redirect to /login
         │
         ▼
    useCurrentUserId()
    returns userId
         │
         ▼
    ✅ Authenticated
    User can access
    protected routes
```

### Session Management

```javascript
// Session stored in localStorage
{
  userIdSession: {
    userId: "firebase_uid_here",
    expires: 1702857600000  // 24h from now
  }
}

// Session validation on app start:
1. Check if userIdSession exists
2. Parse and check expiry time
3. If expired or missing, clear session
4. If valid, use cached userId
5. Listen to Firebase auth state for updates
```

---

## 📊 Data Models

### Memory (Saved in Cloudinary)

```typescript
interface Memory {
  id: string;                    // Generated from timestamp + random
  title: string;                 // Memory title
  date: string;                  // YYYY-MM-DD format
  text: string;                  // Memory content
  location?: string | null;      // Optional location
  images: MemoryImage[];         // Associated images
  created_at?: string;           // Creation timestamp
  tags?: string[];               // Image tags
  folder?: string;               // Cloudinary folder
  userId?: string;               // Firebase user ID
}

interface MemoryImage {
  public_id: string;             // Cloudinary public ID
  secure_url: string;            // HTTPS URL
  width: number;                 // Image width
  height: number;                // Image height
  format: string;                // File format (jpg, png, etc)
  created_at: string;            // Upload date
  tags: string[];                // Image tags
}

// Cloudinary Context Storage
{
  memory_id: "2025-11-29-abc123",
  title: "First Date",
  memory_text: "We met at the coffee shop...",
  memory_date: "2025-11-29",
  location: "Coffee Shop",
  userId: "firebase_uid"
}
```

### Anniversary

```typescript
interface Anniversary {
  id: string;                    // Firestore doc ID
  userId: string;                // Firebase user ID
  title: string;                 // Anniversary name
  date: string;                  // YYYY-MM-DD format
  type: AnniversaryType;         // Category
  reminderDays: number;          // Days before reminder
  isNotificationEnabled: boolean; // Notification toggle
}

type AnniversaryType =
  | 'custom'
  | 'first_date'
  | 'engagement'
  | 'wedding'
  | 'first_meeting'
  | 'proposal'
  | 'honeymoon'
  | 'birthday'
  | 'valentine';
```

### Milestone

```typescript
interface Milestone {
  id: string;                    // Unique identifier
  date: string;                  // YYYY-MM-DD format
  title: string;                 // Milestone name
  description: string;           // Details
  type: MilestoneType;          // Category
  mood: MoodType;               // Emotional tone
  iconType?: string;             // Icon representation
  isUpcoming?: boolean;          // Future milestone flag
  photos?: string[];             // Photo URLs
  achievement?: {
    title: string;
    description: string;
    badgeType?: string;
  }
}

type MilestoneType =
  | 'first_date'
  | 'anniversary'
  | 'trip'
  | 'engagement'
  | 'moving_in'
  | 'special_moment';
```

### Theme Configuration

```typescript
interface ThemeConfig {
  name: string;                  // Theme name
  icon: React.ReactNode;         // Icon element
  emoji: string;                 // Theme emoji
  colors: {
    primary: string;             // Primary color
    secondary: string;           // Secondary color
    accent: string;              // Accent color
    background: string;          // Background gradient
    cardBg: string;              // Card background
    textPrimary: string;          // Primary text color
    textSecondary: string;        // Secondary text color
    border: string;              // Border color
    gradient: string;            // Gradient string
    buttonGradient: string;       // Button gradient
    hoverBg: string;             // Hover background
  };
  fontFamily: string;            // Font family
}

// Available Themes:
happy: {
  emoji: '😊',
  gradient: 'linear-gradient(135deg, #FFFDE4, #FEF08A)',
  primary: 'rgb(251, 191, 36)'
}

calm: {
  emoji: '😊',
  gradient: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)',
  primary: 'rgb(99, 102, 241)'
}

romantic: {
  emoji: '💕',
  gradient: 'linear-gradient(135deg, #FDF2F8, #FCE7F3)',
  primary: 'rgb(236, 72, 153)'
}
```

---

## 🚀 Deployment Guide

### Prerequisites
- Node.js 20.x
- npm or yarn
- Vercel account
- Firebase project
- Cloudinary account

### Environment Variables (.env.local)

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Cloudinary Configuration (Backend only)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# API Configuration
VITE_API_URL=/api  # For local development or relative paths
```

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local with credentials
cp .env.example .env.local
# Edit .env.local with your credentials

# 3. Start development server
npm run dev

# 4. Server runs on http://localhost:3000
```

### Production Build

```bash
# 1. Build frontend
npm run build

# Creates dist/ folder with optimized production build

# 2. Preview build locally
npm run preview
```

### Vercel Deployment

```bash
# 1. Connect repository to Vercel (via Vercel dashboard)

# 2. Add environment variables in Vercel Project Settings
#    - Copy all CLOUDINARY_* variables
#    - These are only needed for serverless functions
#    - Firebase variables can be public (VITE_*)

# 3. Vercel automatically:
#    - Builds frontend with: npm run build
#    - Deploys serverless functions from /api directory
#    - Serves frontend from /dist

# 4. Check vercel.json for build configuration
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}

# 5. Deploy
vercel deploy --prod
```

### Vercel Function Configuration

Serverless functions in `/api/cloudinary/` automatically:
- Receive environment variables
- Handle HTTP requests
- Return JSON responses
- Scale automatically
- Execute in Node.js runtime

**Note**: Functions are stateless, cannot use sessions, must be idempotent.

---

## 💻 Development Workflow

### Available NPM Scripts

```bash
# Development
npm run dev              # Start dev server (port 3000) with auto-open
npm run dev:watch       # Dev with forced refresh

# Building
npm run build           # Production build (creates dist/)
npm run build:watch    # Build in watch mode for development
npm run vercel-build   # Vercel-specific build

# Verification
npm run lint           # Run ESLint
npm run preview        # Preview production build locally

# Full Stack
npm start              # Start with Vercel dev (local & serverless)
```

### Recommended Development Setup

```bash
# Terminal 1: Start frontend
npm run dev

# Terminal 2: Optional - Start backend (Vercel dev)
npm start

# Access at: http://localhost:3000
```

### File Watching Configuration

```javascript
// vite.config.ts
{
  server: {
    watch: {
      usePolling: true,      // Better on Windows
      interval: 100          // Poll every 100ms
    }
  }
}
```

### ESLint Configuration

Configured rules for:
- React hooks validation
- React refresh compatibility
- TypeScript type safety
- ES2020+ syntax

Run linting:
```bash
npm run lint
```

---

## ⚙️ Configuration

### Vite Configuration (vite.config.ts)

```typescript
{
  plugins: [react()],           // React plugin
  server: {
    host: true,                 // Network access
    port: 3000,
    open: true,                 // Auto-open browser
    hmr: { overlay: true },     // Error overlay
    watch: {
      usePolling: true,         // Windows support
      interval: 100
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/*'],
          html2canvas: ['html2canvas']
        }
      }
    },
    outDir: 'dist'
  },
  optimizeDeps: {
    exclude: ['lucide-react']
  }
}
```

### TypeScript Configuration (tsconfig.json)

- Target: ES2020
- Module: ESNext
- Strict mode enabled
- JSX: react-jsx

### Tailwind CSS (tailwind.config.js)

- Content: src/**/*.tsx
- Theme customization available
- Extends Tailwind utilities

### PostCSS Configuration (postcss.config.js)

- Autoprefixer: Adds vendor prefixes
- Tailwind CSS: CSS framework

---

## 🔍 Debugging Tips

### Common Issues

**1. Images not loading**
```bash
# Check Cloudinary credentials
GET /api/cloudinary/config

# Check image search
GET /api/cloudinary/images?max_results=5

# Verify folder structure
# Should be: love-journal/memories/
```

**2. Firebase auth not working**
```bash
# Check console for Firebase errors
# Verify .env.local has correct credentials
# Ensure Firebase project exists and is active
```

**3. Memory not saving**
```bash
# Check network tab in DevTools
# POST /api/cloudinary/upload should return 200
# Check FormData is properly formatted
# Verify userId is being sent
```

### Development Console Logs

Helpful logs throughout codebase:
- ✅ API /health ok
- ❌ API /health error
- Memory save debug info
- Firebase auth state changes
- Cloudinary search expressions

---

## 📝 Code Examples

### Creating a Memory

```typescript
// CreateMemory.tsx
const memoryData: MemoryData = {
  title: "Our First Kiss",
  location: "Under the Bridge",
  text: "I will never forget this moment...",
  date: "2025-11-29",
  tags: ['memory', 'love-journal']
};

const formData = new FormData();
formData.append('title', memoryData.title);
formData.append('location', memoryData.location);
formData.append('text', memoryData.text);
formData.append('date', memoryData.date);
formData.append('tags', memoryData.tags.join(','));
uploadedImages.forEach(file => {
  formData.append('images', file);
});

const response = await fetch('/api/cloudinary/upload', {
  method: 'POST',
  body: formData
});
```

### Fetching Memories

```typescript
// useMemoriesCache.ts
const res = await fetch(`/api/cloudinary/memories?userId=${userId}`);
const data = await res.json();
const memories = data.memories; // Array of SavedMemory

// Group by year
const byYear = {};
memories.forEach(memory => {
  const year = new Date(memory.date).getFullYear();
  if (!byYear[year]) byYear[year] = [];
  byYear[year].push(memory);
});
```

### Managing Theme

```typescript
// App.tsx
const [currentTheme, setCurrentThemeState] = useState<MoodTheme>(() => {
  const stored = localStorage.getItem('currentTheme');
  return (stored === 'happy' || stored === 'calm' || stored === 'romantic')
    ? stored
    : 'romantic';
});

const setCurrentTheme = (theme: MoodTheme) => {
  setCurrentThemeState(theme);
  localStorage.setItem('currentTheme', theme);
};
```

---

## 🎓 Learning Resources

### Technologies
- [React 18 Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Vite Documentation](https://vitejs.dev)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Cloudinary Documentation](https://cloudinary.com/documentation)

### UI/Styling
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev)

### Tools
- [React Router](https://reactrouter.com)
- [ESLint](https://eslint.org)

---

## 📞 Support & Maintenance

### Troubleshooting Steps

1. **Check console errors** - Browser DevTools
2. **Verify environment variables** - .env.local
3. **Check Firebase project** - Active and configured
4. **Check Cloudinary account** - API keys valid
5. **Clear cache** - localStorage and browser cache
6. **Hard refresh** - Ctrl+Shift+R or Cmd+Shift+R

### Regular Maintenance

- Update dependencies monthly
- Monitor Firebase quotas
- Check Cloudinary usage
- Review security rules
- Backup important data

---

## 📄 Additional Resources

- `README.md` - Quick start guide
- `API_INTEGRATION_COMPLETE.md` - API integration details
- `UPDATED_REQUIREMENTS.md` - Project requirements
- `.env.example` - Environment template

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-29 | Initial documentation |

---

**Last Updated:** November 29, 2025  
**Maintained By:** Development Team  
**License:** MIT

---

## Quick Reference

### Core Dependencies
```json
{
  "react": "^18.3.1",
  "typescript": "^5.5.3",
  "vite": "^4.3.1",
  "firebase": "^12.0.0",
  "cloudinary": "^2.7.0",
  "jspdf": "^2.5.1",
  "html2canvas": "^1.4.1"
}
```

### Key Folders to Know
| Folder | Purpose |
|--------|---------|
| `src/` | Frontend React components |
| `api/cloudinary/` | Serverless backend functions |
| `src/hooks/` | Custom React hooks |
| `src/apis/` | API service interfaces |
| `src/styles/` | Component CSS files |
| `src/firebase/` | Firebase configuration |

### Key Files to Know
| File | Purpose |
|------|---------|
| `App.tsx` | Main routing and layout |
| `main.tsx` | Entry point |
| `vite.config.ts` | Build configuration |
| `tsconfig.json` | TypeScript configuration |
| `package.json` | Dependencies and scripts |

---

**🎉 Project complete and fully documented!**
