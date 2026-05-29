"use client";

import { ArrowLeft } from "lucide-react";

interface VideoPlayerProps {
  streamUrl: string;
  title: string;
  onBack: () => void;
}

export function VideoPlayer({ streamUrl, title, onBack }: VideoPlayerProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black to-transparent">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white hover:text-primary transition-colors"
          >
            <ArrowLeft size={24} />
            <span className="font-medium">Volver</span>
          </button>
          <span className="text-white font-medium truncate">{title}</span>
        </div>
      </div>

      {/* Video */}
      <video
        className="w-full h-full object-contain"
        src={streamUrl}
        controls
        autoPlay
        playsInline
      >
        Tu navegador no soporta la reproduccion de video.
      </video>
    </div>
  );
}
