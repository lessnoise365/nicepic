
export const trimTransparentPixels = (imageSrc: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageSrc);
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { data, width, height } = imageData;

      let top = 0, bottom = height, left = 0, right = width;
      let hasContent = false;

      // Find top
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (data[(y * width + x) * 4 + 3] !== 0) {
            top = y;
            hasContent = true;
            break;
          }
        }
        if (hasContent) break;
      }

      if (!hasContent) {
        // Fully transparent image
        resolve(imageSrc);
        return;
      }

      // Reset content flag for next searches
      hasContent = false;

      // Find bottom
      for (let y = height - 1; y >= 0; y--) {
        for (let x = 0; x < width; x++) {
          if (data[(y * width + x) * 4 + 3] !== 0) {
            bottom = y + 1;
            hasContent = true;
            break;
          }
        }
        if (hasContent) break;
      }

      hasContent = false;

      // Find left
      for (let x = 0; x < width; x++) {
        for (let y = top; y < bottom; y++) {
          if (data[(y * width + x) * 4 + 3] !== 0) {
            left = x;
            hasContent = true;
            break;
          }
        }
        if (hasContent) break;
      }

      hasContent = false;

      // Find right
      for (let x = width - 1; x >= 0; x--) {
        for (let y = top; y < bottom; y++) {
          if (data[(y * width + x) * 4 + 3] !== 0) {
            right = x + 1;
            hasContent = true;
            break;
          }
        }
        if (hasContent) break;
      }

      const trimWidth = right - left;
      const trimHeight = bottom - top;

      // If no trimming is actually needed
      if (trimWidth === width && trimHeight === height) {
        resolve(imageSrc);
        return;
      }

      // Create trimmed canvas
      const trimmedCanvas = document.createElement('canvas');
      trimmedCanvas.width = trimWidth;
      trimmedCanvas.height = trimHeight;
      const trimmedCtx = trimmedCanvas.getContext('2d');
      
      if (!trimmedCtx) {
        resolve(imageSrc);
        return;
      }

      trimmedCtx.drawImage(
        canvas,
        left, top, trimWidth, trimHeight,
        0, 0, trimWidth, trimHeight
      );

      resolve(trimmedCanvas.toDataURL());
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
};
