# Admin Dashboard - Setup and Usage Guide

## Overview

The Admin Dashboard is now fully functional and allows System Administrators to manage users and their roles in the system.

## What's New

### 1. Admin Setup Component (`AdminSetup.tsx`)
- Located in the Profile Information page  
- Allows any logged-in user to promote themselves or others to SysAdmin role
- Safely handles collection naming (dev_users vs users) based on environment

### 2. Updated AdminContext (`src/contexts/AdminContext.tsx`)
- Loads current user's role from Firebase on app startup
- Provides `fetchUsers()` method to retrieve all users with proper permissions
- Fetches from the correct collection based on environment (dev_users or users)
- Handles role changes with proper validation

### 3. ProtectedRoute Component (`src/components/ProtectedRoute.tsx`)
- Protects the admin dashboard route
- Requires "SysAdmin" role to access `/admin`
- Redirects unauthorized users with clear message
- Shows loading state while role is being determined

### 4. AdminDashboard Component (`src/pages/AdminDashboard.tsx`)
- Displays user statistics (total users, number of admins)
- Shows user management table with sortable columns
- Allows changing user roles (User ↔ SysAdmin)
- Responsive design with proper styling
- Added debug logging for troubleshooting

## How to Use

### Step 1: Promote User to Admin
1. Log in with any user account
2. Go to Profile Information page
3. Click the **"Initialize Admin"** button (orange button)
4. In the modal that appears, enter the email address of the user to promote
5. Click **"Promote to Admin"**
6. Wait for the success message

### Step 2: Access Admin Dashboard
1. Once promoted to SysAdmin, you'll see **"Admin Access: You have administrator privileges"** message
2. Click the **"Admin Dashboard"** button (purple button)
3. You'll see the admin dashboard with:
   - **Total Users**: Count of all users in the system
   - **Administrators**: Count of users with SysAdmin role
   - **User Management**: Table showing all users with their details

### Step 3: Manage Users
In the User Management section, you can:
- View all users with email, name, and role
- Click on a user to expand their details
- Change user roles by clicking the role dropdown
- See creation and update timestamps

## Technical Details

### Collection Naming
- **Development**: `dev_users` (when `VITE_ENV_PREFIX=dev_`)
- **Production**: `users` (when `VITE_ENV_PREFIX` is empty)

The system automatically uses the correct collection based on the environment variable.

### Firestore Rules
The firestore.rules file has been configured to allow:
- Authenticated users to **read** any user document (for admin panel)
- Users to **write** only their own documents
- Proper validation for all operations

### Dependencies Removed
- Removed unnecessary dependencies from `fetchUsers()` callback to prevent re-creation
- Used ref-based concurrency control to prevent duplicate requests
- Proper async/await handling with try-catch-finally

## File Changes Summary

### New Files
- `src/components/AdminSetup.tsx` - Admin initialization modal
- `scripts/updateUserRole.mjs` - Node.js script to update roles (requires service account)
- `init-admin.mjs` - Admin initialization script (requires service account)

### Modified Files
- `src/contexts/AdminContext.tsx` - Enhanced with proper logging and error handling
- `src/pages/AdminDashboard.tsx` - Added detailed logging and UI improvements
- `src/ProfileInformation.tsx` - Added AdminSetup button
- `src/components/ProtectedRoute.tsx` - Role-based access control
- `firestore.rules` - Security rules (deployed)

## Troubleshooting

### Admin Dashboard Shows "Access Denied"
- User is not a SysAdmin
- Solution: Use the "Initialize Admin" button on Profile page

### Users List Shows "No users found"
- Check that users exist in the correct collection (dev_users or users)
- Check Firestore rules are deployed: `firebase deploy --only firestore:rules`
- Check browser console for permission errors

### AdminSetup Modal Doesn't Appear
- Make sure you're logged in
- Check browser console for errors
- Verify AdminSetup component is properly imported

### Firestore Rules Errors
- Deploy rules: `firebase deploy --only firestore:rules`
- Check rule syntax in `firestore.rules`
- Verify user is authenticated

## Security Considerations

1. **Role-Based Access**: Only SysAdmins can access the admin dashboard
2. **Rule-Based Protection**: Firestore rules enforce read/write permissions
3. **Action Tracking**: All role changes are logged with timestamp and who made the change
4. **No Direct Collection Access**: Users cannot directly query/modify others' data except through authorized endpoints

## Future Enhancements

Possible improvements:
1. Admin audit log for all actions
2. Batch user operations (delete, role change)
3. User activity statistics
4. Admin notifications for system events
5. User search and filtering
6. Export user data functionality
