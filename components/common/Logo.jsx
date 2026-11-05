'use client';

import Image from 'next/image';
import Link from 'next/link';

/**
 * VoteSphere Brand Logo Component
 * Standardized across all headers, footers, auth cards, and public pages.
 */
export default function Logo({
  size = 36,
  className = '',
  imageClassName = '',
  showText = false,
  textClassName = '',
  asLink = false,
  href = '/',
  priority = false,
  alt = 'VoteSphere Logo',
}) {
  const imageElement = (
    <div
      className={`relative inline-flex items-center justify-center rounded-xl overflow-hidden shrink-0 shadow-md shadow-blue-500/10 ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/logo.png"
        alt={alt}
        width={size}
        height={size}
        priority={priority}
        className={`w-full h-full object-contain ${imageClassName}`}
      />
    </div>
  );

  const content = showText ? (
    <div className="inline-flex items-center gap-2.5 group">
      {imageElement}
      <span className={`text-xl font-black tracking-tight text-white ${textClassName}`}>
        Vote<span className="text-blue-400">Sphere</span>
      </span>
    </div>
  ) : (
    imageElement
  );

  if (asLink) {
    return (
      <Link href={href} className="inline-flex items-center group transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
