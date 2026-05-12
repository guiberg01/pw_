export const normalizeImageSrc = (src) => {
  if (!src || typeof src !== "string") {
    return "";
  }

  if (src.startsWith("data:") || src.startsWith("blob:")) {
    return src;
  }

  if (src.startsWith("/")) {
    return src;
  }

  try {
    const parsedUrl = new URL(src);

    if (parsedUrl.pathname.startsWith("/uploads/")) {
      return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
    }
  } catch {}

  return src;
};
