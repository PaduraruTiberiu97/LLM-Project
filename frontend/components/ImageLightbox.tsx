"use client";
import { X } from "lucide-react";

export default function ImageLightbox({
  src,
  alt,
  onClose,
}: { src: string; alt?: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
      onClick={onClose}
    >
      <button className="absolute top-4 right-4 text-white/90 hover:text-white" aria-label="Close">
        <X className="h-6 w-6" aria-hidden="true" />
      </button>
      {/* stop click from bubbling so clicking the image doesn't close */}
      <img
        onClick={(e) => e.stopPropagation()}
        src={src}
        alt={alt || "image"}
        className="max-h-[85vh] max-w-[90vw] rounded-xl shadow-2xl"
      />
    </div>
  );
}