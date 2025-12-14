# Delete Specific Teacher Account

## Quick Method 1: Using UI Screen (Easiest)

Navigate to: `/debug/clear-data`

This screen shows:
- ✅ List of all teachers with their details
- ✅ Delete button next to each teacher
- ✅ Text input to delete by email address
- Confirmation dialog before deleting

**Steps:**
1. Open `/debug/clear-data`
2. Scroll to "Delete Specific Teacher" section
3. Either:
   - Type the email (e.g., `aclo@gmail.com`) and tap "Delete by Email"
   - OR tap "Delete" button next to the teacher in the list
4. Confirm the deletion

---

## Method 2: Programmatically from Code

```typescript
import { offlineApi } from '@/hooks/useOfflineApi';

// Delete by email
const result = await offlineApi.deleteTeacherByEmail('aclo@gmail.com');
console.log(result.message);  // "Teacher aclo@gmail.com deleted successfully"

// Delete by ID
const result = await offlineApi.deleteTeacherById('2023300076');
console.log(result.message);  // "Teacher aclo@gmail.com deleted successfully"
```

**Response:**
```typescript
{
  success: true,
  message: "Teacher aclo@gmail.com deleted successfully",
  deletedCount: 1,      // number of teachers deleted
  deletedEmail: string  // email of deleted teacher
}
```

---

## Method 3: Console Command

In browser console or React Native debugger:

```javascript
// Delete by email
offlineApi.deleteTeacherByEmail('aclo@gmail.com')

// Delete by ID
offlineApi.deleteTeacherById('2023300076')

// List all teachers first
offlineApi.listAllTeachers()
```

---

## Available Methods

### Delete by Email
```typescript
async deleteTeacherByEmail(email: string)
```
- **Parameter**: Teacher email (e.g., "aclo@gmail.com")
- **Returns**: `{ success, message, deletedCount }`

### Delete by ID  
```typescript
async deleteTeacherById(id: string)
```
- **Parameter**: Teacher ID (e.g., "2023300076")
- **Returns**: `{ success, message, deletedEmail }`

### List All Teachers
```typescript
async listAllTeachers()
```
- **Returns**: `{ success, count, teachers: [] }`
- **Teachers array contains**: `{ id, email, fullName, isVerified }`

---

## Example: Delete aclo@gmail.com

### Using UI:
1. Go to `/debug/clear-data`
2. Under "Delete Specific Teacher"
3. Type: `aclo@gmail.com`
4. Tap "Delete by Email"
5. Confirm deletion

### Using Code:
```typescript
const result = await offlineApi.deleteTeacherByEmail('aclo@gmail.com');
if (result.success) {
  console.log('Teacher deleted');
  // Refresh UI or navigate
}
```

---

## What Happens After Deletion?

✅ Teacher account is removed from database
✅ All associated subjects and sections remain (they reference deleted teacher)
✅ Attendance records remain (they reference deleted teacher)
❌ Cannot login with deleted email anymore
❌ Cannot change password (teacher not found)

**Note**: If you want to keep the data but create a new teacher account with similar structure, you should export the data before deleting.

---

## Undo/Recovery

⚠️ **There is NO undo for deleted data**

Recovery options:
1. **Reset Database**: Use `resetDatabase()` to wipe and recreate with demo teacher
2. **Clear All**: Use `clearAllData()` to wipe everything, then create new teachers
3. **Restore from Backup**: If you have exported the database earlier

---

## Common Examples

### Delete and show confirmation
```typescript
const result = await offlineApi.deleteTeacherByEmail('aclo@gmail.com');
Alert.alert(
  result.success ? 'Success' : 'Error',
  result.message
);
```

### Delete with validation
```typescript
const teachers = await offlineApi.listAllTeachers();
const exists = teachers.teachers.some(t => t.email === 'aclo@gmail.com');

if (exists) {
  await offlineApi.deleteTeacherByEmail('aclo@gmail.com');
} else {
  Alert.alert('Not Found', 'Teacher does not exist');
}
```

### Get teacher info before deleting
```typescript
const list = await offlineApi.listAllTeachers();
const teacher = list.teachers.find(t => t.email === 'aclo@gmail.com');

if (teacher) {
  console.log(`Deleting: ${teacher.fullName} (${teacher.id})`);
  await offlineApi.deleteTeacherById(teacher.id);
}
```
