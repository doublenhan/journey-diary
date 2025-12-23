# Storage Statistics System - Setup Guide

## Đã triển khai

### 1. Cloud Functions (`functions/src/index.ts`)

**Scheduled Function - Tự động chạy mỗi giờ:**
```typescript
calculateStorageStats
```
- Chạy tự động mỗi 1 giờ
- Tính toán stats cho toàn hệ thống (tất cả users, memories, images)
- Lưu kết quả vào `system_stats/storage` collection

**HTTP Function - Manual trigger:**
```typescript
updateStorageStats
```
- Cho phép admin trigger manual để update stats ngay lập tức
- Yêu cầu authentication (Bearer token)
- Chỉ SysAdmin mới được phép gọi

### 2. Firestore Security Rules

Đã thêm rules cho `system_stats` collection:
```
match /system_stats/{statId} {
  allow read: if isAuthenticated();  // Mọi user đều đọc được
  allow write: if false;              // Chỉ Cloud Functions mới write được
}
```

### 3. Updated API (`src/apis/storageUsageApi.ts`)

**New functions:**
- `getSystemStorageStats()` - Đọc pre-calculated stats từ Firestore
- `triggerStatsUpdate()` - Manual trigger Cloud Function (cho admin)
- `getAllStorageUsage()` - Smart function với fallback:
  1. Thử đọc system stats trước (toàn hệ thống)
  2. Nếu không có, fallback về user-specific stats

## Deploy Instructions

### Bước 1: Build Cloud Functions
```powershell
cd functions
npm run build
```

### Bước 2: Deploy Firestore Rules
```powershell
firebase deploy --only firestore:rules
```

### Bước 3: Deploy Cloud Functions
```powershell
firebase deploy --only functions
```

### Bước 4: Test Functions

**Test Scheduled Function (manual trigger):**
```powershell
# Trong Firebase Console:
# Functions → calculateStorageStats → Test
```

**Test HTTP Function:**
```bash
# Get your auth token
const token = await auth.currentUser.getIdToken();

# Call function
curl -X POST https://YOUR-PROJECT.cloudfunctions.net/updateStorageStats \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json"
```

## Environment Variables

Thêm vào `.env`:
```env
VITE_FIREBASE_FUNCTIONS_URL=https://YOUR-PROJECT.cloudfunctions.net/updateStorageStats
```

## Data Structure

**Collection:** `system_stats`  
**Document:** `storage`

```typescript
{
  firebase: {
    documentsCount: 150,
    estimatedStorageMB: 1.47,
    usersCount: 10,
    memoriesCount: 140,
    limit: {
      storageLimitGB: 1,
      readsPerDay: 50000,
      writesPerDay: 20000
    }
  },
  cloudinary: {
    usedStorageMB: 350.5,
    totalImages: 701,
    limit: {
      storageLimitGB: 25,
      transformationsPerMonth: 25000,
      bandwidthGB: 25
    }
  },
  lastUpdated: Timestamp,
  calculatedAt: "2025-12-22T10:00:00.000Z"
}
```

## Cách hoạt động

### Automatic Updates (Recommended)
1. Cloud Function `calculateStorageStats` chạy tự động mỗi giờ
2. Function đọc toàn bộ users/memories collections với Admin SDK
3. Tính toán stats và lưu vào `system_stats/storage`
4. Admin Dashboard đọc từ `system_stats/storage` (instant, no calculation needed)

### Manual Trigger (Optional)
1. Admin click "Refresh" button trong dashboard
2. Call `triggerStatsUpdate()` API
3. HTTP Function được trigger với admin auth
4. Stats được update ngay lập tức

## Benefits

✅ **Accurate System-Wide Stats:**
- Tính toán cho TẤT CẢ users và memories
- Không bị giới hạn bởi security rules
- Dữ liệu chính xác 100%

✅ **Performance:**
- Pre-calculated stats → load nhanh
- Không cần query nhiều documents khi view dashboard
- Giảm Firestore reads

✅ **Security:**
- Chỉ Cloud Functions (Admin SDK) mới write được
- Clients chỉ read-only
- Admin-only manual trigger

✅ **Reliability:**
- Auto-refresh mỗi giờ
- Có fallback nếu stats chưa có
- Error handling đầy đủ

## Next Steps

1. Deploy functions và rules
2. Trigger function lần đầu để tạo stats
3. Test trong Admin Dashboard
4. Monitor logs trong Firebase Console

## Troubleshooting

**Stats không load:**
- Check xem Cloud Function đã chạy chưa (Firebase Console → Functions → Logs)
- Manually trigger function lần đầu
- Check Firestore Rules đã deploy chưa

**Permission errors:**
- Verify user có role SysAdmin
- Check authentication token
- Check firestore rules

**Stats không chính xác:**
- Đợi Cloud Function chạy (mỗi giờ)
- Hoặc manual trigger để update ngay
