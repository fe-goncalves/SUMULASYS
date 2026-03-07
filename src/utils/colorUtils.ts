// @ts-ignore
import { getColor } from 'colorthief';

export function getDominantColor(imageSrc: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageSrc;

    img.onload = async () => {
      try {
        const color = await getColor(img);
        if (color) {
          resolve(color.hex());
        } else {
          resolve('#f97316'); // Default orange
        }
      } catch (error) {
        console.error('Error extracting color:', error);
        resolve('#f97316'); // Default orange
      }
    };

    img.onerror = (error) => {
      console.error('Error loading image for color extraction:', error);
      resolve('#f97316'); // Default orange
    };
  });
}
