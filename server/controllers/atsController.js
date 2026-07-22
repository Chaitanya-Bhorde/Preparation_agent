const { analyzeResume, extractResumeText } = require('../utils/atsAnalyzer');
const User = require('../models/User');
const { getFileUrl, isConfigured } = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

exports.analyzeResumeFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a resume file' });
    }
    let fileBuffer;
    let fileName;
    if (isConfigured) {
      const response = await fetch(req.file.path);
      const arrayBuffer = await response.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
      fileName = req.file.originalname;
    } else {
      fileBuffer = fs.readFileSync(req.file.path);
      fileName = req.file.originalname;
    }
    const text = await extractResumeText(fileBuffer, req.file.mimetype, fileName);
    const result = analyzeResume(text);
    const fileUrl = getFileUrl(req.file);
    await User.findByIdAndUpdate(req.user.id, {
      'profile.atsScore': result.total_score,
      'profile.resumeUrl': fileUrl,
    });
    res.status(200).json({
      success: true,
      data: { ...result, fileUrl },
    });
  } catch (error) {
    if (error.message === 'PDF_EXTRACTION_FAILED') {
      return res.status(400).json({ 
        success: false, 
        message: 'PDF extraction failed completely - the document appears to be image-only or corrupted. Please use a text-based PDF, DOCX, or paste your resume text directly.' 
      });
    }
    if (error.message === 'PARSE_FAILURE') {
      return res.status(400).json({ 
        success: false, 
        message: 'Resume text could not be read properly. This may happen if:\n• The document is a scanned image with poor quality\n• The PDF contains only images without text\n• OCR extraction failed to recognize content\n\nSuggestions:\n• Try uploading a text-based PDF or DOCX file\n• Ensure the document is clear and well-formatted\n• Or paste your resume text directly in the text area' 
      });
    }
    if (error.message === 'UNSUPPORTED_FORMAT') {
      return res.status(400).json({ success: false, message: 'Unsupported file format. Please upload PDF, DOCX, DOC, TXT, or image files.' });
    }
    console.error('Resume analysis error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while analyzing the resume. Please try again.' });
  }
};

exports.analyzeResumeText = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: 'Please provide resume text' });
    }
    if (text.trim().length < 100) {
      return res.status(400).json({ success: false, message: 'Resume text is too short. Please provide more content (at least 100 characters).' });
    }
    const result = analyzeResume(text);
    await User.findByIdAndUpdate(req.user.id, {
      'profile.atsScore': result.total_score,
    });
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a profile picture' });
    }
    const fileUrl = getFileUrl(req.file);
    await User.findByIdAndUpdate(req.user.id, {
      'profile.profilePicture': fileUrl,
    });
    res.status(200).json({
      success: true,
      data: { url: fileUrl },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
