'use client';

import React, { useState } from 'react';

/**
 * Maps a product name (IT/FR, any casing) to a photo in /public/products.
 * Falls back to an emoji tile when no photo is available or it fails to load.
 */
const PHOTO_RULES: { match: RegExp; src: string; emoji: string }[] = [
  { match: /cappuccin/i, src: '/products/cappuccino.jpg', emoji: '☕' },
  { match: /latte|macchiat/i, src: '/products/caffe-latte.jpg', emoji: '🥛' },
  { match: /espresso|americano|caff[eè]|café|shakerat/i, src: '/products/espresso.jpg', emoji: '☕' },
  { match: /spritz/i, src: '/products/spritz.jpg', emoji: '🍹' },
  { match: /negroni/i, src: '/products/negroni.jpg', emoji: '🥃' },
  { match: /mojito/i, src: '/products/mojito.jpg', emoji: '🍸' },
  { match: /birr|bi[eè]re|beer|lager/i, src: '/products/beer.jpg', emoji: '🍺' },
  { match: /tonic|acqua|eau|soda/i, src: '/products/tonic.jpg', emoji: '🥤' },
  { match: /croissant|cornett/i, src: '/products/croissant.jpg', emoji: '🥐' },
  { match: /tagliere|planch|salum|charcut/i, src: '/products/tagliere.jpg', emoji: '🧀' },
  { match: /panin|toast|sandwich/i, src: '/products/panino.jpg', emoji: '🥪' },
];

export function getProductVisual(name: string) {
  const rule = PHOTO_RULES.find(r => r.match.test(name));
  return rule ?? { src: '', emoji: '🍽️' };
}

interface Props {
  name: string;
  size?: number; // px
  rounded?: string; // tailwind radius class
  className?: string;
}

export function ProductThumb({ name, size = 40, rounded = 'rounded-xl', className = '' }: Props) {
  const visual = getProductVisual(name);
  const [failed, setFailed] = useState(false);
  const showPhoto = visual.src && !failed;

  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-gradient-to-br from-orange-50 to-amber-100/70 ring-1 ring-black/5 flex items-center justify-center ${rounded} ${className}`}
      style={{ width: size, height: size }}
    >
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={visual.src}
          alt={name}
          loading="lazy"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span style={{ fontSize: Math.round(size * 0.5) }} aria-hidden>
          {visual.emoji}
        </span>
      )}
    </div>
  );
}
