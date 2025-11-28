import { WavHeaderOptions } from '../types';

// Declare lamejs global as it is loaded via <script> tag in index.html
declare const lamejs: any;

/**
 * Decodes a base64 string into a Uint8Array.
 */
export const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

/**
 * Creates a WAV file header.
 */
const createWavHeader = (dataLength: number, options: WavHeaderOptions): Uint8Array => {
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);
  
  const { sampleRate, numChannels, bitsPerSample } = options;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  return new Uint8Array(buffer);
};

const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

/**
 * Combines raw PCM data with a WAV header to create a playable Blob.
 */
export const createWavBlob = (pcmData: Uint8Array, sampleRate: number = 24000): Blob => {
  const header = createWavHeader(pcmData.length, {
    sampleRate: sampleRate,
    numChannels: 1,
    bitsPerSample: 16
  });

  const wavBytes = new Uint8Array(header.length + pcmData.length);
  wavBytes.set(header);
  wavBytes.set(pcmData, header.length);

  return new Blob([wavBytes], { type: 'audio/wav' });
};

/**
 * Encodes raw PCM data to MP3 using lamejs.
 * Requires PCM 16-bit signed integer input.
 */
export const createMp3Blob = (pcmData: Uint8Array, sampleRate: number = 24000): Blob => {
  if (typeof lamejs === 'undefined') {
    console.error("Lamejs not loaded");
    throw new Error("La librería MP3 no está cargada. Por favor recarga la página.");
  }

  // Ensure buffer length is even for Int16Array (16-bit samples = 2 bytes)
  let buffer = pcmData.buffer;
  
  // Create a copy if it's a view or if we need padding
  if (pcmData.byteOffset !== 0 || pcmData.length % 2 !== 0) {
      const newLen = pcmData.length + (pcmData.length % 2);
      const newBuffer = new Uint8Array(newLen);
      newBuffer.set(pcmData);
      buffer = newBuffer.buffer;
  }
  
  const samples = new Int16Array(buffer);
  
  // Initialize MP3 Encoder: 1 channel, sampleRate, 128kbps
  const mp3encoder = new lamejs.Mp3Encoder(1, sampleRate, 128);
  
  const mp3Data: Int8Array[] = [];
  const blockSize = 1152; // Standard chunk size for MP3 encoding

  for (let i = 0; i < samples.length; i += blockSize) {
    const sampleChunk = samples.subarray(i, i + blockSize);
    const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
  }

  // Flush the encoder to get the last chunk
  const mp3buf = mp3encoder.flush();
  if (mp3buf.length > 0) {
    mp3Data.push(mp3buf);
  }

  return new Blob(mp3Data, { type: 'audio/mp3' });
};