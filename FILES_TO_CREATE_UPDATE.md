# Files to Create/Update - Complete List

## Status Legend
- ✓ = Already done
- ⏳ = Needs to be done
- ⚠️ = Delete/Remove

---

## Backend Files

### Database
- ✓ `backend/src/database.ts` - Updated schema
  - Teachers table: added username, email, qrCodeData
  - Sections table: added teacherId, changed structure
  - Attendance table: changed to sectionId-based
  - Removed students table

### Routes (API)
- ✓ `backend/src/routes/teacher-new.ts` - CREATED
  - POST `/api/teacher/register` - New teacher registration
  - POST `/api/teacher/login` - Login with 2FA (QR + password)
  - GET `/api/teacher/profile` - Get teacher info
  - GET `/api/teacher/dashboard` - Get dashboard stats
  - POST `/api/teacher/logout` - Logout

- ⏳ `backend/src/routes/teacher.ts` - NEEDS REPLACEMENT
  - Replace with teacher-new.ts content
  - Command: `cp teacher-new.ts teacher.ts`

- ✓ `backend/src/routes/sections-new.ts` - CREATED
  - GET `/api/sections` - List sections for teacher
  - POST `/api/sections` - Create section
  - PUT `/api/sections/:id` - Update section
  - DELETE `/api/sections/:id` - Delete section

- ⏳ `backend/src/routes/sections.ts` - NEEDS REPLACEMENT
  - Replace with sections-new.ts content
  - Command: `cp sections-new.ts sections.ts`

- ✓ `backend/src/routes/attendance-new.ts` - CREATED
  - POST `/api/attendance/scan` - Scan student (time in/out with 60s cooldown)
  - GET `/api/attendance/section/:id` - Get section history
  - GET `/api/attendance/today` - Get today's records
  - GET `/api/attendance/stats/today` - Get statistics
  - POST `/api/attendance/manual` - Manual entry (password protected)
  - DELETE `/api/attendance/:id` - Delete record (password protected)

- ⏳ `backend/src/routes/attendance.ts` - NEEDS REPLACEMENT
  - Replace with attendance-new.ts content
  - Command: `cp attendance-new.ts attendance.ts`

### Other Backend Files
- ✓ `backend/src/index.ts` - Already correct
- ✓ `backend/src/middleware/auth.ts` - Already correct
- ✓ `backend/.env` - No changes needed

---

## Mobile App Files

### Landing Page
- ✓ `app/index.tsx` - UPDATED
  - Removed "Student Login" button
  - Changed to "Teacher Login" and "Create Account"
  - Updated subtitle to "Teacher System"

### Teacher Authentication
- ⏳ `app/teacher/register.tsx` - NEEDS CREATION
  **Required Components:**
  - Text input: username
  - Text input: full name
  - Text input: password
  - Text input: confirm password
  - Button: Register
  - Display: Generated QR code
  - Calls: POST `/api/teacher/register`
  - On Success: Save token, show QR, redirect to dashboard

  **Example UI Structure:**
  ```tsx
  - SafeAreaView container
  - Form with 4 inputs
  - Button (disabled while loading)
  - QR code display (after registration)
  - Error message display
  ```

- ⏳ `app/teacher/login.tsx` - NEEDS UPDATE
  **Required Components:**
  - QR Scanner (using expo-camera or similar)
  - Text input: password
  - Button: Login
  - Display: Scanned QR data
  - Calls: POST `/api/teacher/login` with qrCodeData + password
  - On Success: Save token, redirect to dashboard

  **Key Logic:**
  - Parse QR: "TCHR|{TEACHER_ID}|{TEACHER_NAME}"
  - Validate password
  - Store JWT token securely
  - Redirect to /teacher/dashboard

