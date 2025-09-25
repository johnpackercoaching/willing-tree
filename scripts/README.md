# Willing Tree Scripts

This directory contains utility scripts for managing the Willing Tree application.

## ⚠️ SECURITY NOTICE ⚠️

**NEVER hardcode API keys, passwords, or any secrets directly in script files!**

- All sensitive configuration MUST be read from environment variables (`.env` file)
- The `.env` file should NEVER be committed to version control
- Use `.env.example` to document required variables without actual values
- GitHub's secret scanning will flag any exposed API keys

## Available Scripts

### create-test-user.js

Creates test users in Firebase for development and testing purposes.

#### Basic Usage

```bash
# Create default test user
node scripts/create-test-user.js

# Create custom test user
node scripts/create-test-user.js --email custom@example.com --name "Custom User"

# Create admin test user
node scripts/create-test-user.js --email admin@example.com --name "Admin User" --role admin
```

#### Default Test User Credentials

- **Email**: willingtree.test.2024@gmail.com
- **Password**: TestUser2024!Secure
- **Display Name**: Test User 2024

#### Command Line Options

- `--email <email>`: Custom email address for the test user
- `--name <name>`: Custom display name for the test user
- `--password <password>`: Custom password (min 6 characters)
- `--role <role>`: User role ('user' or 'admin', default: 'user')
- `--bio <bio>`: Custom bio text for the user profile

#### Environment Variables

You can also set default values using environment variables:

```bash
export TEST_USER_EMAIL="custom@example.com"
export TEST_USER_PASSWORD="SecurePassword123!"
export TEST_USER_NAME="Custom Test User"
```

#### Features

The script will:
1. Validate Firebase configuration
2. Create a Firebase Authentication user
3. Update the user's display name
4. Create a Firestore document with user profile data
5. Set up default user settings and metadata
6. Sign out after creation

#### Error Handling

The script handles common errors:
- Email already in use
- Weak password
- Invalid email format
- Missing Firebase configuration

#### Security Notes

- **Never commit passwords to version control**
- Store sensitive credentials in environment variables
- Use strong, unique passwords for test accounts
- Consider using different test accounts for different environments

## Setup Requirements

1. **Firebase Configuration**: Ensure your `.env` file contains valid Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

2. **Node.js**: Requires Node.js 20.19.0 or higher

3. **Dependencies**: The script uses Firebase SDK which is already installed in the project

## Troubleshooting

### "Missing required Firebase configuration"
- Check that your `.env` file exists and contains all required Firebase fields
- Ensure the `.env` file is in the project root directory

### "Email already in use"
- The email is already registered in Firebase
- Use a different email or delete the existing user from Firebase Console

### "Failed to initialize Firebase"
- Verify your Firebase configuration is correct
- Check your internet connection
- Ensure Firebase project is active and not deleted

## Additional Scripts (Future)

Planned scripts for future development:
- `delete-test-user.js`: Remove test users
- `reset-test-data.js`: Reset test user data to initial state
- `bulk-create-users.js`: Create multiple test users at once
- `migrate-users.js`: Migrate users between environments