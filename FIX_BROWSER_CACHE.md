# 🔧 FIX FIRESTORE INTERNAL_ASSERTION_FAILED ERROR

## ❌ VẤN ĐỀ
Bạn đang thấy error trong console:
```
FIRESTORE (12.8.0) INTERNAL_ASSERTION_FAILED: Unexpected state (ID: 3f4d)
```

## ✅ NGUYÊN NHÂN
- Code ĐÃ ĐƯỢC FIX (không còn enableIndexedDbPersistence trong source)
- Nhưng browser đang cache JavaScript bundle CŨ
- Bundle cũ vẫn có persistence code → gây ra error

## 🎯 GIẢI PHÁP (Làm ĐÚNG THỨ TỰ)

### Bước 1: Xóa Application Storage
1. Mở DevTools (F12)
2. Vào tab **Application**
3. Click **Clear storage** (bên trái)
4. Check ALL boxes:
   - ✅ Local storage
   - ✅ Session storage
   - ✅ IndexedDB
   - ✅ Cookies
   - ✅ Cache storage
5. Click **Clear site data**

### Bước 2: Hard Refresh
- Windows: **Ctrl + Shift + R**
- hoặc **Ctrl + F5**

### Bước 3: Clear Browser Cache (Nếu vẫn lỗi)
1. **Chrome/Edge**: Ctrl + Shift + Delete
2. Chọn:
   - ✅ Cached images and files
   - ✅ Cookies and site data
3. Time range: **All time**
4. Click **Clear data**

### Bước 4: Incognito Mode Test
- **Ctrl + Shift + N** (Chrome/Edge)
- Mở http://localhost:3001
- Login thử → Nếu KHÔNG CÓ ERROR = cache issue confirmed

## 🔍 VERIFY FIX THÀNH CÔNG

Sau khi clear cache, check:

### Console phải CLEAN:
```
✅ Firebase initialized
✅ User logged in
✅ No red errors
✅ No INTERNAL_ASSERTION_FAILED
```

### Network Tab:
- Bundle name phải là: `vendor-firebase-DSX-uO7v.js` (hash mới)
- KHÔNG PHẢI: `vendor-firebase-DSX-uO7v.js` (hash cũ từ screenshot)

### Sources Tab:
1. Click Sources tab
2. Ctrl + Shift + F (Search in all files)
3. Search: `enableIndexedDbPersistence`
4. Result: **0 matches** (nếu vẫn thấy = chưa clear cache đủ)

## 🚀 AUTOMATED SCRIPT

Chạy script này để tự động clear cache và restart:
```powershell
.\clear-cache-and-restart.ps1
```

## ⚠️ NẾU VẪN LỖI SAU KHI LÀM HẾT

Có thể bạn đang xem **production site (Vercel)** chứ không phải localhost:

### Check URL:
- ✅ `http://localhost:3001` = DEV (đã fix)
- ❌ `https://your-app.vercel.app` = PRODUCTION (chưa fix - cần merge to main)

### Nếu đang xem production:
Production chưa có fix vì:
1. Fix chỉ có trong DEV branch
2. Main branch chưa có merge
3. Vercel deploy từ Main branch

**→ Cần confirm với dev trước khi deploy production!**

## 📊 SUMMARY

| Item | Status | Action |
|------|--------|--------|
| Source code | ✅ Fixed | No enableIndexedDbPersistence |
| DEV build | ✅ Fixed | Bundle 356KB (reduced 15%) |
| Browser cache | ❌ Issue | Need manual clear |
| Production | ❌ Not deployed | Pending approval |

## 💡 TẠI SAO LỖI NÀY KHÓ FIX?

1. **Code fix xong nhưng không thấy** = Browser aggressive caching
2. **Dev server restart không đủ** = Browser cache persist
3. **Hard refresh không đủ** = IndexedDB cache riêng
4. **Cần clear FULL storage** = IndexedDB + Cache API + Service Worker

---

**Last Updated**: 2025-12-15
**Fix Version**: DEV branch (commit 7589389)
**Production Version**: Still old (commit ed9f1ed)
