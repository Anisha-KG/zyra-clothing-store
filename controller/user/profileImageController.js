const User=require('../../models/userScema')

const uploadProfileImage = async (req, res) => {
  try {
    const userId = req.session.user;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const imagePath = "/uploads/profile/" + req.file.filename;

    await User.findByIdAndUpdate(userId, {
      profileImage: imagePath
    });

    res.redirect("/profile"); // go back to profile page
  } 
  catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

module.exports={
    uploadProfileImage
}
