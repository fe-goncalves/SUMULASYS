export function getDominantColor(imageSrc: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('#f97316'); // default orange
        return;
      }
      
      // Scale down for performance
      canvas.width = 50;
      canvas.height = 50;
      ctx.drawImage(img, 0, 0, 50, 50);
      
      const imageData = ctx.getImageData(0, 0, 50, 50).data;
      let r = 0, g = 0, b = 0, count = 0;
      
      for (let i = 0; i < imageData.length; i += 4) {
        // Ignore transparent pixels
        if (imageData[i + 3] > 128) {
          // Ignore white/very light pixels
          if (imageData[i] > 240 && imageData[i+1] > 240 && imageData[i+2] > 240) continue;
          // Ignore black/very dark pixels
          if (imageData[i] < 15 && imageData[i+1] < 15 && imageData[i+2] < 15) continue;
          
          r += imageData[i];
          g += imageData[i + 1];
          b += imageData[i + 2];
          count++;
        }
      }
      
      if (count === 0) {
        resolve('#f97316');
        return;
      }
      
      r = Math.floor(r / count);
      g = Math.floor(g / count);
      b = Math.floor(b / count);
      
      const hex = '#' + [r, g, b].map(x => {
        const hexStr = x.toString(16);
        return hexStr.length === 1 ? '0' + hexStr : hexStr;
      }).join('');
      
      resolve(hex);
    };
    img.onerror = () => resolve('#f97316');
    img.src = imageSrc;
  });
}
