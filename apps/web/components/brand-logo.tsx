import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  size?: "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
  className?: string;
};

const sizeMap = {
  sm: { img: 28, className: "h-7 w-7" },
  md: { img: 36, className: "h-9 w-9" },
  lg: { img: 80, className: "h-20 w-20" },
  xl: { img: 120, className: "h-28 w-28 md:h-32 md:w-32" }
};

export function BrandLogo({
  size = "md",
  showWordmark = true,
  className
}: BrandLogoProps) {
  const { img, className: imgClass } = sizeMap[size];

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/logos/warden-logo.png"
        alt="Warden"
        width={img}
        height={img}
        className={cn("shrink-0 object-contain", imgClass)}
        priority={size === "lg" || size === "xl"}
      />
      {showWordmark ? (
        <span className="text-sm font-semibold leading-none tracking-tight text-foreground">
          Warden
        </span>
      ) : null}
    </span>
  );
}
