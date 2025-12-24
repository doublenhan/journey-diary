# Cloud Functions Invocation Tracking

## Tổng Quan

Hệ thống đã được cập nhật để **đếm thực tế số lần Cloud Functions được gọi** thay vì dùng công thức ước tính.

## Cách Hoạt Động

### 1. **Tracking Function Calls**

Mỗi khi một Cloud Function được gọi, hệ thống sẽ:
- Ghi lại thời gian gọi (ngày)
- Tăng counter cho function đó
- Lưu vào Firestore collection: `system_stats/function_calls`

**Cấu trúc dữ liệu trong Firestore:**
```javascript
{
  "2024-12-24": {
    "deleteCloudinaryImage": 5,
    "calculateStorageStats": 2,
    "updateStorageStats": 1,
    "total": 8
  },
  "2024-12-25": {
    "deleteCloudinaryImage": 10,
    "calculateStorageStats": 2,
    "updateStorageStats": 3,
    "total": 15
  },
  "lastUpdated": timestamp
}
```

### 2. **Tính Toán Usage**

Trong `calculateStorageStats` và `updateStorageStats`, hệ thống sẽ:
1. Đọc dữ liệu từ 7 ngày gần nhất
2. Tính trung bình số lần gọi mỗi ngày
3. Hiển thị số liệu thực tế (actual data) thay vì estimate

**Công thức:**
```typescript
actualInvocationsPerDay = totalCalls / daysWithData
```

### 3. **Hiển Thị Trên Dashboard**

Admin Dashboard sẽ hiển thị:
- **"Cloud Functions (Actual)"**: Khi có dữ liệu thực tế từ tracking
- **"Cloud Functions (Estimated)"**: Khi chưa có đủ dữ liệu (fallback)

**Tính cho cả tháng:**
```
Invocations/Month = actualInvocationsPerDay × 30
```

## Các Functions Được Track

1. **deleteCloudinaryImage** - Xóa ảnh từ Cloudinary
2. **calculateStorageStats** - Tự động chạy mỗi giờ để tính stats
3. **updateStorageStats** - Được gọi thủ công từ Admin Dashboard

## Lợi Ích

### ✅ Trước đây (Estimate):
- Công thức: `memoriesCount × 2 × 30 = invocations/month`
- Mỗi memory mới → tăng 60 calls
- Không chính xác với usage thực tế

### ✅ Bây giờ (Actual):
- Đếm chính xác số lần functions được gọi
- Dựa trên dữ liệu 7 ngày gần nhất
- Tự động fallback về estimate nếu chưa có data
- Admin biết chính xác usage pattern

## Firestore Security Rules

**Lưu ý:** Cần thêm rules cho `system_stats/function_calls`:

```javascript
match /system_stats/{statId} {
  // Allow Cloud Functions to write
  allow write: if request.auth != null;
  
  // Allow SysAdmin to read
  allow read: if request.auth != null && 
    get(/databases/$(database)/documents/dev_users/$(request.auth.uid)).data.role == 'SysAdmin';
}
```

## Testing

### 1. Tạo vài memories mới
- Mỗi memory tạo sẽ trigger `deleteCloudinaryImage` (nếu xóa ảnh cũ)
- Counter sẽ tăng trong `system_stats/function_calls`

### 2. Kiểm tra trong Firestore Console
- Vào `system_stats/function_calls`
- Xem counters theo từng ngày

### 3. Trigger manual stats update
- Vào Admin Dashboard
- Click "Tính Toán Thống Kê"
- Kiểm tra label hiển thị "(Actual)" hay "(Estimated)"

## Xử Lý Lỗi

- Nếu tracking fails, function vẫn chạy bình thường
- Nếu không đọc được tracking data, fallback về estimate
- Logs errors nhưng không throw để avoid breaking functions

## Monitoring

Check Firebase Functions logs để xem:
```
Error tracking function call: [error details]
Error reading function calls data: [error details]
```

## Cập Nhật Sau Này

Có thể mở rộng:
- Track thêm metrics: execution time, errors, etc.
- Tạo dashboard riêng cho function analytics
- Alert khi usage vượt ngưỡng
- Export reports theo tháng
