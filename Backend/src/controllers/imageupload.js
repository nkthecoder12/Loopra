const User = require("../models/User");

const uploadProfileImage = async (req, res) => {
  try {
    const imageUrl = req.file.path; // Cloudinary URL

    await User.findByIdAndUpdate(req.user.id, {
      profileImage: imageUrl
    }
  );


  

    res.json({
      success: true,
      message: "Profile image uploaded",
      image: imageUrl
    });
  } catch (error) {
    res.status(500).json({ message: "Image upload failed" });
  }
};
module.exports={uploadProfileImage};


