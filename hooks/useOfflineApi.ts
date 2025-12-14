import AsyncStorage from '@react-native-async-storage/async-storage';

// Generate simple unique ID (replaces uuid)
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Simple hash function for passwords
function hashPassword(password: string): string {
  const salt = 'qr_attendance_salt';
  return btoa(password + salt);
}

// Verify password against hash
function verifyPassword(password: string, hash: string): boolean {
  const computed = hashPassword(password);
  return computed === hash;
}

interface Teacher {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  qrCodeData: string;
  isVerified: number;
  createdAt: string;
}

interface Subject {
  id: string;
  teacherId: string;
  name: string;
  description?: string;
  createdAt: string;
}

interface Section {
  id: string;
  subjectId: string;
  teacherId: string;
  name: string;
  description?: string;
  createdAt: string;
}

interface Attendance {
  id: string;
  teacherId: string;       // ✅ NEW: Track which teacher owns this record
  sectionId: string;
  studentId: string;
  studentName: string;
  course: string;
  timeIn: string;
  timeOut?: string;
  createdAt: string;
}

class OfflineAPI {
  async initDatabase() {
    try {
      // Check if database already exists
      const existing = await AsyncStorage.getItem('teachers');
      if (!existing) {
        // Initialize with demo teacher (already verified)
        const teachers: Teacher[] = [
          {
            id: '2023300001',
            email: 'teacher@demo.com',
            fullName: 'Demo Teacher',
            passwordHash: hashPassword('teacher123'),
            qrCodeData: 'Demo Teacher 2023300001 TEACHER',
            isVerified: 1,
            createdAt: new Date().toISOString(),
          },
        ];
        await AsyncStorage.setItem('teachers', JSON.stringify(teachers));
        await AsyncStorage.setItem('subjects', JSON.stringify([]));
        await AsyncStorage.setItem('sections', JSON.stringify([]));
        await AsyncStorage.setItem('attendance', JSON.stringify([]));
        console.log('✅ Offline database initialized with demo data');
      }
    } catch (err) {
      console.error('❌ Failed to initialize database:', err);
    }
  }

  // Helper to get all teachers
  private async getTeachers(): Promise<Teacher[]> {
    const data = await AsyncStorage.getItem('teachers');
    return data ? JSON.parse(data) : [];
  }

  // Helper to save teachers
  private async saveTeachers(teachers: Teacher[]) {
    await AsyncStorage.setItem('teachers', JSON.stringify(teachers));
  }

  // Helper to get all subjects
  private async getSubjectsData(): Promise<Subject[]> {
    const data = await AsyncStorage.getItem('subjects');
    return data ? JSON.parse(data) : [];
  }

  // Helper to save subjects
  private async saveSubjects(subjects: Subject[]) {
    await AsyncStorage.setItem('subjects', JSON.stringify(subjects));
  }

  // Helper to get all sections
  private async getSectionsData(): Promise<Section[]> {
    const data = await AsyncStorage.getItem('sections');
    return data ? JSON.parse(data) : [];
  }

  // Helper to save sections
  private async saveSections(sections: Section[]) {
    await AsyncStorage.setItem('sections', JSON.stringify(sections));
  }

  // Helper to get all attendance
  private async getAttendanceData(): Promise<Attendance[]> {
    const data = await AsyncStorage.getItem('attendance');
    return data ? JSON.parse(data) : [];
  }

  // Helper to save attendance
  private async saveAttendance(attendance: Attendance[]) {
    await AsyncStorage.setItem('attendance', JSON.stringify(attendance));
  }

  // REGISTRATION - Step 1: Create temp account
  async register(email: string, fullName: string, password: string) {
    try {
      const teachers = await this.getTeachers();

      // Check if email exists
      if (teachers.some((t) => t.email === email)) {
        return {
          success: false,
          message: 'Email already registered',
        };
      }

      // Create temporary teacher (not verified yet)
      const tempTeacherId = 'TEMP_' + generateId().replace(/-/g, '').substring(0, 10);

      const newTeacher: Teacher = {
        id: tempTeacherId,
        email,
        fullName,
        passwordHash: hashPassword(password),
        qrCodeData: '', // Empty until QR is verified
        isVerified: 0,  // Not verified yet
        createdAt: new Date().toISOString(),
      };

      teachers.push(newTeacher);
      await this.saveTeachers(teachers);

      console.log('📝 Temporary account created, waiting for QR verification');
      return {
        success: true,
        message: 'Please scan your QR code to complete registration',
        tempToken: 'offline_temp_' + tempTeacherId,
        tempTeacherId,
      };
    } catch (err) {
      console.error('Registration error:', err);
      return { success: false, message: 'Registration error' };
    }
  }

