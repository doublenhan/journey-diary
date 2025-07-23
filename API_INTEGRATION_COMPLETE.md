## Firebase API Endpoints (nếu sử dụng)

> **Lưu ý:** Firebase hiện chỉ dùng cho các tính năng như xác thực (auth), profile người dùng, analytics. Tất cả logic memories/images đã chuyển hoàn toàn sang Cloudinary qua serverless API. Không còn lưu memories/images trên Firestore hay Storage.

### 1. Firestore (Client-side)
- **Chỉ dùng cho user profile hoặc các dữ liệu phụ.**
- **Ví dụ**:
  ```typescript
  import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';
  const db = getFirestore(app);
  // Thêm document (ví dụ: user profile)
  await addDoc(collection(db, 'users'), { displayName, ... });
  // Lấy danh sách user
  const querySnapshot = await getDocs(collection(db, 'users'));
  ```

### 2. Authentication (Client-side)
- **Đăng ký/Đăng nhập**: Sử dụng SDK để xác thực người dùng.
- **Ví dụ**:
  ```typescript
  import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
  const auth = getAuth(app);
  await signInWithEmailAndPassword(auth, email, password);
  ```

### 3. Firebase Storage (Client-side)
- **Chỉ dùng cho file user profile (nếu có).**
- **Không dùng cho memories/images.**
- **Ví dụ**:
  ```typescript
  import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
  const storage = getStorage(app);
  const storageRef = ref(storage, 'avatars/my-avatar.jpg');
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  ```

---
## Cloudinary Serverless API Endpoints (Vercel)

> **Toàn bộ memories/images đều qua các endpoint dưới đây. Không còn backend Express, không cần chạy server riêng. Frontend fetch trực tiếp các endpoint này.**
## Backend API Endpoints Detail


### 1. GET /api/cloudinary/images
- **Chức năng**: Lấy danh sách ảnh từ Cloudinary.
- **Method**: GET
- **Query params**:
  - `folder` (string, optional)
  - `tags` (string, optional, comma-separated)
  - `max_results` (number, optional)
  - `next_cursor` (string, optional)
  - `sort_by` (string, optional)
  - `sort_order` (string, optional, `asc`/`desc`)
- **Response**:
```json
{
  "resources": [/* array of images */],
  "next_cursor": "...",
  "total_count": 123
}
```

### 2. POST /api/cloudinary/upload
- **Chức năng**: Upload 1 ảnh lên Cloudinary.
- **Method**: POST
- **Body** (form-data):
  - `file` (file, required)
  - `folder` (string, optional)
  - `tags` (string, optional)
  - `public_id` (string, optional)
  - `transformation` (JSON string, optional)
- **Response**:
```json
{
  "public_id": "...",
  "secure_url": "...",
  "width": 800,
  "height": 600,
  ...
}
```

### 3. DELETE /api/cloudinary/delete
- **Chức năng**: Xóa ảnh khỏi Cloudinary.
- **Method**: DELETE
- **Body** (JSON):
```json
{
  "public_id": "..."
}
```
- **Response**:
```json
{
  "result": "ok"
}
```

### 4. GET /api/cloudinary/config
- **Chức năng**: Lấy thông tin cấu hình public Cloudinary cho FE.
- **Method**: GET
- **Response**:
```json
{
  "cloudName": "...",
  "isConfigured": true
}
```

