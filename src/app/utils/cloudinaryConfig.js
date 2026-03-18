const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// 1. Kết nối với Trạm Cloudinary bằng thông tin trong file .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Cấu hình cái kho chứa đồ (Storage)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "AppNhacCuaTui", // Tên thư mục nó sẽ tự tạo trên Cloudinary
    resource_type: "auto", // Quan trọng! Chữ 'auto' giúp nó tự nhận diện lúc nào khách up Ảnh (.jpg), lúc nào up Nhạc (.mp3)
  },
});

// 3. Đưa kho chứa đồ cho anh "bốc vác" Multer quản lý
const upload = multer({ storage: storage });

module.exports = upload;