import { useState, useEffect } from 'react';
import { FastAverageColor } from 'fast-average-color';

const fac = new FastAverageColor();

export function useDominantColor(imageUrl: string | null | undefined, defaultColor: string = '#ff8c00') {
  const [color, setColor] = useState<string>(defaultColor);

  useEffect(() => {
    if (!imageUrl) {
      setColor(defaultColor);
      return;
    }

    // If it's a base64 string or a URL
    fac.getColorAsync(imageUrl)
      .then(color => {
        setColor(color.hex);
      })
      .catch(e => {
        console.error(e);
        setColor(defaultColor);
      });
  }, [imageUrl, defaultColor]);

  return color;
}
