const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { cloudinary } = require("../config/cloudinary");

const getCloudinaryStorage = (folderName) =>
  new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: `ZYRA/${folderName}`,
      allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
      transformation: [{ width: 800, height: 800, crop: "limit" }],
    },
  });

const uploadVariantImages = multer({
  storage: getCloudinaryStorage("Variants"),
});

const uploadBrandImages = multer({
  storage: getCloudinaryStorage("Brands"),
});

const uploadCategoryImages = multer({
  storage: getCloudinaryStorage("Categories"),
});
const uploadSubcategoryImages = multer({
  storage: getCloudinaryStorage("Subcategories"),
});
module.exports = {
  uploadVariantImages,
  uploadBrandImages,
  uploadCategoryImages,
  uploadSubcategoryImages
};