// Tải ảnh lên Cloudinary và trả về URL
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file && !req.files) {
      return res.status(400).json({ message: 'Không có file được tải lên' });
    }
    
    // URL ảnh trên Cloudinary nằm sẵn ở req.file.path
    const imageUrl = req.file.path; 
    
    res.status(200).json({
      success: true,
      imageUrl: imageUrl
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};