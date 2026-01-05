# Love Journal - React + TypeScript + Firebase

**Version 3.0.1** - A beautiful, romantic web application for couples to capture and preserve their precious memories together.

## ✨ What's New in Version 3.0.1 (January 2026)

### 💑 Couple Features
- **Partner Linking**: Send & accept invitations to connect with your partner
- **Memory Sharing**: Share selected memories with partner (view-only mode)
- **Real-time Sync**: Instant updates via Firestore listeners
- **Couple Settings**: Manage connection, auto-share preferences, and disconnect
- **Smart Invitations**: 7-day expiration, accept/reject/cancel flows

### 🖼️ Image Enhancements
- **Auto Compression**: Images compressed before upload (80% quality, 1920px max)
- **Lazy Loading**: Progressive image loading for better performance
- **Responsive Gallery**: Optimized gallery view across all devices

### 📊 Admin Improvements
- **Visual Charts**: Area, bar, line, and pie charts for analytics
- **Stats Cards**: Modern stat cards with gradients and icons
- **Real-time Monitoring**: Live updates for storage, users, and activities

## 🎯 Version 3.0 Features (December 2025)

### 🔐 Security & Admin
- **System Admin Dashboard**: Real-time monitoring and analytics
- **Role-Based Access Control**: SysAdmin/Admin/User permissions
- **Cloud Functions**: Server-side image deletion and stats tracking
- **Enhanced Security**: Server-side validation for all admin operations

### 📊 Performance & Tracking
- **Actual Function Call Tracking**: Precise monitoring vs estimates
- **Optimized Bundle**: ~400KB (gzipped)
- **Fast Operations**: 200-500ms Cloud Functions execution
- **Efficient Queries**: Optimized Firestore indexes

## 🚀 Quick Start

### Prerequisites
- Node.js 20.x
- npm 10.x
- Firebase account
- Cloudinary account (optional for images)

### Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Setup environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# 3. Start development server
npm run dev
# Opens at http://localhost:3000

# 4. (Optional) Start Cloud Functions emulator
cd functions
npm install
npm run build
firebase emulators:start
```

### Environment Variables

Create `.env.local`:
```env
# Firebase (Required)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Cloudinary (Optional)
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Environment Prefix (for multi-tenant)
VITE_ENV_PREFIX=
```

### Available Scripts

```bash
# Development
npm run dev              # Start Vite dev server with HMR
npm run dev:watch        # Development with forced refresh
npm run build:watch      # Production build in watch mode

# Production
npm run build            # Build for production
npm run preview          # Preview production build

# Firebase Functions
cd functions
npm run build            # Compile TypeScript
npm run serve            # Start emulator
firebase deploy --only functions  # Deploy to production
```

## 🏗️ Project Structure

```
diary_2/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Couple/         # Couple features (invitations, sharing, settings)
│   │   ├── ImageUpload/    # Image upload with compression
│   │   ├── AdminCharts.tsx # Analytics charts
│   │   ├── StatsCard.tsx   # Stat card component
│   │   └── ...
│   ├── pages/              # Page components
│   │   └── AdminDashboard.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useCouple.ts    # Couple state management
│   │   ├── useSharedMemories.ts # Shared memories management
│   │   └── useCloudinary.ts
│   ├── services/           # API services
│   │   ├── coupleService.ts        # Couple operations
│   │   ├── firebaseMemoriesService.ts
│   │   └── cloudinaryService.ts
│   ├── types/              # TypeScript definitions
│   │   ├── couple.ts       # Couple-related types
│   │   └── ...
│   ├── utils/              # Utility functions
│   │   ├── imageCompression.ts
│   │   └── ...
│   ├── config/             # Configuration
│   │   └── routes.ts       # Centralized routes
│   ├── firebase/           # Firebase config
│   │   └── firebaseConfig.ts
│   └── translations/       # i18n translations
│       ├── vi.ts
│       └── en.ts
├── functions/              # Firebase Cloud Functions
│   └── src/
│       └── index.ts        # Cloud Functions entry
├── Documentation/
│   ├── V3_Current/         # Current version docs
│   │   ├── README.md
│   │   ├── RELEASE_3.0.md
│   │   ├── COUPLE_FEATURES_SCHEMA.md
│   │   └── ...
│   └── General/            # General documentation
│       ├── QUICK_START_GUIDE.md
│       ├── ENVIRONMENT_SETUP.md
│       └── ...
├── firestore.rules         # Firestore security rules
├── firestore.indexes.json  # Firestore indexes
└── package.json
```


## 🔐 Security & Architecture

### Firebase Security
- **Authentication**: Email/password with Firebase Auth
- **Firestore Rules**: Row-level security for all data
- **Role-Based Access**: SysAdmin/Admin/User permissions
- **Server-side Validation**: Cloud Functions verify all admin operations

### Data Privacy
- **User Isolation**: Users can only access their own data
- **Couple Sharing**: View-only access for shared memories
- **Clean Disconnect**: Complete data cleanup on couple disconnect
- **Secure Tokens**: ID token verification for all sensitive operations

### Cloud Functions Security
```
User → Firebase Auth → ID Token → Cloud Function
     → verifyIdToken → Check Role → Execute
