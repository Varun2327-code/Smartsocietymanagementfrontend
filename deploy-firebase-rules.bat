@echo off
echo 🔥 Deploying Firebase Security Rules...
echo Make sure you have Firebase CLI installed and are logged in.

:: Check if Firebase CLI is installed
firebase --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Firebase CLI not found. Installing...
    npm install -g firebase-tools
)

:: Deploy the rules
echo 📤 Deploying security rules...
firebase deploy --only firestore:rules --project smart-society-b3836

if %errorlevel% equ 0 (
    echo ✅ Firebase security rules deployed successfully!
    echo 🔄 The permission errors should now be resolved.
) else (
    echo ❌ Failed to deploy rules. Check your Firebase configuration.
)

pause
