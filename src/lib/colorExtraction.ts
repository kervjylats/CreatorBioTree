/** TODO: Add purpose docstring. */
export function extractPaletteFromImage(imageUrl: string): Promise<{
  background: string;
  card: string;
  text: string;
  accent: string;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX_SIZE = 100;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > MAX_SIZE || h > MAX_SIZE) {
        const ratio = Math.min(MAX_SIZE / w, MAX_SIZE / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      const { data } = ctx.getImageData(0, 0, w, h);

      const colorCounts: Record<string, { r: number; g: number; b: number; count: number }> = {};
      for (let i = 0; i < data.length; i += 4) {
        const r = Math.round(data[i] / 32) * 32;
        const g = Math.round(data[i + 1] / 32) * 32;
        const b = Math.round(data[i + 2] / 32) * 32;
        const key = `${r},${g},${b}`;
        if (!colorCounts[key]) colorCounts[key] = { r, g, b, count: 0 };
        colorCounts[key].count++;
      }

      const sorted = Object.values(colorCounts).sort((a, b) => b.count - a.count).slice(0, 10);
      if (sorted.length === 0) {
        resolve({ background: "#ffffff", card: "#f9fafb", text: "#111827", accent: "#6366f1" });
        return;
      }

      const { r: dr, g: dg, b: db } = sorted[0];
      const background = rgbToHex(dr, dg, db);
      const luminance = (0.299 * dr + 0.587 * dg + 0.114 * db) / 255;
      const accent = rgbToHex(Math.min(255, dr + 60), Math.min(255, Math.max(0, dg - 20)), Math.min(255, db + 40));
      const text = luminance > 0.5 ? "#111827" : "#f9fafb";
      const card = luminance > 0.5
        ? rgbToHex(Math.max(0, dr - 15), Math.max(0, dg - 15), Math.max(0, db - 15))
        : rgbToHex(Math.min(255, dr + 25), Math.min(255, dg + 25), Math.min(255, db + 25));

      resolve({ background, card, text, accent });
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("");
}