### Dashboard
- ⏳ `app/teacher/dashboard.tsx` - NEEDS UPDATE
  **Required Components:**
  - Welcome message (teacher name)
  - Statistics display:
    - Total students present
    - Currently checked in
    - Already checked out
    - Active sections
  - Sections list (scrollable):
    - Section name
    - [Select] [Edit] [Delete] buttons
  - Buttons:
    - [+ Add Section]
    - [View History]
    - [Logout]

  **Key Logic:**
  - GET `/api/teacher/profile` - Get teacher name
  - GET `/api/sections` - List sections
  - GET `/api/attendance/stats/today` - Get statistics
  - Section selection navigation
  - Logout clears token and redirects to landing

### Scanner/Attendance
- ⏳ `app/teacher/scanner.tsx` - NEEDS UPDATE
  **Required Components:**
  - Section selector (dropdown/picker):
    - List of teacher's sections
    - Required before scanning
  - QR Scanner:
    - Real-time camera view
    - Auto-detect QR codes
  - Scan result display:
    - Student name
    - Status (IN / OUT / COOLDOWN)
    - Time display
    - Countdown timer (for cooldown)
  - Recent scans log:
    - Student name
    - Time
    - Status
    - Scrollable list

  **Key Logic:**
  - Prevent scanning without section selected
  - Parse student QR: "{STUDENT_NAME}|{STUDENT_ID}|{COURSE}"
  - Call POST `/api/attendance/scan`
  - Handle responses:
    - IN: Show "Time In recorded", show next action after 60s
    - COOLDOWN: Show remaining seconds countdown
    - OUT: Show "Time Out recorded" with duration
    - COMPLETED: Show error "Already complete"
  - Real-time log updates

### Section Management
- ⏳ `app/teacher/sections/` - NEEDS UPDATE/CREATE
  
  **Files needed:**
  - `app/teacher/sections/index.tsx` or integrated in dashboard
  
  **Required Components (Modal/Screen):**
  - Section list with edit/delete buttons
  - Add section form:
    - Text input: section name
    - Text input: description (optional)
    - Button: Create
  - Edit section form:
    - Text input: section name
    - Text input: description
    - Button: Update
  - Delete confirmation dialog

  **Key Logic:**
  - GET `/api/sections` - List sections
  - POST `/api/sections` - Create
  - PUT `/api/sections/:id` - Update
  - DELETE `/api/sections/:id` - Delete
  - Handle errors (duplicate names, etc.)

### Attendance History
- ⏳ `app/teacher/attendance/` - NEEDS UPDATE/CREATE
  
  **Files needed:**
  - `app/teacher/attendance/index.tsx` or similar
  
  **Required Components:**
  - Section selector (dropdown)
  - Date selector (date picker)
  - Filter button
  - Results table:
    - Student name
    - Student ID
    - Course
    - Time In
    - Time Out
    - Duration
    - Status (IN / OUT)
  - Scrollable list

  **Key Logic:**
  - GET `/api/attendance/section/:id` with date query
  - Format times: HH:MM:SS
  - Calculate duration: (timeOut - timeIn) / 1000 seconds
  - Display "IN" if no timeOut, "OUT" if both exist

### State Management
- ⏳ `store/authStore.ts` - NEEDS UPDATE
  **Required fields:**
  - token: string (JWT)
  - teacherId: string
  - username: string
  - fullName: string
  - email: string (optional)
  - qrCodeData: string (generated)
  - lastLogin: timestamp
  
  **Required methods:**
  - setToken()
  - setTeacherInfo()
  - logout()
  - getToken()
  - isAuthenticated()

### API Client
- ✓ `hooks/useApi.ts` - Already exists
  **Verify:**
  - API_BASE_URL points to `http://localhost:3000/api`
  - For Android emulator: `http://10.0.2.2:3000/api`
  - For physical device: update to your PC IP

---

## Files to Delete/Remove

- ⚠️ `app/student/` - Entire folder (not needed)
  - `app/student/scan.tsx` - Remove
  - `app/student/login.tsx` - Remove (if exists)
  - Any other student files

---

## Documentation Files

- ✓ `CORRECT_FLOW.md` - CREATED
  - Complete business logic overview
  - Database schema explanation
  - API endpoints list
  - Implementation steps

- ✓ `IMPLEMENTATION_GUIDE.md` - CREATED
  - Step-by-step implementation instructions
  - File replacement guide
  - Screen creation guide
  - API examples
  - Testing checklist

