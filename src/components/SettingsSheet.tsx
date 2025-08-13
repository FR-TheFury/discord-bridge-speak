import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAudioDevices } from "@/hooks/use-audio-devices";
import { useSettings } from "@/state/SettingsProvider";
import { Settings } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export function SettingsSheet() {
  const { state, set } = useSettings();
  const { t } = useTranslation();
  const { inputs, outputs, refresh } = useAudioDevices();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const testOutput = async () => {
    try {
      const el = audioRef.current || new Audio();
      audioRef.current = el;
      // 200ms beep data URI (440Hz)
      el.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABYAZGF0YQwAAAAA"; // super short click
      const anyEl = el as any;
      if (state.audio.outputId && typeof anyEl.setSinkId === "function") {
        await anyEl.setSinkId(state.audio.outputId);
      }
      await el.play();
    } catch (e) {
      toast({ title: t("settings.testOutput"), description: t("settings.outputTestFailed") });
    }
  };


  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="hover-scale"><Settings className="mr-2 h-4 w-4" /> {t("settings.open")}</Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t("settings.title")}</SheetTitle>
          <SheetDescription>{t("settings.description")}</SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="audio" className="mt-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="audio">{t("settings.tabs.audio")}</TabsTrigger>
            <TabsTrigger value="voice">{t("settings.tabs.voice")}</TabsTrigger>
          </TabsList>

          <TabsContent value="audio" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>{t("settings.mic")}</Label>
              <Select value={state.audio.inputId ?? ""} onValueChange={(v) => set({ audio: { inputId: v || null } as any })}>
                <SelectTrigger><SelectValue placeholder={t("settings.micPlaceholder") ?? ""} /></SelectTrigger>
                <SelectContent>
                  {inputs.map((d) => (
                    <SelectItem key={d.deviceId} value={d.deviceId}>{d.label || "Micro"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("settings.output")}</Label>
              <Select value={state.audio.outputId ?? ""} onValueChange={(v) => set({ audio: { outputId: v || null } as any })}>
                <SelectTrigger><SelectValue placeholder={t("settings.outputPlaceholder") ?? ""} /></SelectTrigger>
                <SelectContent>
                  {outputs.map((d) => (
                    <SelectItem key={d.deviceId} value={d.deviceId}>{d.label || "Sortie"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={testOutput}>{t("settings.testOutput")}</Button>
                <Button variant="ghost" onClick={refresh}>{t("settings.refresh")}</Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {t("settings.note")}
            </p>
          </TabsContent>

          <TabsContent value="voice" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="tts-method">{t("settings.ttsMethod")}</Label>
              <Select 
                value={state.tts.method} 
                onValueChange={(value: 'elevenlabs' | 'native' | 'disabled') => 
                  set({ tts: { method: value } as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="elevenlabs">ElevenLabs (Premium)</SelectItem>
                  <SelectItem value="native">Native TTS</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {state.tts.method === 'elevenlabs' && (
              <div className="space-y-2">
                <Label htmlFor="elevenlabs-key">{t("settings.elevenlabsApiKey")}</Label>
                <Input
                  id="elevenlabs-key"
                  type="password"
                  placeholder="sk-..."
                  value={state.tts.elevenlabsApiKey || ''}
                  onChange={(e) => set({ tts: { elevenlabsApiKey: e.target.value || null } as any })}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <Label>{t("settings.autoSpeak")}</Label>
                <p className="text-xs text-muted-foreground">{t("settings.autoSpeakDesc")}</p>
              </div>
              <Switch checked={state.tts.autoSpeak} onCheckedChange={(b) => set({ tts: { autoSpeak: b } as any })} />
            </div>

            <div className="space-y-2">
              <Label>{t("settings.rate")}</Label>
              <Slider min={0.5} max={2} step={0.1} defaultValue={[state.tts.rate]} onValueChange={([val]) => set({ tts: { rate: val } as any })} />
            </div>
            <div className="space-y-2">
              <Label>{t("settings.pitch")}</Label>
              <Slider min={0} max={2} step={0.1} defaultValue={[state.tts.pitch]} onValueChange={([val]) => set({ tts: { pitch: val } as any })} />
            </div>
            <div className="space-y-2">
              <Label>{t("settings.volume")}</Label>
              <Slider min={0} max={1} step={0.05} defaultValue={[state.tts.volume]} onValueChange={([val]) => set({ tts: { volume: val } as any })} />
            </div>
            
          </TabsContent>
        </Tabs>

        <audio ref={audioRef} hidden />
      </SheetContent>
    </Sheet>
  );
}
