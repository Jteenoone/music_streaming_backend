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

// 3. Bộ lọc chỉ chấp nhận file audio và ảnh
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "audio/mpeg",       // .mp3
    "audio/wav",        // .wav
    "audio/flac",       // .flac
    "audio/ogg",        // .ogg
    "image/jpeg",       // .jpg
    "image/png",        // .png
    "image/webp",       // .webp
    "image/gif",        // .gif
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Định dạng file không được hỗ trợ! Chỉ chấp nhận audio (mp3, wav, flac, ogg) và ảnh (jpg, png, webp, gif)."), false);
  }
};

// 4. Đưa kho chứa đồ cho anh "bốc vác" Multer quản lý (giới hạn 20MB)
const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: fileFilter,
});

module.exports = upload;