import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Mic, Square, Volume2, ArrowLeftRight, Globe } from "lucide-react";
import { useSettings } from "@/state/SettingsProvider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { POPULAR_LANGUAGES, toISO2 } from "@/data/languages";

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
  sourceLang: string; // BCP-47 e.g. "fr-FR"
  targetLang: string; // BCP-47 e.g. "en-US"
}

async function translateText(text: string, fromISO2: string, toISO2: string) {
  if (!text.trim()) return "";
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromISO2}|${toISO2}`;
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
  const { state: settings } = useSettings();

  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [translated, setTranslated] = useState("");
  const [srcLang, setSrcLang] = useState(sourceLang);
  const [tgtLang, setTgtLang] = useState(targetLang);

  // Text-mode fallback
  const [manualIn, setManualIn] = useState("");
  const [manualOut, setManualOut] = useState("");

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const recognitionSupported = useMemo(() => {
    return typeof window !== "undefined" && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }, []);

  const startListening = async () => {
    try {
      const constraints: MediaStreamConstraints = settings.audio.inputId
        ? { audio: { deviceId: { exact: settings.audio.inputId } as any } as any }
        : { audio: true };
      await navigator.mediaDevices.getUserMedia(constraints);
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
        description: "Sur ce navigateur (ex: Opera GX/Firefox), utilisez le mode texte ou Chrome/Edge.",
      });
      return;
    }

    const rec = new SpeechRecognitionImpl();
    rec.lang = srcLang;
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = async (event: SpeechRecognitionEvent) => {
      let full = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        full += chunk + " ";
        if (event.results[i].isFinal) {
          const t = await translateText(chunk, toISO2(srcLang), toISO2(tgtLang));
          setTranslated((prev) => (prev ? prev + " " + t : t));
          if (t && settings.tts.autoSpeak) speak(t, tgtLang);
        }
      }
      setTranscript((prev) => (prev ? prev + " " + full.trim() : full.trim()));
    };

    rec.onerror = (e: any) => {
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
    // Apply voice selection and params
    try {
      const voices = window.speechSynthesis.getVoices?.() || [];
      const selected = voices.find((v) => v.voiceURI === settings.tts.voiceURI)
        || voices.find((v) => v.lang?.toLowerCase() === lang.toLowerCase())
        || voices.find((v) => v.lang?.toLowerCase().startsWith(lang.split("-")[0].toLowerCase()))
        || voices[0];
      if (selected) u.voice = selected;
    } catch {}
    u.rate = settings.tts.rate;
    u.pitch = settings.tts.pitch;
    u.volume = settings.tts.volume;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    window.speechSynthesis.cancel();
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

  const swapLangs = () => {
    setSrcLang((prev) => {
      const s = tgtLang; setTgtLang(prev); return s;
    });
    setTranscript("");
    setTranslated("");
  };

  const doManualTranslate = async () => {
    const t = await translateText(manualIn, toISO2(srcLang), toISO2(tgtLang));
    setManualOut(t);
    if (t && settings.tts.autoSpeak) speak(t, tgtLang);
  };

  return (
    <Card className="relative overflow-hidden neon-card animate-enter">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2"><Globe className="h-5 w-5" /> {title}</span>
          <span className="text-sm text-muted-foreground">
            {srcLang} → {tgtLang}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2">
          <Select value={srcLang} onValueChange={(v) => setSrcLang(v)}>
            <SelectTrigger aria-label="Langue source"><SelectValue placeholder="Source" /></SelectTrigger>
            <SelectContent className="max-h-72">
              {POPULAR_LANGUAGES.map((l) => (
                <SelectItem key={l.bcp47} value={l.bcp47}>{l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" aria-label="Inverser les langues" onClick={swapLangs}>
            <ArrowLeftRight />
          </Button>
          <Select value={tgtLang} onValueChange={(v) => setTgtLang(v)}>
            <SelectTrigger aria-label="Langue cible"><SelectValue placeholder="Cible" /></SelectTrigger>
            <SelectContent className="max-h-72">
              {POPULAR_LANGUAGES.map((l) => (
                <SelectItem key={l.bcp47} value={l.bcp47}>{l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!recognitionSupported && (
          <div className="rounded-md border border-destructive/50 p-3 text-sm text-muted-foreground bg-destructive/10">
            La reconnaissance vocale n'est pas supportée par ce navigateur. Utilisez le mode texte ci-dessous, ou essayez Chrome/Edge pour le micro en direct.
          </div>
        )}

        <div className="flex gap-3">
          {!listening ? (
            <Button variant="neon" onClick={startListening} aria-label="Démarrer" disabled={!recognitionSupported}>
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
              onClick={() => speak(translated, tgtLang)}
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

        {/* Text mode fallback */}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs uppercase text-muted-foreground">Mode texte</p>
            <Textarea value={manualIn} onChange={(e) => setManualIn(e.target.value)} placeholder="Saisissez un texte à traduire" />
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={doManualTranslate}>Traduire</Button>
              <Button size="sm" variant="outline" onClick={() => speak(manualOut || manualIn, tgtLang)} disabled={!(manualOut || manualIn)}>Lire</Button>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase text-muted-foreground">Résultat</p>
            <Textarea value={manualOut} onChange={(e) => setManualOut(e.target.value)} placeholder="Traduction" />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Astuce: laissez ce panneau ouvert pendant votre appel Discord; selon le navigateur, le choix strict du micro n'est pas garanti. Pour le meilleur support, utilisez Chrome/Edge.
        </p>
      </CardContent>
      <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden>
        <div className="absolute -inset-32 bg-[radial-gradient(120px_120px_at_var(--x,50%)_var(--y,50%),hsl(var(--primary)/0.15),transparent_60%)]" />
      </div>
    </Card>
  );
}
