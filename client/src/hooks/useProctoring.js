import { useState, useRef, useCallback, useEffect } from 'react';

const MAX_WARNINGS = 2;
const FACE_CHECK_INTERVAL = 3000;
const FACE_THRESHOLD = 0.15;
const DEBOUNCE_MS = 1000;

export default function useProctoring({ enabled = false, onViolation, onAutoSubmit }) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [faceDetected, setFaceDetected] = useState(true);
  const [violationCount, setViolationCount] = useState(0);
  const [lastWarning, setLastWarning] = useState(null);
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const faceCheckRef = useRef(null);
  const lastViolationRef = useRef(0);
  const violationCountRef = useRef(0);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera API not supported in this browser.');
      return false;
    }
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      return true;
    } catch (err) {
      const msg = err.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access.'
        : err.name === 'NotFoundError'
          ? 'No camera found. Please connect a webcam.'
          : 'Could not access camera.';
      setCameraError(msg);
      setCameraActive(false);
      return false;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  const checkFacePresence = useCallback(() => {
    if (!videoRef.current || !cameraActive) return true;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return true;
    if (!canvasRef.current) canvasRef.current = document.createElement('canvas');
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const sampleSize = 160;
    canvas.width = sampleSize;
    canvas.height = sampleSize;
    const sx = Math.floor((video.videoWidth - sampleSize) / 2);
    const sy = Math.floor((video.videoHeight - sampleSize) / 2);
    ctx.drawImage(video, sx, sy, sampleSize, sampleSize, 0, 0, sampleSize, sampleSize);
    const frame = ctx.getImageData(0, 0, sampleSize, sampleSize);
    const data = frame.data;
    let skinPixels = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15) skinPixels++;
    }
    const ratio = skinPixels / (sampleSize * sampleSize);
    const detected = ratio > FACE_THRESHOLD;
    setFaceDetected(detected);
    return detected;
  }, [cameraActive]);

  const handleViolation = useCallback((reason) => {
    const now = Date.now();
    if (now - lastViolationRef.current < DEBOUNCE_MS) return;
    lastViolationRef.current = now;
    const newCount = violationCountRef.current + 1;
    violationCountRef.current = newCount;
    setViolationCount(newCount);
    console.log(`[Proctoring] Violation ${newCount}/${MAX_WARNINGS + 1}: ${reason}`);
    if (newCount > MAX_WARNINGS) {
      setAutoSubmitted(true);
      console.log('[Proctoring] Auto-submitting interview due to repeated violations.');
      onAutoSubmit?.(reason);
    } else {
      const warningMsg = newCount === 1
        ? 'Warning 1/2: Abnormal activity detected. Please remain focused on the interview and keep your face visible.'
        : 'Warning 2/2: Another abnormal activity was detected. One more violation will automatically submit your interview.';
      setLastWarning({ message: warningMsg, reason, count: newCount, at: new Date() });
      onViolation?.(reason, newCount);
    }
  }, [onViolation, onAutoSubmit]);

  useEffect(() => {
    if (!enabled || autoSubmitted) return;
    const handleVisibilityChange = () => { if (document.visibilityState === 'hidden') handleViolation('TAB_SWITCH'); };
    const handleWindowBlur = () => { if (document.visibilityState !== 'hidden') handleViolation('WINDOW_BLUR'); };
    const handleBeforeUnload = (e) => { if (!autoSubmitted) { e.preventDefault(); e.returnValue = 'Are you sure you want to leave? Your interview will be submitted.'; return e.returnValue; } };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, autoSubmitted, handleViolation]);

  useEffect(() => {
    if (!enabled || !cameraActive || autoSubmitted) return;
    const initialTimer = setTimeout(() => checkFacePresence(), 2000);
    faceCheckRef.current = setInterval(() => { const d = checkFacePresence(); if (!d) handleViolation('NO_FACE'); }, FACE_CHECK_INTERVAL);
    return () => { clearTimeout(initialTimer); if (faceCheckRef.current) { clearInterval(faceCheckRef.current); faceCheckRef.current = null; } };
  }, [enabled, cameraActive, autoSubmitted, checkFacePresence, handleViolation]);

  useEffect(() => { return () => { stopCamera(); if (faceCheckRef.current) clearInterval(faceCheckRef.current); }; }, [stopCamera]);

  const reset = useCallback(() => {
    violationCountRef.current = 0;
    setViolationCount(0);
    setLastWarning(null);
    setAutoSubmitted(false);
    setFaceDetected(true);
    lastViolationRef.current = 0;
  }, []);

  return { videoRef, canvasRef, cameraActive, cameraError, faceDetected, violationCount, lastWarning, autoSubmitted, maxWarnings: MAX_WARNINGS, startCamera, stopCamera, reset, checkFacePresence };
}