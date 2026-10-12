import React, { useEffect, useState, useRef } from 'react';
import Aboutus from '../public/Aboutus';
import Contact from '../../components/common/Contact';
import GenderSelection from './sections/Genderselection';
import DropCollections from './sections/Dropcollections';
import SaleSection from './SalesBadge';

import '../../css/Home.css';
import '../../css/font.css';

const Home = () => {
  const [saleOpen, setSaleOpen] = useState(false);
  const saleRef = useRef(null);

  useEffect(() => {
    const activate = () => {
      const els = document.querySelectorAll('.scroll-reveal');

      const observer = new IntersectionObserver(
        (entries) => entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('active');
            observer.unobserve(e.target);
          }
        }),
        { threshold: 0.1 }
      );

      els.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) {
          el.classList.add('active');
        } else {
          observer.observe(el);
        }
      });

      return observer;
    };

    const observer = activate();
    const timer = setTimeout(() => activate(), 1500);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  const handleSaleToggle = () => {
    setSaleOpen(prev => {
      const next = !prev;
      if (next) {
        setTimeout(() => {
          saleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
      }
      return next;
    });
  };

  return (
    <div className="home-container">
      <GenderSelection />
      <DropCollections />

      <div className="sale-announcement-wrapper scroll-reveal" ref={saleRef}>
        <div
          className={`sale-announcement-banner ${saleOpen ? 'open' : ''}`}
          onClick={handleSaleToggle}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && handleSaleToggle()}
          aria-expanded={saleOpen}
        >
          <div className="sale-banner-inner">
            <div className="sale-banner-left">
              <span className="sale-banner-eyebrow">Limited Time</span>
              <h2 className="sale-banner-headline">End of Season Sale</h2>
              <p className="sale-banner-sub">Up to 50% off selected pieces</p>
            </div>
            <div className="sale-banner-right">
              <span className="sale-banner-cta">
                {saleOpen ? 'Close' : 'Explore Sale'}
              </span>
              <span className={`sale-banner-arrow ${saleOpen ? 'rotated' : ''}`}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M3 6.5L9 12.5L15 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
                </svg>
              </span>
            </div>
          </div>
          <div className="sale-banner-ticker" aria-hidden="true">
            <div className="sale-ticker-track">
              {Array(6).fill('SALE · UP TO 50% OFF · NEW ARRIVALS · SELECTED STYLES ·').map((t, i) => (
                <span key={i}>{t}&nbsp;</span>
              ))}
            </div>
          </div>
        </div>

        <div className={`sale-section-collapse ${saleOpen ? 'expanded' : ''}`}>
          <div className="sale-section-inner">
            <SaleSection />
          </div>
        </div>
      </div>

      <div className="about-section scroll-reveal">
        <Aboutus />
      </div>

      <div className="contact-section scroll-reveal">
        <Contact />
      </div>
    </div>
  );
};

export default Home;