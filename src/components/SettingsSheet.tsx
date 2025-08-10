import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAudioDevices } from "@/hooks/use-audio-devices";
import { useSettings } from "@/state/SettingsProvider";
import { Settings } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export function SettingsSheet() {
  const { state, set } = useSettings();
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
      toast({ title: "Test sortie", description: "Impossible de jouer le son sur cette sortie." });
    }
  };


  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="hover-scale"><Settings className="mr-2 h-4 w-4" /> Paramètres</Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Paramètres</SheetTitle>
          <SheetDescription>Configurez votre audio et la synthèse vocale.</SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="audio" className="mt-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="audio">Audio</TabsTrigger>
            <TabsTrigger value="voice">Voix</TabsTrigger>
          </TabsList>

          <TabsContent value="audio" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Microphone</Label>
              <Select value={state.audio.inputId ?? ""} onValueChange={(v) => set({ audio: { inputId: v || null } as any })}>
                <SelectTrigger><SelectValue placeholder="Sélectionnez un micro" /></SelectTrigger>
                <SelectContent>
                  {inputs.map((d) => (
                    <SelectItem key={d.deviceId} value={d.deviceId}>{d.label || "Micro"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sortie audio</Label>
              <Select value={state.audio.outputId ?? ""} onValueChange={(v) => set({ audio: { outputId: v || null } as any })}>
                <SelectTrigger><SelectValue placeholder="Par défaut du système" /></SelectTrigger>
                <SelectContent>
                  {outputs.map((d) => (
                    <SelectItem key={d.deviceId} value={d.deviceId}>{d.label || "Sortie"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={testOutput}>Tester la sortie</Button>
                <Button variant="ghost" onClick={refresh}>Actualiser</Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Note: la reconnaissance vocale du navigateur n'autorise pas le choix strict du micro. Sélectionner un micro ici aide à donner la permission au bon appareil.
            </p>
          </TabsContent>

          <TabsContent value="voice" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Lecture automatique</Label>
                <p className="text-xs text-muted-foreground">Lire la traduction automatiquement.</p>
              </div>
              <Switch checked={state.tts.autoSpeak} onCheckedChange={(b) => set({ tts: { autoSpeak: b } as any })} />
            </div>


            <div className="space-y-2">
              <Label>Vitesse</Label>
              <Slider min={0.5} max={2} step={0.1} defaultValue={[state.tts.rate]} onValueChange={([val]) => set({ tts: { rate: val } as any })} />
            </div>
            <div className="space-y-2">
              <Label>Timbre</Label>
              <Slider min={0} max={2} step={0.1} defaultValue={[state.tts.pitch]} onValueChange={([val]) => set({ tts: { pitch: val } as any })} />
            </div>
            <div className="space-y-2">
              <Label>Volume</Label>
              <Slider min={0} max={1} step={0.05} defaultValue={[state.tts.volume]} onValueChange={([val]) => set({ tts: { volume: val } as any })} />
            </div>
            
          </TabsContent>
        </Tabs>

        <audio ref={audioRef} hidden />
      </SheetContent>
    </Sheet>
  );
}
