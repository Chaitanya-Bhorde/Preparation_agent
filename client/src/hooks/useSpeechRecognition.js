import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * useSpeechRecognition — speech-to-text hook.
 *
 * Wraps the browser SpeechRecognition API with a clean interface:
 *   - isSupported: whether the browser supports speech recognition
 *   - isListening: whether recognition is currently active
 *   - transcript: accumulated final transcript
 *   - interimTranscript: current interim (in-progress) text
 *   - error: last error message (null if none)
 *   - start(): begin listening
 *   - stop(): end listening
 *   - reset(): clear transcript and interim text
 *
 * The recognition object is created fresh on each start() so that
 * configuration (lang, continuous, interimResults) is always applied.
 */
export default function useSpeechRecognition({ lang = 'en-US', continuous = true, interimResults = true } = {}) {
  const SpeechRecognition = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null;

  const [isSupported] = useState(() => Boolean(SpeechRecognition));
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  // Stop recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) { /* ignore */ }
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) { /* ignore */ }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  const start = useCallback(() => {
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }
    // If already listening, stop first
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) { /* ignore */ }
    }

    setError(null);
    setInterimTranscript('');

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;

    recognition.onresult = (event) => {
      let finalChunk = '';
      let interimChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalChunk += result[0].transcript + ' ';
        } else {
          interimChunk += result[0].transcript;
        }
      }
      if (finalChunk) setTranscript((prev) => prev + finalChunk);
      setInterimTranscript(interimChunk);
    };

    recognition.onerror = (event) => {
      const errMap = {
        'not-allowed': 'Microphone access denied. Please allow microphone access in your browser settings.',
        'service-not-allowed': 'Microphone access denied. Please allow microphone access in your browser settings.',
        'no-speech': 'No speech detected. Please try again.',
        'audio-capture': 'No microphone found. Please connect a microphone and try again.',
        'network': 'Network error during speech recognition. Please check your connection.',
      };
      setError(errMap[event.error] || `Speech recognition error: ${event.error}`);
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
    } catch (err) {
      setError('Failed to start speech recognition. Please try again.');
      recognitionRef.current = null;
    }
  }, [SpeechRecognition, lang, continuous, interimResults]);

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    error,
    start,
    stop,
    reset,
  };
}
