import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";
import { trackLink } from "@/lib/tailor";
import { matchesCardFilter } from "@/routes/app.cards";

const day = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

describe("Customer cards", () => {
  it("serves a page at /app/cards instead of the not-found fallback", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    expect(router.matchRoutes("/app/cards").at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("points each card's QR at that customer's own tracking link", () => {
    expect(trackLink("F-4C30E5FA345", "https://fady-abn-almalk.lovable.app")).toBe(
      "https://fady-abn-almalk.lovable.app/c/F-4C30E5FA345",
    );
  });

  it("keeps handed-over customers out of the not-yet-delivered filter", () => {
    expect(matchesCardFilter({ status: 4, due_date: day(1) }, "open")).toBe(false);
    expect(matchesCardFilter({ status: 2, due_date: day(1) }, "open")).toBe(true);
  });

  it("shows only deliveries within two days in the soon filter", () => {
    expect(matchesCardFilter({ status: 1, due_date: day(1) }, "soon")).toBe(true);
    expect(matchesCardFilter({ status: 1, due_date: day(10) }, "soon")).toBe(false);
  });
});
