"use client";

import { useState, useRef, useEffect } from "react";
import { X, Lock, Loader2 } from "lucide-react";

interface PinModalProps {
  profileName: string;
  onSubmit: (pin: string) => Promise<{ success: boolean; error?: string; blockedUntil?: string }>;
  onCancel: () => void;
}

export function PinModal({ profileName, onSubmit, onCancel }: PinModalProps) {
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Countdown for blocked state
  useEffect(() => {
    if (!blockedUntil) return;

    const interval = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      const blocked = new Date(blockedUntil);
      if (currentTime >= blocked.getTime()) {
        setBlockedUntil(null);
        setError(null);
        setPin(["", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [blockedUntil]);

  const handleChange = (index: number, value: string) => {
    if (blockedUntil) return;
    if (!/^\d*$/.test(value)) return; // Only digits

    const newPin = [...pin];
    newPin[index] = value.slice(-1); // Only last digit
    setPin(newPin);
    setError(null);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 4 digits entered
    if (value && index === 3 && newPin.every((d) => d !== "")) {
      handleSubmit(newPin.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (pinValue: string) => {
    if (blockedUntil) return;

    setLoading(true);
    setError(null);

    try {
      const result = await onSubmit(pinValue);
      if (!result.success) {
        if (result.blockedUntil) {
          setBlockedUntil(result.blockedUntil);
          setNow(Date.now());
          setError("Demasiados intentos fallidos.");
        } else {
          setError(result.error || "PIN incorrecto");
        }
        setPin(["", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError("Error al validar el PIN");
      setPin(["", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const getRemainingTime = () => {
    if (!blockedUntil) return "";
    const blocked = new Date(blockedUntil);
    const diff = Math.max(0, Math.ceil((blocked.getTime() - now) / 1000));
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="relative w-full max-w-md mx-4 p-6 bg-card rounded-xl border border-border shadow-2xl">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-secondary transition-colors"
          aria-label="Cerrar"
        >
          <X size={20} className="text-muted-foreground" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock size={32} className="text-primary" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-foreground text-center mb-2">
          Ingresa el PIN
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Ingresa el PIN de control parental para acceder al perfil{" "}
          <span className="font-medium text-foreground">{profileName}</span>
        </p>

        {/* PIN inputs */}
        <div className="flex justify-center gap-3 mb-6">
          {pin.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={loading || !!blockedUntil}
              className="w-14 h-14 text-center text-2xl font-bold border-2 border-border rounded-lg bg-background text-foreground focus:border-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label={`Digito ${index + 1} del PIN`}
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-lg border border-primary/60 bg-primary/10 px-4 py-3 text-sm text-primary text-center mb-4">
            {blockedUntil
              ? `Demasiados intentos fallidos. Perfil bloqueado hasta dentro de ${getRemainingTime()}.`
              : error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
