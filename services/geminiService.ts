import { GoogleGenAI, Type } from "@google/genai";
import { NoteData } from "../types";
import { getApiKey } from "../utils/apiKeyStorage";

const getAiInstance = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Gemini API key is not set. Please configure it in settings.");
  }
  return new GoogleGenAI({ apiKey });
};

const MODEL_NAME = "gemini-2.5-flash";

export const processAudioRecording = async (base64Audio: string, mimeType: string): Promise<NoteData> => {
  try {
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio,
            },
          },
          {
            text: `You are an expert sales assistant. Analyze this audio recording.
            1. Create a professional, short title for the meeting.
            2. Write a concise executive summary of the conversation.
            3. Extract clear, actionable next steps (action items).
            4. Provide a clean full transcription.
            
            Return the result strictly in JSON.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            actionItems: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            transcription: { type: Type.STRING },
          },
          required: ["title", "summary", "actionItems", "transcription"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response from AI");
    }

    const rawData = JSON.parse(resultText);

    // Transform simple strings into ActionItem objects
    const actionItems = (rawData.actionItems || []).map((text: string) => ({
      id: crypto.randomUUID(),
      text: text,
      completed: false
    }));

    return {
      ...rawData,
      actionItems
    } as NoteData;
  } catch (error) {
    console.error("Gemini processing error:", error);
    throw error;
  }
};