import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).href;

export interface ImageResult {
  base64: string;
  dataUrl: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
}

export async function fileToImageBase64(file: File): Promise<ImageResult> {
  if (file.type === "application/pdf") {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context");
    await page.render({ canvasContext: ctx, viewport } as unknown as Parameters<typeof page.render>[0]).promise;
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    return { base64: dataUrl.split(",")[1] ?? "", dataUrl, mimeType: "image/jpeg" };
  }

  const reader = new FileReader();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  return {
    base64: dataUrl.split(",")[1] ?? "",
    dataUrl,
    mimeType: file.type as "image/jpeg" | "image/png" | "image/webp",
  };
}
