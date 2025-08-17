"use client";
import { useEffect, useMemo, useState } from "react";
import ImageLightbox from "@/components/ImageLightbox";
import Spinner from "@/components/Spinner";

type Img = { id:number; chat_id:number|null; title?:string|null; b64:string };

export default function LibraryPage(){
  const base = useMemo(()=>process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",[]);
  const [imgs, setImgs] = useState<Img[] | null>(null);
  const [open, setOpen] = useState<string|null>(null);

  useEffect(()=>{ fetch(base+"/images").then(r=>r.json()).then(setImgs).catch(()=>setImgs([])); },[base]);

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">Library</h2>
      {imgs === null ? (
        <div className="flex items-center justify-center py-10">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {imgs.map(im=> (
              <img key={im.id} src={`data:image/png;base64,${im.b64}`} alt={im.title || "image"}
                   className="rounded-xl border border-slate-200 dark:border-slate-700 cursor-zoom-in hover:opacity-95"
                   onClick={()=>setOpen(`data:image/png;base64,${im.b64}`)}/>
            ))}
          </div>
          {imgs.length===0 && <div className="text-slate-500">No images yet.</div>}
        </>
      )}
      {open && <ImageLightbox src={open} onClose={()=>setOpen(null)}/>}
    </div>
  );
}