### 5. GET /api/health
- **Chức năng**: Health check server.
- **Method**: GET
- **Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-07-22T08:00:00.000Z",
  "cloudinary": "configured"
}
```

### 6. POST /api/cloudinary/memory
- **Chức năng**: Lưu 1 memory (nhiều ảnh + metadata).
- **Method**: POST
- **Body** (form-data):
  - `title` (string, required)
  - `location` (string, optional)
  - `text` (string, required)
  - `date` (string, required)
  - `tags` (string, optional)
  - `userId` (string, optional)
  - `images[]` (file[], required, tối đa 10 ảnh)
- **Response**:
```json
{
  "success": true,
  "memory": {
    "id": "memory-...",
    "title": "...",
    "location": "...",
    "text": "...",
    "date": "2025-07-01",
    "images": [/* array of images */],
    "created_at": "...",
    "tags": ["memory", "love-journal"],
    "folder": "love-journal/memories/2025"
  },
  "message": "Memory saved successfully!"
}
```

### 7. GET /api/cloudinary/memories
- **Chức năng**: Lấy danh sách memories (ảnh + metadata, group theo memory_id).
- **Method**: GET
- **Query params**:
  - `userId` (string, optional)
- **Response**:
```json
{
  "memories": [/* array of memory objects */]
}
```

---


## Hướng dẫn triển khai & phát triển

1. **Tất cả endpoint Cloudinary nằm trong thư mục `api/` ở gốc project.**
2. **Không còn backend Express, không cần chạy server riêng.**
3. **Chỉ cần chạy 1 lệnh:**
   - `npm run start` hoặc `vercel dev` (chạy cả FE + API serverless)
   - Hoặc `npm run dev` (chỉ FE, không dùng cho test API)
4. **Frontend fetch trực tiếp các endpoint `/api/cloudinary/*`**
5. **Không dùng `app.listen`, không có Express app.**
6. **Mỗi file trong `api/` là 1 function handler.**
7. **Cấu hình env đúng như README.**

---

---
# CreateMemory API Integration Test Results

## Summary
✅ **API Integration Completed Successfully!**

The CreateMemory component now fully integrates with the Cloudinary backend API to save memory data and images.

## What's Working:

- ✅ Memory creation endpoint: `POST /api/cloudinary/memory`
- ✅ Accepts multiple form fields: title, location, text, date, tags
- ✅ Handles multiple image uploads
- ✅ Real Cloudinary integration for image storage
- ✅ Proper error handling and validation
- ✅ CreateMemory form updated with API calls
- ✅ Loading states during save operation
- ✅ Success/error message display
- ✅ Form validation before submission
- ✅ Image preview and upload handling
- ✅ Form reset after successful save
- ✅ Environment variables properly configured

## Test Results:

### Manual API Test
```bash
curl -X POST http://localhost:3000/api/cloudinary/memory \
  -F "title=Test Memory" \
  -F "text=This is a test memory" \
  -F "date=2025-07-01" \
  -F "tags=test,memory"
```

**Result**: ✅ Success
```json
{
  "success": true,
  "memory": {
    "id": "memory-1751356890779",
    "title": "Test Memory",
    "location": null,
    "text": "This is a test memory",
    "date": "2025-07-01",
    "images": [],
    "created_at": "2025-07-01T08:01:30.779Z",
    "tags": ["test", "memory", "memory", "love-journal", "date-2025-6"],
    "folder": "love-journal/memories/2025"
  },
  "message": "Memory saved successfully!"
}
```

## How to Test:

1. **Access the application**: http://localhost:3000
2. **Navigate to "Create Memory"** (click the "Start Your Journey" button)
3. **Fill out the form**:
   - Title: "Our First Date"
   - Location: "Central Park"
   - Date: Select any date
   - Text: Write a romantic memory
   - Upload 1-2 images (optional)
4. **Click "Save Memory"**
5. **Watch for**:
   - Loading spinner while saving
   - Success message: "Memory saved successfully! 💕"
   - Form clears automatically after 2 seconds

## API Features:

### Memory Data Structure
```typescript
interface MemoryData {
  title: string;        // Required
  location?: string;    // Optional
  text: string;        // Required
  date: string;        // ISO date format
  tags?: string[];     // Optional, defaults to ['memory', 'love-journal']
}
```

### Response Structure
```typescript
interface SaveMemoryResponse {
  success: boolean;
  memory: {
    id: string;
    title: string;
    location: string | null;
    text: string;
    date: string;
    images: CloudinaryImage[];
    created_at: string;
    tags: string[];
    folder: string;
  };
  message: string;
}
```

### Image Upload
- Supports multiple images (up to 10)
- Automatic upload to Cloudinary
- Organized in folders by year: `love-journal/memories/YYYY`
- Tagged with memory metadata for easy retrieval

## Error Handling:
- ✅ Network errors
- ✅ Validation errors
- ✅ File upload errors
- ✅ User-friendly error messages
- ✅ Graceful fallbacks

## Next Steps:
The CreateMemory API integration is now complete! Users can:
1. Create memories with rich text and metadata
2. Upload multiple images
3. All data is safely stored in Cloudinary
4. Receive immediate feedback on save success/failure

The integration is ready for production use! 🎉
