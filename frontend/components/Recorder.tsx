"use client";
import { useRef, useState } from "react";
import { Mic } from "lucide-react";

export default function Recorder({
  onText,
  onRecordingChange,
  className,
}: {
  onText: (text: string) => void;
  onRecordingChange?: (recording: boolean) => void;
  className?: string;
}) {
  const [recording, setRecording] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number | null>(null);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      startTimeRef.current = Date.now();
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        const duration = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        startTimeRef.current = null;
        // ignore near-silent or very short captures which can yield random transcripts
        if (duration < 800 || blob.size < 2000) return;
        const form = new FormData();
        form.append("file", blob, "voice.webm");
        const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
        try {
          const res = await fetch(base + "/stt", { method: "POST", body: form });
          const data = await res.json();
          const text = (data?.text || "").trim();
          if (text) onText(text);
        } catch (e) {
          console.error("STT failed", e);
        }
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
      onRecordingChange?.(true);
    } catch (e) {
      console.error("Mic access failed", e);
      setRecording(false);
    }
  }

  function stop() {
    mediaRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setRecording(false);
    onRecordingChange?.(false);
  }

  return (
    <div className={`flex items-center ${className || ""}`}>
      <button
        type="button"
        onClick={() => (recording ? stop() : start())}
        aria-label={recording ? "Stop recording" : "Start recording"}
        className={`p-2 rounded-full ${
          recording
            ? "text-red-600"
            : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        }`}
      >
        <Mic className="h-5 w-5" />
      </button>
      {recording && (
        <div className="ml-2 recording-bars">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} />
          ))}
        </div>
      )}
    </div>
  );
}
