# Login Flow - CORRECTED

## The Correct 2FA Process

### Step 1: Email + Password Authentication
```
┌─────────────────────────────────────────────┐
│         Teacher Login - Step 1              │
│                                             │
│  Enter your credentials:                    │
│                                             │
│  Email:     [teacher@example.com  ]        │
│  Password:  [••••••••••••••••     ]        │
│                                             │
│  [Next]  [Back to Landing]                  │
└─────────────────────────────────────────────┘

POST /api/teacher/login/step1
{
  "email": "teacher@example.com",
  "password": "teacher123"
}

Response (if correct):
{
  "success": true,
  "message": "Email and password verified. Please scan your QR code.",
  "tempToken": "jwt_temp_token_5min"
}

Response (if wrong):
{
  "message": "Email or password incorrect"
}
```

**Flow:**
1. User enters email + password
2. Server validates credentials
3. If wrong → Stay on Step 1, show error
4. If correct → Proceed to Step 2

---

### Step 2: QR Code Verification
```
┌─────────────────────────────────────────────┐
│    Teacher Login - Step 2 (Final)           │
│                                             │
│  Scan your teacher QR code:                 │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │                                       │ │
│  │     [QR SCANNER WINDOW]               │ │
│  │                                       │ │
│  │  Align QR code in frame               │ │
│  │                                       │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  Expected Format:                           │
│  TCHR|{TEACHER_ID}|{TEACHER_NAME}          │
│                                             │
│  [Rescan] [Cancel]                          │
└─────────────────────────────────────────────┘

POST /api/teacher/login/step2
{
  "tempToken": "jwt_temp_token_from_step1",
  "qrCodeData": "TCHR|TCHR001|Demo Teacher"
}

Response (if QR matches):
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_final_token_12h",
  "teacherId": "TCHR001",
  "fullName": "Demo Teacher",
  "email": "teacher@demo.com"
}

Response (if QR doesn't match):
{
  "message": "QR code does not match. Please try again."
}
```

**Flow:**
1. User scans their QR code
2. Server verifies QR matches stored QR
3. If no match → Show error, allow rescan
4. If match → Login complete, save token, go to dashboard

---

## Complete Login Workflow

```
Landing Page
    │
    ├─→ [Teacher Login]
    │        │
    │        ▼
    │   ┌──────────────────────────┐
    │   │  Step 1: Email + Pass     │
    │   │  POST /teacher/login/step1│
    │   └──────────────────────────┘
    │        │
    │        ├─ WRONG → Show error, stay
    │        │
    │        └─ CORRECT → Get tempToken
    │                │
    │                ▼
    │        ┌──────────────────────────┐
    │        │  Step 2: Scan QR         │
    │        │  POST /teacher/login/step2│
    │        └──────────────────────────┘
    │                │
    │                ├─ QR MISMATCH → Error, rescan
    │                │
    │                └─ QR MATCH → Get JWT token
    │                        │
    │                        ▼
    │                  Dashboard
    │
    └─→ [Create Account]
             │
             ▼
        ┌──────────────────────────┐
        │  Registration Form       │
        │  Email: __________       │
        │  Full Name: __________   │
        │  Password: __________    │
        │  Confirm: __________     │
        │                          │
        │  POST /teacher/register  │
        └──────────────────────────┘
             │
             ├─ ERROR → Show error, stay
             │
             └─ SUCCESS → Get JWT token + QR
                     │
                     ▼
                Show QR Code
                     │
                     ▼
                Dashboard
```

---

## Default Test Credentials

```
Email: teacher@demo.com
Password: teacher123
Teacher ID: TCHR001
QR Code: TCHR|TCHR001|Demo Teacher
```

**Test Process:**
1. Tap "Teacher Login"
2. Enter: `teacher@demo.com`
3. Enter: `teacher123`
4. Tap "Next"
5. Scan QR: `TCHR|TCHR001|Demo Teacher`
6. Login successful → Dashboard

---

## Registration Flow

```
Landing → Create Account
             │
             ▼
        Registration Form
        ├─ Email: [_______]
        ├─ Full Name: [_______]
        ├─ Password: [_______]
        └─ Confirm: [_______]
             │
             │ POST /teacher/register
             │
             ├─ Invalid email format?
             │  → Error: "Invalid email format"
             │
             ├─ Passwords don't match?
             │  → Error: "Passwords do not match"
             │
             ├─ Email already used?
             │  → Error: "Email already registered"
             │
             └─ Valid?
                  │
                  ▼
              ┌─────────────────────────┐
              │  Account Created!       │
              │                         │
              │  Your QR Code:          │
              │  [Display QR Image]     │
              │                         │
              │  TCHR|TCHR002|John Smith│
              │                         │
              │  Save this QR code!     │
              │  You'll need it to login│
              │                         │
              │  [Continue Dashboard]   │
              └─────────────────────────┘
                      │
                      ▼
                   Dashboard
```

---

## Key Differences from Previous Plan

| Aspect | Previous | Corrected |
|--------|----------|-----------|
| Step 1 | Scan QR code | Email + Password |
| Step 2 | Enter password | Scan QR code |
| Why 2FA? | QR + Pass | Email/Pass + QR |
| Registration | Username only | Email required |
| QR Generation | Manual input | Auto-generated |

---

## Why This Order?

1. **Email + Password First**
   - Fast to verify (database lookup + hash check)
   - Prevents spam attempts to QR scanner
   - Standard login practice

2. **QR Code Second**
   - Additional security layer
   - Harder to fake/brute-force
   - True 2FA protection
   - Device-specific (teacher must have their QR)

