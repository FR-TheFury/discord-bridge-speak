import { useEffect, useState } from "react";

export type MediaDevice = Pick<MediaDeviceInfo, "deviceId" | "kind" | "label">;

export function useAudioDevices() {
  const [inputs, setInputs] = useState<MediaDevice[]>([]);
  const [outputs, setOutputs] = useState<MediaDevice[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setInputs(devices.filter((d) => d.kind === "audioinput").map(({ deviceId, kind, label }) => ({ deviceId, kind, label })));
      setOutputs(devices.filter((d) => d.kind === "audiooutput").map(({ deviceId, kind, label }) => ({ deviceId, kind, label })));
      setReady(true);
    } catch (e) {
      setReady(false);
    }
  };

  useEffect(() => {
    // Ensure labels are populated
    navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => {});
    refresh();

    const onChange = () => refresh();
    navigator.mediaDevices.addEventListener?.("devicechange", onChange);
    return () => navigator.mediaDevices.removeEventListener?.("devicechange", onChange);
  }, []);

  return { inputs, outputs, ready, refresh };
}
