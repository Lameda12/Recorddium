export interface ActionItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface NoteData {
  title: string;
  summary: string;
  actionItems: ActionItem[];
  transcription: string;
}

export interface Recording {
  id: string;
  createdAt: Date;
  duration: number; // in seconds
  data?: NoteData;
  isProcessing: boolean;
  audioBlob?: Blob;
}

export enum RecorderState {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  PROCESSING = 'PROCESSING',
}