"use client";

import { useState } from "react";
import ImageGallery from "./ImageGallery";

interface ImageMosaicProps {
  images: string[];
  alt: string;
  initials?: string;
  className?: string;
}

export default function ImageMosaic({
  images,
  alt,
  initials = "?",
  className = "",
}: ImageMosaicProps) {
  const [showGallery, setShowGallery] = useState(false);

  // No images — subtle gradient fallback
  if (images.length === 0) {
    return (
      <div
        className={`h-[400px] rounded-xl bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 flex items-center justify-center ${className}`}
      >
        <span className="text-display-lg font-bold text-gray-200 select-none">
          {initials}
        </span>
      </div>
    );
  }

  // 1 image — full width
  if (images.length === 1) {
    return (
      <>
        <div
          className={`h-[400px] rounded-xl overflow-hidden cursor-pointer group ${className}`}
          onClick={() => setShowGallery(true)}
        >
          <img
            src={images[0]}
            alt={alt}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
          />
        </div>
        {showGallery && (
          <ImageGallery
            images={images}
            alt={alt}
            onClose={() => setShowGallery(false)}
          />
        )}
      </>
    );
  }

  // 2 images — 50/50 split
  if (images.length === 2) {
    return (
      <>
        <div
          className={`h-[400px] grid grid-cols-2 gap-1.5 rounded-xl overflow-hidden cursor-pointer ${className}`}
          onClick={() => setShowGallery(true)}
        >
          {images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`${alt} ${i + 1}`}
              className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-700"
            />
          ))}
        </div>
        {showGallery && (
          <ImageGallery
            images={images}
            alt={alt}
            onClose={() => setShowGallery(false)}
          />
        )}
      </>
    );
  }

  // 3+ images — Airbnb-style asymmetric: 1 large left (50%) + 2 stacked right (50%)
  // 4+ images — 1 large left (50%) + 2x2 grid right (50%)
  return (
    <>
      <div
        className={`h-[420px] grid grid-cols-2 gap-1.5 rounded-xl overflow-hidden cursor-pointer ${className}`}
        onClick={() => setShowGallery(true)}
      >
        {/* Hero image — left half, full height */}
        <img
          src={images[0]}
          alt={alt}
          className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-700"
        />

        {/* Right half */}
        <div className={`grid ${images.length >= 4 ? "grid-cols-2 grid-rows-2" : "grid-rows-2"} gap-1.5`}>
          {images.slice(1, images.length >= 4 ? 5 : 3).map((img, i) => (
            <div key={i} className="relative overflow-hidden">
              <img
                src={img}
                alt={`${alt} ${i + 2}`}
                className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-700"
              />
              {/* Show count overlay on last image if there are more */}
              {i === (images.length >= 4 ? 3 : 1) && images.length > (images.length >= 4 ? 5 : 3) && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center hover:bg-black/40 transition-colors">
                  <span className="text-text-sm font-semibold text-white">
                    +{images.length - (images.length >= 4 ? 5 : 3)} more
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {showGallery && (
        <ImageGallery
          images={images}
          alt={alt}
          onClose={() => setShowGallery(false)}
        />
      )}
    </>
  );
}