```

### Firestore Collections Structure
```
users/                    # User profiles
couples/                  # Couple relationships
coupleInvitations/        # Pending invitations
sharedMemories/          # Shared memory references
memories/                # User memories
function_calls/          # Cloud Function tracking
storage_stats/           # Storage analytics
```

## 🎨 Styling Architecture

### CSS Organization
- **Separated CSS files**: Each component has its own CSS file
- **Consistent naming**: Component-specific class names
- **Responsive design**: Mobile-first approach with breakpoints
- **Design system**: Consistent colors, spacing, and typography
- **Dark mode support**: CSS custom properties for theming

### Design Principles
- **Apple-level aesthetics**: Clean, sophisticated, attention to detail
- **Romantic theme**: Pink gradients, heart icons, elegant typography
- **Micro-interactions**: Hover states, animations, transitions
- **Accessibility**: Proper contrast ratios, keyboard navigation
- **Performance**: Optimized animations, efficient CSS

## 🎨 Key Features

### 💑 Couple Features (v3.0.1)
- **Partner Linking**: Invite and connect with your partner via email
- **Memory Sharing**: Share selected memories (view-only access)
- **Real-time Sync**: Instant updates via Firestore listeners
- **Auto-share Settings**: Option to automatically share new memories
- **Disconnect Flow**: Clean disconnection with data cleanup

### 📝 Memory Management
- **Rich Text Editor**: Write detailed memories with formatting
- **Photo Upload**: Multiple images with auto-compression
- **Location Tracking**: Add places to your memories
- **Tags & Categories**: Organize with custom tags
- **Timeline View**: Beautiful chronological display

### 📊 Admin Dashboard (v3.0+)
- **User Management**: View and manage all users
- **Storage Analytics**: Real-time storage usage monitoring
- **Function Call Tracking**: Track Cloud Function executions
- **Visual Charts**: Area, bar, line, and pie charts
- **Role-Based Access**: SysAdmin/Admin/User permissions

### 🗓️ Anniversary & Reminders
- **Event Tracking**: Track important dates
- **Calendar Export**: Save events to calendar (.ics)
- **Recurring Events**: Annual reminders
- **Custom Notifications**: Set reminder preferences

### 🎨 Personalization
- **Themes**: Romantic pink gradients & elegant design
- **Responsive Design**: Works on mobile, tablet, desktop
- **Multi-language**: Vietnamese & English support
- **PDF Export**: Generate beautiful PDF memories

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Utility-first CSS
- **Lucide Icons** - Icon library
- **Recharts** - Chart library for admin dashboard

### Backend & Services
- **Firebase Authentication** - User authentication
- **Firestore** - NoSQL database
- **Firebase Cloud Functions** - Serverless backend
- **Firebase Storage** - File storage
- **Cloudinary** - Image optimization (optional)

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking
- **VS Code** - Recommended IDE

## 📊 Performance Metrics

### Bundle Size
- **Main Bundle**: ~400KB (gzipped)
- **Vendor**: React, Firebase, etc.
- **Code Splitting**: Route-based lazy loading

### Cloud Functions
- **Cold Start**: ~1-2s
- **Warm Execution**: 200-500ms
- **Delete Operation**: ~500ms
- **Stats Calculation**: ~1-2s

### Database
- **Firestore Reads**: Optimized with indexes
- **Real-time Updates**: WebSocket connections
- **Offline Support**: Local cache enabled

## 🔧 Development Best Practices

### Code Quality
- ✅ TypeScript strict mode enabled
- ✅ ESLint for code consistency
- ✅ Component-based architecture
- ✅ Custom hooks for reusability
- ✅ Centralized routing configuration

### Security
- ✅ Row-level security rules
- ✅ Server-side validation
- ✅ ID token verification
- ✅ Input sanitization
- ✅ CSRF protection

### Performance
- ✅ Image compression (80% quality)
- ✅ Lazy loading for images
- ✅ Code splitting by route
- ✅ Firestore query optimization
- ✅ Efficient re-renders with React.memo

## 🛠️ Development

### Getting Started
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Code Quality
```bash
# Run linting
npm run lint

