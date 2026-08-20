import React, { useEffect, useState } from 'react';
import { isDataUrl, isRemoteUrl } from '../utils/logoStorage';

interface EntityLogoProps {
  src?: string | null;
  alt: string;
  fallback: string;
  className?: string;
  title?: string;
}

export default function EntityLogo({ src, alt, fallback, className, title }: EntityLogoProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const usable = !failed && src && (isRemoteUrl(src) || isDataUrl(src)) ? src : null;

  if (usable) {
    return (
      <img
        src={usable}
        alt={alt}
        title={title || alt}
        className={className}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span className="text-lg font-bold text-gray-600" title={title || alt}>
      {fallback}
    </span>
  );
}
