# Love Journal - React + TypeScript Project

A beautiful, romantic web application for couples to capture and preserve their precious memories together.

## 🚀 Auto-Build Configuration

This project is now configured for automatic rebuilding during development:

### Development Scripts
- `npm run dev` - Start development server with hot reload, auto-open browser
- `npm run dev:watch` - Development with forced refresh and better file watching
- `npm run build:watch` - Production build in watch mode

### VS Code Integration
- **Auto-save** enabled with 1-second delay
- **Format on save** with ESLint auto-fix
- **Background tasks** for continuous building
- **Problem matcher** for error highlighting

### How to Use Auto-Build

1. **Start Development Server:**
   ```bash
   npm run dev
   ```
   This will:
   - Start Vite dev server on port 3000
   - Auto-open browser
   - Enable hot module replacement (HMR)
   - Watch for file changes and rebuild automatically

2. **Using VS Code Tasks:**
   - Press `Ctrl+Shift+P` → "Tasks: Run Task" → "Auto Build Development Server"
   - Or use `Ctrl+Shift+B` for default build task

3. **Auto-Save Features:**
   - Files auto-save after 1 second of inactivity
   - Code formats automatically on save
   - ESLint fixes applied on save

### File Watching Features
- **Polling-based** file watching for better Windows compatibility
- **100ms interval** for responsive updates
- **Excludes** node_modules and build folders for performance
- **HMR overlay** shows build errors in browser

## 🏗️ Project Structure

```
src/
├── api/                        # API services and integrations
│   └── cloudinaryGalleryApi.ts # Cloudinary service (client-safe)
├── components/                 # Reusable UI components
│   └── ImageUpload/           # Image upload component
│       ├── ImageUpload.tsx
│       └── ImageUpload.css
├── hooks/                     # Custom React hooks
│   └── useCloudinary.ts       # Cloudinary operations hook
├── styles/                    # Component-specific CSS files
│   ├── App.css               # Landing page styles
│   ├── CreateMemory.css      # Create memory page styles
│   ├── ViewMemory.css        # View memory page styles
│   ├── JourneyTracker.css    # Journey tracker styles
│   ├── AnniversaryReminders.css # Anniversary reminders styles
│   └── PDFExport.css         # PDF export styles
├── App.tsx                   # Main application component
├── CreateMemory.tsx          # Create memory page
├── ViewMemory.tsx            # View memory page
├── JourneyTracker.tsx        # Journey tracker page
├── AnniversaryReminders.tsx  # Anniversary reminders page
├── PDFExport.tsx             # PDF export page
└── main.tsx                  # Application entry point

api/                          # Backend API routes (Vercel serverless)
└── cloudinary.ts            # Secure Cloudinary operations
```


## 🏗️ Backend Service Architecture

### Serverless API (Vercel)
The project uses Vercel Serverless API routes for all backend operations:

```
Frontend (Vite + React)     Vercel Serverless API (api/cloudinary/*)     Cloudinary Cloud
      ↓                                 ↓                                    ↓
CloudinaryGalleryApi.ts  →  api/cloudinary/*.js  →  Cloudinary API
      ↑                                 ↑                                    ↑
Port 3000 (dev)                Serverless (Vercel)                    Cloud Storage
```

### Key Features:
- **🔒 Secure**: API secrets only in serverless API
- **🚀 Fast**: Direct API integration with Cloudinary
- **🧪 Mock Mode**: Works without Cloudinary credentials
- **📤 File Upload**: Multipart form data handling
- **🖼️ Image Processing**: Cloudinary transformations
- **🗑️ CRUD Operations**: Create, read, update, delete images

### Scripts Available:
```bash
npm run dev            # Frontend only (Vite dev server)
npm run build          # Build for production
npm run preview        # Preview production build
```

### API Endpoints (Vercel serverless):
- `GET /api/health` - Health check
- `GET /api/cloudinary/config` - Public config
- `GET /api/cloudinary/images` - Fetch images
- `POST /api/cloudinary/upload` - Upload image
- `DELETE /api/cloudinary/delete` - Delete image
- `POST /api/cloudinary/memory` - Create memory (with images)
- `GET /api/cloudinary/memories` - List memories

**Note:** No need to run a separate backend server. All backend logic is handled by serverless functions in the `api/` directory and deployed automatically with Vercel.