# Type checking
npx tsc --noEmit
```

## � Documentation

### For Developers
- **[Quick Start Guide](Documentation/General/QUICK_START_GUIDE.md)** - Get started in 5 minutes
- **[Environment Setup](Documentation/General/ENVIRONMENT_SETUP.md)** - Detailed environment configuration
- **[Technical Architecture](Documentation/General/TECHNICAL_ARCHITECTURE.md)** - System architecture overview

### For v3.0 Features
- **[Release Notes](Documentation/V3_Current/RELEASE_3.0.md)** - Complete v3.0 release documentation
- **[Couple Features](Documentation/V3_Current/COUPLE_FEATURES_SCHEMA.md)** - Couple linking & sharing system
- **[Critical Notes](Documentation/V3_Current/CRITICAL_NOTES.md)** - ⚠️ Important deployment notes
- **[Security Architecture](Documentation/V3_Current/TECHNICAL_SECURITY_ARCHITECTURE.md)** - Security implementation

### For Deployment
- **[Migration Guide](Documentation/General/MIGRATION_GUIDE.md)** - How to migrate from older versions
- **[Firebase Admin Setup](Documentation/General/FIREBASE_ADMIN_SETUP.md)** - Setting up Firebase Admin SDK
- **[Testing Guide](Documentation/General/TESTING_GUIDE.md)** - Testing strategies and guidelines

## 🚀 Deployment

### Firebase Hosting

```bash
# Build for production
npm run build

# Deploy to Firebase
firebase deploy

# Deploy functions only
firebase deploy --only functions

# Deploy hosting only
firebase deploy --only hosting
```

### Environment Variables (Production)

Set these in Firebase Console → Project Settings → Service Accounts:

```env
# Firebase Config (auto-generated)
FIREBASE_CONFIG (automatically set by Firebase)

# Cloud Functions Environment
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Pre-deployment Checklist
- [ ] Update Firestore security rules
- [ ] Deploy Firestore indexes
- [ ] Test Cloud Functions locally
- [ ] Verify environment variables
- [ ] Run production build locally
- [ ] Check bundle size
- [ ] Test couple features end-to-end
- [ ] Verify admin dashboard permissions

## 🤝 Contributing

### Development Workflow
1. Create a feature branch from `dev`
2. Make your changes
3. Test thoroughly
4. Submit PR to `dev` branch
5. After review, merge to `dev`
6. Merge `dev` to `main` for production

### Code Style
- Follow TypeScript best practices
- Use functional components with hooks
- Write meaningful commit messages
- Add JSDoc comments for complex functions
- Keep components small and focused

## 📄 License

This project is created for educational and demonstration purposes.

## 🆘 Support & Contact

For issues, questions, or contributions:
- Create an issue on GitHub
- Check [Documentation](Documentation/) folder
- Review [Quick Start Guide](Documentation/General/QUICK_START_GUIDE.md)