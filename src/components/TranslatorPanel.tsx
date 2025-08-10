import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Mic, Square, Volume2, ArrowLeftRight, Globe, Eraser } from "lucide-react";
import { useSettings } from "@/state/SettingsProvider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { POPULAR_LANGUAGES, toISO2 } from "@/data/languages";
import { useTranslation } from "react-i18next";

// Minimal typings for Web Speech API to satisfy TypeScript
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
  const { t } = useTranslation();
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
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
      let newFinal = "";
      let newInterim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const chunk = (res[0]?.transcript || "").trim();
        if (!chunk) continue;
        if (res.isFinal) {
          newFinal += (newFinal ? " " : "") + chunk;
        } else {
          newInterim += (newInterim ? " " : "") + chunk;
        }
      }
      if (newFinal) {
        setFinalTranscript((prev) => (prev ? prev + " " + newFinal : newFinal));
        const t = await translateText(newFinal, toISO2(srcLang), toISO2(tgtLang));
        if (t) setTranslated((prev) => (prev ? prev + " " + t : t));
        if (t && settings.tts.autoSpeak) speak(t, tgtLang);
      }
      setInterimTranscript(newInterim);
    };

    rec.onerror = (e: any) => {
      console.error(e);
      toast({ title: "Erreur micro", description: String(e.error || "inconnue") });
      stopAll();
    };

    rec.onend = () => { setListening(false); setInterimTranscript(""); };

    recognitionRef.current = rec as any;
    rec.start();
    setListening(true);
  };

  const speak = (text: string, lang: string) => {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;

    const assignAndSpeak = () => {
      try {
        const voices = window.speechSynthesis.getVoices?.() || [];
        const langLower = lang.toLowerCase();
        const base = langLower.split("-")[0];
        const exact = voices.filter((v) => v.lang?.toLowerCase() === langLower);
        const partial = voices.filter((v) => v.lang?.toLowerCase().startsWith(base));
        const prefer = (arr: SpeechSynthesisVoice[]) => arr.find((v) => /google|microsoft/i.test(v.name)) || arr[0];
        const chosen = prefer(exact) || prefer(partial) || voices[0];
        if (chosen) u.voice = chosen;
      } catch {}
      u.rate = settings.tts.rate;
      u.pitch = settings.tts.pitch;
      u.volume = settings.tts.volume;
      u.onstart = () => setSpeaking(true);
      u.onend = () => setSpeaking(false);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    };

    const existing = window.speechSynthesis.getVoices?.() || [];
    if (!existing.length) {
      const once = () => {
        window.speechSynthesis.removeEventListener?.("voiceschanged", once as any);
        assignAndSpeak();
      };
      window.speechSynthesis.addEventListener?.("voiceschanged", once as any);
      window.speechSynthesis.getVoices?.();
    } else {
      assignAndSpeak();
    }
  };

  const stopAll = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
    if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
    setSpeaking(false);
    setInterimTranscript("");
  };

  const clearAll = () => {
    stopAll();
    setFinalTranscript("");
    setInterimTranscript("");
    setTranslated("");
    setManualIn("");
    setManualOut("");
  };

  useEffect(() => () => stopAll(), []);

  const swapLangs = () => {
    setSrcLang((prev) => {
      const s = tgtLang; setTgtLang(prev); return s;
    });
    setFinalTranscript("");
    setInterimTranscript("");
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
            <SelectTrigger aria-label={t("panel.sourceLangAria")}><SelectValue placeholder={t("panel.sourceLangAria")} /></SelectTrigger>
            <SelectContent className="max-h-72">
              {POPULAR_LANGUAGES.map((l) => (
                <SelectItem key={l.bcp47} value={l.bcp47}>{l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" aria-label={t("actions.swap")} onClick={swapLangs}>
            <ArrowLeftRight />
          </Button>
          <Select value={tgtLang} onValueChange={(v) => setTgtLang(v)}>
            <SelectTrigger aria-label={t("panel.targetLangAria")}><SelectValue placeholder={t("panel.targetLangAria")} /></SelectTrigger>
            <SelectContent className="max-h-72">
              {POPULAR_LANGUAGES.map((l) => (
                <SelectItem key={l.bcp47} value={l.bcp47}>{l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!recognitionSupported && (
          <div className="rounded-md border border-destructive/50 p-3 text-sm text-muted-foreground bg-destructive/10">
            {t("panel.unsupportedWarning")}
          </div>
        )}

        <div className="flex gap-3">
          {!listening ? (
            <Button variant="neon" onClick={startListening} aria-label={t("actions.start")} disabled={!recognitionSupported}>
              <Mic className="opacity-90" /> {t("actions.start")}
            </Button>
          ) : (
            <Button variant="destructive" onClick={stopAll} aria-label={t("actions.stop")}>
              <Square /> {t("actions.stop")}
            </Button>
          )}
          {translated && (
            <Button
              variant="outline"
              onClick={() => speak(translated, tgtLang)}
              aria-label={t("actions.replay")}
            >
              <Volume2 /> {t("actions.replay")}
            </Button>
          )}
          {(finalTranscript || interimTranscript || translated || manualIn || manualOut) && (
            <Button variant="ghost" onClick={clearAll} aria-label={t("actions.clear")}>
              <Eraser /> {t("actions.clear")}
            </Button>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-md border p-3 bg-muted/30">
            <p className="text-xs uppercase text-muted-foreground mb-1">{t("panel.voiceToText")}</p>
            <p className="min-h-12 leading-relaxed text-foreground">{(finalTranscript + (interimTranscript ? " " + interimTranscript : "")) || "…"}</p>
          </div>
          <div className="rounded-md border p-3 bg-muted/30">
            <p className="text-xs uppercase text-muted-foreground mb-1">{t("panel.translation")}</p>
            <p className="min-h-12 leading-relaxed text-foreground">{translated || "…"}</p>
          </div>
        </div>

        {/* Text mode fallback */}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs uppercase text-muted-foreground">{t("panel.textMode")}</p>
            <Textarea value={manualIn} onChange={(e) => setManualIn(e.target.value)} placeholder={t("placeholders.typeText") ?? ""} />
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={doManualTranslate}>{t("actions.translate")}</Button>
              <Button size="sm" variant="outline" onClick={() => speak(manualOut || manualIn, tgtLang)} disabled={!(manualOut || manualIn)}>{t("actions.read")}</Button>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase text-muted-foreground">{t("panel.result")}</p>
            <Textarea value={manualOut} onChange={(e) => setManualOut(e.target.value)} placeholder={t("placeholders.translation") ?? ""} />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {t("panel.tip")}
        </p>
      </CardContent>
      <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden>
        <div className="absolute -inset-32 bg-[radial-gradient(120px_120px_at_var(--x,50%)_var(--y,50%),hsl(var(--primary)/0.15),transparent_60%)]" />
      </div>
    </Card>
  );
}
