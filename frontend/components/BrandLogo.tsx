// BrandLogo component for TITOFLIX
// Displays the logo with Italian flag colors: TIT (green), OF (white), LIX (red)

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function BrandLogo({ size = "md", className = "" }: BrandLogoProps) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-5xl",
    xl: "text-7xl",
  };

  return (
    <h1 className={`font-bold tracking-tight ${sizeClasses[size]} ${className}`}>
      <span className="text-tito-green">TIT</span>
      <span className="text-tito-white">O</span>
      <span className="text-tito-red">FLIX</span>
    </h1>
  );
}
