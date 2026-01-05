# 🔗 Couple Features - Firestore Schema Design

## 📋 Overview

Schema thiết kế cho tính năng couple linking, cho phép 2 users liên kết tài khoản và chia sẻ memories với nhau.

---

## 🗂️ Collections Structure

### 1️⃣ **Collection: `couples`**

Lưu thông tin về các cặp đôi đã liên kết.

```typescript
interface Couple {
  // Core Info
  coupleId: string;                    // Auto-generated document ID
  
  // Members
  user1Id: string;                     // User ID của người đầu tiên
  user2Id: string;                     // User ID của người thứ hai
  user1Name: string;                   // Display name user 1
  user2Name: string;                   // Display name user 2
  user1Avatar?: string;                // Avatar URL user 1
  user2Avatar?: string;                // Avatar URL user 2
  
  // Relationship Info
  relationshipName?: string;           // Tên couple VD: "Minh & Linh"
  coupleAvatar?: string;               // Avatar của couple (optional)
  anniversaryDate?: Date;              // Ngày kỷ niệm (VD: ngày quen nhau)
  
  // Status
  status: 'active' | 'disconnected';   // Trạng thái liên kết
  
  // Settings
  shareMode: 'all' | 'selected';       // 'all': tự động share tất cả memories, 'selected': chọn share
  allowEdit: boolean;                  // Partner có được edit memories của nhau không
  allowDelete: boolean;                // Partner có được delete memories của nhau không
  
  // Metadata
  createdAt: Timestamp;                // Ngày tạo liên kết
  updatedAt: Timestamp;                // Lần cập nhật cuối
  disconnectedAt?: Timestamp;          // Ngày ngắt kết nối (nếu có)
  disconnectedBy?: string;             // User ID người ngắt kết nối
}
```

**Example Document:**
```json
{
  "coupleId": "couple_abc123",
  "user1Id": "user_xyz789",
  "user2Id": "user_def456",
  "user1Name": "Minh",
  "user2Name": "Linh",
  "user1Avatar": "https://...",
  "user2Avatar": "https://...",
  "relationshipName": "Minh & Linh",
  "anniversaryDate": "2023-02-14T00:00:00Z",
  "status": "active",
  "shareMode": "all",
  "allowEdit": false,
  "allowDelete": false,
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

---

### 2️⃣ **Collection: `coupleInvitations`**

Lưu lời mời kết nối couple (pending invitations).
=> Status Pending > Keep trong 3 ngày , sau 3 ngày se expire
```typescript
interface CoupleInvitation {
  // Core Info
  invitationId: string;                // Auto-generated document ID
  
  // Sender & Receiver
  senderId: string;                    // User ID người gửi lời mời
  senderName: string;                  // Display name người gửi
  senderAvatar?: string;               // Avatar người gửi
  senderEmail: string;                 // Email người gửi
  
  receiverId: string;                  // User ID người nhận
  receiverName: string;                // Display name người nhận
  receiverEmail: string;               // Email người nhận
  
  // Status
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  
  // Message
  message?: string;                    // Lời nhắn kèm theo lời mời
  
  // Settings (áp dụng khi accepted)
  proposedShareMode: 'all' | 'selected';
  proposedAllowEdit: boolean;
  proposedAllowDelete: boolean;
  
  // Metadata
  createdAt: Timestamp;                // Ngày gửi lời mời
  expiresAt: Timestamp;                // Ngày hết hạn (7 days)
  respondedAt?: Timestamp;             // Ngày phản hồi
  coupleId?: string;                   // Couple ID sau khi accepted
}
```

**Example Document:**
```json
{
  "invitationId": "inv_xyz123",
  "senderId": "user_abc789",
  "senderName": "Minh",
  "senderEmail": "minh@example.com",
  "receiverId": "user_def456",
  "receiverName": "Linh",
  "receiverEmail": "linh@example.com",
  "status": "pending",
  "message": "Anh muốn liên kết tài khoản để lưu giữ kỷ niệm chung của chúng mình ❤️",
  "proposedShareMode": "all",
  "proposedAllowEdit": false,
  "proposedAllowDelete": false,
  "createdAt": "2025-01-15T09:00:00Z",
  "expiresAt": "2025-01-22T09:00:00Z"
}
```

---

### 3️⃣ **Collection: `sharedMemories`**

Lưu thông tin memories được share giữa couple (cho shareMode = 'selected').

```typescript
interface SharedMemory {
  // Core Info
  sharedId: string;                    // Auto-generated document ID
  
  // Memory Info
  memoryId: string;                    // Memory ID được share
  coupleId: string;                    // Couple ID
  
