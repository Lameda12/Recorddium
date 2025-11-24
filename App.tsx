import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Recorder } from './components/Recorder';
import { NoteView } from './components/NoteView';
import { ApiKeyModal } from './components/ApiKeyModal';
import { Recording, RecorderState } from './types';
import { processAudioRecording } from './services/geminiService';
import { blobToBase64 } from './utils/audioUtils';
import { hasApiKey } from './utils/apiKeyStorage';
import { AlertCircle, Settings } from 'lucide-react';

export default function App() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [recorderState, setRecorderState] = useState<RecorderState>(RecorderState.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  // Check for API key on mount
  useEffect(() => {
    if (!hasApiKey()) {
      setShowApiKeyModal(true);
    }
  }, []);

  const handleNewRecording = () => {
    setSelectedId(null);
    setRecorderState(RecorderState.IDLE);
    setError(null);
  };

  const handleRecordingComplete = async (blob: Blob, duration: number) => {
    // Check for API key before processing
    if (!hasApiKey()) {
      setError("Please configure your Gemini API key in settings first.");
      setShowApiKeyModal(true);
      return;
    }

    const newId = crypto.randomUUID();
    const newRecording: Recording = {
      id: newId,
      createdAt: new Date(),
      duration: duration,
      isProcessing: true,
      audioBlob: blob,
    };

    setRecordings(prev => [newRecording, ...prev]);
    setSelectedId(newId);

    try {
      const base64Audio = await blobToBase64(blob);
      // Gemini processing
      const noteData = await processAudioRecording(base64Audio, blob.type);

      setRecordings(prev => prev.map(rec => 
        rec.id === newId 
          ? { ...rec, isProcessing: false, data: noteData } 
          : rec
      ));
      setRecorderState(RecorderState.IDLE);
    } catch (err) {
      setError("Failed to process recording with AI. Please try again.");
      setRecordings(prev => prev.filter(rec => rec.id !== newId));
      setSelectedId(null);
      setRecorderState(RecorderState.IDLE);
    }
  };

  const handleToggleTask = (recordingId: string, taskId: string) => {
    setRecordings(prev => prev.map(rec => {
      if (rec.id !== recordingId || !rec.data) return rec;
      return {
        ...rec,
        data: {
          ...rec.data,
          actionItems: rec.data.actionItems.map(item => 
            item.id === taskId ? { ...item, completed: !item.completed } : item
          )
        }
      };
    }));
  };

  const selectedRecording = recordings.find(r => r.id === selectedId);

  return (
    <>
      <ApiKeyModal 
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSave={() => setError(null)}
      />
      <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="hidden md:block">
        <Sidebar 
          recordings={recordings}
          onSelect={setSelectedId}
          selectedId={selectedId}
          onNew={handleNewRecording}
          onOpenSettings={() => setShowApiKeyModal(true)}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 relative">
        
        {/* Mobile Header (Only visible on small screens) */}
        <div className="md:hidden p-4 bg-white border-b border-slate-200 flex justify-between items-center">
             <h1 className="font-bold text-slate-800">Recordium</h1>
             <div className="flex items-center space-x-3">
               <button 
                 onClick={() => setShowApiKeyModal(true)}
                 className="p-2 text-slate-600 hover:text-slate-800"
                 title="Settings"
               >
                 <Settings className="w-5 h-5" />
               </button>
               <button onClick={handleNewRecording} className="text-indigo-600 font-medium">New</button>
             </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          {!selectedId ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="max-w-2xl w-full">
                 <Recorder 
                    onRecordingComplete={handleRecordingComplete}
                    recorderState={recorderState}
                    setRecorderState={setRecorderState}
                 />
              </div>
            </div>
          ) : (
            <div className="h-full">
              {selectedRecording?.isProcessing ? (
                <div className="h-full flex flex-col items-center justify-center space-y-4">
                  <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  <h3 className="text-xl font-semibold text-slate-700">Transcribing & Analyzing...</h3>
                  <p className="text-slate-500">Gemini is extracting action items from your conversation.</p>
                </div>
              ) : selectedRecording?.data ? (
                <NoteView 
                  data={selectedRecording.data} 
                  createdAt={selectedRecording.createdAt} 
                  onToggleActionItem={(taskId) => handleToggleTask(selectedId, taskId)}
                />
              ) : (
                <div className="text-center text-slate-500">Error loading note data.</div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
    </>
  );
}