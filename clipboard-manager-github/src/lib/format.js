export const catIcon = (text) => {
  if (/^https?:\/\//.test(text)) return "🔗";
  if (text.includes("@") && text.includes(".") && !text.includes(" ")) return "✉️";

  const digits = text.replace(/[^0-9+\-]/g, "");
  if (digits.length >= 9 && digits.length <= 15 && /^[\d\-+\s()]+$/.test(text.trim())) {
    return "📞";
  }

  return "📝";
};

export const ago = (timestamp) => {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return "방금 전";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
  return `${Math.floor(diff / 86400000)}일 전`;
};

export const normalizeUrl = (rawUrl) => {
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";

  const withProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return url.href;
  } catch {
    return "";
  }
};
