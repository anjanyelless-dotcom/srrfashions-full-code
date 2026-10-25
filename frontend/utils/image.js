// Shared product/image URL resolution.
//
// The backend stores image paths relative to the site root, e.g.
// "wp-content/uploads/sites/383/2026/07/2.png" (no leading slash).
// A bare relative path only resolves correctly on "/" — on nested clean
// routes like /category/:slug or /product/:slug the browser resolves it
// against the route directory (/category/wp-content/..., /product/wp-content/...)
// which hits the SPA fallback and returns index.html instead of the image.
// Always produce a root-absolute URL ("wp-content/x" -> "/wp-content/x").

const UPLOADS_PREFIX = 'wp-content/uploads/sites/383/';

// Last-resort fallback for images that genuinely fail to load.
// A data URI so it can never 404 or cause an onerror loop.
export const IMAGE_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='800'%3E%3Crect width='100%25' height='100%25' fill='%23f2f0ed'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='22' fill='%23999' text-anchor='middle'%3EImage unavailable%3C/text%3E%3C/svg%3E";

export function getProductImageUrl(imagePath) {
  const src = String(imagePath || '').trim();
  if (!src) return '';

  // Already absolute (http://, https://, //cdn...) or root-relative (/...) — use as-is
  if (/^(https?:)?\/\//i.test(src) || src.startsWith('/')) return src;

  // Site-relative upload paths -> make them root-absolute
  if (src.startsWith('wp-content/')) return `/${src}`;
  if (src.startsWith('uploads/')) return `/${UPLOADS_PREFIX}${src.slice('uploads/'.length)}`;
  return `/${UPLOADS_PREFIX}${src}`;
}

// For <img onError={onImageError}>: swap in the inline fallback exactly once,
// so a broken URL shows a placeholder without looping.
export function onImageError(e) {
  const img = e.currentTarget || e.target;
  if (!img || img.dataset.fallbackApplied === '1') return;
  img.dataset.fallbackApplied = '1';
  img.src = IMAGE_FALLBACK;
}