3. **Both Required**
   - One thing you know (password)
   - One thing you have (QR code)
   - Complete 2FA security

---

## Registration Generates QR Automatically

```
User Creates Account
    │
    ├─ Email: john@example.com
    ├─ Full Name: John Smith
    ├─ Password: password123
    │
    ▼
Server Actions:
    ├─ Hash password
    ├─ Generate Teacher ID: TCHR001A2B
    ├─ Create QR Code: TCHR|TCHR001A2B|John Smith
    ├─ Store in database
    │
    ▼
Return to User:
    ├─ JWT Token (logged in immediately)
    ├─ QR Code (for future logins)
    │
    ▼
Show QR to User:
    ├─ Display as image
    ├─ Let user save/print
    ├─ Store in secure location
    │
    ▼
User Can Now:
    ├─ Login anytime using: Email + Pass + QR scan
    ├─ Use dashboard immediately
    ├─ Create sections
    ├─ Start scanning students
```

---

## Mobile Implementation

### Registration Screen
```tsx
export default function Register() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [qrCode, setQrCode] = useState('');

  const handleRegister = async () => {
    try {
      const response = await fetch('/api/teacher/register', {
        method: 'POST',
        body: JSON.stringify({
          email, fullName, password, confirmPassword
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Save token
        authStore.setToken(data.token);
        
        // Show QR code
        setQrCode(data.qrCodeData);
        
        // Then redirect to dashboard
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Registration failed');
    }
  };

  return (
    <View>
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" />
      <TextInput value={fullName} onChangeText={setFullName} placeholder="Full Name" />
      <TextInput value={password} onChangeText={setPassword} placeholder="Password" />
      <TextInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm" />
      <Button onPress={handleRegister} title="Register" />
      {error && <Text>{error}</Text>}
      {qrCode && <QRCode value={qrCode} />}
    </View>
  );
}
```

### Login Screen - Step 1
```tsx
export default function LoginStep1() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleNext = async () => {
    try {
      const response = await fetch('/api/teacher/login/step1', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Save temp token and proceed to Step 2
        navigation.navigate('LoginStep2', { tempToken: data.tempToken });
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Login failed');
    }
  };

  return (
    <View>
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" />
      <TextInput value={password} onChangeText={setPassword} placeholder="Password" />
      <Button onPress={handleNext} title="Next" />
      {error && <Text>{error}</Text>}
    </View>
  );
}
```

### Login Screen - Step 2
```tsx
export default function LoginStep2({ route }) {
  const { tempToken } = route.params;
  const [error, setError] = useState('');

  const handleQRScanned = async (data) => {
    try {
      const response = await fetch('/api/teacher/login/step2', {
        method: 'POST',
        body: JSON.stringify({
          tempToken,
          qrCodeData: data
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Save token
        authStore.setToken(result.token);
        
        // Go to dashboard
        navigation.replace('Dashboard');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Login failed');
    }
  };

  return (
    <View>
      <QRScanner onQRScanned={handleQRScanned} />
      {error && <Text>{error}</Text>}
    </View>
  );
}
```

---

## Backend API Summary

### Register Endpoint
```
POST /api/teacher/register

Request:
{
  "email": "teacher@example.com",
  "fullName": "John Smith",
  "password": "password123",
  "confirmPassword": "password123"
}

Response (Success - 201):
{
  "success": true,
  "message": "Account created successfully",
  "token": "jwt_token_12h",
  "teacherId": "TCHR001ABC",
  "fullName": "John Smith",
  "email": "teacher@example.com",
  "qrCodeData": "TCHR|TCHR001ABC|John Smith"
}

Response (Error):
{
  "message": "Email already registered" | "Invalid email format" | etc.
}
```

### Login Step 1 Endpoint
```
POST /api/teacher/login/step1

Request:
{
  "email": "teacher@example.com",
  "password": "password123"
}

Response (Success):
{
  "success": true,
  "message": "Email and password verified. Please scan your QR code.",
  "tempToken": "jwt_temp_5m"
}

Response (Error):
{
  "message": "Email or password incorrect"
}
```

### Login Step 2 Endpoint
```
POST /api/teacher/login/step2

Request:
{
  "tempToken": "jwt_temp_5m",
  "qrCodeData": "TCHR|TCHR001ABC|John Smith"
}

Response (Success):
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token_12h",
  "teacherId": "TCHR001ABC",
  "fullName": "John Smith",
  "email": "teacher@example.com"
}

Response (Error):
{
  "message": "QR code does not match. Please try again." | "Session expired. Please login again." | etc.
}
```

---

## Testing the Flow

### Manual Test with curl/Postman

**Step 1: Register**
```bash
curl -X POST http://localhost:3000/api/teacher/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "fullName": "Test Teacher",
    "password": "test123",
    "confirmPassword": "test123"
  }'
```

**Step 2: Login - Step 1**
```bash
curl -X POST http://localhost:3000/api/teacher/login/step1 \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

**Step 3: Login - Step 2**
```bash
curl -X POST http://localhost:3000/api/teacher/login/step2 \
  -H "Content-Type: application/json" \
  -d '{
    "tempToken": "JWT_FROM_STEP1",
    "qrCodeData": "TCHR|TCHR123ABC|Test Teacher"
  }'
```

---

## Summary

✓ **Step 1:** Email + Password (standard auth)
✓ **Step 2:** QR Code scan (2FA verification)
✓ **Result:** Secure, standard 2FA process

This is the correct flow!

