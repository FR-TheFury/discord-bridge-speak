import { useSettings } from "@/state/SettingsProvider";

export type TTSMethod = 'elevenlabs' | 'native' | 'disabled';

export interface TTSService {
  speak: (text: string, lang: string) => Promise<void>;
  stop: () => void;
  isSupported: () => boolean;
  isSpeaking: () => boolean;
}

class ElevenLabsTTS implements TTSService {
  private currentAudio: HTMLAudioElement | null = null;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async speak(text: string, lang: string): Promise<void> {
    if (!text.trim()) return;
    
    this.stop();

    try {
      const voiceId = "9BWtsMINqrJLrRacOk9x"; // Aria voice
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey,
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error('ElevenLabs API failed');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      this.currentAudio = new Audio(audioUrl);
      
      return new Promise((resolve, reject) => {
        if (!this.currentAudio) return reject(new Error('Audio creation failed'));
        
        this.currentAudio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        this.currentAudio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          reject(new Error('Audio playback failed'));
        };
        
        this.currentAudio.play().catch(reject);
      });
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      throw error;
    }
  }

  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  isSupported(): boolean {
    return !!this.apiKey && typeof fetch !== 'undefined';
  }

  isSpeaking(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused;
  }
}

class NativeTTS implements TTSService {
  private utterance: SpeechSynthesisUtterance | null = null;

  async speak(text: string, lang: string): Promise<void> {
    if (!text.trim()) return;
    
    this.stop();

    return new Promise((resolve, reject) => {
      if (!window.speechSynthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      this.utterance = new SpeechSynthesisUtterance(text);
      this.utterance.lang = lang;
      this.utterance.rate = 1;
      this.utterance.pitch = 1;
      this.utterance.volume = 1;

      this.utterance.onend = () => resolve();
      this.utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`));

      window.speechSynthesis.speak(this.utterance);
    });
  }

  stop(): void {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.utterance = null;
  }

  isSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  isSpeaking(): boolean {
    return window.speechSynthesis?.speaking || false;
  }
}

export function createTTSService(method: TTSMethod, apiKey?: string): TTSService {
  switch (method) {
    case 'elevenlabs':
      if (!apiKey) throw new Error('ElevenLabs API key required');
      return new ElevenLabsTTS(apiKey);
    case 'native':
      return new NativeTTS();
    case 'disabled':
    default:
      return {
        speak: async () => {},
        stop: () => {},
        isSupported: () => false,
        isSpeaking: () => false,
      };
  }
}

export function useTTS() {
  const { state } = useSettings();
  
  const createService = (method: TTSMethod, apiKey?: string) => {
    return createTTSService(method, apiKey);
  };

  return { createService };
}