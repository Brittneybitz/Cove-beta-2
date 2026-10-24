import React, { useState, useRef, useEffect } from 'react';
import { soundManager } from '../audio/soundManager';
import { Send, X, Sparkles, MessageCircle, Heart, Fish, Volume2, Upload, Music } from 'lucide-react';
import { Inventory } from '../types/game';
import { saveCustomCry, getAllCustomCries, fileToDataUrl, CryEmotion } from '../services/customCryStorage';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'oreo';
  text: string;
  timestamp: string;
}

interface WhaleChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: Inventory;
  onFeedFish: () => void;
  onFeedKelp: () => void;
}

const QUICK_STARTERS = [
  'Tell me about Whale Cove! 🌊',
  'What is your favorite fish? 🐟',
  'Sing me a whale melody! 🎵',
  'Can you do a backflip? 🐬',
  'How do you feel today? 💕',
];

const EMOTION_SOUND_EVENTS: { id: 'happy' | 'sad' | 'angry' | 'victory'; label: string; icon: string }[] = [
  { id: 'happy', label: 'Happy', icon: '💖' },
  { id: 'sad', label: 'Sad', icon: '💧' },
  { id: 'angry', label: 'Angry', icon: '💢' },
  { id: 'victory', label: 'Victory', icon: '🏆' },
];

