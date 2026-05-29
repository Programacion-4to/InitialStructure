"use client";

import { User } from "lucide-react";
import { getAssetUrl } from "@/lib/api";

type ProfileAvatarProps = {
  profile?: { nombre?: string | null; avatar?: string | null } | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-28 w-28 text-4xl md:h-36 md:w-36 md:text-5xl",
};

export function ProfileAvatar({ profile, size = "md", className = "" }: ProfileAvatarProps) {
  const avatarUrl = getAssetUrl(profile?.avatar);
  const initial = profile?.nombre?.trim().charAt(0).toUpperCase();

  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary font-bold text-foreground ${sizeClasses[size]} ${className}`}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : initial ? (
        initial
      ) : (
        <User size={size === "lg" ? 36 : 18} className="text-muted-foreground" />
      )}
    </span>
  );
}
