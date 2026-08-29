function parseImageUrls(body) {
  let urls = [];
  if (Array.isArray(body.images)) {
    urls = body.images;
  } else if (typeof body.images === 'string' && body.images.trim()) {
    try {
      const parsed = JSON.parse(body.images);
      urls = Array.isArray(parsed) ? parsed : [body.images];
    } catch {
      urls = body.images.split(/[\n,]+/);
    }
  }
  if (body.imageUrl?.trim()) {
    urls.unshift(body.imageUrl.trim());
  }
  return [...new Set(
    urls
      .map((u) => (typeof u === 'string' ? u.trim() : ''))
      .filter((u) => u.length > 0 && /^https?:\/\//i.test(u))
  )];
}

function serializePropertyImages(urls) {
  return {
    imageUrl: urls[0],
    images: JSON.stringify(urls),
  };
}

function parsePropertyImages(property) {
  if (!property) return [];
  let urls = [];
  if (property.images) {
    try {
      const parsed = JSON.parse(property.images);
      if (Array.isArray(parsed)) urls = parsed;
    } catch {
      urls = [];
    }
  }
  if (property.imageUrl && !urls.includes(property.imageUrl)) {
    urls.unshift(property.imageUrl);
  }
  return urls.filter(Boolean);
}

module.exports = { parseImageUrls, serializePropertyImages, parsePropertyImages };
