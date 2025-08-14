"use client";
import { useEffect, useMemo, useState } from "react";
import ChatWindow from "@/components/ChatWindow";

export default function ChatById({ params }: { params: { id: string } }){
  const chatId = Number(params.id);
  // Prime ChatWindow by loading history once (optional — ChatWindow can also load on its own)
  const [seed, setSeed] = useState<{role:"user"|"assistant";content:string}[]|null>(null);

  const base = useMemo(()=>process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",[]);
  useEffect(()=>{
    fetch(`${base}/chats/${chatId}`).then(r=>r.json()).then(data=>{
      setSeed(data?.messages || []);
    }).catch(()=>setSeed([]));
  },[base,chatId]);

  return <ChatWindow chatId={chatId} seedMessages={seed || undefined}/>;
}