- ✓ `FIX_SUMMARY.md` - CREATED
  - Overview of all changes
  - What was fixed
  - What needs to be done
  - Default credentials
  - File status

- ✓ `QUICK_FIX_CHECKLIST.md` - CREATED
  - Quick reference checklist
  - API endpoints
  - QR code formats
  - Database schema
  - Timeline estimate

- ✓ `FLOW_DIAGRAM.md` - CREATED
  - Visual diagrams of all flows
  - State machines
  - Request/response flows

- ✓ `START_HERE.md` - UPDATED
  - Updated title and description
  - Updated quick start steps
  - Updated features
  - Updated credentials
  - Updated workflow

- ✓ `FILES_TO_CREATE_UPDATE.md` - THIS FILE
  - Complete list of all files
  - What to create/update/delete
  - Detailed specifications

---

## Priority Order

### Phase 1: Backend (Required before mobile testing)
1. ✓ Replace `backend/src/routes/teacher.ts`
2. ✓ Replace `backend/src/routes/sections.ts`
3. ✓ Replace `backend/src/routes/attendance.ts`
4. ✓ Verify database.ts is updated
5. Test backend with Postman

### Phase 2: Mobile Core (Essential screens)
1. ✓ Create `app/teacher/register.tsx`
2. ✓ Update `app/teacher/login.tsx`
3. ✓ Update `app/teacher/dashboard.tsx`
4. ✓ Update `app/teacher/scanner.tsx`
5. ✓ Update `store/authStore.ts`

### Phase 3: Mobile Secondary (Supporting screens)
1. ✓ Create/Update `app/teacher/sections/`
2. ✓ Create/Update `app/teacher/attendance/`
3. ✓ Remove `app/student/` folder

### Phase 4: Testing & Polish
1. Test backend endpoints
2. Test mobile flows
3. Fix any issues
4. Polish UI/UX

---

## File Sizes Reference

**Backend Files:**
- teacher-new.ts: ~5KB
- sections-new.ts: ~4KB
- attendance-new.ts: ~6KB

**Mobile Files:**
- register.tsx: ~3KB
- login.tsx: ~4KB
- dashboard.tsx: ~5KB
- scanner.tsx: ~7KB
- sections/: ~4KB
- attendance/: ~5KB

**Total to create/update: ~43KB**

---

## Testing Checklist

After creating all files:

- [ ] Backend starts without errors
- [ ] Database tables created
- [ ] Teacher registration works
- [ ] Teacher login works
- [ ] Section CRUD operations work
- [ ] Student QR scanning works
- [ ] 60-second cooldown enforced
- [ ] Mobile app starts
- [ ] Landing page shows correct buttons
- [ ] Can register new teacher
- [ ] Can login as teacher
- [ ] Can create section
- [ ] Can select section
- [ ] Can scan student QR
- [ ] Can view history
- [ ] Can logout
- [ ] No student functionality visible

---

## Common Mistakes to Avoid

1. ❌ Don't forget to replace old route files
2. ❌ Don't hardcode API URLs
3. ❌ Don't store passwords in plain text
4. ❌ Don't skip JWT token storage
5. ❌ Don't forget section validation
6. ❌ Don't remove student folder until ready
7. ❌ Don't test mobile without backend running
8. ❌ Don't mix old and new code

---

## Quick Copy Commands

```bash
# Navigate to backend routes
cd qr-attendance-v2/backend/src/routes

# Backup originals
mv teacher.ts teacher-old.ts
mv sections.ts sections-old.ts
mv attendance.ts attendance-old.ts

# Use new files
cp teacher-new.ts teacher.ts
cp sections-new.ts sections.ts
cp attendance-new.ts attendance.ts

# Verify
ls -la *.ts
```

---

## Support

For detailed explanations, see:
- **CORRECT_FLOW.md** - Business logic
- **IMPLEMENTATION_GUIDE.md** - Step-by-step guide
- **FLOW_DIAGRAM.md** - Visual reference
- **START_HERE.md** - Quick start

