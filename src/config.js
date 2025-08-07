// ✅ Fixed code for config.js
const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  cloudinaryUrl: `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`,
};

// Debug log for production
if (import.meta.env.PROD) {
  console.log('🔧 Production API URL:', config.apiUrl);
}

export default config;