import { useEffect, useState, useRef } from 'react';
import { bannerApi } from '../../services/systemConfigApi';
import type { Banner } from '../../types/systemConfig';
import './BannerCarousel.css';

export const BannerCarousel = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchBanners = async () => {
      try {
        const activeBanners = await bannerApi.getActive();
        if (isMounted) {
          setBanners(activeBanners);
        }
      } catch (err) {
        console.error('Failed to load active banners:', err);
      }
    };

    fetchBanners();
    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-play interval
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 4500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [banners.length, isPaused]);

  if (banners.length === 0) {
    return null;
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  return (
    <section
      className="banner-carousel-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Promotional Banners"
    >
      <div className="banner-carousel-viewport">
        {banners.map((banner, index) => {
          const isActive = index === currentIndex;
          return (
            <div
              key={banner._id}
              className={`banner-slide ${isActive ? 'banner-slide--active' : ''}`}
              aria-hidden={!isActive}
            >
              {banner.linkUrl ? (
                <a
                  href={banner.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="banner-slide-link"
                >
                  <img
                    src={banner.imageUrl}
                    alt={banner.title || `Banner ${index + 1}`}
                    className="banner-slide-image"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://placehold.co/1200x320?text=Learnova+Promotion';
                    }}
                  />
                  {banner.title && (
                    <div className="banner-slide-overlay">
                      <h3 className="banner-slide-title">{banner.title}</h3>
                    </div>
                  )}
                </a>
              ) : (
                <div className="banner-slide-link">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title || `Banner ${index + 1}`}
                    className="banner-slide-image"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://placehold.co/1200x320?text=Learnova+Promotion';
                    }}
                  />
                  {banner.title && (
                    <div className="banner-slide-overlay">
                      <h3 className="banner-slide-title">{banner.title}</h3>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Previous / Next buttons */}
        {banners.length > 1 && (
          <>
            <button
              type="button"
              className="banner-arrow banner-arrow--prev"
              onClick={handlePrev}
              aria-label="Previous Banner"
            >
              ‹
            </button>
            <button
              type="button"
              className="banner-arrow banner-arrow--next"
              onClick={handleNext}
              aria-label="Next Banner"
            >
              ›
            </button>
          </>
        )}

        {/* Pagination Dots */}
        {banners.length > 1 && (
          <div className="banner-dots">
            {banners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`banner-dot ${idx === currentIndex ? 'banner-dot--active' : ''}`}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
