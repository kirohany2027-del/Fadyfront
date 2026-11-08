import { MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { orderMessage, smsLink, type Customer } from "@/lib/tailor";

export function SendSms({ c, className, size = "lg" }: { c: Pick<Customer, "name" | "code" | "due_date" | "phone">; className?: string; size?: "sm" | "lg" | "default" }) {
  if (!c.phone) return null;
  return (
    <Button asChild variant="outline" size={size} className={className}>
      <a href={smsLink(c.phone, orderMessage(c, window.location.origin))}><MessageSquareText /> رسالة SMS</a>
    </Button>
  );
}
