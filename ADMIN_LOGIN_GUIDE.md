# Admin Dashboard Login Guide

This guide explains how to access the admin dashboard for the Smart Society Management System.

## Default Admin Credentials

**Email:** admin@smartsociety.com  
**Password:** Admin123!

## How to Login to Admin Dashboard

### Step 1: Create Admin User (First Time Setup)

If this is your first time setting up the system, you need to create the default admin user:

```bash
npm run create-admin
```

This will create the admin user in Firebase Authentication and set up the necessary Firestore document with admin role.

### Step 2: Access the Login Page

1. Start the development server:
```bash
npm run dev
```

2. Navigate to the login page at `http://localhost:5173/login`

3. Enter the admin credentials:
   - **Email:** admin@smartsociety.com
   - **Password:** Admin123

4. Click "Sign In"

### Step 3: Access Admin Dashboard

After successful login, you will be redirected to the homepage. To access the admin dashboard:

**Option A: Direct URL**
- Navigate to `http://localhost:5173/admin` or `http://localhost:5173/admin/dashboard`

**Option B: Manual Navigation**
- Currently, there's no direct link from the homepage to the admin dashboard
- You need to manually enter the `/admin` URL in the browser

## Admin Dashboard Features

Once logged in as admin, you can access:

- **Dashboard** - Overview and metrics
- **Members** - User management
- **Security** - Security settings and monitoring
- **Complaints** - Complaint management
- **Events** - Event management
- **Maintenance** - Maintenance requests
- **Announcements** - Announcement management

## Security Recommendations

1. **Change Default Password**: Immediately change the default password after first login
2. **Firestore Rules**: Update Firestore security rules to restrict admin-only access
3. **Environment Variables**: Use environment variables for sensitive data in production
4. **User Management**: Create additional admin accounts and disable the default one if needed

## Troubleshooting

### Access Denied Error
If you see "Access Denied" when accessing `/admin`:
- Ensure the user has the "admin" role in Firestore
- Check that the user document exists in the `user` collection with the correct UID

### Login Issues
- Verify Firebase Authentication is properly configured
- Check browser console for any error messages
- Ensure Firestore rules allow user document creation

### User Role Not Updating
- The role is fetched from Firestore on each page load
- Changes to user role in Firestore may take a moment to reflect

## Firestore User Document Structure

For admin access, the user document should have:
```javascript
{
  email: "admin@smartsociety.com",
  name: "System Administrator",
  role: "admin", // This must be "admin"
  apartment: "Admin Office",
  members: 1,
  iconColor: "#FF6B6B",
  createdAt: [timestamp]
}
```

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify Firebase project configuration
3. Ensure all dependencies are installed
4. Check Firestore security rules

For production deployment, consider implementing:
- Custom admin registration flow
- Role-based access control in Firestore rules
- Environment-specific configurations
- Proper error handling and logging
