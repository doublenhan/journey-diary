# Cloudinary Folder Structure Migration Guide

## 🎯 Mục đích
Migrate từ cấu trúc cũ: `love-journal/memories/{year}/`
Sang cấu trúc mới: `love-journal/users/{userId}/{year}/{month}/memories/`

## 🚀 Chạy migration trên Vercel

### **Bước 1: Pull environment variables từ Vercel**

Cho **Production**:
```bash
vercel env pull .env.vercel.production --environment production
```

Cho **Preview/Dev**:
```bash
vercel env pull .env.vercel.preview --environment preview
```

### **Bước 2: Load env và chạy migration**

**Migration cho Production:**
```bash
# Load production env vars
$prodEnv = Get-Content .env.vercel.production | ForEach-Object { 
  if ($_ -match '^([^=]+)=(.*)$') { 
    [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2])
  }
}

# Run migration
node scripts/migrateToUserFolderStructure.cjs
```

**Migration cho Preview/Dev:**
```bash
# Load preview env vars
$previewEnv = Get-Content .env.vercel.preview | ForEach-Object { 
  if ($_ -match '^([^=]+)=(.*)$') { 
    [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2])
  }
}

# Run migration
node scripts/migrateToUserFolderStructure.cjs
```

### **Bước 3: Verify migration**

Script sẽ output:
- Số lượng images tìm thấy
- Images theo userId
- Images không có userId (→ anonymous folder)
- Success/Error count

## 📋 Checklist

- [ ] Pull env vars từ Vercel
- [ ] Backup data (optional: export list trước khi migrate)
- [ ] Run migration cho Preview environment trước
- [ ] Verify data trên Preview
- [ ] Run migration cho Production
- [ ] Test app sau migration
- [ ] Clean up env files (.env.vercel.*)

## ⚠️ Lưu ý

1. Script **KHÔNG XÓA** files cũ, chỉ **MOVE/RENAME**
2. Nếu file đã tồn tại ở destination → Skip (overwrite: false)
3. Images không có userId → Move vào folder `anonymous`
4. Có rate limit delay 100ms giữa mỗi operation

## 🔄 Rollback

Nếu cần rollback, script tương tự nhưng đảo ngược:
- From: `users/{userId}/{year}/{month}/memories/`
- To: `love-journal/memories/{year}/`

## 📞 Support

Nếu gặp lỗi, check:
- Cloudinary credentials có đúng không
- Network connection
- API rate limits
