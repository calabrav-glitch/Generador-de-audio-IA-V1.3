import React, { useState, useRef, useEffect } from 'react';
import { generateSpeech } from './services/geminiService';
import { VoiceName, HistoryItem, AudioFormat } from './types';
import Header from './components/Header';
import { IconLoader, IconDownload, IconWaveform } from './components/Icons';

// Configuración de voces con etiquetas de género y descripción
const VOICE_DETAILS: Record<VoiceName, { label: string; gender: 'Masculino' | 'Femenino'; desc: string }> = {
  [VoiceName.Puck]: { label: 'Puck', gender: 'Masculino', desc: 'Neutro' },
  [VoiceName.Charon]: { label: 'Charon', gender: 'Masculino', desc: 'Profundo' },
  [VoiceName.Fenrir]: { label: 'Fenrir', gender: 'Masculino', desc: 'Intenso' },
  [VoiceName.Orpheus]: { label: 'Orpheus', gender: 'Masculino', desc: 'Confiado' },
  [VoiceName.Kore]: { label: 'Kore', gender: 'Femenino', desc: 'Suave' },
  [VoiceName.Zephyr]: { label: 'Zephyr', gender: 'Femenino', desc: 'Claro' },
  [VoiceName.Aoede]: { label: 'Aoede', gender: 'Femenino', desc: 'Expresivo' },
  [VoiceName.Leda]: { label: 'Leda', gender: 'Femenino', desc: 'Cálido' },
};

// Componente auxiliar para manejar la velocidad de reproducción de audio
const AudioPlayer: React.FC<{ src: string; playbackRate: number; className?: string }> = ({ src, playbackRate, className }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, src]);

  return (
    <audio 
      ref={audioRef}
      controls 
      src={src} 
      className={className}
      style={{ filter: 'invert(0.9) hue-rotate(180deg)' }} 
    />
  );
};

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>(VoiceName.Puck);
  const [selectedFormat, setSelectedFormat] = useState<AudioFormat>('wav');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Historial de audios
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateSpeech(prompt, selectedVoice, selectedFormat);
      
      const newItem: HistoryItem = {
        id: crypto.randomUUID(),
        text: prompt.length > 50 ? prompt.slice(0, 50) + '...' : prompt,
        voice: selectedVoice,
        format: selectedFormat,
        audioUrl: result.audioUrl,
        timestamp: Date.now()
      };

      setHistory(prev => [newItem, ...prev].slice(0, 20)); // Limitar a 20 items
      
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (url: string, id: string, format: AudioFormat) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `echomuse-${id}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col items-center p-3 sm:p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-4 transform scale-90 origin-left">
           <Header />
        </div>

        <main className="space-y-4">
          {/* Main Generation Card - Compact */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 shadow-xl backdrop-blur-sm">
            <form onSubmit={handleGenerate} className="space-y-4">
              
              {/* Voice Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">
                  Voz
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.values(VoiceName).map((voice) => {
                    const details = VOICE_DETAILS[voice];
                    const isSelected = selectedVoice === voice;
                    return (
                      <button
                        key={voice}
                        type="button"
                        onClick={() => setSelectedVoice(voice)}
                        className={`
                          relative flex flex-col items-center justify-center p-2 rounded-lg border transition-all
                          ${isSelected 
                            ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:border-slate-600'}
                        `}
                      >
                        <div className="font-semibold text-xs mb-0.5">{details.label}</div>
                        <div className="text-[9px] opacity-70 leading-tight">
                          {details.gender === 'Masculino' ? 'Masc' : 'Fem'} • {details.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Text Input, Speed and Format */}
              <div className="flex flex-col gap-2">
                 <div className="flex justify-between items-end px-1">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Idea</label>
                    <div className="flex gap-4 items-center">
                       {/* Format Selector */}
                       <div className="flex bg-slate-900 rounded p-0.5 border border-slate-700">
                          <button
                            type="button"
                            onClick={() => setSelectedFormat('wav')}
                            className={`px-2 py-0.5 text-[10px] rounded font-medium transition-colors ${selectedFormat === 'wav' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                          >
                            WAV
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedFormat('mp3')}
                            className={`px-2 py-0.5 text-[10px] rounded font-medium transition-colors ${selectedFormat === 'mp3' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                          >
                            MP3
                          </button>
                       </div>

                       {/* Playback Speed Slider */}
                       <div className="flex items-center gap-2 bg-slate-800 px-2 py-1 rounded border border-slate-700">
                          <span className="text-[10px] text-slate-400 w-12 text-right">Vel: {playbackSpeed}x</span>
                          <input
                             type="range"
                             min="0.5"
                             max="2.0"
                             step="0.1"
                             value={playbackSpeed}
                             onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                             className="w-16 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                       </div>
                    </div>
                 </div>

                <div className="flex flex-col sm:flex-row gap-4 items-stretch">
                  <div className="flex-1">
                    <textarea
                      id="prompt"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Escribe tu idea aquí..."
                      className="custom-scrollbar w-full h-20 bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
                    />
                  </div>
                  
                  {/* Action Button */}
                  <button
                    type="submit"
                    disabled={isGenerating || !prompt.trim()}
                    className={`
                      sm:w-28 h-20 shrink-0 rounded-lg font-semibold text-white flex flex-col items-center justify-center gap-1 transition-all text-xs
                      ${isGenerating || !prompt.trim()
                        ? 'bg-slate-700 cursor-not-allowed text-slate-400' 
                        : 'bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25'}
                    `}
                  >
                    {isGenerating ? (
                      <>
                        <IconLoader />
                        <span>Generando</span>
                      </>
                    ) : (
                      <>
                        <IconWaveform />
                        <span>Generar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </form>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-2 px-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-xs text-center">
              {error}
            </div>
          )}

          {/* History Section - Compact with Scroll */}
          {history.length > 0 && (
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
               <div className="bg-slate-800/80 px-4 py-2 border-b border-slate-700 flex items-center justify-between">
                 <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <IconWaveform /> Historial
                 </h2>
                 <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full">
                   {history.length} / 20
                 </span>
               </div>
              
              <div className="custom-scrollbar max-h-[320px] overflow-y-auto p-2 grid gap-2">
                {history.map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-slate-800 border border-slate-700 rounded-lg p-2 hover:border-indigo-500/30 transition-colors flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                             <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[10px] font-bold text-indigo-300 bg-indigo-900/40 px-1.5 rounded-sm">
                                {item.voice}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-700/50 px-1.5 rounded-sm uppercase">
                                  {item.format}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                            <p className="text-slate-300 text-xs truncate leading-relaxed opacity-90">
                                {item.text}
                            </p>
                        </div>
                        <button
                            onClick={() => handleDownload(item.audioUrl, item.id, item.format)}
                            className="shrink-0 p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-700 rounded transition-colors"
                            title={`Descargar ${item.format.toUpperCase()}`}
                        >
                            <IconDownload />
                        </button>
                    </div>

                    <AudioPlayer 
                        src={item.audioUrl} 
                        playbackRate={playbackSpeed}
                        className="w-full h-6 block rounded"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;