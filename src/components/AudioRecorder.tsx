"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Trash2, Upload, Loader2 } from "lucide-react";

interface Props {
  value: string | undefined;
  onChange: (dataUrl: string | undefined) => void;
}

export default function AudioRecorder({ value, onChange }: Props) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = () => onChange(reader.result as string);
        reader.readAsDataURL(blob);
      };

      recorder.start();
      setRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch {
      alert("Impossible d'accéder au microphone.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function handleFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  }

  function formatDuration(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {recording ? (
          <button onClick={stopRecording}
            className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700">
            <Square className="w-4 h-4" /> Arrêter ({formatDuration(duration)})
          </button>
        ) : (
          <button onClick={startRecording}
            className="flex items-center gap-1.5 border border-gray-300 rounded-lg px-3 py-2 text-sm hover:bg-gray-50">
            <Mic className="w-4 h-4 text-red-500" /> Enregistrer
          </button>
        )}
        <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={(e) => handleFile(e.target.files)} />
        <button onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 border border-gray-300 rounded-lg px-3 py-2 text-sm hover:bg-gray-50">
          <Upload className="w-4 h-4" /> Fichier audio
        </button>
      </div>

      {value && !recording && (
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
          <audio ref={audioRef} src={value} onEnded={() => setPlaying(false)} className="hidden" />
          <button onClick={() => {
            if (playing) { audioRef.current?.pause(); setPlaying(false); }
            else { audioRef.current?.play(); setPlaying(true); }
          }} className="text-[--primary]">
            {playing ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <span className="text-xs text-gray-500 flex-1">
            Audio {value.startsWith("data:audio/webm") ? "(enregistrement)" : "(fichier)"}
          </span>
          <button onClick={() => { onChange(undefined); setPlaying(false); }}
            className="text-red-400 hover:text-red-600">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
