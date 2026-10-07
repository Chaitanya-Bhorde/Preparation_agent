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
  const [faceWarningCount, setFaceWarningCount] = useState(0);
  const [lastWarning, setLastWarning] = useState(null);
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const faceCheckRef = useRef(null);
  const lastViolationRef = useRef(0);
  const violationCountRef = useRef(0);
  const faceWarningRef = useRef(0);
  const autoSubmittedRef = useRef(false);

  // Callbacks are read through refs so `handleViolation` keeps a STABLE identity.
  // If they were `useCallback` dependencies instead, every parent re-render
  // would replace them, and the interval effect below (which depends on
  // `handleViolation`) would be torn down and recreated on every render. The
  // interview screen re-renders once per second for the elapsed timer, so a
  // 3s interval would never survive long enough to fire and face detection
  // would silently never run.
  const onViolationRef = useRef(onViolation);
  const onAutoSubmitRef = useRef(onAutoSubmit);
  const cameraActiveRef = useRef(false);

  useEffect(() => { onViolationRef.current = onViolation; }, [onViolation]);
  useEffect(() => { onAutoSubmitRef.current = onAutoSubmit; }, [onAutoSubmit]);
  useEffect(() => { cameraActiveRef.current = cameraActive; }, [cameraActive]);

  const attachStream = useCallback((video) => {
    if (!video || !streamRef.current || video.srcObject === streamRef.current) return;
    try {
      video.srcObject = streamRef.current;
      const p = video.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (err) {
      // A detached/unsupported element must not abort camera start-up.
      console.warn('[Proctoring] could not attach camera stream:', err.message);
    }
  }, []);

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
      attachStream(videoRef.current);
      cameraActiveRef.current = true;
      setCameraActive(true);
      return true;
    } catch (err) {
      const msg = err.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access.'
        : err.name === 'NotFoundError'
          ? 'No camera found. Please connect a webcam.'
          : 'Could not access camera.';
      setCameraError(msg);
      cameraActiveRef.current = false;
      setCameraActive(false);
      return false;
    }
  }, [attachStream]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    cameraActiveRef.current = false;
    setCameraActive(false);
  }, []);

  const checkFacePresence = useCallback(() => {
    if (!videoRef.current || !cameraActiveRef.current) return true;
    const video = videoRef.current;
    // Not yet decoded (no frames) — treat as "cannot judge" rather than a
    // violation, so a slow first frame never triggers a false warning.
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
  }, []);

  const handleViolation = useCallback((reason) => {
    const now = Date.now();
    if (now - lastViolationRef.current < DEBOUNCE_MS) return;
    lastViolationRef.current = now;
    // Camera/face absence is advisory only: it must NEVER drive the
    // auto-submit counter. Tab-switch / window-blur are the only signals
    // that may end the interview. A shared counter would let two NO_FACE
    // warnings plus one tab switch (or three NO_FACE ticks) submit the
    // interview, which is exactly the reported warning-warning-submit bug.
    if (reason === 'NO_FACE') {
      const nextFace = faceWarningRef.current + 1;
      faceWarningRef.current = nextFace;
      setFaceWarningCount(nextFace);
      const faceMsg = nextFace <= 1
        ? 'Camera check: no face detected. Please keep your face visible in the camera frame.'
        : 'Camera check: still no face detected. Please adjust your camera — this warning will never auto-submit your interview.';
      setLastWarning({ message: faceMsg, reason, count: Math.min(nextFace, MAX_WARNINGS), at: new Date() });
      onViolationRef.current?.(reason, nextFace);
      return;
    }
    const newCount = violationCountRef.current + 1;
    violationCountRef.current = newCount;
    setViolationCount(newCount);
    console.log(`[Proctoring] Violation ${newCount}/${MAX_WARNINGS + 1}: ${reason}`);
    if (newCount > MAX_WARNINGS) {
      // Ref guard, not just state: `autoSubmitted` only flips on the next
      // render, so a second sampler tick inside the same window would fire the
      // auto-submit callback twice (two submits, two reports).
      if (autoSubmittedRef.current) return;
      autoSubmittedRef.current = true;
      setAutoSubmitted(true);
      console.log('[Proctoring] Auto-submitting interview due to repeated violations.');
      onAutoSubmitRef.current?.(reason);
    } else {
      const warningMsg = newCount === 1
        ? 'Warning 1/2: Abnormal activity detected. Please remain focused on the interview and keep your face visible.'
        : 'Warning 2/2: Another abnormal activity was detected. One more violation will automatically submit your interview.';
      setLastWarning({ message: warningMsg, reason, count: newCount, at: new Date() });
      onViolationRef.current?.(reason, newCount);
    }
  }, []);

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

  // Face sampling must survive re-renders: both `checkFacePresence` and
  // `handleViolation` are stable now, so this effect only re-runs when the
  // camera is actually started/stopped.
  useEffect(() => {
    if (!enabled || !cameraActive || autoSubmitted) return;
    const initialTimer = setTimeout(() => checkFacePresence(), 2000);
    faceCheckRef.current = setInterval(() => { const d = checkFacePresence(); if (!d) handleViolation('NO_FACE'); }, FACE_CHECK_INTERVAL);
    return () => { clearTimeout(initialTimer); if (faceCheckRef.current) { clearInterval(faceCheckRef.current); faceCheckRef.current = null; } };
  }, [enabled, cameraActive, autoSubmitted, checkFacePresence, handleViolation]);

  // The <video> element is rendered conditionally, so it can mount after
  // getUserMedia() already resolved. Re-attach the live stream whenever the
  // element appears, otherwise videoWidth stays 0 and no frame is ever sampled.
  const setVideoElement = useCallback((el) => {
    videoRef.current = el;
    attachStream(el);
  }, [attachStream]);

  useEffect(() => { return () => { stopCamera(); if (faceCheckRef.current) clearInterval(faceCheckRef.current); }; }, [stopCamera]);

  const reset = useCallback(() => {
    violationCountRef.current = 0;
    faceWarningRef.current = 0;
    autoSubmittedRef.current = false;
    setViolationCount(0);
    setFaceWarningCount(0);
    setLastWarning(null);
    setAutoSubmitted(false);
    setFaceDetected(true);
    lastViolationRef.current = 0;
  }, []);

  return { videoRef, setVideoElement, canvasRef, cameraActive, cameraError, faceDetected, violationCount, faceWarningCount, lastWarning, autoSubmitted, maxWarnings: MAX_WARNINGS, startCamera, stopCamera, reset, checkFacePresence };
}