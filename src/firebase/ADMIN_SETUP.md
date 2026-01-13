# Admin User Setup Script

This script helps you set up the initial admin user in Firestore.

## Setting Up the First Admin

### Option 1: Using Firebase Console (Recommended)

1. Sign up with your admin email in the app first
2. Go to Firebase Console: https://console.firebase.google.com/
3. Select project: **patagonia-rnd-hub**
4. Navigate to **Firestore Database**
5. Find the **users** collection
6. Find your user document (identified by UID)
7. Edit the document and set these fields:
   - `approved`: `true`
   - `isAdmin`: `true`
8. Save changes
9. Refresh the app - you should now see the "Admin" link in the navigation

### Option 2: Manually in Firebase Console

If the users collection doesn't exist yet:

1. Sign in to the app with your email
2. You'll see the "Pending Approval" screen
3. Open Firebase Console → Firestore Database
4. You should now see a **users** collection
5. Click on your user document
6. Click **Add field**:
   - Field name: `isAdmin`
   - Field type: `boolean`
   - Value: `true`
7. Edit the `approved` field and change it to `true`
8. Click **Update**
9. Refresh your app - you should now have admin access!

## Admin Capabilities

Once you're set as admin, you can:
- Access the Admin Panel at `/admin`
- View all pending user signups
- Approve or revoke user access
- Promote users to admin or demote them
- Admin users always have access regardless of approval status

## Managing Other Admins

From the Admin Panel, you can:
1. Approve pending users (green "Approve" button)
2. Make approved users admins (purple "Make Admin" button)
3. Remove admin privileges (gray "Remove Admin" button)
4. Revoke user access (red "Revoke" button)

## Important Notes

- **Admin Status:** Determined by `isAdmin: true` flag in user document
- There is no hardcoded admin email in the code
- First admin must be set manually in Firebase Console
- Subsequent admins can be promoted from the Admin Panel
- Admin users see the 👤 Admin link in navigation
- Regular approved users do NOT see the Admin link

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
