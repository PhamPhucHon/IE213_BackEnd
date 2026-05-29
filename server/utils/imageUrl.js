const CLOUDINARY_UPLOAD_MARKER = '/image/upload/';

const hasTransformationFlag = (value, flag) =>
  new RegExp(`(^|[,/])${flag}([,:/]|$)`).test(value);

const optimizeImageUrl = (url) => {
  if (typeof url !== 'string' || !url) return url;

  const markerIndex = url.indexOf(CLOUDINARY_UPLOAD_MARKER);
  if (markerIndex === -1) return url;

  const prefixEnd = markerIndex + CLOUDINARY_UPLOAD_MARKER.length;
  const prefix = url.slice(0, prefixEnd);
  const suffix = url.slice(prefixEnd);
  const uploadPath = suffix.split('?')[0];
  const hasAutoFormat = hasTransformationFlag(uploadPath, 'f_auto');
  const hasAutoQuality = hasTransformationFlag(uploadPath, 'q_auto');

  if (hasAutoFormat && hasAutoQuality) {
    return url;
  }

  const transforms = [
    hasAutoFormat ? null : 'f_auto',
    hasAutoQuality ? null : 'q_auto',
  ].filter(Boolean);

  return `${prefix}${transforms.join(',')}/${suffix}`;
};

const optimizeImageUrls = (urls = []) => urls.map(optimizeImageUrl);

module.exports = {
  optimizeImageUrl,
  optimizeImageUrls,
};
