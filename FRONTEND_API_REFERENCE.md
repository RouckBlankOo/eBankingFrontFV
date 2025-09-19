# eBanking Backend API Reference for Frontend Integration

## 🔧 Base Configuration
- **Base URL**: `http://localhost:4022/api`
- **Alternative URL**: `http://192.168.100.4:4022/api`
- **Authentication**: JWT Bearer Token in Authorization header
- **API Documentation**: Available at `http://localhost:4022/api-docs` (Swagger UI)

## 📋 Authentication Header Format
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

## 📊 Standard Response Format
```javascript
{
  "success": true|false,
  "message": "Description",
  "data": {...} // Optional
}
```

---

# 🔐 Authentication APIs (`/api/auth`)

## 1. Register User
**POST** `/api/auth/register`
```javascript
// Request Body
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "+1234567890",
  "password": "SecurePassword123!"
}

// Success Response (201)
{
  "success": true,
  "message": "User registered successfully. Verification codes sent to email and phone.",
  "data": {
    "userId": "user_id_here",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "fullName": "John Doe"
  }
}
```

## 2. Login User
**POST** `/api/auth/login`
```javascript
// Request Body
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}

// Success Response (200)
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_access_token_here",
  "refreshToken": "jwt_refresh_token_here",
  "user": {
    "_id": "user_id",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "emailVerified": false,
    "phoneVerified": false,
    "profileCompletionStatus": {
      "personalInformation": false,
      "addressInformation": false,
      "identityVerification": false
    }
  }
}
```

## 3. Verify Email
**POST** `/api/auth/verify-email`
```javascript
// Request Body
{
  "userId": "user_id_here",
  "code": "123456"
}
```

## 4. Verify Phone
**POST** `/api/auth/verify-phone`
```javascript
// Request Body
{
  "userId": "user_id_here",
  "code": "123456"
}
```

## 5. Resend Verification
**POST** `/api/auth/resend-verification`
```javascript
// Request Body
{
  "userId": "user_id_here",
  "type": "email" // or "phone"
}
```

## 6. Forgot Password
**POST** `/api/auth/forgot-password`
```javascript
// Request Body
{
  "email": "john@example.com"
}
```

## 7. Reset Password
**POST** `/api/auth/reset-password`
```javascript
// Request Body
{
  "email": "john@example.com",
  "code": "123456",
  "newPassword": "NewSecurePassword123!"
}
```

## 8. Logout
**POST** `/api/auth/logout` 🔒
```javascript
// Request Body
{
  "refreshToken": "refresh_token_here"
}
```

## 9. Get Current User
**GET** `/api/auth/me` 🔒

---

# 👤 User Management APIs (`/api/user`)

## 1. Get Profile
**GET** `/api/user/profile` 🔒

## 2. Update Profile
**PUT** `/api/user/profile` 🔒
```javascript
// Request Body
{
  "fullName": "John Updated Doe",
  "phoneNumber": "+1234567891"
}
```

## 3. Update Personal Information
**PUT** `/api/user/personal-info` 🔒
```javascript
// Request Body
{
  "dateOfBirth": "1990-01-01",
  "nationality": "American",
  "occupation": "Software Engineer",
  "employmentStatus": "employed",
  "monthlyIncome": 5000,
  "sourceOfIncome": "Salary from tech company"
}
```

## 4. Update Address Information
**PUT** `/api/user/address-info` 🔒
```javascript
// Request Body
{
  "street": "123 Main Street",
  "city": "New York",
  "state": "NY",
  "postalCode": "10001",
  "country": "United States",
  "residenceType": "owned"
}
```

## 5. Submit Identity Verification
**PUT** `/api/user/identity-verification` 🔒
```javascript
// Request Body
{
  "documentType": "passport",
  "documentNumber": "A12345678",
  "documentImages": [
    "https://example.com/document1.jpg",
    "https://example.com/document2.jpg"
  ]
}
```

