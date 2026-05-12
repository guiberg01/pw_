export function setFrontendCookie(name, value, maxAgeSeconds = 2592000) {
  if (typeof document !== "undefined") {
    const safeValue = encodeURIComponent(value);
    document.cookie = `${name}=${safeValue}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
  }
}

export function removeFrontendCookie(name) {
  if (typeof document !== "undefined") {
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
  }
}

export function getFrontendCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.*+?^${}()|[\\]\\])/g, "\\$1") + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}
