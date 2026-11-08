export function accountImageFile(blob: Blob, code: string) {
  return new File([blob], `account-${code}.png`, { type: "image/png" });
}

export async function shareAccountImage(file: File) {
  if (!navigator.canShare?.({ files: [file] }) || !navigator.share) return false;
  await navigator.share({ files: [file] });
  return true;
}

export function downloadAccountImage(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}