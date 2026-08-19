"use client";

import { ArrowLeft } from "lucide-react";
import Hls from "hls.js";
import { useEffect, useRef } from "react";

interface VideoPlayerProps {
  streamUrl: string;
  title: string;
  onBack: () => void;
}

export function VideoPlayer({ streamUrl, title, onBack }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl.includes(".m3u8") || video.canPlayType("application/vnd.apple.mpegurl") || !Hls.isSupported()) return;
    const hls = new Hls({ enableWorker: true });
    hls.loadSource(streamUrl);
    hls.attachMedia(video);
    return () => hls.destroy();
  }, [streamUrl]);
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
        ref={videoRef}
        className="w-full h-full object-contain"
        src={streamUrl.includes(".m3u8") ? undefined : streamUrl}
        controls
        autoPlay
        playsInline
      >
        Tu navegador no soporta la reproduccion de video.
      </video>
    </div>
  );
}
