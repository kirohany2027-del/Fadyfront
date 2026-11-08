import { useRef, useState } from "react";
import { Download, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BrandMark } from "@/components/Brand";
import { STATUSES, money, paidOf, remainingOf, today, type Customer } from "@/lib/tailor";
import { accountImageFile, downloadAccountImage, shareAccountImage } from "@/lib/account-image";
import { FooterCredit } from "@/components/FooterCredit";

export function AccountImageShare({ c, className }: { c: Customer; className?: string }) {
  const sheet = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [image, setImage] = useState<{ file: File; url: string } | null>(null);
  const close = () => { if (image) URL.revokeObjectURL(image.url); setImage(null); };
  const prepare = async () => {
    if (!sheet.current) return;
    setBusy(true);
    try {
      await document.fonts.ready;
      const { toBlob } = await import("html-to-image");
      const blob = await toBlob(sheet.current, { pixelRatio: 2 });
      if (!blob) throw new Error("Image unavailable");
      const file = accountImageFile(blob, c.code);
      setImage({ file, url: URL.createObjectURL(file) });
    } catch { toast.error("تعذر تجهيز الصورة، حاول تاني"); }
    finally { setBusy(false); }
  };
  return <>
    <Button variant="whatsapp" size="lg" className={className} disabled={busy} onClick={prepare}>
      {busy ? <Loader2 className="animate-spin" /> : <MessageCircle />} {busy ? "تجهيز الصورة..." : "واتساب · صورة الحساب"}
    </Button>
    <div aria-hidden="true" className="account-image-staging">
      <div ref={sheet} dir="rtl" className="w-[640px] bg-card p-8 text-card-foreground">
        <div className="flex items-center gap-5 border-b-2 border-accent pb-6">
          <BrandMark className="size-28" />
          <div><div className="font-display text-3xl">المعلم فادي يسري</div><div className="mt-2 text-lg text-muted-foreground">كشف حساب العميل</div></div>
        </div>
        <div className="space-y-3 py-6 text-lg">
          <div className="flex justify-between"><b>{c.name}</b><b dir="ltr" className="text-primary">{c.code}</b></div>
          <div className="flex justify-between"><span>{c.garment || "—"}</span><span>{STATUSES[c.status]}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>تاريخ الحساب</span><span dir="ltr">{today()}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>موعد التسليم</span><span dir="ltr">{c.due_date || "—"}</span></div>
        </div>
        <div className="bg-secondary px-5 py-3 text-lg font-bold text-secondary-foreground">الدفعات</div>
        {c.payments.length ? c.payments.map(p => <div key={p.id} className="flex justify-between border-b border-border px-5 py-3 text-lg"><span dir="ltr">{p.paid_on}</span><b>{money(p.amount)}</b></div>) : <div className="py-5 text-muted-foreground">لا توجد دفعات</div>}
        <div className="mt-6 space-y-4 bg-muted p-5 text-xl">
          <div className="flex justify-between"><span>الإجمالي</span><b>{money(c.total)}</b></div>
          <div className="flex justify-between"><span>المدفوع</span><b className="text-success">{money(paidOf(c))}</b></div>
          <div className="flex justify-between border-t border-border pt-4"><b>{remainingOf(c) > 0 ? "المتبقي" : "الحساب خالص"}</b><b className={remainingOf(c) > 0 ? "text-destructive" : "text-success"}>{money(Math.max(remainingOf(c), 0))}</b></div>
        </div>
        <p className="mt-6 text-center text-muted-foreground">شكراً لتعاملكم معنا</p>
        <FooterCredit printable className="mt-5 border-t border-border pt-5" />
      </div>
    </div>
    <Dialog open={!!image} onOpenChange={open => { if (!open) close(); }}>
      <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>صورة الحساب</DialogTitle></DialogHeader>
        {image && <>
          <img src={image.url} alt={`كشف حساب ${c.name}`} className="w-full border border-border" />
          <div className="flex flex-wrap gap-2">
            <Button variant="whatsapp" className="flex-1" onClick={async () => {
              try {
                if (!await shareAccountImage(image.file)) {
                  downloadAccountImage(image.file);
                  toast.success("تم تحميل الصورة؛ ارفقها في محادثة العميل على واتساب");
                }
              } catch (e) { if (!(e instanceof Error && e.name === "AbortError")) toast.error("المشاركة مش متاحة؛ استخدم تحميل الصورة"); }
            }}><MessageCircle /> مشاركة الصورة</Button>
            <Button variant="outline" onClick={() => downloadAccountImage(image.file)}><Download /> تحميل</Button>
          </div>
        </>}
      </DialogContent>
    </Dialog>
  </>;
}