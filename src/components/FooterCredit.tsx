import { Phone } from "lucide-react";
import { cn } from "@/lib/utils";

const PHONE = "01272513545";

export function FooterCredit({ className, tone = "light", printable = false }: { className?: string; tone?: "light" | "dark"; printable?: boolean }) {
  return (
    <footer className={cn("flex flex-col items-center gap-1 text-center", !printable && "no-print", className)}>
      <a href="tel:01206098373" className={cn("mb-2 text-sm font-bold", tone === "dark" ? "text-primary-foreground" : "text-foreground")}>
        للتواصل مع المعلم فادي: <span dir="ltr" className="text-success">01206098373</span>
      </a>
      <span aria-hidden className="mb-1 h-1 w-24 rounded-full bg-gold" />
      <p className={cn("text-[11px] sm:text-xs", tone === "dark" ? "text-primary-foreground/70" : "text-muted-foreground")}>
        تصميم وإنشاء الموقع والتطبيق
      </p>
      <p className={cn("text-sm font-extrabold sm:text-base", tone === "dark" ? "text-primary-foreground" : "text-primary")}>
        مهندس كيرلس هاني <span className="text-accent">( النوتي )</span>
      </p>
      <a
        dir="ltr"
        href={`tel:${PHONE}`}
        className={cn(
          "mt-1 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold transition-colors",
          tone === "dark"
            ? "border-primary-foreground/25 text-primary-foreground hover:bg-primary-foreground/10"
            : "border-border text-success hover:border-success/40 hover:bg-success/5",
        )}
      >
        <Phone className="size-3.5" />
        <span dir="ltr">{PHONE}</span>
      </a>
    </footer>
  );
}
