# Admin User Setup Script

This script helps you set up the initial admin user in Firestore.

## Option 1: Using Firebase Console (Recommended)

1. Sign up with your admin email in the app first
2. Go to Firebase Console: https://console.firebase.google.com/
3. Select project: **patagonia-rnd-hub**
4. Navigate to **Firestore Database**
5. Find the **users** collection
6. Find your user document (identified by UID or email)
7. Edit the document and change `approved` field to `true`
8. Save changes

## Option 2: Using Firestore REST API

You can use curl or any HTTP client to update the user document:

```bash
# Replace {PROJECT_ID}, {USER_UID}, and {DATABASE} with your values
curl -X PATCH \
  'https://firestore.googleapis.com/v1/projects/patagonia-rnd-hub/databases/(default)/documents/users/{USER_UID}?updateMask.fieldPaths=approved' \
  -H 'Authorization: Bearer YOUR_FIREBASE_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "fields": {
      "approved": {
        "booleanValue": true
      }
    }
  }'
```

## Option 3: Manually in Firebase Console

If the users collection doesn't exist yet:

1. Sign in to the app with your admin email
2. You'll see the "Pending Approval" screen
3. Open Firebase Console → Firestore Database
4. You should now see a **users** collection
5. Click on your user document
6. Click **Edit Field** next to `approved`
7. Change value from `false` to `true`
8. Click **Update**
9. Refresh your app - you should now have access!

## Important Notes

- **Admin Email:** Make sure this matches the email in `src/App.jsx` (currently: `sidjonnala@gmail.com`)
- The admin user is identified by email address, not by the approved flag
- Admin users always have access, regardless of approval status
- The first time you sign in as admin, you'll be auto-approved
- All other users will need approval from the admin panel

## Firestore Security Rules

Update your Firestore rules to allow users to read their own profile:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own profile
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false; // Only backend/admin can write
    }
    
    // Only approved users can access app data
    match /{document=**} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.approved == true;
    }
  }
}
```

## Testing the Setup

1. Sign in with your admin email - you should have immediate access
2. Sign in with a different email in an incognito window - you should see "Pending Approval"
3. As admin, go to `/admin` to see the pending user
4. Approve the user
5. The pending user should now have access (may need to refresh)
