"use client";

import { Suspense, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { reportarVista } from "@/lib/api";

// Report progress every N seconds of playback time
const REPORT_INTERVAL_SECONDS = 5;
// Threshold to mark as terminado (90%)
const TERMINADO_THRESHOLD = 0.9;

function ReproducirContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, profile, account } = useAuth();

  const streamUrl = searchParams.get("url");
  const title = searchParams.get("title") || "Reproduciendo";
  const contenidoId = searchParams.get("contenido_id");
  const episodioId = searchParams.get("episodio_id");

  const videoRef = useRef<HTMLVideoElement>(null);
  const lastReportedRef = useRef<number>(-REPORT_INTERVAL_SECONDS);
  const reportedTerminadoRef = useRef(false);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (account?.is_admin) {
      router.replace("/admin");
      return;
    }

    if (!profile) {
      router.replace("/perfiles");
      return;
    }
  }, [isAuthenticated, isLoading, account, profile, router]);

  // HU6: report progress via POST /perfiles/{id}/vistas
  const reportProgress = useCallback(
    async (segundos: number, terminado: boolean) => {
      if (!profile?.id) return;
      if (!contenidoId && !episodioId) return;

      try {
        const payload: {
          contenido_id?: number;
          episodio_id?: number;
          segundos_vistos: number;
          terminado?: boolean;
        } = {
          segundos_vistos: Math.floor(segundos),
          terminado,
        };
        if (episodioId) {
          payload.episodio_id = Number(episodioId);
        } else if (contenidoId) {
          payload.contenido_id = Number(contenidoId);
        }
        await reportarVista(profile.id, payload);
      } catch {
        // Silently ignore progress report errors — they shouldn't interrupt playback
      }
    },
    [profile, contenidoId, episodioId]
  );

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration || isNaN(video.duration)) return;

    const current = video.currentTime;
    const duration = video.duration;
    const progress = current / duration;

    // Mark terminado once at 90%+
    if (progress >= TERMINADO_THRESHOLD && !reportedTerminadoRef.current) {
      reportedTerminadoRef.current = true;
      reportProgress(current, true);
      lastReportedRef.current = current;
      return;
    }

    // Report every REPORT_INTERVAL_SECONDS
    if (current - lastReportedRef.current >= REPORT_INTERVAL_SECONDS) {
      lastReportedRef.current = current;
      reportProgress(current, false);
    }
  }, [reportProgress]);

  // Report final position on pause / before unload
  const handlePause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    reportProgress(video.currentTime, false);
    lastReportedRef.current = video.currentTime;
  }, [reportProgress]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const video = videoRef.current;
      if (!video) return;
      // Best-effort sync report on tab close
      reportProgress(video.currentTime, false);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [reportProgress]);

  const handleBack = () => {
    // Report current position before navigating away
    const video = videoRef.current;
    if (video) reportProgress(video.currentTime, false);
    router.back();
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!streamUrl) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center gap-4">
        <p className="text-white">No se especifico un video para reproducir.</p>
        <button onClick={handleBack} className="text-primary hover:underline">
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black to-transparent">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-white hover:text-primary transition-colors"
          >
            <ArrowLeft size={24} />
            <span className="font-medium">Volver</span>
          </button>
          <span className="text-white font-medium truncate">{title}</span>
        </div>
      </div>

      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        src={streamUrl}
        controls
        autoPlay
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onPause={handlePause}
      >
        Tu navegador no soporta la reproduccion de video.
      </video>
    </div>
  );
}

export default function ReproducirPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      }
    >
      <ReproducirContent />
    </Suspense>
  );
}
