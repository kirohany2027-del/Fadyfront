import { createFileRoute } from "@tanstack/react-router";
import { CustomerScreen } from "./track.$code";

export const Route = createFileRoute("/c/$code")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "شاشة العميل | المعلم فادي يسري" },
      { name: "description", content: "كارت طلبك عند المعلم فادي يسري: موعد التسليم والحساب ومراسلة المعلم." },
      { property: "og:title", content: "شاشة العميل | المعلم فادي يسري" },
      { property: "og:description", content: "كارت طلبك: موعد التسليم والحساب ومراسلة المعلم فادي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CustomerOnly,
});

function CustomerOnly() {
  const { code } = Route.useParams();
  return <CustomerScreen code={code} standalone />;
}