## 🔐 Security Implementation

### Cloudinary Integration Security
- **Client-side**: Only uses `CLOUD_NAME` and `API_KEY` (public credentials)
- **Server-side**: Secure API routes handle operations requiring `API_SECRET`
- **Environment Variables**: Proper separation of client/server credentials
- **No sensitive data exposure**: API secrets never sent to the browser

### Environment Variables Setup

Create a `.env.local` file:
```env
# Client-side (safe to expose to browser)
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_API_KEY=your-api-key

# Server-side only (keep these secret!)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Important**: 
- `VITE_` prefixed variables are exposed to the client
- Non-prefixed variables are only available on the server
- Never put `API_SECRET` in a `VITE_` variable!

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

## 🚀 Features

### Core Functionality
- **Memory Creation**: Rich text editor with photo uploads
- **Memory Gallery**: Beautiful timeline view with lightbox
- **Journey Tracker**: Relationship milestones with achievements
- **Anniversary Reminders**: Smart notifications for special dates
- **PDF Export**: Professional PDF generation with multiple templates

### Technical Features
- **TypeScript**: Full type safety throughout the application
- **React Hooks**: Custom hooks for state management
- **Responsive Design**: Works perfectly on all device sizes
- **Image Optimization**: Cloudinary transformations for performance
- **Error Handling**: Graceful error states and user feedback
- **Loading States**: Smooth loading indicators and progress bars

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

## 📱 Responsive Breakpoints

```css
/* Mobile First */
@media (min-width: 640px)  { /* sm */ }
@media (min-width: 768px)  { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

## 🎯 Best Practices Implemented

### Security
- ✅ API secrets never exposed to client
- ✅ Secure backend endpoints for sensitive operations
- ✅ Proper environment variable separation
- ✅ Input validation and sanitization

### Performance
- ✅ Image optimization with Cloudinary
- ✅ Lazy loading for images
- ✅ Efficient CSS with minimal reflows
- ✅ Code splitting and tree shaking

### Maintainability
- ✅ Separated concerns (API, UI, styles)
- ✅ Reusable components and hooks
- ✅ TypeScript for type safety
- ✅ Consistent file organization

### User Experience
- ✅ Responsive design for all devices
- ✅ Smooth animations and transitions
- ✅ Loading states and error handling
- ✅ Accessible design patterns

## 🔧 Customization

### Adding New Pages
1. Create component file: `src/NewPage.tsx`
2. Create styles file: `src/styles/NewPage.css`
3. Import styles in component: `import './styles/NewPage.css'`
4. Add route to `App.tsx`


### Extending Cloudinary Features
1. Add new methods to `src/api/cloudinaryGalleryApi.ts`
2. Update backend API route: `api/cloudinary.ts`
3. Extend custom hook: `src/hooks/useCloudinary.ts`

## 🔥 Firebase Integration

This project also uses Firebase for additional features (such as authentication, Firestore, or analytics).

### Where Firebase is Used
- `src/firebase/firebaseConfig.ts`: Initializes and exports the Firebase app instance.
- Custom hooks or components may use Firebase for user authentication, data storage, or other services.

### Environment Variables Setup
Add your Firebase config to `.env.local`:
```env
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-firebase-messaging-sender-id
VITE_FIREBASE_APP_ID=your-firebase-app-id
```

**Note:** All Firebase config for the web client is safe to expose (these are public keys, not secrets).

### How to Use Firebase in Code
- Import the initialized app from `src/firebase/firebaseConfig.ts`:
  ```ts
  import { app } from './firebase/firebaseConfig';
  ```
- Use Firebase SDKs (auth, firestore, etc.) as needed in your components or hooks.

### Security Notes
- Do **not** put any Firebase Admin SDK or service account credentials in the frontend code or `.env.local`.
- Only use the public web config (as above) for client-side features.

### Extending Firebase Features
1. Add new logic to `src/firebase/firebaseConfig.ts` or create new hooks in `src/hooks/` for Firebase features.
2. Use Firestore, Auth, or Storage as needed for your app's requirements.

### Styling Guidelines
- Use component-specific CSS classes
- Follow BEM naming convention
- Maintain consistent spacing (8px grid)
- Use CSS custom properties for theming
- Ensure responsive design for all components

## 📄 License

This project is created for educational and demonstration purposes.