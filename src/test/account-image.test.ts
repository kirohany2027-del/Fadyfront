import { afterEach, describe, expect, it, vi } from "vitest";
import { accountImageFile, shareAccountImage } from "@/lib/account-image";

afterEach(() => vi.unstubAllGlobals());
describe("Image account sharing", () => {
  it("shares the account as a PNG file without a written account summary", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { canShare: () => true, share });
    const file = accountImageFile(new Blob(["image"]), "F-A7C92E4B81D6");
    expect(file.type).toBe("image/png");
    expect(file.name).toBe("account-F-A7C92E4B81D6.png");
    expect(await shareAccountImage(file)).toBe(true);
    expect(share).toHaveBeenCalledWith({ files: [file] });
  });
  it("signals the download fallback when file sharing is unavailable", async () => {
    vi.stubGlobal("navigator", {});
    expect(await shareAccountImage(accountImageFile(new Blob(["image"]), "F-0001"))).toBe(false);
  });
});