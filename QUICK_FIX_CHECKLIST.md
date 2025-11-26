# Quick Fix Checklist

## What Was Fixed
✓ Removed student login functionality  
✓ Updated landing page (teacher only)  
✓ Updated database schema  
✓ Created new backend routes  
✓ Updated documentation  

## What You Need To Do

### Phase 1: Backend Routes (5 minutes)
Replace old routes with new ones:
```bash
cd backend/src/routes

# Backup old files
mv teacher.ts teacher-old.ts
mv sections.ts sections-old.ts
mv attendance.ts attendance-old.ts

# Copy new files
cp teacher-new.ts teacher.ts
cp sections-new.ts sections.ts
cp attendance-new.ts attendance.ts
```

### Phase 2: Mobile UI Components (1-2 hours)
Create/Update these screens:

**High Priority:**
- [ ] `app/teacher/register.tsx` - CREATE (teacher registration)
- [ ] `app/teacher/login.tsx` - UPDATE (add QR scanner)
- [ ] `app/teacher/dashboard.tsx` - UPDATE (add section management)
- [ ] `app/teacher/scanner.tsx` - UPDATE (update attendance flow)

**Medium Priority:**
- [ ] `app/teacher/sections/` - CREATE (section management UI)
- [ ] `app/teacher/attendance/` - UPDATE (history display)
- [ ] `store/authStore.ts` - UPDATE (add teacher fields)

**Low Priority:**
- [ ] `app/student/` - DELETE (not needed)

### Phase 3: Testing (30 minutes)
- [ ] Start backend: `cd backend && npm run dev`
- [ ] Test registration: POST `/api/teacher/register`
- [ ] Test login: POST `/api/teacher/login`
- [ ] Test sections: CRUD operations
- [ ] Test scanning: POST `/api/attendance/scan`
- [ ] Start mobile app: `npm start`
- [ ] Test flow end-to-end

---

## Quick Reference

### API Endpoints (New)

**Teacher:**
```
POST   /api/teacher/register       - Register new teacher
POST   /api/teacher/login          - Login (QR + password)
GET    /api/teacher/profile        - Get teacher info
GET    /api/teacher/dashboard      - Get stats & logs
POST   /api/teacher/logout         - Logout
```

**Sections:**
```
GET    /api/sections               - List teacher's sections
POST   /api/sections               - Create section
PUT    /api/sections/:id           - Update section
DELETE /api/sections/:id           - Delete section
```

**Attendance:**
```
POST   /api/attendance/scan        - Scan student QR
GET    /api/attendance/section/:id - Get history
GET    /api/attendance/today       - Today's records
GET    /api/attendance/stats/today - Statistics
POST   /api/attendance/manual      - Manual entry
DELETE /api/attendance/:id         - Delete record
```

### QR Code Formats

**Teacher:** `TCHR|{TCHR_ID}|{TEACHER_NAME}`
```
TCHR|TCHR001|Demo Teacher
TCHR|TCHR002|John Smith
```

**Student:** `{STUDENT_NAME}|{STUDENT_ID}|{COURSE}`
```
John Doe|20203300001|BSIT
Jane Smith|20203300002|BSCS
```

### Attendance Flow

```
Teacher Login
    ↓
Create/Select Section
    ↓
Scan Student QR (First)
    ↓
Time In Recorded
    ↓
Wait 60 Seconds (cooldown)
    ↓
Scan Same QR Again
    ↓
Time Out Recorded
    ↓
Student Attendance Complete
```

### Default Credentials

**Login:**
- Username: `demoteacher`
- Password: `teacher123`
- QR: `TCHR|TCHR001|Demo Teacher`

**Register:**
- Click "Create Account"
- Enter: username, name, password

### Database Schema

**Teachers:**
```
id, username (unique), email, fullName, passwordHash, 
qrCodeData, lastLoginAt, createdAt, updatedAt
```

**Sections:**
```
id, teacherId (FK), name, description, createdAt, updatedAt
```

**Attendance:**
```
id, sectionId (FK), studentId, studentName, course,
timeIn, timeOut, createdAt, updatedAt
```

---

## Important Points

1. **2FA is Required:** Both QR code AND password must match
2. **1-Minute Cooldown:** Server enforces (not client)
3. **Section Selection:** Required before scanning
4. **Section Isolation:** Attendance only recorded for selected section
5. **Password Protected:** Manual entry and deletion require password
6. **Auto Logout:** Student can logout after 60 seconds

---

## Testing Data

### Create Student QR Codes
Use: https://www.qr-code-generator.com/

Paste this text:
```
John Doe|20203300001|BSIT
```

Generate QR code and test scanning.

---

## Files to Review

**Before Starting:**
- [x] FIX_SUMMARY.md - Overview of changes
- [ ] CORRECT_FLOW.md - Business logic
- [ ] IMPLEMENTATION_GUIDE.md - Step-by-step guide

**Key Implementation Files:**
- `backend/src/routes/teacher-new.ts` - Authentication
- `backend/src/routes/sections-new.ts` - Section management
- `backend/src/routes/attendance-new.ts` - Scanning logic
- `backend/src/database.ts` - Database schema

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Backend won't start | Check port 3000, npm install |
| API 404 error | Verify route file was replaced |
| Login fails | Check QR format and password |
| Scans not working | Select section first |
| Cooldown not working | Server must be running |
| QR won't scan | Use correct format, check camera |

---

## Success Checklist

After completing the fix:
- [ ] Landing page shows "Teacher Login" and "Create Account"
- [ ] Can register new teacher account
- [ ] Can login with QR + password
- [ ] Dashboard shows teacher name and sections
- [ ] Can create/edit/delete sections
- [ ] Can scan student QR codes
- [ ] First scan shows "Time In"
- [ ] Cooldown prevents immediate re-scan
- [ ] Second scan (after 60s) shows "Time Out"
- [ ] Attendance history displays correctly
- [ ] No student functionality visible
- [ ] All console errors resolved

---

## Timeline Estimate

| Task | Time | Status |
|------|------|--------|
| Backend routes | 5 min | ⏳ |
| Mobile screens | 1-2 hrs | ⏳ |
| Backend testing | 15 min | ⏳ |
| Mobile testing | 15 min | ⏳ |
| **Total** | **2-3 hrs** | ⏳ |

---

## Next Actions

1. **Right Now:** Read this checklist (done ✓)
2. **Next:** Review CORRECT_FLOW.md (10 min)
3. **Then:** Follow IMPLEMENTATION_GUIDE.md (1-2 hrs)
4. **Finally:** Test and fix any issues (30 min)

---

For detailed instructions, see: **IMPLEMENTATION_GUIDE.md**
