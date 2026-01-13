# Firebase Setup Instructions

## Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click **"Add project"** or **"Create a project"**
3. Name it: `patagonia-rnd-hub` (or your preferred name)
4. Disable Google Analytics (optional)
5. Click **"Create project"**

## Step 2: Enable Firestore Database

1. In Firebase Console, go to **"Build" → "Firestore Database"**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (for development)
4. Select your preferred location
5. Click **"Enable"**

## Step 3: Get Firebase Configuration

1. Go to **Project Settings** (gear icon top left)
2. Scroll to **"Your apps"** section
3. Click the web icon **`</>`** to add a web app
4. Register app: `react-process-app`
5. Copy the `firebaseConfig` object
6. Paste it into `src/firebase/config.js` (replace the placeholder)

## Step 4: Configure Firestore Rules (Optional - for security)

In Firestore Console > Rules tab, use:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // For development - restrict this later
    }
  }
}
```

## What This Enables

✅ Real-time sync across all browsers
✅ Persistent data storage
✅ Automatic conflict resolution
✅ Multiple users can collaborate
