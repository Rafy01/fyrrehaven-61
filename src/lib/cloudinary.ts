// Byg hurtige, cachebare Cloudinary-URLs
const CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD!;
const BASE = `https://res.cloudinary.com/${CLOUD}/image/upload`;

/** Rå url med transformations */
export function clUrl(publicId: string, tr: string[] = []) {
  const t = ["f_auto", "q_auto", "dpr_auto", ...tr].join(",");
  return `${BASE}/${t}/${publicId}`;
}

/** Thumbnail til kort/tiles (cropper pænt) */
export function clThumb(id: string, w = 520, h = 360) {
  return clUrl(id, [`c_fill,g_auto,w_${w},h_${h}`]);
}

/** Stor visning (begræns max-bredde) */
export function clFull(id: string, maxW = 2000) {
  return clUrl(id, [`c_limit,w_${maxW}`]);
}