  // REGISTRATION - Step 2: Verify QR code and finalize account
  async registerVerifyQR(tempToken: string, qrCodeData: string) {
    try {
      const teachers = await this.getTeachers();
      
      // Parse QR code: NAME ID PROGRAM
      const parseQR = (qr: string) => {
        const parts = qr.trim().split(/\s+/).filter(p => p.length > 0);
        if (parts.length < 3) return null;
        
        return {
          name: parts.slice(0, parts.length - 2).join(' '),
          id: parts[parts.length - 2],
          program: parts[parts.length - 1],
        };
      };

      const scannedParsed = parseQR(qrCodeData);
      if (!scannedParsed) {
        return {
          success: false,
          message: 'Invalid QR code format. Expected: NAME ID PROGRAM',
        };
      }

      // Find temporary teacher by tempToken
      const tempTeacherId = tempToken.replace('offline_temp_', '');
      const tempTeacher = teachers.find(t => t.id === tempTeacherId);

      if (!tempTeacher || tempTeacher.isVerified === 1) {
        return {
          success: false,
          message: 'Registration session not found',
        };
      }

      // Verify scanned name matches registered name (case-insensitive)
      if (scannedParsed.name.toLowerCase() !== tempTeacher.fullName.toLowerCase()) {
        return {
          success: false,
          message: 'QR code name does not match your registered name. Please scan the correct QR code.',
        };
      }

      console.log('📋 QR verified - Finalizing account');

      // Update teacher with real ID from QR and mark as verified
      const idx = teachers.indexOf(tempTeacher);
      teachers[idx] = {
        ...tempTeacher,
        id: scannedParsed.id,
        qrCodeData,
        isVerified: 1,
      };

      await this.saveTeachers(teachers);

      return {
        success: true,
        message: 'Account created and verified successfully',
        token: 'offline_token_' + scannedParsed.id,
        teacherId: scannedParsed.id,
        fullName: tempTeacher.fullName,
        email: tempTeacher.email,
        qrCodeData,
      };
    } catch (err) {
      console.error('Registration QR verification error:', err);
      return { success: false, message: 'Verification failed' };
    }
  }

