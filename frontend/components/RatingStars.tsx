"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface RatingStarsProps {
  /** Current rating (1-5), 0 means not rated */
  value: number;
  /** Average rating from API */
  average?: number | null;
  /** Called when user clicks a star */
  onRate?: (puntaje: number) => void;
  /** If true the user cannot interact */
  disabled?: boolean;
  /** Size of the star icons */
  size?: number;
}

export function RatingStars({
  value,
  average,
  onRate,
  disabled = false,
  size = 20,
}: RatingStarsProps) {
  const [hovered, setHovered] = useState(0);

  const display = hovered || value;

  return (
    <div className="flex flex-col gap-2">
      {/* Interactive stars */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onRate?.(star)}
            onMouseEnter={() => !disabled && setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className={`transition-colors ${
              disabled ? "cursor-default" : "cursor-pointer"
            }`}
            aria-label={`Calificar ${star} estrella${star > 1 ? "s" : ""}`}
          >
            <Star
              size={size}
              className={
                star <= display
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-muted-foreground"
              }
            />
          </button>
        ))}

        {value > 0 && (
          <span className="ml-2 text-sm text-muted-foreground">
            Tu puntuacion: {value}
          </span>
        )}
      </div>

      {/* Average */}
      {average !== undefined && average !== null && average > 0 && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Star size={14} className="text-yellow-400 fill-yellow-400" />
          <span>{average.toFixed(1)} promedio</span>
        </div>
      )}
    </div>
  );
}
