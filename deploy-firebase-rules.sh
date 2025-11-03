#!/bin/bash
# Firebase Rules Deployment Script

echo "🔥 Deploying Firebase Security Rules..."
echo "Make sure you have Firebase CLI installed and are logged in."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Check if logged in
if ! firebase projects:list | grep -q "society-13083"; then
    echo "🔐 Logging into Firebase..."
    firebase login
fi

# Deploy the rules
echo "📤 Deploying security rules..."
firebase deploy --only firestore:rules --project society-13083

if [ $? -eq 0 ]; then
    echo "✅ Firebase security rules deployed successfully!"
    echo "🔄 The permission errors should now be resolved."
else
    echo "❌ Failed to deploy rules. Check your Firebase configuration."
fi
