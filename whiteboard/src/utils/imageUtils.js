// Image compression & optimization utility for FlowSpace
// Ensures image elements fit safely within Firestore document limits (<1MB)

export async function compressImageToDataUrl(fileOrDataUrl, maxDimension = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const processImage = () => {
      let { naturalWidth: width, naturalHeight: height } = img;
      if (!width || !height) {
        width = img.width || 300;
        height = img.height || 240;
      }

      // Constrain dimensions proportionally
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({
          dataUrl: typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '',
          width,
          height
        });
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Try webp then jpeg
      let dataUrl = canvas.toDataURL('image/webp', quality);
      if (!dataUrl || dataUrl.startsWith('data:image/png')) {
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }

      // If still large (>600KB base64 length ~450KB binary), scale down once more
      if (dataUrl.length > 600 * 1024) {
        canvas.width = Math.round(width * 0.75);
        canvas.height = Math.round(height * 0.75);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      }

      resolve({
        dataUrl,
        width,
        height
      });
    };

    img.onload = processImage;
    img.onerror = () => {
      if (typeof fileOrDataUrl === 'string') {
        resolve({ dataUrl: fileOrDataUrl, width: 300, height: 240 });
      } else {
        reject(new Error('Failed to load image for compression'));
      }
    };

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else if (fileOrDataUrl instanceof Blob || fileOrDataUrl instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}
