"use client";

interface ProgressBarProps {
  /** Seconds watched so far */
  segundosVistos: number;
  /** Total duration in minutes (from duracion_min) */
  duracionMin?: number | null;
  /** Whether the item is fully watched */
  terminado?: boolean;
  /** Compact mode (no text, just bar) */
  compact?: boolean;
}

export function ProgressBar({
  segundosVistos,
  duracionMin,
  terminado = false,
  compact = false,
}: ProgressBarProps) {
  const totalSeconds = duracionMin ? duracionMin * 60 : 0;
  const percent = terminado
    ? 100
    : totalSeconds > 0
      ? Math.min(100, Math.round((segundosVistos / totalSeconds) * 100))
      : 0;

  if (percent === 0 && !terminado) return null;

  return (
    <div className="flex flex-col gap-1">
      {/* Bar */}
      <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            terminado ? "bg-tito-green" : "bg-primary"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Label */}
      {!compact && (
        <span className="text-xs text-muted-foreground">
          {terminado ? "Visto" : `${percent}% visto`}
        </span>
      )}
    </div>
  );
}
