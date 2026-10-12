import React, { useState, useEffect, useRef } from 'react';
import api, { assetUrl } from '../../api/client';
import '../../css/Crousal.css';

const FALLBACK_SLIDES = [
  {
    image: null,
    label: 'LIFESTYLE / FASHION',
    heading: 'OLD',
    subheading: 'MONEY',
    body: 'Old money is an aesthetic based around a wealthy, classic style. Old money refers to people who have inherited their wealth instead of working for it.',
    scrollLabel: 'SCROLL TO SEE ↓',
    issue: 'BEFORE 2016',
    index: '/ ISSUE 1',
  },
  {
    image: null,
    label: 'INSPIRATION / STYLE',
    heading: 'NEW',
    subheading: 'SEASON',
    body: 'The new collection arrives with a quiet confidence. Understated luxury, refined silhouettes, and the kind of quality that only time can earn.',
    scrollLabel: 'SCROLL TO SEE ↓',
    issue: 'SPRING 2025',
    index: '/ ISSUE 2',
  },
];

const Crousal = () => {
  const [slides, setSlides] = useState(FALLBACK_SLIDES);
  const [index, setIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    api.get('/carousel')
      .then(({ data }) => {
        if (data?.length > 0) setSlides(data);
      })
      .catch(() => {});
  }, []);

  const goTo = (i) => {
    if (transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setIndex(i);
      setTransitioning(false);
    }, 400);
  };

  const next = () => goTo((index + 1) % slides.length);
  const prev = () => goTo(index === 0 ? slides.length - 1 : index - 1);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setIndex(prev => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timerRef.current);
  }, [slides.length]);

  const slide = slides[index];

  const imageUrl = slide.image ? assetUrl(slide.image) : null;

  return (
    <section className="em-hero">
      <header className="em-topbar">
        <div className="em-topbar-left">
          <span className="em-tag">INSPIRATION</span>
          <span className="em-tag">STYLE</span>
        </div>
        <nav className="em-topbar-center">
          <span>LIFE STYLE</span>
          <span>FASHION</span>
          <span>INSPIRED</span>
          <span>DECORATION</span>
        </nav>
        <div className="em-topbar-right">
          <span>{slide.issue || 'BEFORE 2016'}</span>
          <span className="em-issue-num">{slide.index || '/ ISSUE 1'}</span>
        </div>
      </header>

      <main className="em-main">
        <div className="em-heading-block">
          <h1 className={`em-title ${transitioning ? 'em-fade-out' : 'em-fade-in'}`}>
            <span className="em-title-outline">{slide.heading}</span>
            <span className="em-title-solid">{slide.subheading}</span>
          </h1>
          <div className="em-divider"></div>
        </div>

        <div className="em-body">
          <div className="em-left">
            <div className={`em-label-tag ${transitioning ? 'em-fade-out' : 'em-fade-in'}`}>
              {slide.label || 'LIFESTYLE / FASHION'}
            </div>
            <p className={`em-body-text ${transitioning ? 'em-fade-out' : 'em-fade-in'}`}>
              {slide.body}
            </p>
            <div className="em-scroll-label">
              <span>↓</span>
              <span>{slide.scrollLabel || 'SCROLL TO SEE'}</span>
            </div>
            <div className="em-dots">
              {slides.map((_, i) => (
                <button
                  key={i}
                  className={`em-dot ${i === index ? 'em-dot--active' : ''}`}
                  onClick={() => goTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="em-right">
            <button className="em-arrow em-arrow--prev" onClick={prev} aria-label="Previous">‹</button>
            <div className={`em-image-wrap ${transitioning ? 'em-fade-out' : 'em-fade-in'}`}>
              {imageUrl ? (
                <img src={imageUrl} alt={slide.heading} className="em-image" />
              ) : (
                <div className="em-image-placeholder"><span>NO IMAGE</span></div>
              )}
              <div className="em-image-caption">{slide.heading} {slide.subheading}</div>
            </div>
            <button className="em-arrow em-arrow--next" onClick={next} aria-label="Next">↓</button>
          </div>
        </div>
      </main>
    </section>
  );
};

export default Crousal;