## 6. Change Password
**PUT** `/api/user/change-password` 🔒
```javascript
// Request Body
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

## 7. Delete Account
**DELETE** `/api/user/account` 🔒
```javascript
// Request Body
{
  "password": "CurrentPassword123!",
  "confirmDeletion": "DELETE"
}
```

---

# ✅ Verification APIs (`/api/verification`)

## 1. Send Verification Code
**POST** `/api/verification/send-verification`
```javascript
// Request Body
{
  "userId": "user_id_here", // Optional if email/phone provided
  "phoneNumber": "+1234567890", // Optional
  "email": "john@example.com", // Optional
  "type": "email" // or "phone"
}
```

## 2. Verify Code
**POST** `/api/verification/verify-code`
```javascript
// Request Body
{
  "userId": "user_id_here",
  "code": "123456",
  "type": "email" // "email", "phone", or "password_reset"
}
```

## 3. Verify Code with Attempt Tracking
**POST** `/api/verification/verify-code-attempt`
```javascript
// Request Body
{
  "userId": "user_id_here",
  "code": "123456",
  "type": "email"
}
```

## 4. Get Verification Status
**GET** `/api/verification/status/:userId` 🔒

## 5. Clear Pending Verifications
**DELETE** `/api/verification/clear/:userId` 🔒

---

# 💳 Card Management APIs (`/api/cards`)

## Card Types
- `debit`, `credit`, `virtual`, `prepaid`

## 1. Create Card
**POST** `/api/cards` 🔒
```javascript
// Request Body
{
  "cardType": "debit", // debit, credit, virtual, prepaid
  "cardName": "My Main Card",
  "currency": "USD",
  "balance": 0
}
```

## 2. Get All User Cards
**GET** `/api/cards` 🔒

## 3. Get Specific Card
**GET** `/api/cards/:id` 🔒

## 4. Update Card
**PUT** `/api/cards/:id` 🔒
```javascript
// Request Body
{
  "cardName": "Updated Card Name",
  "isFrozen": false,
  "isDefault": true,
  "limits": {
    "dailyLimit": 5000,
    "monthlyLimit": 20000
  }
}
```

## 5. Delete Card
**DELETE** `/api/cards/:id` 🔒

---

# 💰 Transaction APIs (`/api/transaction`)

## Transaction Types
- `deposit`, `withdrawal`, `transfer`, `payment`, `refund`, `fee`, `interest`, `bonus`

## Transaction Categories
- `food`, `transport`, `entertainment`, `shopping`, `bills`, `healthcare`, `education`, `other`

## Transaction Status
- `pending`, `completed`, `failed`, `cancelled`, `processing`

## 1. Create Transaction
**POST** `/api/transaction` 🔒
```javascript
// Request Body
{
  "cardId": "card_id_here", // Optional
  "type": "payment", // Required
  "amount": 100.50, // Required
  "currency": "USD",
  "description": "Coffee shop payment",
  "fromAccount": "account_id",
  "toAccount": "merchant_account",
  "category": "food",
  "location": "Starbucks Downtown"
}
```

## 2. Get User Transactions (with pagination & filters)
**GET** `/api/transaction` 🔒
```javascript
// Query Parameters
?page=1
&limit=10
&status=completed
&type=payment
&category=food
&startDate=2025-01-01
&endDate=2025-12-31
&sortBy=createdAt
&order=desc
```

## 3. Get Transaction Statistics
**GET** `/api/transaction/stats` 🔒
```javascript
// Query Parameters
?startDate=2025-01-01&endDate=2025-12-31
```

## 4. Get Specific Transaction
**GET** `/api/transaction/:id` 🔒

## 5. Update Transaction
**PUT** `/api/transaction/:id` 🔒
```javascript
// Request Body
{
  "status": "completed",
  "description": "Updated description",
  "category": "entertainment"
}
```

## 6. Delete Transaction
**DELETE** `/api/transaction/:id` 🔒

---

# 🏦 Bank Directory APIs (`/api/bank`)

## 1. Create Bank
**POST** `/api/bank` 🔒

## 2. Get All Banks
**GET** `/api/bank` 🔒

## 3. Get Specific Bank
**GET** `/api/bank/:id` 🔒

## 4. Update Bank
**PUT** `/api/bank/:id` 🔒

## 5. Delete Bank
**DELETE** `/api/bank/:id` 🔒

---

# 🔄 Bank Transfer APIs (`/api/bankTransfer`)

## 1. Create Bank Transfer
**POST** `/api/bankTransfer` 🔒

## 2. Get User Transfers
**GET** `/api/bankTransfer/user/:userId` 🔒

## 3. Get Specific Transfer
**GET** `/api/bankTransfer/:id` 🔒

## 4. Update Transfer
**PUT** `/api/bankTransfer/:id` 🔒

## 5. Delete Transfer
**DELETE** `/api/bankTransfer/:id` 🔒

---

# 🪙 Crypto Wallet APIs (`/api/cryptoWallet`)

## 1. Create Crypto Wallet
**POST** `/api/cryptoWallet` 🔒

## 2. Get User Wallets
**GET** `/api/cryptoWallet/user/:userId` 🔒

## 3. Get Specific Wallet
**GET** `/api/cryptoWallet/:id` 🔒

## 4. Update Wallet
**PUT** `/api/cryptoWallet/:id` 🔒

## 5. Delete Wallet
**DELETE** `/api/cryptoWallet/:id` 🔒

---

# ⚡ Crypto Transaction APIs (`/api/cryptoTransaction`)

## 1. Create Crypto Transaction
**POST** `/api/cryptoTransaction` 🔒

## 2. Get User Crypto Transactions
**GET** `/api/cryptoTransaction/user/:userId` 🔒

## 3. Get Specific Crypto Transaction
**GET** `/api/cryptoTransaction/:id` 🔒

## 4. Update Crypto Transaction
**PUT** `/api/cryptoTransaction/:id` 🔒

## 5. Delete Crypto Transaction
**DELETE** `/api/cryptoTransaction/:id` 🔒

---

# 🎁 Referral APIs (`/api/referral`)

## 1. Create Referral
**POST** `/api/referral` 🔒

## 2. Get Referrals Made by User
**GET** `/api/referral/referrer/:userId` 🔒

## 3. Get Referral Received by User
**GET** `/api/referral/referred/:userId` 🔒

## 4. Get Specific Referral
**GET** `/api/referral/:id` 🔒

## 5. Update Referral
**PUT** `/api/referral/:id` 🔒

## 6. Delete Referral
**DELETE** `/api/referral/:id` 🔒

---

# 🔔 Notification APIs (`/api/notification`)

## 1. Create Notification
**POST** `/api/notification` 🔒

## 2. Get User Notifications
**GET** `/api/notification/user/:userId` 🔒

## 3. Get Specific Notification
**GET** `/api/notification/:id` 🔒

## 4. Update Notification (Mark as Read)
**PUT** `/api/notification/:id` 🔒

## 5. Delete Notification
**DELETE** `/api/notification/:id` 🔒

---

# 🏆 Achievement APIs (`/api/achievement`)

## 1. Create Achievement
**POST** `/api/achievement` 🔒

## 2. Get User Achievements
**GET** `/api/achievement/user/:userId` 🔒

## 3. Get Specific Achievement
**GET** `/api/achievement/:id` 🔒

## 4. Update Achievement
**PUT** `/api/achievement/:id` 🔒

## 5. Delete Achievement
**DELETE** `/api/achievement/:id` 🔒

---

# 📍 Address APIs (`/api/address`)

## 1. Create Address
**POST** `/api/address` 🔒

## 2. Get User Addresses
**GET** `/api/address/user/:userId` 🔒

## 3. Get Specific Address
**GET** `/api/address/:id` 🔒

## 4. Update Address
**PUT** `/api/address/:id` 🔒

## 5. Delete Address
**DELETE** `/api/address/:id` 🔒

---

# 🔧 Utility APIs

## Health Check
**GET** `/api/health`
```javascript
// Response
{
  "success": true,
  "message": "eBanking Backend API is running",
  "timestamp": "2025-09-09T00:00:00.000Z",
  "environment": "development"
}
```

---

# 📝 Error Responses

## Validation Error (400)
```javascript
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email"
    }
  ]
}
```

## Authentication Error (401)
```javascript
{
  "success": false,
  "message": "Invalid credentials"
}
```

## Access Denied (403)
```javascript
{
  "success": false,
  "message": "Access denied"
}
```

## Not Found (404)
```javascript
{
  "success": false,
  "message": "User not found"
}
```

## Rate Limit (429)
```javascript
{
  "success": false,
  "message": "Too many requests, please try again later"
}
```

## Server Error (500)
```javascript
{
  "success": false,
  "message": "Internal server error"
}
```

---

# 🚦 Rate Limits
- **Authentication endpoints**: 5 requests per 15 minutes
- **Verification endpoints**: 3 requests per 5 minutes
- **General API endpoints**: 100 requests per 15 minutes

---

# 🔐 Password Requirements
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (@$!%\*?&)

---

# 📱 Frontend Implementation Tips

## 1. Axios Configuration Example
```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:4022/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

