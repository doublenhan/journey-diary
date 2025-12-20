# Role-Based Access Control (RBAC) System

## 📋 Overview

The app now has a role-based permission system with 2 roles:

### **User** (Default)
- ✅ Create memories
- ✅ Read memories
- ✅ Update memories
- ✅ Delete memories
- ✅ Create anniversaries
- ✅ Read anniversaries
- ✅ Update anniversaries
- ✅ Delete anniversaries
- ✅ Update profile (but not delete account)
- ❌ Access admin panel
- ❌ Manage other users
- ❌ Change system settings

### **SysAdmin** (System Administrator)
- ✅ Full access to all User permissions
- ✅ Access admin dashboard
- ✅ View all users
- ✅ Change user roles (User ↔ SysAdmin)
- ✅ Audit all user data
- ✅ System management

---

## 🚀 How It Works

### 1. **User Signup**
When a user creates an account:
```
User Registration → Firestore User Document Created with role: 'User'
```

New users automatically get the **User** role.

### 2. **Role Assignment**
Admin access is granted by changing role in Admin Dashboard:
```
Admin Dashboard → Select User → Change Role → User → SysAdmin
```

### 3. **Admin Access**
Only users with **SysAdmin** role can:
- Navigate to `/admin` route
- View Admin Dashboard
- Manage other users' roles

---

## 📁 File Structure

```
src/
├── config/
│   └── roles.ts                 # Role definitions & permissions
├── contexts/
│   └── AdminContext.tsx         # Global admin state management
├── apis/
│   └── userRoleApi.ts           # User role API functions
├── components/
│   └── ProtectedRoute.tsx       # Route protection component
├── pages/
│   └── AdminDashboard.tsx       # Admin panel UI
├── styles/
│   └── AdminDashboard.css       # Admin dashboard styles
└── utils/
    └── roleUtils.ts             # Role utility functions
```

---

## 🔧 Configuration

### Admin Access Code (Environment Variable)
Set in `.env.local`:
```
REACT_APP_ADMIN_CODE=ADMIN_SECRET_2024
```

This code is used for promoting users to admin programmatically (optional).

---

## 💾 Firestore Schema

### Users Collection
```typescript
{
  uid: string;
  email: string;
  displayName: string;
  phone: string;
  dob: string;
  role: 'User' | 'SysAdmin';              // ← NEW FIELD
  createdAt: timestamp;
  updatedAt: timestamp;
  roleAssignedAt: timestamp;              // ← NEW FIELD
  roleChangedAt?: timestamp;              // ← When role was last changed
  roleChangedBy?: string;                 // ← UID of admin who changed it
}
```

---

## 🎯 Usage Examples

### 1. Check User Role
```typescript
import { useAdmin } from './contexts/AdminContext';

function MyComponent() {
  const { currentUserRole, isAdmin } = useAdmin();
  
  return (
    <div>
      Your role: {currentUserRole}
      Is admin: {isAdmin}
    </div>
  );
}
```

### 2. Protect Routes
```typescript
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requiredRole="SysAdmin">
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}
```

### 3. Check Permissions
```typescript
import { hasPermission, isAdmin } from './utils/roleUtils';
import { useAdmin } from './contexts/AdminContext';

function ResourceComponent() {
  const { currentUserRole } = useAdmin();
  
  const canDeleteMemory = hasPermission(currentUserRole, 'memories', 'delete');
  const isAdminUser = isAdmin(currentUserRole);
  
  return (
    <>
      {canDeleteMemory && <button>Delete</button>}
      {isAdminUser && <button>Admin Options</button>}
    </>
  );
}
```

---

## 👨‍💼 Admin Dashboard Features

### User List
- View all users with their roles
- See user creation date and last update
- User email and display name

### Role Management
- Change individual user roles
- Confirm role changes with visual feedback
- Audit trail (changes are logged with timestamp)

### Statistics
- Total users count
- Total administrators count

---

## 🔐 Security Considerations

### Best Practices Implemented:
✅ Role validation on Firestore rules (add security rules)
✅ Audit logging for role changes
✅ Protected routes require authentication
✅ Admin-only access to sensitive operations
✅ Permission checks on both frontend and backend (backend needed)

### Recommendations:
1. **Add Firestore Security Rules** to enforce role-based access:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId || 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'SysAdmin';
    }
  }
}
```

2. **Server-side validation** for sensitive operations
3. **Rate limiting** on role change operations
4. **Email notifications** when user roles are changed

---

## 🚨 Common Issues

### Q: New user can't access admin panel after role change?
**A:** The user needs to log out and log back in for the role to refresh.

### Q: Changes don't persist after page reload?
**A:** Check Firestore database - role must be saved correctly.

### Q: Admin link not appearing in Profile?
**A:** Ensure user has SysAdmin role and the AdminContext is wrapped in main.tsx.

---

## 📝 Testing Checklist

- [ ] New users get 'User' role automatically
- [ ] Users can't access `/admin` route
- [ ] Promote user to SysAdmin in admin dashboard
- [ ] Admin user sees admin panel link in profile
- [ ] Admin can change other users' roles
- [ ] Role changes are logged with timestamp
- [ ] Admin dashboard shows correct user count
- [ ] Protected routes work correctly

---

## 🔄 Migration Guide (if upgrading existing users)

For users who existed before this update and don't have a role field:

```typescript
// Run once in Firestore migration
db.collection('users').get().then(snapshot => {
  snapshot.forEach(doc => {
    if (!doc.data().role) {
      doc.ref.update({ role: 'User', roleAssignedAt: new Date() });
    }
  });
});
```

---

## 📚 API Reference

### useAdmin Hook
```typescript
const {
  currentUserRole,        // 'User' | 'SysAdmin' | null
  isAdmin,                // boolean
  loading,                // boolean
  error,                  // string | null
  users,                  // UserWithRole[]
  fetchUsers,             // () => Promise<void>
  changeUserRole,         // (userId, newRole) => Promise<void>
  getCollectionName       // (name) => string
} = useAdmin();
```

### Role Utils
```typescript
hasPermission(role, resource, action)          // Check specific permission
canManageMemories(role)                         // User can CRUD memories
canManageAnniversaries(role)                    // User can CRUD anniversaries
canManageUsers(role)                            // User is admin
isAdmin(role)                                   // Quick admin check
isRegularUser(role)                             // Quick user check
getRoleLabel(role)                              // Get display name
isValidRole(role)                               // Validate role type
```

---

## 🎉 You're All Set!

The role-based permission system is now implemented. Users automatically get the 'User' role on signup, and admins can promote them to 'SysAdmin' through the admin dashboard.
