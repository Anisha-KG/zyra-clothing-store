const multer = require("multer");
const path = require("path");
const fs = require("fs");

const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder;
    const originalUrl = req.originalUrl.toLowerCase();
    if (originalUrl.includes("variant")) {
      folder = path.join(__dirname, "..", "public", "uploads", "variants");
    } else if (originalUrl.includes("brand")) {
      folder = path.join(__dirname, "..", "public", "uploads", "brands");
    } else if (originalUrl.includes("category")) {
      folder = path.join(__dirname, "..", "public", "uploads", "categories");
    } else {
      folder = path.join(__dirname, "..", "public", "uploads", "others");
    }

    fs.mkdirSync(folder, { recursive: true });
    console.log("Saving file to folder:", folder);
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only image files are allowed"), false);
};

module.exports = multer({ storage, fileFilter });