export const WhaleChatModal: React.FC<WhaleChatModalProps> = ({
  isOpen,
  onClose,
  inventory,
  onFeedFish,
  onFeedKelp,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'oreo',
      text: '*surfaces with a playful whooooosh and a cheerful fluke splash!* 🌊 Hello best human friend! The cove water feels wonderful today! What should we talk about? *click-click-click!* 🐋✨',
      timestamp: 'Just now',
    },
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showVoiceStudio, setShowVoiceStudio] = useState(false);
  const [customAudioMap, setCustomAudioMap] = useState<Record<string, { fileName: string; duration?: number }>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load mapped custom sounds
  useEffect(() => {
    if (isOpen) {
      getAllCustomCries()
        .then((all) => {
          const map: Record<string, { fileName: string; duration?: number }> = {};
          Object.keys(all).forEach((emo) => {
            if (all[emo as CryEmotion]) {
              map[emo] = {
                fileName: all[emo as CryEmotion]!.fileName || 'Custom Audio',
                duration: all[emo as CryEmotion]!.duration,
              };
            }
          });
          setCustomAudioMap(map);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const handleAudioUpload = async (emotion: 'happy' | 'sad' | 'angry' | 'victory', file: File) => {
    try {
      const dataUrl = await fileToDataUrl(file);
      await saveCustomCry(emotion, dataUrl, file.name);
      setCustomAudioMap((prev) => ({
        ...prev,
        [emotion]: { fileName: file.name },
      }));
      soundManager.playEmotionCry(emotion);
    } catch {
      alert('Error saving audio file. Please select a valid .mp3 or .wav file.');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages, isTyping]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isTyping) return;

    soundManager.playClick();

    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/whale-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          history: newHistory.map((m) => ({ sender: m.sender, text: m.text })),
        }),
      });

      const data = await res.json();
      soundManager.playWhaleChirp();

      const oreoReply: ChatMessage = {
        id: 'oreo-' + Date.now(),
        sender: 'oreo',
        text: data.reply || '*playfully clicks and blows a stream of sparkling bubbles!* 🫧🐋',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, oreoReply]);
    } catch {
      soundManager.playBubble();
      const fallbackReply: ChatMessage = {
        id: 'oreo-err-' + Date.now(),
        sender: 'oreo',
        text: '*dips underwater for a second and pops back up with a splash!* Whooosh! The water ripples carried away our words, but I am still right here swimming beside you! 🌊💖',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-sky-400/80 rounded-2xl text-white shadow-2xl flex flex-col h-[82vh] max-h-[680px]">
        {/* Header */}
        <div className="p-4 border-b border-slate-700/80 bg-slate-950/80 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center text-2xl shadow-md shadow-sky-900/50 border border-sky-300">
              🐋
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-sky-300">Oreo the Orca</h3>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-medium">
                  Active Companion 🌊
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                AI Companion • Powered by Gemini AI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Custom Emotion Audio Toggle */}
            <button
              onClick={() => setShowVoiceStudio((prev) => !prev)}
              className={`text-xs px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 border cursor-pointer ${
                showVoiceStudio
                  ? 'bg-purple-900/80 text-purple-200 border-purple-400'
                  : 'bg-slate-800 hover:bg-slate-700 text-sky-300 border-sky-500/30'
              }`}
              title="Upload & Play Custom Voice Cries (.mp3/.wav)"
            >
              <Music size={13} />
              <span>Cries (.MP3)</span>
            </button>

            {/* Direct feeding button in chat */}
            <button
              onClick={() => {
                onFeedFish();
                soundManager.playFeed();
              }}
              disabled={inventory.fishTreats <= 0}
              className="text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-amber-300 border border-amber-500/30 px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1"
              title="Feed Fish Treat"
            >
              <span>🐟 Feed</span>
              <span className="text-[10px] opacity-75 font-mono">({inventory.fishTreats})</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Collapsible Emotion Audio Mapping & Uploader Tray */}
        {showVoiceStudio && (
          <div className="p-3 bg-slate-950/95 border-b border-purple-500/40 animate-in fade-in duration-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                <Volume2 size={13} />
                <span>Whale Voice Cries (Mapped to Emotions)</span>
              </span>
              <span className="text-[10px] text-slate-400">Upload .mp3 or .wav per emotion</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {EMOTION_SOUND_EVENTS.map((emo) => {
                const isCustom = !!customAudioMap[emo.id];
                return (
                  <div
                    key={emo.id}
                    className="bg-slate-900 border border-slate-800 hover:border-purple-500/40 rounded-xl p-2 flex flex-col justify-between text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-200 flex items-center gap-1">
                        <span>{emo.icon}</span>
                        <span>{emo.label}</span>
                      </span>
                      {isCustom && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400" title="Custom Audio Active" />
                      )}
                    </div>

                    <p className="text-[10px] text-slate-400 truncate mb-1.5">
                      {isCustom ? customAudioMap[emo.id].fileName : 'Procedural synth'}
                    </p>

                    <div className="flex gap-1">
                      <button
                        onClick={() => soundManager.playEmotionCry(emo.id)}
                        className="flex-1 bg-purple-950 hover:bg-purple-900 border border-purple-500/40 text-purple-200 text-[10px] py-1 px-1.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        title={`Play ${emo.label} cry`}
                      >
                        <Volume2 size={10} />
                        <span>Play</span>
                      </button>

                      <label className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-300 text-[10px] py-1 px-1.5 rounded-lg font-medium transition-colors flex items-center justify-center cursor-pointer">
                        <Upload size={10} />
                        <input
                          type="file"
                          accept="audio/mp3,audio/wav,audio/*,.mp3,.wav"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleAudioUpload(emo.id, file);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gradient-to-b from-slate-950/60 to-slate-900/40">
          {messages.map((m, index) => {
            const isOreo = m.sender === 'oreo';
            const isLatest = index === messages.length - 1;

            return (
              <div
                key={m.id}
                className={`flex gap-2.5 ${isOreo ? 'justify-start' : 'justify-end'} ${
                  isLatest ? 'animate-pop-bubble' : ''
                }`}
              >
                {isOreo && (
                  <div
                    className={`w-8 h-8 rounded-full bg-sky-950 border border-sky-400 flex items-center justify-center text-sm shrink-0 mt-0.5 transition-transform ${
                      isLatest ? 'animate-whale-float shadow-md shadow-sky-500/20' : ''
                    }`}
                  >
                    🐋
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-md transition-all ${
                    isOreo
                      ? `bg-slate-800/95 text-sky-100 border border-sky-500/40 rounded-tl-xs ${
                          isLatest
                            ? 'shadow-lg shadow-sky-950/80 ring-1 ring-sky-400/40 bg-gradient-to-br from-slate-800 to-slate-900'
                            : ''
                        }`
                      : 'bg-indigo-600 text-white rounded-tr-xs shadow-indigo-950/50'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <span
                    className={`block text-[10px] mt-1.5 ${
                      isOreo ? 'text-sky-400/70 text-left' : 'text-indigo-200 text-right'
                    }`}
                  >
                    {m.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Oreo Typing Animation */}
          {isTyping && (
            <div className="flex gap-2.5 items-center animate-pop-bubble">
              <div className="w-8 h-8 rounded-full bg-sky-950 border border-sky-400 flex items-center justify-center text-sm shrink-0 animate-whale-float">
                🐋
              </div>
              <div className="bg-slate-800/90 border border-sky-500/30 rounded-2xl rounded-tl-xs px-3.5 py-2.5 text-xs text-sky-300 flex items-center gap-2 shadow-md">
                <span>*Oreo is clicking, whistling, and swimming over...*</span>
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce [animation-delay:0.3s]" />
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick starter chips */}
        <div className="px-3 pt-2 pb-1 bg-slate-950/80 border-t border-slate-800 flex gap-1.5 overflow-x-auto no-scrollbar text-xs">
          {QUICK_STARTERS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={isTyping}
              className="shrink-0 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-sky-500/50 text-sky-300 px-2.5 py-1 rounded-full text-[11px] transition-all"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-950 rounded-b-2xl border-t border-slate-800 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Talk to Oreo (e.g. 'Can you jump over the coral?')..."
            disabled={isTyping}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-400 disabled:opacity-50"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isTyping}
            className="bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-600 text-white p-2.5 rounded-xl font-bold transition-all shadow-md flex items-center justify-center shrink-0 cursor-pointer"
            title="Send Message"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