  // Owner & Shared Info
  ownerId: string;                     // User ID chủ memory
  sharedWithId: string;                // User ID được share
  
  // Permissions
  canView: boolean;                    // Có được xem không (default: true)
  canEdit: boolean;                    // Có được edit không
  canDelete: boolean;                  // Có được delete không
  
  // Metadata
  sharedAt: Timestamp;                 // Ngày share
  sharedBy: string;                    // User ID người share
  revokedAt?: Timestamp;               // Ngày thu hồi quyền
  revokedBy?: string;                  // User ID người thu hồi
}
```

**Example Document:**
```json
{
  "sharedId": "shared_abc123",
  "memoryId": "memory_xyz789",
  "coupleId": "couple_def456",
  "ownerId": "user_abc789",
  "sharedWithId": "user_def456",
  "canView": true,
  "canEdit": false,
  "canDelete": false,
  "sharedAt": "2025-01-15T11:00:00Z",
  "sharedBy": "user_abc789"
}
```

---

### 4️⃣ **Update: `users` Collection**

Thêm fields mới vào existing `users` collection:

```typescript
interface User {
  // ... existing fields ...
  
  // Couple Info (NEW)
  coupleId?: string;                   // Couple ID nếu đã liên kết
  partnerId?: string;                  // Partner User ID
  partnerName?: string;                // Partner display name
  coupleStatus?: 'single' | 'linked';  // Trạng thái couple
  
  // Couple Settings (NEW)
  coupleSettings?: {
    allowPartnerEdit: boolean;         // Cho phép partner edit memories
    allowPartnerDelete: boolean;       // Cho phép partner delete memories
    autoShareNewMemories: boolean;     // Tự động share memories mới
    notifyOnPartnerMemory: boolean;    // Thông báo khi partner tạo memory mới
  };
}
```

---

### 5️⃣ **Update: `memories` Collection**

Thêm fields mới vào existing `memories` collection:

```typescript
interface Memory {
  // ... existing fields ...
  
  // Sharing Info (NEW)
  isShared?: boolean;                  // Memory có được share không
  sharedWith?: string[];               // Array of user IDs được share
  sharedAt?: Timestamp;                // Ngày share
  
  // Couple Collaboration (NEW)
  collaborators?: string[];            // Array of user IDs có thể edit
  lastEditedBy?: string;               // User ID người edit cuối
  lastEditedAt?: Timestamp;            // Thời gian edit cuối
  
  // Original Owner (NEW - important khi couple disconnect)
  originalOwnerId: string;             // User ID chủ nhân ban đầu
}
```

---

## 🔍 Firestore Indexes

### Required Composite Indexes:

```javascript
// 1. Query couples by user
couples
  - user1Id (Ascending)
  - status (Ascending)
  - createdAt (Descending)

couples
  - user2Id (Ascending)
  - status (Ascending)
  - createdAt (Descending)

// 2. Query invitations
coupleInvitations
  - receiverId (Ascending)
  - status (Ascending)
  - createdAt (Descending)

coupleInvitations
  - senderId (Ascending)
  - status (Ascending)
  - createdAt (Descending)

// 3. Query shared memories
sharedMemories
  - coupleId (Ascending)
  - sharedWithId (Ascending)
  - sharedAt (Descending)

sharedMemories
  - memoryId (Ascending)
  - coupleId (Ascending)

// 4. Query user memories with sharing
memories
  - userId (Ascending)
  - isShared (Ascending)
  - createdAt (Descending)
```

---

## 🔐 Security Rules

```javascript
// couples collection
match /couples/{coupleId} {
  allow read: if request.auth != null && (
    resource.data.user1Id == request.auth.uid ||
    resource.data.user2Id == request.auth.uid
  );
  
  allow create: if request.auth != null && (
    request.resource.data.user1Id == request.auth.uid ||
    request.resource.data.user2Id == request.auth.uid
  );
  
  allow update: if request.auth != null && (
    resource.data.user1Id == request.auth.uid ||
    resource.data.user2Id == request.auth.uid
  );
  
  allow delete: if request.auth != null && (
    resource.data.user1Id == request.auth.uid ||
    resource.data.user2Id == request.auth.uid
  );
}

// coupleInvitations collection
match /coupleInvitations/{invitationId} {
  allow read: if request.auth != null && (
    resource.data.senderId == request.auth.uid ||
    resource.data.receiverId == request.auth.uid
  );
  
  allow create: if request.auth != null && 
    request.resource.data.senderId == request.auth.uid;
  
  allow update: if request.auth != null && (
    resource.data.receiverId == request.auth.uid ||
    resource.data.senderId == request.auth.uid
  );
  
  allow delete: if request.auth != null && (
    resource.data.senderId == request.auth.uid ||
    resource.data.receiverId == request.auth.uid
  );
}

