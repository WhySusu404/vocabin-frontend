#!/bin/bash

# VocaBin Frontend Deployment Script

echo "🚀 VocaBin Frontend Deployment"
echo "==============================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the vocabin-frontend directory."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building the project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📁 Your built files are in the 'dist' directory"
    echo ""
    echo "🌐 Next steps for deployment:"
    echo "1. Upload the 'dist' folder to your hosting service (Netlify, Vercel, etc.)"
    echo "2. Set environment variable PARCEL_BACKEND_URL to your Render backend URL"
    echo "3. Update your backend's FRONTEND_URL environment variable with your frontend URL"
    echo ""
    echo "📚 For detailed instructions, see DEPLOYMENT.md"
else
    echo "❌ Build failed! Please check the errors above."
    exit 1
fi 