import { GoogleGenAI, Modality } from "@google/genai";
import { VoiceName, AudioFormat } from "../types";
import { base64ToUint8Array, createWavBlob, createMp3Blob } from "../utils/audioUtils";

// Safely access process.env to prevent ReferenceError in browser if process is not polyfilled
const API_KEY = (typeof process !== 'undefined' && process.env?.API_KEY) ? process.env.API_KEY : "";

// Initialize Gemini client
const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Generates audio from text using Gemini 2.5 Flash TTS model.
 * Returns a URL for the generated audio file in the requested format.
 */
export const generateSpeech = async (
  text: string, 
  voice: VoiceName,
  format: AudioFormat = 'wav'
): Promise<{ audioUrl: string }> => {
  if (!API_KEY) {
    throw new Error("La clave API no está configurada.");
  }

  try {
    const speechConfig = {
      voiceConfig: {
        prebuiltVoiceConfig: { 
          voiceName: voice,
        },
      },
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: speechConfig,
      },
    });

    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.[0];

    if (!audioPart || !audioPart.inlineData || !audioPart.inlineData.data) {
      throw new Error("No se generó contenido de audio en la respuesta.");
    }

    // Convert Base64 string to Uint8Array (Raw PCM)
    const pcmData = base64ToUint8Array(audioPart.inlineData.data);
    
    let audioBlob: Blob;

    // Create Blob based on selected format
    if (format === 'mp3') {
       audioBlob = createMp3Blob(pcmData, 24000); // 24kHz
    } else {
       audioBlob = createWavBlob(pcmData, 24000); // 24kHz
    }

    // Create object URL
    const audioUrl = URL.createObjectURL(audioBlob);

    return { audioUrl };

  } catch (error: any) {
    console.error("Error en generateSpeech:", error);
    throw new Error(error.message || "Error al generar el audio.");
  }
};