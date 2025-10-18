const multer = require("multer");
const path = require("path");
const fs = require("fs");

const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "public/uploads/others";
    const url = req.originalUrl.toLowerCase();//url is a string

    if (url.includes("category")) folder = "public/uploads/categories";// check weather the string contains this as substring
    else if (url.includes("subcategory")) folder = "public/uploads/subcategory";
    else if (url.includes("brand")) folder = "public/uploads/brands";
    else if (url.includes("product")) folder = "public/uploads/products";
    else if (url.includes("variant")) folder = "public/uploads/variants";

    fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only image files are allowed"), false);
};

module.exports = multer({ storage, fileFilter });
