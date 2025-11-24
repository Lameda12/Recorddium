import React, { useEffect, useState, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { formatDuration } from '../utils/audioUtils';
import { RecorderState } from '../types';

interface RecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void;
  recorderState: RecorderState;
  setRecorderState: (state: RecorderState) => void;
}

export const Recorder: React.FC<RecorderProps> = ({ 
  onRecordingComplete, 
  recorderState,
  setRecorderState 
}) => {
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const startVisualizer = (stream: MediaStream) => {
    if (!canvasRef.current) return;
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;
    const analyser = audioContext.createAnalyser();
    analyserRef.current = analyser;
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    
    if (!canvasCtx) return;

    const draw = () => {
      const WIDTH = canvas.width;
      const HEIGHT = canvas.height;
      
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.5)'; // Clear with slight trail for fade effect
      canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

      const barWidth = (WIDTH / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        
        // Gradient color for bars
        const gradient = canvasCtx.createLinearGradient(0, HEIGHT, 0, HEIGHT - barHeight);
        gradient.addColorStop(0, '#6366f1'); // Indigo 500
        gradient.addColorStop(1, '#a855f7'); // Purple 500
        
        canvasCtx.fillStyle = gradient;
        canvasCtx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    draw();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      startVisualizer(stream);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(blob, duration);
        setDuration(0);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Stop visualizer
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      };

      mediaRecorder.start();
      setRecorderState(RecorderState.RECORDING);
      
      timerRef.current = window.setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access is required to record.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recorderState === RecorderState.RECORDING) {
      mediaRecorderRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      setRecorderState(RecorderState.PROCESSING);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
      
      {/* Background/Visualizer */}
      <div className="absolute inset-0 w-full h-full z-0 flex items-end opacity-20 pointer-events-none">
         <canvas ref={canvasRef} width={600} height={200} className="w-full h-1/2" />
      </div>

      <div className="z-10 flex flex-col items-center space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">
            {recorderState === RecorderState.RECORDING ? 'Listening...' : 'Ready to Record'}
          </h2>
          <p className="text-slate-500">
            {recorderState === RecorderState.PROCESSING 
              ? 'AI is analyzing your conversation...' 
              : 'Capture your meeting notes instantly'}
          </p>
        </div>

        <div className="relative">
          {/* Ripple Effect Ring */}
          {recorderState === RecorderState.RECORDING && (
            <div className="absolute inset-0 rounded-full bg-indigo-500 opacity-20 animate-ping"></div>
          )}
          
          <button
            onClick={recorderState === RecorderState.RECORDING ? stopRecording : startRecording}
            disabled={recorderState === RecorderState.PROCESSING}
            className={`
              relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl
              ${recorderState === RecorderState.RECORDING 
                ? 'bg-red-500 hover:bg-red-600' 
                : recorderState === RecorderState.PROCESSING
                  ? 'bg-slate-100'
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105'
              }
            `}
          >
            {recorderState === RecorderState.RECORDING ? (
              <Square className="w-8 h-8 text-white fill-current" />
            ) : recorderState === RecorderState.PROCESSING ? (
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            ) : (
              <Mic className="w-10 h-10 text-white" />
            )}
          </button>
        </div>

        <div className="text-3xl font-mono font-medium text-slate-700 tracking-wider">
          {formatDuration(duration)}
        </div>
      </div>
    </div>
  );
};