
export function isYoutubeUrl(url: string): boolean {
  const u = (url || '').toLowerCase();
  return u.includes('youtube.com') || u.includes('youtu.be');
}

export function extractYoutubeId(url: string): string | null {
  if (!url) return null;

  // youtu.be/<id>
  let m = url.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
  if (m?.[1]) return m[1];

  // youtube.com/watch?v=<id>
  m = url.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
  if (m?.[1]) return m[1];

  // youtube.com/shorts/<id>
  m = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/);
  if (m?.[1]) return m[1];

  // youtube.com/embed/<id>
  m = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/);
  if (m?.[1]) return m[1];

  return null;
}

export function toYoutubeEmbedUrl(url: string, autoplay = true): string | null {
  const id = extractYoutubeId(url);
  if (!id) return null;

  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    playsinline: '1',
    rel: '0',
    modestbranding: '1',
  });

  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}

export function isMp4Url(url: string): boolean {
  return /\.mp4(\?.*)?$/i.test(url || '');
}
