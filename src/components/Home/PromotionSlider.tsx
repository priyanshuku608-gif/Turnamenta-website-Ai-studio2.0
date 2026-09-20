import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, ExternalLink } from 'lucide-react';
import { Promotion } from '../../types';

interface PromotionSliderProps {
  promotions: Promotion[];
}

export const PromotionSlider: React.FC<PromotionSliderProps> = ({ promotions }) => {
  const validPromos = promotions.filter((p) => !!p.imageUrl);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef<number>(0);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Safely clamp index if promotions array shrinks
  useEffect(() => {
    if (validPromos.length > 0 && currentIndex >= validPromos.length) {
      setCurrentIndex(0);
    }
  }, [validPromos.length, currentIndex]);

  // Next Slide Handler
  const handleNext = useCallback(() => {
    if (validPromos.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % validPromos.length);
  }, [validPromos.length]);

  // Prev Slide Handler
  const handlePrev = useCallback(() => {
    if (validPromos.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + validPromos.length) % validPromos.length);
  }, [validPromos.length]);

  // Pause autoplay briefly on user interaction and schedule resume
  const triggerUserInteractionPause = useCallback(() => {
    setIsPaused(true);
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }
    resumeTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 3500);
  }, []);

  // Autoplay Effect (3.5s interval, loop)
  useEffect(() => {
    if (validPromos.length <= 1 || isPaused) {
      return;
    }

    const interval = setInterval(() => {
      handleNext();
    }, 3500);

    return () => clearInterval(interval);
  }, [validPromos.length, isPaused, handleNext]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
      }
    };
  }, []);

  // Touch Swipe Handlers (Preserves manual swipe left/right)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchDeltaXRef.current = 0;
    triggerUserInteractionPause();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    touchDeltaXRef.current = e.touches[0].clientX - touchStartXRef.current;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null) return;
    const delta = touchDeltaXRef.current;
    const swipeThreshold = 40; // min px to trigger slide

    if (delta < -swipeThreshold) {
      handleNext();
    } else if (delta > swipeThreshold) {
      handlePrev();
    }

    touchStartXRef.current = null;
    touchDeltaXRef.current = 0;
    triggerUserInteractionPause();
  };

  const handlePromoClick = (promo: Promotion) => {
    if (promo.link && promo.link.trim()) {
      const targetUrl = promo.link.startsWith('http') ? promo.link : `https://${promo.link}`;
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // 1. Fallback State if no promotional images exist in database
  if (validPromos.length === 0) {
    return (
      <div className="relative w-full aspect-[2/1] sm:aspect-[21/9] rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-[#1E293B]">
        <div className="w-full h-full bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] flex items-center justify-between p-4 sm:p-6 select-none">
          <div className="space-y-1.5 z-10 max-w-[65%]">
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-[#B6FF3C] text-black tracking-wider shadow-sm">
              MEGA ESPORTS
            </span>
            <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
              OPPONENT <span className="text-[#38BDF8]">VS</span> <span className="text-[#B6FF3C]">ME</span>
            </h2>
            <p className="text-[11px] text-slate-300 font-medium">
              Compete in daily cash tournaments & win real money!
            </p>
          </div>
          <div className="shrink-0 flex items-center justify-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-[#B6FF3C]/20 border border-[#B6FF3C]/40 flex items-center justify-center shadow-[0_0_20px_rgba(182,255,60,0.25)]">
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-[#B6FF3C]" />
            </div>
          </div>
        </div>

        {/* Lightweight CSS Shimmer Highlight Effect */}
        <div className="banner-shimmer-sweep" />
      </div>
    );
  }

  // 2. Real Promotions Slider (Arrows and dots removed completely, swipe and autoplay active)
  return (
    <div
      className="relative w-full aspect-[2/1] sm:aspect-[21/9] rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-[#0F172A] select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides Track */}
      <div
        className="flex w-full h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {validPromos.map((promo, idx) => (
          <div
            key={promo.id || idx}
            onClick={() => handlePromoClick(promo)}
            className={`w-full h-full shrink-0 relative ${promo.link ? 'cursor-pointer' : ''}`}
          >
            <img
              src={promo.imageUrl}
              alt={promo.title || `Promotion ${idx + 1}`}
              className="w-full h-full object-cover select-none"
              referrerPolicy="no-referrer"
              draggable={false}
            />

            {/* Gradient Overlays for readability and contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

            {/* Title / Link Badge if available */}
            {promo.title && (
              <div className="absolute bottom-3 left-3 right-3 z-10">
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-black/75 text-[#B6FF3C] border border-[#B6FF3C]/30 inline-flex items-center gap-1 backdrop-blur-sm truncate max-w-full shadow-md">
                  {promo.title}
                  {promo.link && <ExternalLink className="w-2.5 h-2.5 shrink-0" />}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightweight CSS Shimmer / Shine Highlight Sweep */}
      <div className="banner-shimmer-sweep" />
    </div>
  );
};
