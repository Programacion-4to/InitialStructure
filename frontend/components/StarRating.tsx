"use client";

import { Star } from "lucide-react";
import { useState } from "react";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: number;
  showValue?: boolean;
}

export function StarRating({
  value,
  onChange,
  readOnly = false,
  size = 24,
  showValue = false,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0);

  const displayValue = hoverValue || value;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readOnly && setHoverValue(star)}
          onMouseLeave={() => setHoverValue(0)}
          className={`transition-colors ${
            readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"
          }`}
          aria-label={`${star} estrellas`}
        >
          <Star
            size={size}
            className={
              star <= displayValue
                ? "text-yellow-500 fill-yellow-500"
                : "text-muted-foreground"
            }
          />
        </button>
      ))}
      {showValue && value > 0 && (
        <span className="ml-2 text-sm text-muted-foreground">
          ({value.toFixed(1)})
        </span>
      )}
    </div>
  );
}
