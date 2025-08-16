"use client";
import { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react"; 

export default function Recorder({ onText }: { onText: (text: string) => void }) {
  const [recording, setRecording] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    chunksRef.current = [];
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const form = new FormData();
      form.append("file", blob, "voice.webm");
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const res = await fetch(base + "/stt", { method: "POST", body: form });
      const data = await res.json();
      if (data?.text) onText(data.text);
    };
    mr.start();
    mediaRef.current = mr;
    setRecording(true);
  }

  function stop() {
    mediaRef.current?.stop();
    setRecording(false);
  }

   return (
    <button
      onClick={() => (recording ? stop() : start())}
      aria-label={recording ? "Stop recording" : "Start recording"}
      className={`inline-flex items-center gap-2 rounded border px-3 py-2 ${
        recording ? "bg-red-600 text-white border-red-700" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow"
      }`}
    >
      <Mic className="h-4 w-4" /> {recording ? "Stop" : "Record"}
    </button>
  );
}
