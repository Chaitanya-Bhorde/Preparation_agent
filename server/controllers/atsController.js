const { analyzeResume, extractResumeText } = require('../utils/atsAnalyzer');
const { generateRewriteSuggestions } = require('../utils/resumeRewriter');
const { evaluateResume } = require('../utils/strictAtsEvaluator');
const User = require('../models/User');
const RoleRequirements = require('../models/RoleRequirements');
const { getFileUrl, isConfigured } = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

exports.analyzeResumeFile = async (req, res) => {
  try {
    console.log('[ATS_ANALYZE] Resume analysis started');
    console.log('[ATS_ANALYZE] User:', req.user?.id);

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a resume file' });
    }

    // --- Step 1: Load file buffer ---
    let fileBuffer;
    let fileName;
    try {
      if (isConfigured) {
        const response = await fetch(req.file.path);
        if (!response.ok) {
          throw new Error(`CLOUDINARY_FETCH_FAILED: HTTP ${response.status} ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuffer);
        fileName = req.file.originalname;
        console.log('[ATS_ANALYZE] Cloudinary fetch succeeded, buffer size:', fileBuffer.length);
      } else {
        fileBuffer = fs.readFileSync(req.file.path);
        fileName = req.file.originalname;
        console.log('[ATS_ANALYZE] Local file read succeeded, buffer size:', fileBuffer.length);
      }
    } catch (fileError) {
      console.error('[ATS_ANALYZE] FILE LOAD FAILED:', fileError.message);
      return res.status(500).json({
        success: false,
        message: `Failed to load uploaded file: ${fileError.message}`,
      });
    }
    console.log('[ATS_ANALYZE] File loaded, size:', fileBuffer.length, 'bytes');

    // --- Step 2: Extract text ---
    let text;
    try {
      text = await extractResumeText(fileBuffer, req.file.mimetype, fileName);
      console.log('[ATS_ANALYZE] Text extracted, length:', text.length, 'chars');
      console.log('[ATS_ANALYZE] First 300 chars:', JSON.stringify(text.slice(0, 300)));
      if (!text || text.trim().length < 50) {
        return res.status(400).json({
          success: false,
          message: "Couldn't extract text from this PDF — try a different file (text-based PDF or DOCX works best)."
        });
      }
    } catch (extractError) {
      console.error('[ATS_ANALYZE] TEXT EXTRACTION FAILED:', extractError.message);
      if (extractError.message === 'PDF_EXTRACTION_FAILED') {
        return res.status(400).json({
          success: false,
          message: 'PDF extraction failed completely - the document appears to be image-only or corrupted. Please use a text-based PDF or DOCX file.'
        });
      }
      if (extractError.message === 'PARSE_FAILURE') {
        return res.status(400).json({
          success: false,
          message: 'Resume text could not be read properly. This may happen if:\n• The document is a scanned image with poor quality\n• The PDF contains only images without text\n• OCR extraction failed to recognize content\n\nSuggestions:\n• Try uploading a text-based PDF or DOCX file\n• Ensure the document is clear and well-formatted'
        });
      }
      if (extractError.message === 'UNSUPPORTED_FORMAT') {
        return res.status(400).json({ success: false, message: 'Unsupported file format. Please upload PDF, DOCX, DOC, TXT, or image files.' });
      }
      throw extractError;
    }

    // --- Step 3: Find role requirements ---
    const roleName = req.body.role || null;
    console.log('[ATS_ANALYZE] Role selection:', roleName ? 'provided' : 'none');

    let roleRequirements = null;
    if (roleName) {
      try {
        // Try exact match first
        roleRequirements = await RoleRequirements.findOne({ role: roleName, isActive: true });

        // If not found, try case-insensitive match
        if (!roleRequirements) {
          console.log('[ATS_ANALYZE] Exact role match not found, trying case-insensitive');
          const allRoles = await RoleRequirements.find({ isActive: true }).select('role');
          for (const r of allRoles) {
            if (r.role.toLowerCase() === roleName.toLowerCase()) {
              roleRequirements = await RoleRequirements.findById(r._id);
              console.log('[ATS_ANALYZE] Found case-insensitive match');
              break;
            }
          }
        }

        if (!roleRequirements) {
          console.log('[ATS_ANALYZE] WARNING: No role requirements found');
        } else {
          console.log('[ATS_ANALYZE] Role requirements found, keywords count:', roleRequirements.keywords?.length, 'requiredSkills count:', roleRequirements.requiredSkills?.length);
        }
      } catch (roleError) {
        console.error('[ATS_ANALYZE] ROLE FETCH FAILED:', roleError.message);
        // Continue without role requirements - non-fatal
        console.log('[ATS_ANALYZE] Continuing without role requirements');
      }
    }

    // --- Step 4: Analyze resume ---
    // Use strict evaluator if 'strict=true' is passed, otherwise use legacy analyzer
    const useStrict = req.body.strict === 'true' || req.body.strict === true;
    let result;
    try {
      if (useStrict) {
        console.log('[ATS_ANALYZE] Using strict evaluator');
        result = evaluateResume(text, roleName || undefined);
      } else {
        result = analyzeResume(text, roleRequirements);
      }
      console.log('[ATS_ANALYZE] Analysis complete, total_score:', result.total_score);
      console.log('[ATS_ANALYZE] Category scores:', JSON.stringify(result.category_scores));
    } catch (analyzeError) {
      console.error('[ATS_ANALYZE] RESUME ANALYSIS FAILED:', analyzeError.message);
      throw analyzeError;
    }

    // --- Step 5: Generate rewrite suggestions ---
    let rewriteSuggestions;
    try {
      if (useStrict && result.rewrite_suggestions) {
        rewriteSuggestions = result.rewrite_suggestions;
      } else {
        rewriteSuggestions = generateRewriteSuggestions(text, result);
      }
      console.log('[ATS_ANALYZE] Rewrite suggestions generated, count:', rewriteSuggestions?.length || 0);
    } catch (rewriteError) {
      console.error('[ATS_ANALYZE] REWRITE GENERATION FAILED:', rewriteError.message);
      rewriteSuggestions = [];
    }

    // --- Step 6: Update user profile ---
    try {
      const fileUrl = getFileUrl(req.file);
      await User.findByIdAndUpdate(req.user.id, {
        'profile.atsScore': result.total_score,
        'profile.resumeUrl': fileUrl,
      });
      console.log('[ATS_ANALYZE] User profile updated');
      res.status(200).json({
        success: true,
        data: { ...result, fileUrl, rewriteSuggestions },
      });
    } catch (updateError) {
      console.error('[ATS_ANALYZE] USER UPDATE FAILED:', updateError.message);
      // Still return the analysis even if DB update fails
      const fileUrl = getFileUrl(req.file);
      res.status(200).json({
        success: true,
        data: { ...result, fileUrl, rewriteSuggestions },
      });
    }
  } catch (error) {
    console.error('[ATS_ANALYZE] ===== FATAL ERROR =====');
    console.error('[ATS_ANALYZE] Error name:', error.name);
    console.error('[ATS_ANALYZE] Error message:', error.message);

    if (error.message === 'PDF_EXTRACTION_FAILED') {
      return res.status(400).json({
        success: false,
        message: 'PDF extraction failed completely - the document appears to be image-only or corrupted. Please use a text-based PDF or DOCX file.'
      });
    }
    if (error.message === 'PARSE_FAILURE') {
      return res.status(400).json({
        success: false,
        message: 'Resume text could not be read properly. This may happen if:\n• The document is a scanned image with poor quality\n• The PDF contains only images without text\n• OCR extraction failed to recognize content\n\nSuggestions:\n• Try uploading a text-based PDF or DOCX file\n• Ensure the document is clear and well-formatted'
      });
    }
    if (error.message === 'UNSUPPORTED_FORMAT') {
      return res.status(400).json({ success: false, message: 'Unsupported file format. Please upload PDF, DOCX, DOC, TXT, or image files.' });
    }
    res.status(500).json({ success: false, message: `An error occurred while analyzing the resume: ${error.message}` });
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
