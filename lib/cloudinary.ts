import { v2 as cloudinary } from 'cloudinary';

/* Server side only: holds the API secret. Keys come from the Cloudinary console. */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;