## 2. Authentication Flow
1. **Register** → **Verify Email/Phone** → **Login** → **Get JWT Token**
2. Store JWT token in localStorage or secure storage
3. Include token in all authenticated API calls
4. Handle token expiration and refresh

## 3. Error Handling
```javascript
try {
  const response = await apiClient.post('/auth/login', credentials);
  if (response.data.success) {
    // Handle success
    localStorage.setItem('authToken', response.data.token);
  }
} catch (error) {
  if (error.response) {
    // Handle API errors
    console.error(error.response.data.message);
  } else {
    // Handle network errors
    console.error('Network error');
  }
}
```

## 4. Pagination Handling
```javascript
const fetchTransactions = async (page = 1, limit = 10, filters = {}) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...filters
  });
  
  const response = await apiClient.get(`/transaction?${params}`);
  return response.data;
};
```

---

# 📋 Quick Reference Checklist

- [ ] Set up axios configuration with base URL and interceptors
- [ ] Implement authentication flow (register, login, verify)
- [ ] Handle JWT token storage and inclusion in requests
- [ ] Implement error handling for all API responses
- [ ] Set up pagination for list endpoints
- [ ] Handle loading states and user feedback
- [ ] Implement proper form validation matching backend requirements
- [ ] Set up rate limiting handling on frontend
- [ ] Test all API endpoints with different scenarios
- [ ] Implement refresh token logic for token expiration

---

**🔒 Legend**: 🔒 = Requires Authentication

**Last Updated**: September 9, 2025