// sharedMemories collection
match /sharedMemories/{sharedId} {
  allow read: if request.auth != null && (
    resource.data.ownerId == request.auth.uid ||
    resource.data.sharedWithId == request.auth.uid
  );
  
  allow create: if request.auth != null && 
    request.resource.data.ownerId == request.auth.uid;
  
  allow update, delete: if request.auth != null && 
    resource.data.ownerId == request.auth.uid;
}
```

---

## 🔄 User Flows

### Flow 1: Send Couple Invitation

```
1. User A clicks "Connect with Partner"
2. Enter partner's email/userId
3. Optionally add message
4. Select initial settings (shareMode, permissions)
5. Create document in `coupleInvitations` collection
   - status: 'pending'
   - expiresAt: now + 7 days
6. Send notification to User B
```

### Flow 2: Accept/Reject Invitation

```
Accept:
1. User B sees invitation in notifications
2. Reviews invitation details
3. Clicks "Accept"
4. Update `coupleInvitations` document:
   - status: 'accepted'
   - respondedAt: now
5. Create new document in `couples` collection
6. Update both users' `coupleId` in `users` collection
7. If shareMode = 'all': create `sharedMemories` for all existing memories

Reject:
1. User B clicks "Reject"
2. Update `coupleInvitations` document:
   - status: 'rejected'
   - respondedAt: now
3. Send notification to User A
```

### Flow 3: Disconnect Couple

```
1. User A clicks "Disconnect Couple"
2. Show confirmation dialog
3. Update `couples` document:
   - status: 'disconnected'
   - disconnectedAt: now
   - disconnectedBy: userAId
4. Update both users in `users` collection:
   - Remove coupleId, partnerId
   - coupleStatus: 'single'
5. Optional: Keep or delete `sharedMemories` documents
   - Keep: User B still sees shared memories (read-only)
   - Delete: Remove all sharing
6. Send notification to User B
```

### Flow 4: Share Memory (shareMode = 'selected')

```
1. User A views their memory
2. Clicks "Share with Partner"
3. Create document in `sharedMemories`:
   - memoryId: memoryId
   - coupleId: coupleId
   - sharedWithId: partnerUserId
   - permissions based on couple settings
4. Update memory document:
   - isShared: true
   - sharedWith: [partnerUserId]
5. Send notification to User B
```

---

## 📊 Query Examples

### Get user's couple info
```typescript
const coupleRef = await firestore
  .collection('couples')
  .where('user1Id', '==', userId)
  .where('status', '==', 'active')
  .get();

if (coupleRef.empty) {
  // Try user2Id
  const coupleRef2 = await firestore
    .collection('couples')
    .where('user2Id', '==', userId)
    .where('status', '==', 'active')
    .get();
}
```

### Get pending invitations
```typescript
const invitations = await firestore
  .collection('coupleInvitations')
  .where('receiverId', '==', userId)
  .where('status', '==', 'pending')
  .orderBy('createdAt', 'desc')
  .get();
```

### Get shared memories
```typescript
// Get memories shared with me
const sharedWithMe = await firestore
  .collection('sharedMemories')
  .where('sharedWithId', '==', userId)
  .where('coupleId', '==', coupleId)
  .get();

// Get memory IDs
const memoryIds = sharedWithMe.docs.map(doc => doc.data().memoryId);

// Query actual memories
const memories = await firestore
  .collection('memories')
  .where(FieldPath.documentId(), 'in', memoryIds)
  .orderBy('createdAt', 'desc')
  .get();
```

### Get all memories (own + shared)
```typescript
// Own memories
const ownMemories = await firestore
  .collection('memories')
  .where('userId', '==', userId)
  .orderBy('createdAt', 'desc')
  .get();

// Shared memories
const sharedMemoryRefs = await firestore
  .collection('sharedMemories')
  .where('sharedWithId', '==', userId)
  .get();

const sharedMemoryIds = sharedMemoryRefs.docs.map(doc => doc.data().memoryId);

if (sharedMemoryIds.length > 0) {
  const sharedMemories = await firestore
    .collection('memories')
    .where(FieldPath.documentId(), 'in', sharedMemoryIds.slice(0, 10)) // Max 10 per query
    .get();
}

