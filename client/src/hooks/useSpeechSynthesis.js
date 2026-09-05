import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * useSpeechSynthesis — text-to-speech hook.
 *
 * Provides a speak() function that uses the browser's SpeechSynthesis API.
 * Also exposes isSpeaking, isSupported, and a cancel() function.
 *
 * The hook is intentionally decoupled from useSpeechRecognition so that
 * each capability can be replaced independently.
 */
export default function useSpeechSynthesis({ lang = 'en-US', rate = 1, pitch = 1, volume = 1 } = {}) {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  const [isSupported] = useState(() => Boolean(synth));
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef(null);

  // Cancel any in-flight speech on unmount
  useEffect(() => {
    return () => {
      if (synth) synth.cancel();
    };
  }, [synth]);

  const cancel = useCallback(() => {
    if (synth) synth.cancel();
    setIsSpeaking(false);
  }, [synth]);

  const speak = useCallback((text) => {
    return new Promise((resolve) => {
      if (!synth || !text) return resolve();

      // Cancel any current speech
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
        resolve();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
        resolve();
      };

      utteranceRef.current = utterance;
      synth.speak(utterance);
    });
  }, [synth, lang, rate, pitch, volume]);

  return {
    isSupported,
    isSpeaking,
    speak,
    cancel,
  };
}
