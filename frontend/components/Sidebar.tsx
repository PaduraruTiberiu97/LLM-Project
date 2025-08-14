"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Image as ImageIcon, MessageSquare } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

function useApiBase(){
  return useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000", []);
}

type ChatItem = { id: number; title: string };

export default function Sidebar(){
  const base = useApiBase();
  const [q, setQ] = useState("");
  const [chats, setChats] = useState<ChatItem[]>([]);

  async function load(){
  try {
    const res = await fetch(base + "/chats");
    const data = await res.json().catch(() => []);
    setChats(Array.isArray(data) ? data : []);
  } catch {
    setChats([]); // don't crash UI if API is down
  }
}
  useEffect(()=>{ load().catch(()=>{}); },[base]);

  useEffect(() => {
    const handler = () => load().catch(() => {});
    window.addEventListener("chat-updated", handler);
    return () => window.removeEventListener("chat-updated", handler);
  }, [base]);

  async function newChat(){
    const res = await fetch(base+"/chats", { method: "POST"});
    const data = await res.json();
    window.location.href = "/chat/"+data.id;
  }

  const filtered = Array.isArray(chats)
  ? chats.filter(c => !q || c.title.toLowerCase().includes(q.toLowerCase()))
  : [];

  return (
    <aside className="w-72 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 backdrop-blur hidden md:flex md:flex-col">
      <div className="p-3 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button onClick={newChat} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-3 py-2 hover:opacity-95">
          <Plus className="h-4 w-4"/> New chat
        </button>
        <ThemeToggle/>
      </div>

      <div className="p-3 border-b border-slate-200 dark:border-slate-800">
        <label className="flex items-center gap-2 rounded-lg border px-2 py-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <Search className="h-4 w-4"/>
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search chats" className="bg-transparent w-full outline-none py-1"/>
        </label>
        <div className="mt-2 flex items-center gap-2 text-sm">
          <Link href="/library" className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"><ImageIcon className="h-4 w-4"/> Library</Link>
        </div>
      </div>

      <div className="p-3 space-y-1 overflow-auto">
        <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">My chats</div>
        {filtered.map(c => (
          <Link key={c.id} href={`/chat/${c.id}`} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <MessageSquare className="h-4 w-4"/>
            <span className="truncate">{c.title}</span>
          </Link>
        ))}
        {filtered.length===0 && (
          <div className="text-slate-500 text-sm">No chats yet.</div>
        )}
      </div>
    </aside>
  );
}