  // LOGIN STEP 1
  async loginStep1(email: string, password: string) {
    try {
      const teachers = await this.getTeachers();
      const teacher = teachers.find((t) => t.email === email);

      if (!teacher) {
        return {
          success: false,
          message: 'Email or password incorrect',
        };
      }

      console.log('🔍 Login attempt for email:', email);
      console.log('   Teacher found:', !!teacher);
      console.log('   Teacher ID:', teacher?.id);
      console.log('   Stored hash length:', teacher?.passwordHash?.length);
      
      const isMatch = verifyPassword(password, teacher.passwordHash);

      console.log('   Password match result:', isMatch);

      if (!isMatch) {
        return {
          success: false,
          message: 'Email or password incorrect',
        };
      }
      return {
        success: true,
        tempToken: 'offline_temp_' + teacher.id,
      };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, message: 'Login error' };
    }
  }

  // LOGIN STEP 2 - Enhanced with detailed QR validation
  async loginStep2(tempToken: string, qrCodeData: string, loginEmail?: string) {
    try {
      // Parse QR code: NAME ID PROGRAM
      const parseQR = (qr: string) => {
        const parts = qr.trim().split(/\s+/).filter(p => p.length > 0);
        if (parts.length < 3) return null;
        
        return {
          name: parts.slice(0, parts.length - 2).join(' '),
          id: parts[parts.length - 2],
          program: parts[parts.length - 1],
        };
      };

      const scannedParsed = parseQR(qrCodeData);
      if (!scannedParsed) {
        return {
          success: false,
          message: 'Invalid QR code format. Expected: NAME ID PROGRAM',
        };
      }

      const teachers = await this.getTeachers();
      
      // Find teacher by email from temp token
      const tempTeacherId = tempToken.replace('offline_temp_', '');
      const teacher = teachers.find(t => t.id === tempTeacherId);

      if (!teacher || teacher.isVerified === 0) {
        return {
          success: false,
          message: 'Teacher account not found or not verified',
        };
      }

      // Parse stored QR code
      const storedParsed = parseQR(teacher.qrCodeData);
      if (!storedParsed) {
        return {
          success: false,
          message: 'Teacher QR code is invalid. Please contact administrator.',
        };
      }

      console.log('📋 Scanned QR:', scannedParsed);
      console.log('📋 Stored QR:', storedParsed);

      // Check if teacher ID matches
      if (scannedParsed.id !== storedParsed.id) {
        return {
          success: false,
          message: `❌ QR Code Mismatch\n\nScanned QR does not match your account.\n\nYour QR ID: ${storedParsed.id}\nScanned QR ID: ${scannedParsed.id}\n\nPlease scan your correct teacher QR code.`,
        };
      }

      // Check if name matches (case-insensitive)
      if (scannedParsed.name.toLowerCase() !== storedParsed.name.toLowerCase()) {
        return {
          success: false,
          message: `❌ QR Code Name Mismatch\n\nScanned QR name does not match your registered name.\n\nYour Name: ${storedParsed.name}\nScanned Name: ${scannedParsed.name}\n\nPlease scan your correct teacher QR code.`,
        };
      }

      console.log('✅ QR Code verified, login successful');
      
      // ✅ CRITICAL: Save the email used for login (loginEmail), not the database email
      // This ensures password change uses the correct email
      const emailToSave = loginEmail || teacher.email;
      console.log('💾 Saving email for offline mode:', emailToSave);
      await AsyncStorage.setItem('lastTeacherId', teacher.id);
      await AsyncStorage.setItem('lastTeacherEmail', emailToSave);
      
      return {
        success: true,
        token: 'offline_token_' + teacher.id,
        teacherId: teacher.id,
        fullName: teacher.fullName,
        email: emailToSave,
      };
      } catch (err) {
      console.error('Login Step 2 error:', err);
      return { success: false, message: 'Login error' };
      }
      }

  // ===== SUBJECT MANAGEMENT =====
  
  // GET SUBJECTS
  async getSubjects(teacherId: string) {
    try {
      const subjects = await this.getSubjectsData();
      return subjects.filter((s) => s.teacherId === teacherId).sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (err) {
      console.error('Get subjects error:', err);
      return [];
    }
  }

  // CREATE SUBJECT
  async createSubject(teacherId: string, name: string, description?: string) {
    try {
      const subjects = await this.getSubjectsData();

      const newSubject: Subject = {
        id: generateId(),
        teacherId,
        name,
        description,
        createdAt: new Date().toISOString(),
      };

      subjects.push(newSubject);
      await this.saveSubjects(subjects);

      return {
        success: true,
        subject: newSubject,
      };
    } catch (err) {
      console.error('Create subject error:', err);
      return { success: false, message: 'Failed to create subject' };
    }
  }

  // DELETE SUBJECT (and its sections)
  async deleteSubject(subjectId: string) {
    try {
      const subjects = await this.getSubjectsData();
      const sections = await this.getSectionsData();
      
      // Remove subject
      const filtered = subjects.filter((s) => s.id !== subjectId);
      await this.saveSubjects(filtered);
      
      // Remove all sections in this subject
      const filteredSections = sections.filter((s) => s.subjectId !== subjectId);
      await this.saveSections(filteredSections);

      return { success: true };
    } catch (err) {
      console.error('Delete subject error:', err);
      return { success: false, message: 'Failed to delete subject' };
    }
  }

  // ===== SECTION MANAGEMENT =====
  
  // GET SECTIONS FOR SUBJECT
  async getSectionsBySubject(subjectId: string) {
    try {
      const sections = await this.getSectionsData();
      return sections.filter((s) => s.subjectId === subjectId).sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (err) {
      console.error('Get sections error:', err);
      return [];
    }
  }

  // GET ALL SECTIONS FOR TEACHER
  async getSections(teacherId: string) {
    try {
      const sections = await this.getSectionsData();
      return sections.filter((s) => s.teacherId === teacherId).sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (err) {
      console.error('Get sections error:', err);
      return [];
    }
  }

  // CREATE SECTION
  async createSection(teacherId: string, name: string, subjectId?: string, description?: string) {
    try {
      const sections = await this.getSectionsData();

      const newSection: Section = {
        id: generateId(),
        subjectId: subjectId || '',
        teacherId,
        name,
        description,
        createdAt: new Date().toISOString(),
      };

      sections.push(newSection);
      await this.saveSections(sections);

      return {
        success: true,
        section: newSection,
      };
    } catch (err) {
      console.error('Create section error:', err);
      return { success: false, message: 'Failed to create section' };
    }
  }

  // DELETE SECTION
  async deleteSection(sectionId: string) {
    try {
      const sections = await this.getSectionsData();
      const filtered = sections.filter((s) => s.id !== sectionId);
      await this.saveSections(filtered);

      return { success: true };
    } catch (err) {
      console.error('Delete section error:', err);
      return { success: false, message: 'Failed to delete section' };
    }
  }

  // SCAN ATTENDANCE
  async scanAttendance(teacherId: string, sectionId: string, studentQrData: string) {
    try {
      // ✅ NEW: Verify that section belongs to this teacher
      const sections = await this.getSectionsData();
      const section = sections.find(s => s.id === sectionId && s.teacherId === teacherId);
      
      if (!section) {
        return {
          success: false,
          status: 'COMPLETED' as const,
          message: 'Section not found or access denied',
        };
      }

      // Parse student QR: FULLNAME|STUDENTID|DEPARTMENT or NAME ID PROGRAM
      let studentName = '';
      let studentId = '';
      let course = '';
      
      // Try pipe-separated format first (FULLNAME|STUDENTID|DEPARTMENT)
      if (studentQrData.includes('|')) {
        const parts = studentQrData.split('|').map(p => p.trim()).filter(p => p.length > 0);
        if (parts.length >= 3) {
          studentName = parts[0];
          studentId = parts[1];
          course = parts[2];
        } else {
          return {
            success: false,
            status: 'COMPLETED' as const,
            message: 'Invalid student QR code format (pipe-separated)',
          };
        }
      } else {
        // Try space-separated format (NAME ID PROGRAM)
        const parts = studentQrData.trim().split(/\s+/).filter(p => p.length > 0);
        
        if (parts.length < 3) {
          return {
            success: false,
            status: 'COMPLETED' as const,
            message: 'Invalid student QR code format (space-separated)',
          };
        }

        studentName = parts.slice(0, -2).join(' ');
        studentId = parts[parts.length - 2];
        course = parts[parts.length - 1];
      }

      const attendance = await this.getAttendanceData();
      const today = new Date().toISOString().split('T')[0];

      // Find today's attendance for this student in this section
      const existingRecord = attendance.find(
        (a) =>
          a.teacherId === teacherId &&
          a.sectionId === sectionId &&
          a.studentId === studentId &&
          a.createdAt.split('T')[0] === today
      );

      if (!existingRecord) {
        // First scan - Time In
        const now = new Date().toISOString();
        const newAttendance: Attendance = {
          id: generateId(),
          teacherId,                    // ✅ NEW: Track teacher ownership
          sectionId,
          studentId,
          studentName,
          course,
          timeIn: now,
          createdAt: now,
        };

        attendance.push(newAttendance);
        await this.saveAttendance(attendance);

        return {
          success: true,
          status: 'IN' as const,
          message: 'Time In recorded',
          timeIn: now,
          studentName,
          studentId,
        };
      } else if (existingRecord.timeIn && !existingRecord.timeOut) {
        // Second scan - Time Out
        const now = new Date().toISOString();
        const idx = attendance.indexOf(existingRecord);
        attendance[idx].timeOut = now;

        await this.saveAttendance(attendance);

        return {
          success: true,
          status: 'OUT' as const,
          message: 'Time Out recorded',
          timeIn: existingRecord.timeIn,
          timeOut: now,
          studentName,
          studentId,
        };
      } else {
        // Already completed
        return {
          success: false,
          status: 'COMPLETED' as const,
          message: 'Attendance already complete for today',
          studentName,
          studentId,
        };
      }
    } catch (err) {
      console.error('Scan attendance error:', err);
      return {
        success: false,
        status: 'COMPLETED' as const,
        message: 'Failed to scan attendance',
      };
    }
  }

  // GET STATS
  async getStats(teacherId: string) {
    try {
      const attendance = await this.getAttendanceData();
      const today = new Date().toISOString().split('T')[0];

      // ✅ CRITICAL: Filter by teacher AND today
      const todayAttendance = attendance.filter(
        (a) => a.teacherId === teacherId && a.createdAt.split('T')[0] === today
      );

      // Count unique students (total present)
      const uniqueStudents = new Set(todayAttendance.map((a) => a.studentId));
      
      // Count those currently in (has timeIn, no timeOut)
      const currentlyIn = todayAttendance.filter(
        (a) => a.timeIn && !a.timeOut
      ).length;
      
      // Count those checked out (has both timeIn and timeOut)
      const checkedOut = todayAttendance.filter(
        (a) => a.timeIn && a.timeOut
      ).length;

      console.log('📊 Stats calculation for teacher', teacherId, ':', {
        totalRecords: attendance.length,
        todayRecords: todayAttendance.length,
        totalPresent: uniqueStudents.size,
        currentlyIn,
        checkedOut,
      });

      return {
        totalPresent: uniqueStudents.size || 0,
        currentlyIn: currentlyIn || 0,
        checkedOut: checkedOut || 0,
      };
    } catch (err) {
      console.error('Get stats error:', err);
      return { totalPresent: 0, currentlyIn: 0, checkedOut: 0 };
    }
  }

  // GET ATTENDANCE FOR SECTION
  async getAttendance(teacherId: string, sectionId: string) {
    try {
      // ✅ NEW: Verify section belongs to teacher
      const sections = await this.getSectionsData();
      const section = sections.find(s => s.id === sectionId && s.teacherId === teacherId);
      
      if (!section) {
        console.warn(`Access denied: section ${sectionId} does not belong to teacher ${teacherId}`);
        return [];
      }

      const attendance = await this.getAttendanceData();
      // ✅ CRITICAL: Filter by both teacher AND section
      return attendance
        .filter((a) => a.teacherId === teacherId && a.sectionId === sectionId)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    } catch (err) {
      console.error('Get attendance error:', err);
      return [];
    }
  }

  // GET ALL ATTENDANCE (for history/reports)
  async getAllAttendance() {
    try {
      const attendance = await this.getAttendanceData();
      return attendance.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (err) {
      console.error('Get all attendance error:', err);
      return [];
    }
  }

  // GET SECTIONS DATA (public method for mapping section IDs to names)
  async getAllSections() {
    try {
      return await this.getSectionsData();
    } catch (err) {
      console.error('Get all sections error:', err);
      return [];
    }
  }

  // CHANGE PASSWORD - Use email-only lookup to avoid ID duplication issues
  async changePassword(currentPassword: string, newPassword: string, teacherEmail?: string) {
    try {
      // Get current user email from parameter or storage
      let targetEmail = teacherEmail || await AsyncStorage.getItem('lastTeacherEmail');
      
      console.log('🔐 Change password attempt');
      console.log('   Email provided:', teacherEmail);
      console.log('   Email from storage:', await AsyncStorage.getItem('lastTeacherEmail'));
      
      if (!targetEmail) {
        return {
          success: false,
          message: 'Teacher not found - please log in again',
        };
      }

      const teachers = await this.getTeachers();
      
      // Find teacher by EMAIL ONLY (avoid ID duplication issues)
      const teacherIndex = teachers.findIndex(t => t.email === targetEmail);
      
      console.log('   Total teachers in DB:', teachers.length);
      console.log('   Teacher found by email:', teacherIndex !== -1);

      if (teacherIndex === -1) {
        return {
          success: false,
          message: 'Teacher account not found - please register again',
        };
      }

      const teacher = teachers[teacherIndex];
      console.log('   Found teacher ID:', teacher.id);

      // Verify current password
      const trimmedPw = currentPassword.trim();
      
      // Try password verification
      let passwordMatch = verifyPassword(trimmedPw, teacher.passwordHash);
      
      if (!passwordMatch) {
        // Try without trim
        passwordMatch = verifyPassword(currentPassword, teacher.passwordHash);
      }
      
      console.log('✓ Password match result:', passwordMatch);
      
      if (!passwordMatch) {
        return {
          success: false,
          message: 'Current password is incorrect. Please verify you are using the correct password.',
        };
      }

      // Check if new password is different
      const trimmedNew = newPassword.trim();
      const isSamePassword = verifyPassword(trimmedNew, teacher.passwordHash);
      if (isSamePassword) {
        return {
          success: false,
          message: 'New password must be different from current password',
        };
      }

      // Hash new password
      const newPasswordHash = hashPassword(trimmedNew);

      // Update teacher
      const oldHash = teacher.passwordHash;
      teachers[teacherIndex] = {
        ...teacher,
        passwordHash: newPasswordHash,
      };

      console.log('🔄 Updating password for teacher:', teacher.id);
      console.log('   Email:', targetEmail);
      console.log('   Old hash length:', oldHash.length);
      console.log('   New hash length:', newPasswordHash.length);

      await this.saveTeachers(teachers);

      // Verify it was saved correctly
      const verifyTeachers = await this.getTeachers();
      const verifyTeacher = verifyTeachers.find(t => t.email === targetEmail);
      console.log('   Verification - Teacher found after save:', !!verifyTeacher);
      if (verifyTeacher) {
        console.log('   Verification - Hash matches new:', verifyTeacher.passwordHash === newPasswordHash);
      }

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (err) {
      console.error('Change password error:', err);
      return {
        success: false,
        message: 'Failed to change password',
      };
    }
  }

  // CLEAR/RESET DATABASE
  async clearAllData() {
    try {
      await AsyncStorage.removeItem('teachers');
      await AsyncStorage.removeItem('subjects');
      await AsyncStorage.removeItem('sections');
      await AsyncStorage.removeItem('attendance');
      await AsyncStorage.removeItem('lastTeacherId');
      await AsyncStorage.removeItem('lastTeacherEmail');
      console.log('✅ All data cleared from offline database');
      return { success: true, message: 'All data cleared' };
    } catch (err) {
      console.error('❌ Failed to clear data:', err);
      return { success: false, message: 'Failed to clear data' };
    }
  }

  // CLEAR specific data type
  async clearData(dataType: 'teachers' | 'subjects' | 'sections' | 'attendance') {
    try {
      await AsyncStorage.removeItem(dataType);
      console.log(`✅ ${dataType} cleared`);
      return { success: true, message: `${dataType} cleared` };
    } catch (err) {
      console.error(`❌ Failed to clear ${dataType}:`, err);
      return { success: false, message: `Failed to clear ${dataType}` };
    }
  }

  // REINITIALIZE database with fresh demo data
  async resetDatabase() {
    try {
      await this.clearAllData();
      await this.initDatabase();
      console.log('✅ Database reset to initial state with demo data');
      return { success: true, message: 'Database reset to initial state' };
    } catch (err) {
      console.error('❌ Failed to reset database:', err);
      return { success: false, message: 'Failed to reset database' };
    }
  }

  // DELETE SPECIFIC TEACHER by email
  async deleteTeacherByEmail(email: string) {
    try {
      const teachers = await this.getTeachers();
      const initialCount = teachers.length;
      
      const filtered = teachers.filter(t => t.email !== email);
      
      if (filtered.length === initialCount) {
        return {
          success: false,
          message: `Teacher with email "${email}" not found`,
        };
      }

      await this.saveTeachers(filtered);
      console.log(`✅ Teacher ${email} deleted (${initialCount} → ${filtered.length})`);
      return {
        success: true,
        message: `Teacher ${email} deleted successfully`,
        deletedCount: initialCount - filtered.length,
      };
    } catch (err) {
      console.error('❌ Failed to delete teacher:', err);
      return { success: false, message: 'Failed to delete teacher' };
    }
  }

  // DELETE SPECIFIC TEACHER by ID
  async deleteTeacherById(id: string) {
    try {
      const teachers = await this.getTeachers();
      const teacher = teachers.find(t => t.id === id);
      
      if (!teacher) {
        return {
          success: false,
          message: `Teacher with ID "${id}" not found`,
        };
      }

      const filtered = teachers.filter(t => t.id !== id);
      await this.saveTeachers(filtered);
      
      console.log(`✅ Teacher ${teacher.email} (ID: ${id}) deleted`);
      return {
        success: true,
        message: `Teacher ${teacher.email} deleted successfully`,
        deletedEmail: teacher.email,
      };
    } catch (err) {
      console.error('❌ Failed to delete teacher:', err);
      return { success: false, message: 'Failed to delete teacher' };
    }
  }

  // LIST ALL TEACHERS
  async listAllTeachers() {
    try {
      const teachers = await this.getTeachers();
      const teachersList = teachers.map((t, idx) => ({
        index: idx,
        id: t.id,
        email: t.email,
        fullName: t.fullName,
        isVerified: t.isVerified,
      }));
      
      console.log('📋 All Teachers:', teachersList);
      return {
        success: true,
        count: teachers.length,
        teachers: teachersList,
      };
    } catch (err) {
      console.error('❌ Failed to list teachers:', err);
      return { success: false, message: 'Failed to list teachers', teachers: [] };
    }
  }
}

export const offlineApi = new OfflineAPI();

export const useOfflineApi = () => {
  return { offlineApi };
};
