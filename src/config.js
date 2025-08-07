const config = {
  apiUrl: import.meta.env.PROD 
    ? 'https://discuss-backend-3igq.onrender.com' 
    : 'http://localhost:5000',
  cloudinaryUrl: `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`,
};

export default config;