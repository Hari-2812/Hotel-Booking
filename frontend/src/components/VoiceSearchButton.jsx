import { useEffect, useRef, useState } from 'react';

export default function VoiceSearchButton({ onResult, disabled = false }) {
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [supported] = useState(() => Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const instance = new SpeechRecognition();
    instance.lang = 'en-US';
    instance.interimResults = false;
    instance.maxAlternatives = 1;
    recognitionRef.current = instance;

    return () => {
      recognitionRef.current = null;
    };
  }, []);

  function startListening() {
    const recognition = recognitionRef.current;
    if (!recognition || disabled) return;

    recognition.onstart = () => setListening(true);
    recognition.onresult = (event) => {
      const transcript = event?.results?.[0]?.[0]?.transcript;
      if (transcript) onResult?.(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.start();
  }

  if (!supported) {
    return (
      <button type="button" className="btn-secondary h-14 px-6" disabled>
        Voice unavailable
      </button>
    );
  }

  return (
    <button type="button" className="btn-secondary h-14 px-6" onClick={startListening} disabled={disabled || listening}>
      {listening ? 'Listening…' : 'Voice search'}
    </button>
  );
}
