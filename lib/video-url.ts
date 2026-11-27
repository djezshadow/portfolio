export type ParsedVideo = { provider: "youtube" | "vimeo"; videoId: string };

/**
 * Acepta cualquier formato común de link de YouTube o Vimeo y devuelve
 * el provider + id que necesitamos guardar. Si no reconoce el link,
 * devuelve null (y el caller decide si avisar al usuario).
 */
export function parseVideoUrl(raw: string): ParsedVideo | null {
  const url = raw.trim();
  if (!url) return null;
  const youtubeId = /^[a-zA-Z0-9_-]{11}$/;
  if (youtubeId.test(url)) return { provider: "youtube", videoId: url };

  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = u.pathname.split("/")[1];
      if (youtubeId.test(id)) return { provider: "youtube", videoId: id };
    }

    if (["youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com"].includes(host)) {
      const v = u.searchParams.get("v");
      if (v && youtubeId.test(v)) return { provider: "youtube", videoId: v };
      const match = u.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)\/?$/);
      if (match && youtubeId.test(match[1])) return { provider: "youtube", videoId: match[1] };
    }

    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const match = u.pathname.match(/(\d+)/);
      if (match) return { provider: "vimeo", videoId: match[1] };
    }
  } catch {
    return null;
  }

  return null;
}

/** Miniatura estática de YouTube (gratis, sin API key). Vimeo no tiene un
 * equivalente sin llamar a su oEmbed, así que devolvemos null para ese caso. */
export function getVideoThumbnail(provider: "youtube" | "vimeo", videoId: string): string | null {
  if (provider === "youtube") return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  return null;
}