// Merge and sort both
const allMemories = [...ownMemories.docs, ...sharedMemories.docs]
  .sort((a, b) => b.data().createdAt - a.data().createdAt);
```

---

## 🎯 Features Checklist

### Phase 1: Basic Couple Linking
- [ ] Send couple invitation
- [ ] Accept/Reject invitation
- [ ] View couple status
- [ ] Disconnect couple
- [ ] Basic settings (shareMode, permissions)

### Phase 2: Memory Sharing
- [ ] Auto-share all memories (shareMode = 'all')
- [ ] Manual share selected memories (shareMode = 'selected')
- [ ] View shared memories timeline
- [ ] Revoke sharing
- [ ] Partner memory notifications

### Phase 3: Collaboration
- [ ] Edit partner's memories (if allowed)
- [ ] Comment on partner's memories
- [ ] React to partner's memories
- [ ] Joint timeline view
- [ ] Couple statistics dashboard

### Phase 4: Advanced Features
- [ ] Couple photo album
- [ ] Shared anniversary reminders
- [ ] Couple challenges/goals
- [ ] Export couple memories
- [ ] Privacy controls per memory

---

## 🚨 Edge Cases to Handle

1. **Invitation Expiry**: Auto-update status after 7 days
2. **Multiple Invitations**: Prevent user from having multiple active invitations
3. **Already Linked**: Prevent user from linking with someone else while already linked
4. **Self-Invitation**: Prevent user from inviting themselves
5. **Disconnect with Shared Memories**: Decide what happens to shared memories
6. **Memory Deletion**: If partner deletes shared memory, notify owner
7. **User Account Deletion**: Clean up all couple-related data
8. **Concurrent Updates**: Handle race conditions with transactions
9. **Batch Operations**: Handle >500 memories when shareMode = 'all'

---

## 💾 Data Migration Plan

### Step 1: Add new fields to existing collections
```typescript
// Add to users collection
await batch.update(userRef, {
  coupleStatus: 'single',
  coupleSettings: {
    allowPartnerEdit: false,
    allowPartnerDelete: false,
    autoShareNewMemories: true,
    notifyOnPartnerMemory: true
  }
});

// Add to memories collection
await batch.update(memoryRef, {
  isShared: false,
  originalOwnerId: memory.userId
});
```

### Step 2: Create new collections
- `couples` collection (empty initially)
- `coupleInvitations` collection (empty initially)
- `sharedMemories` collection (empty initially)

### Step 3: Create indexes
- Run index creation commands
- Wait for indexes to build

### Step 4: Deploy security rules
- Update Firestore security rules
- Test with different user scenarios

---

## 📝 Notes

- **Scalability**: For users with >1000 memories, consider pagination when sharing
- **Real-time Updates**: Use Firestore listeners for invitation status, couple status
- **Notifications**: Integrate with existing notification system
- **Analytics**: Track couple linking rate, sharing behavior
- **Privacy**: Ensure users can control what's shared even in 'all' mode

---

## ✅ Ready for Review

Schema này đã cover:
✅ Complete data structure
✅ Security rules
✅ Indexes for performance
✅ User flows
✅ Query examples
✅ Edge cases
✅ Migration plan

**Next Steps After Approval:**
1. Create TypeScript interfaces
2. Create Firestore services
3. Create React hooks
4. Build UI components
5. Write tests

---

## ✅ **Implementation Decisions (CONFIRMED)**

1. **Permissions on Disconnect**: ❌ XÓA HẾT
   - Khi couple disconnect, partner MẤT HOÀN TOÀN quyền truy cập memories đã share
   - Delete all `sharedMemories` documents
   - Partner không thể xem/edit/delete memories nữa

2. **Edit History**: ❌ KHÔNG CẦN
   - Không lưu version history khi partner edit
   - Chỉ track `lastEditedBy` và `lastEditedAt`
   - Giữ đơn giản, tránh phức tạp data storage

3. **Notification Frequency**: ✅ REAL-TIME
   - Thông báo ngay lập tức khi partner tạo memory mới
   - Sử dụng Firestore listeners cho real-time updates
   - Push notifications tức thì

4. **Memory Limit**: ✅ KHÔNG GIỚI HẠN
   - User có thể share unlimited memories
   - Sử dụng pagination khi query large datasets
   - Batch operations cho >500 memories

5. **Multiple Couples**: ✅ CÓ (Timeline-based)
   - User có thể có nhiều couples khác nhau theo thời gian
   - Chỉ 1 couple ACTIVE tại 1 thời điểm
   - Lưu history các couples trước đó (status = 'disconnected')
   - Có thể view lại memories từ các relationships cũ
