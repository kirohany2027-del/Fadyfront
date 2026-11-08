import logoSrc from "@/assets/fady-logo.png";
const logo = { url: logoSrc };
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <img src={logo.url} alt="لوجو المعلم فادي يسري — محل ابن الملك" className={cn("size-11 shrink-0 rounded-full object-contain", className)} />
  );
}

export function Brand({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-3">
      <BrandMark />
      <div className="min-w-0 leading-tight">
        <div className="font-display text-lg sm:text-xl">المعلم فادي يسري</div>
        {subtitle && <div className="text-xs opacity-70">{subtitle}</div>}
      </div>
    </div>
  );
}
