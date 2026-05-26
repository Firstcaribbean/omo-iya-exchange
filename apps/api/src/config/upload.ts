import multer from "multer";
import path from "path";
import fs from "fs";

// Create directories for upload storage if they don't exist
export const UPLOAD_DIR = path.join(process.cwd(), "uploads");
export const ASSETS_DIR = path.join(UPLOAD_DIR, "assets");
export const IMAGES_DIR = path.join(UPLOAD_DIR, "images");
export const AVATARS_DIR = path.join(UPLOAD_DIR, "avatars");

const dirs = [UPLOAD_DIR, ASSETS_DIR, IMAGES_DIR, AVATARS_DIR];
dirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = IMAGES_DIR;
    
    if (file.fieldname === "avatar") {
      dest = AVATARS_DIR;
    } else if (file.fieldname === "digitalAsset") {
      dest = ASSETS_DIR;
    }
    
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

export const fileFilter = (req: any, file: any, cb: any) => {
  if (file.fieldname === "digitalAsset") {
    // Allow standard compressed/document files for digital goods
    cb(null, true);
  } else {
    // Only allow images for photos
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);
    
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size limit
  },
});
export default upload;
