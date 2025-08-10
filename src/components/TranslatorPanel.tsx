import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Mic, Square, Volume2 } from "lucide-react";

// Minimal typings for Web Speech API to satisfy TypeScript
declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

type SpeechRecognition = any;
type SpeechRecognitionEvent = any;

interface TranslatorPanelProps {
  title: string;
  sourceLang: "fr-FR" | "en-US";
  targetLang: "fr-FR" | "en-US";
}

// Map BCP-47 to 2-letter codes for translation API
const shortCode = (lang: TranslatorPanelProps["sourceLang"]) =>
  lang.startsWith("fr") ? "fr" : "en";

async function translateText(text: string, from: string, to: string) {
  if (!text.trim()) return "";
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text
    )}&langpair=${from}|${to}`;
    const res = await fetch(url);
    const data = await res.json();
    const translated = data?.responseData?.translatedText as string | undefined;
    return translated ?? "";
  } catch (e) {
    console.error("Translation error", e);
    return "";
  }
}

export function TranslatorPanel({ title, sourceLang, targetLang }: TranslatorPanelProps) {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [translated, setTranslated] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      toast({
        title: "Accès micro refusé",
        description: "Veuillez autoriser le micro pour la traduction en direct.",
      });
      return;
    }

    const SpeechRecognitionImpl: typeof window.SpeechRecognition | undefined =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionImpl) {
      toast({
        title: "Reconnaissance vocale non supportée",
        description: "Essayez Chrome/Edge ou autorisez le micro.",
      });
      return;
    }

    const rec = new SpeechRecognitionImpl();
    rec.lang = sourceLang;
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = async (event: SpeechRecognitionEvent) => {
      let full = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        full += chunk + " ";
        if (event.results[i].isFinal) {
          const source = shortCode(sourceLang);
          const target = shortCode(targetLang);
          const t = await translateText(chunk, source, target);
          setTranslated((prev) => (prev ? prev + " " + t : t));
          if (t) speak(t, targetLang);
        }
      }
      setTranscript((prev) => (prev ? prev + " " + full.trim() : full.trim()));
    };

    rec.onerror = (e) => {
      console.error(e);
      toast({ title: "Erreur micro", description: String(e.error || "inconnue") });
      stopAll();
    };

    rec.onend = () => setListening(false);

    recognitionRef.current = rec as any;
    rec.start();
    setListening(true);
  };

  const speak = (text: string, lang: string) => {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  };

  const stopAll = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
    if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  useEffect(() => () => stopAll(), []);

  return (
    <Card className="relative overflow-hidden shadow-[var(--shadow-elegant)]">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <span className="text-sm text-muted-foreground">
            {sourceLang} → {targetLang}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          {!listening ? (
            <Button variant="hero" onClick={startListening} aria-label="Démarrer">
              <Mic className="opacity-90" /> Démarrer
            </Button>
          ) : (
            <Button variant="destructive" onClick={stopAll} aria-label="Arrêter">
              <Square /> Arrêter
            </Button>
          )}
          {translated && (
            <Button
              variant="outline"
              onClick={() => speak(translated, targetLang)}
              aria-label="Relire la traduction"
            >
              <Volume2 /> Relire
            </Button>
          )}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-md border p-3 bg-muted/30">
            <p className="text-xs uppercase text-muted-foreground mb-1">Voix → Texte</p>
            <p className="min-h-12 leading-relaxed text-foreground">{transcript || "…"}</p>
          </div>
          <div className="rounded-md border p-3 bg-muted/30">
            <p className="text-xs uppercase text-muted-foreground mb-1">Traduction</p>
            <p className="min-h-12 leading-relaxed text-foreground">{translated || "…"}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Astuce: laissez ce panneau ouvert pendant votre appel Discord; le micro du
          navigateur capte votre voix et lit la traduction automatiquement.
        </p>
      </CardContent>
      <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden>
        <div className="absolute -inset-32 bg-[radial-gradient(120px_120px_at_var(--x,50%)_var(--y,50%),hsl(var(--primary)/0.15),transparent_60%)]" />
      </div>
    </Card>
  );
}
