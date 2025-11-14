import React, { useState, useRef, useCallback } from 'react';
import CameraView from './components/CameraView';
import OutputDisplay from './components/OutputDisplay';
import Controls from './components/Controls';
import { interpretSign, generateSpeech } from './services/geminiService';
import { playAudio } from './utils/audio';

const App: React.FC = () => {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [interpretedText, setInterpretedText] = useState('');
  const [audioData, setAudioData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Ready');
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const handleToggleCamera = useCallback(() => {
    setIsCameraOn(prev => !prev);
    if (isCameraOn) {
      // Reset state when camera is turned off
      setInterpretedText('');
      setAudioData(null);
      setError(null);
      setStatusMessage('Ready');
    }
  }, [isCameraOn]);

  const captureFrameAndInterpret = useCallback(async () => {
    if (!videoRef.current) return;

    setError(null);
    setInterpretedText('');
    setAudioData(null);
    setIsLoading(true);
    setStatusMessage('Capturing frame...');

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not get canvas context');

      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const imageDataUrl = canvas.toDataURL('image/jpeg');
      const base64ImageData = imageDataUrl.split(',')[1];

      setStatusMessage('Interpreting sign...');
      const text = await interpretSign(base64ImageData);
      setInterpretedText(text);

      if (text && text.toLowerCase() !== 'no clear sign detected.') {
        setStatusMessage('Generating speech...');
        const audio = await generateSpeech(text);
        setAudioData(audio);
      } else {
        setAudioData(null);
      }

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
      setStatusMessage(interpretedText ? `Last interpretation: ${interpretedText}` : 'Ready');
    }
  }, [interpretedText]);

  const handlePlayAudio = useCallback(async () => {
    if (!audioData) return;

    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    setIsPlaying(true);
    try {
        await playAudio(audioData, audioContextRef.current);
    } catch (err) {
        console.error("Error playing audio:", err);
        setError("Could not play audio.");
    } finally {
        setIsPlaying(false);
    }
  }, [audioData]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-6 md:p-8 font-sans">
      <header className="w-full max-w-5xl text-center mb-6">
        <h1 className="text-4xl sm:text-5xl font-bold text-teal-300">Sign to Speech AI</h1>
        <p className="text-lg text-gray-400 mt-2">Interpret ASL with Gemini</p>
      </header>
      
      <main className="w-full max-w-5xl flex-grow flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/2 flex flex-col items-center bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-200">Camera Feed</h2>
          <CameraView isCameraOn={isCameraOn} videoRef={videoRef} />
        </div>
        
        <div className="lg:w-1/2 flex flex-col items-center bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-200">Output</h2>
          <OutputDisplay
            text={interpretedText}
            isLoading={isLoading}
            statusMessage={statusMessage}
            error={error}
          />
        </div>
      </main>

      <footer className="w-full max-w-5xl mt-8">
         <Controls
            isCameraOn={isCameraOn}
            isLoading={isLoading}
            hasAudio={!!audioData}
            isPlaying={isPlaying}
            onToggleCamera={handleToggleCamera}
            onCapture={captureFrameAndInterpret}
            onPlayAudio={handlePlayAudio}
          />
      </footer>
    </div>
  );
};

export default App;
