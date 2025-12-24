# Love Journal - Release 3.0 Documentation

**Version**: 3.0  
**Release Date**: December 24, 2025  
**Status**: ✅ Production Ready

---

## 📖 Quick Navigation

### 🚀 Start Here
1. **[RELEASE_3.0.md](RELEASE_3.0.md)** - Complete release notes, features, breaking changes
2. **[CRITICAL_NOTES.md](CRITICAL_NOTES.md)** - ⚠️ Must-read before deployment

### 🏗️ Technical Reference
3. **[TECHNICAL_SECURITY_ARCHITECTURE.md](TECHNICAL_SECURITY_ARCHITECTURE.md)** - Architecture diagrams, security flows

### 📋 For Deployment
- Read: [CRITICAL_NOTES.md](CRITICAL_NOTES.md) - Security checklist
- Follow: Deployment guide trong [RELEASE_3.0.md](RELEASE_3.0.md#-deployment-guide)
- Verify: Pre-production checklist trong [CRITICAL_NOTES.md](CRITICAL_NOTES.md#-pre-production-checklist)

---

## 🎯 Release 3.0 Highlights

### What's New
- ✅ **System Admin Dashboard** với real-time monitoring
- ✅ **Role-Based Access Control** (SysAdmin/Admin/User)
- ✅ **Cloud Functions Integration** cho image deletion và stats
- ✅ **Actual Function Call Tracking** thay vì estimates
- ✅ **Enhanced Security** với server-side validation

### Breaking Changes
- ⚠️ Cloudinary API credentials changed
- ⚠️ Delete flow: Cloudinary → Firestore (not async)
- ⚠️ Stats calculation requires `function_calls` document
- ⚠️ Admin authentication server-side validation

---

## 📊 Key Metrics

### Production Status
- **Database**: 10.25 MB / 1 GB (1.0%)
- **Storage**: 25,592 MB / 25,600 MB (99.97%) ⚠️
- **Function Calls**: 240 / 125,000 monthly (0.19%)
- **Users**: 2 total

### Performance
- **Bundle Size**: ~400KB (gzipped)
- **Cloud Functions**: 200-500ms (warm)
- **Delete Operation**: ~500ms
- **Stats Calculation**: ~1-2s

---

## 🔐 Security

### Authentication Flow
```
User → Firebase Auth → ID Token → Cloud Function
     → verifyIdToken → Check Role → Execute
```

### Role Hierarchy
- **SysAdmin**: Full system access
- **Admin**: User management only
- **User**: Own data only

### Protected Endpoints
- `/updateStorageStats` - SysAdmin only
- `/deleteCloudinaryImage` - Authenticated users only

---

## 🛠️ Development

### Local Setup
```bash
# Frontend
npm install
npm run dev

# Functions
cd functions
npm install
npm run build
firebase emulators:start
```

### Deploy
```bash
# Functions only
firebase deploy --only functions

# Full deploy
npm run build
firebase deploy
```

### Testing
```bash
# Create memory → Verify stats tracking
# Delete memory → Verify Cloudinary delete first
# Admin panel → Verify role checks
```

---

## 📁 File Structure

```
Documentation/V3_Current/
├── README.md                              # This file
├── RELEASE_3.0.md                         # Complete release notes
├── CRITICAL_NOTES.md                      # Important notes & checklist
└── TECHNICAL_SECURITY_ARCHITECTURE.md     # Architecture diagrams
```

---

## 🆘 Troubleshooting

### Common Issues

**403 Forbidden on stats:**
- Check user role in Firestore
- Verify collection name (dev_users vs users)
- Check function logs: `firebase functions:log`

**Cloudinary delete fails:**
- Verify API credentials in .env
- Check publicId extraction from URL
- Test credentials manually

**Stats not updating:**
- Trigger manual calculation
- Check `system_stats/function_calls` exists
- Create a memory to initialize tracking

---

## 📞 Support

**Issues**: Check [CRITICAL_NOTES.md](CRITICAL_NOTES.md#-troubleshooting-guide)  
**Contact**: [Project Owner]  
**Logs**: `firebase functions:log --only updateStorageStats`

---

## 📚 Related Documentation

- [General Documentation](../General/) - Setup guides, features
- [V2 Documentation](../V2_Current/) - Previous release notes
- [V1 Documentation](../V1_Initial/) - Original requirements

---

**Last Updated**: December 24, 2025  
**Verified**: Production deployment successful ✅
