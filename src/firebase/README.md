# Firebase Setup Instructions

## Prerequisites
You need a Firebase project. The current configuration is set up for:
- **Project ID:** patagonia-rnd-hub
- **App ID:** 1:730858267173:web:fe7d9dcf1b21e8e6a25e71

## Steps to Enable Firebase Features

### 1. Enable Firebase Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **patagonia-rnd-hub**
3. Navigate to **Build** > **Authentication** in the left sidebar
4. Click **Get started**
5. Enable authentication providers:
   
   **Email/Password:**
   - Click on **Email/Password** provider
   - Enable **Email/Password** (toggle ON)
   - Click **Save**
   
   **Google (Optional but recommended):**
   - Click on **Google** provider
   - Enable **Google** (toggle ON)
   - Select a support email
   - Click **Save**

6. Configure authorized domains:
   - Go to **Authentication** > **Settings** > **Authorized domains**
   - Add your GitHub Pages domain: `sidjonnala.github.io`
   - Add `localhost` for local development (usually already there)

### 2. Enable Firestore Database

1. In Firebase Console, go to **Build** > **Firestore Database**
2. Click **Create database**
3. Choose **Production mode** (requires authentication)
4. Select your preferred location (e.g., `us-central1`)
5. Click **Enable**

### 3. Configure Firestore Security Rules

After enabling Firestore, set up security rules:

**TEMPORARY (while auth is disabled):**

1. Go to **Firestore Database** > **Rules** tab
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // TEMPORARY: Allow public access while authentication is disabled
    // TODO: Re-enable authentication and update rules
    
    // Planning Poker sessions (temporary public access)
    match /poker-sessions/{sessionId} {
      allow read, write: if true;
    }
    match /poker-sessions/{sessionId}/votes/{voterId} {
      allow read, write: if true;
    }
    
    // Users collection (for when auth is re-enabled)
    match /users/{userId} {
      allow read, write: if true; // TEMPORARY
    }
    
    // All other data (events, teams, config)
    match /{document=**} {
      allow read, write: if true; // TEMPORARY
    }
  }
}
```

3. Click **Publish**

**PRODUCTION (when auth is re-enabled):**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own profile
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null; // Allow user creation on signup
      allow update: if false; // Only admin can approve users (via Admin Panel)
    }
    
    // Planning Poker sessions - authenticated users only
    match /poker-sessions/{sessionId} {
      allow read, write: if request.auth != null;
    }
    match /poker-sessions/{sessionId}/votes/{voterId} {
      allow read, write: if request.auth != null;
    }
    
    // Only approved users can access app data (events, teams, config)
    match /{document=**} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.approved == true;
    }
  }
}
```

### 4. Create Firestore Collections

The app will automatically create these collections when you use it:

- **events**: Stores all sprint ceremony events
  - Each document has an ID and contains: `id`, `day`, `startTime`, `endTime`, `title`, `team`
  
- **config/teams**: Stores team configuration
  - Single document containing the teams array with `name` and `color` for each team

### 5. Verify Setup

1. Start your development server: `npm run dev`
2. Open the app in your browser
3. You should see the login screen
4. Sign up with an email/password or use Google sign-in
5. After signing in, make changes (add/edit events or teams)
6. Check the Firestore console to see if data is being synced
7. Open the app in a different browser/device - changes should sync in real-time

## Authentication Features

**Email/Password:**
- Users can sign up with email and password
- Minimum password length: 6 characters
- Toggle between Sign In and Sign Up modes

**Google Sign-In:**
- One-click authentication with Google account
- No password needed

**Passkey Support (Experimental):**
- App detects if device supports passkeys (WebAuthn)
- Shown as green indicator on login screen
- Full passkey implementation coming soon

## What This Enables

✅ Real-time sync across all browsers and devices
✅ Secure authentication with email/password or Google
✅ Persistent data storage in the cloud
✅ Automatic conflict resolution
✅ Multiple users can collaborate securely
✅ Graceful fallback to localStorage if Firebase unavailable

## Fallback Behavior

If Firebase is not configured or unreachable:
- The app automatically falls back to localStorage
- Data will be stored locally on each device
- No cross-browser synchronization will occur
- The app will continue to work normally

## Security Notes

- Firebase API keys in the config file are **public by design**
- Security is enforced through:
  1. **Firebase Authentication** - Users must sign in
  2. **Firestore Security Rules** - Data access requires authentication
- Always require authentication in production: `allow read, write: if request.auth != null;`
- For additional security, you can:
  - Add domain restrictions in Firebase Console
  - Use environment variables for sensitive configuration
  - Implement rate limiting and data validation in rules

## Troubleshooting

**"Missing or insufficient permissions" error:**
- Make sure Firestore is enabled
- Check that security rules allow access
- Verify you're signed in (check for Sign Out button in nav)

**Can't sign in:**
- Verify Email/Password provider is enabled in Firebase Console
- Check that authorized domains include your domain
- Check browser console for Firebase Auth errors

**Data not syncing:**
- Check browser console for Firebase errors
- Verify internet connection
- Check Firebase Console for service status
- Make sure you're signed in

**App still using localStorage:**
- Check if `useFirebase` state is true in EventContext/TeamContext
- Verify Firebase config in `src/firebase/config.js`
- Check browser console for initialization errors

**Google Sign-In not working:**
- Verify Google provider is enabled in Firebase Console
- Check that authorized domains are configured
- Make sure popup blockers aren't blocking the Google sign-in window
