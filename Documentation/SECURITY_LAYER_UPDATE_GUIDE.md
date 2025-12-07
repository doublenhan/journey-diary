# 🔒 Security Layer - Instructions for Draw.io Update

## How to Add Security Layer to Existing Diagram

### Step 1: Open Diagram
1. Go to **https://app.diagrams.net/**
2. Open `ARCHITECTURE_DIAGRAM.drawio.xml`

### Step 2: Add Security Guard Component

**Position**: Left side of Frontend Layer (before all pages)

**Create a Rectangle Shape**:
- **Width**: 160px
- **Height**: 240px
- **Position**: x=20, y=180
- **Fill Color**: #dc2626 (Red)
- **Stroke Color**: #991b1b (Dark Red)
- **Font Color**: #ffffff (White)

**Text Content**:
```
🔒 SECURITY LAYER

Firebase Authentication
• Email/Password
• Phone + OTP
• reCAPTCHA

Session Management
• 24h expiry
• localStorage
• Auto refresh

Protected Routes
• useCurrentUserId()
• Auth state listener
• Redirect to login

Authorization
• Firestore rules
• Ownership check
• User-specific data
```

### Step 3: Add Security Connections

**Add Arrow from Security Layer to Frontend**:
- **Type**: Solid line with arrow
- **Color**: #dc2626 (Red)
- **Width**: 3px
- **Label**: "Auth Check"

**Add Arrow from Security Layer to API Layer**:
- **Type**: Dashed line
- **Color**: #dc2626 (Red)
- **Width**: 2px
- **Label**: "API Secret Protection"

### Step 4: Update Legend

**Add to Legend Box**:
```
Security Layer
├─ Red background (#dc2626)
├─ Protects all routes
└─ Firebase Auth + Rules
```

---

## Alternative: Create Security-Focused Diagram

If you prefer a separate security diagram, here's the complete XML:

