export function resizeImage(file: File, maxW: number, maxH: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxW) { height *= maxW / width; width = maxW; }
      if (height > maxH) { width *= maxH / height; height = maxH; }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export async function fetchLinkPreview(url: string): Promise<{ title: string; thumbnail?: string }> {
  try {
    const res = await fetch(`/api/og?url=${encodeURIComponent(url)}`);
    if (res.ok) return await res.json();
  } catch { /* fallback */ }
  return { title: url };
}
