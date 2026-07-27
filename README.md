# Preparation Agent - ATS Resume Analyzer

A MERN stack placement preparation platform with coding practice, ATS resume analysis, and SQL problem-solving.

## PDF OCR Fallback

The resume parser uses pdf2pic + Tesseract.js as a last-resort OCR fallback for image-based PDFs. pdf2pic requires **GraphicsMagick** (recommended) or **ImageMagick** system binaries.

**On Render / Heroku / other cloud deployments:**
- Use a Docker image that includes GraphicsMagick (e.g., `render/node:20-gm`)
- Or install it via a buildpack: `apt-get install -y graphicsmagick`
- Without it, the OCR fallback will fail silently and the parser will return a `PDF_EXTRACTION_FAILED` error for image-only PDFs.

**Local development (Windows):**
- Download and install GraphicsMagick from http://www.graphicsmagick.org/download.html
- Ensure `gm` is in your PATH

## Features
- ATS Resume Analysis (PDF/DOCX/TXT/Image)
- Coding Practice (JavaScript, Python, Java, C++, C)
- SQL Problem Solving
- Topic-based Progress Tracking
- Leaderboard and Analytics
- Company-specific Problem Sets
- Interview Experiences
- Spaced Repetition Revision