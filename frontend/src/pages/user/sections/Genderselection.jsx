import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const GENDER_SECTIONS = [
  {
    gender: 'men',
    label: 'Men',
    sub: 'New Season',
    num: '01',
  },
  {
    gender: 'women',
    label: 'Women',
    sub: 'New Season',
    num: '02',
  },
  {
    gender: 'unisex',
    label: 'Unisex',
    sub: 'Shared Edit',
    num: '03',
  },
  {
    gender: 'kids_male',
    label: 'Boys',
    sub: 'Mini Collection',
    num: '04',
  },
  {
    gender: 'kids_female',
    label: 'Girls',
    sub: 'Mini Collection',
    num: '05',
  },
];

const GenderSelection = () => {
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('gs-visible');
          }
        });
      },
      { threshold: 0.12 }
    );

    const el = sectionRef.current;
    if (!el) return;
    el.querySelectorAll('[data-reveal]').forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        .gs-root {
          width: 100%;
          background: #f7f6f3;
          padding: 100px clamp(20px, 6vw, 100px) 80px;
          box-sizing: border-box;
        }

        .gs-inner {
          max-width: 1200px;
          margin: 0 auto;
        }

        .gs-header {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          margin-bottom: 56px;
        }

        .gs-eyebrow {
          font-family: 'DM Sans', 'Helvetica Neue', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #8a8680;
          margin-bottom: 14px;
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .gs-eyebrow.gs-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .gs-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(2rem, 3.5vw, 3rem);
          font-weight: 400;
          letter-spacing: -0.02em;
          line-height: 1.1;
          color: #0d0d0d;
          margin: 0 0 20px;
          opacity: 0;
          transform: translateY(14px);
          transition: opacity 0.55s ease 0.08s, transform 0.55s ease 0.08s;
        }
        .gs-title em {
          font-style: italic;
          font-weight: 400;
        }
        .gs-title.gs-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .gs-rule {
          width: 40px;
          height: 1px;
          background: #0d0d0d;
          opacity: 0;
          transition: opacity 0.4s ease 0.18s;
        }
        .gs-rule.gs-visible {
          opacity: 1;
        }

        .gs-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 1px;
          background: #e2e0da;
          border: 1px solid #e2e0da;
        }

        .gs-card {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 32px 24px 28px;
          background: #f7f6f3;
          text-decoration: none;
          color: #0d0d0d;
          overflow: hidden;
          min-height: 220px;
          opacity: 0;
          transform: translateY(20px);
          transition:
            opacity 0.55s cubic-bezier(0.22, 1, 0.36, 1),
            transform 0.55s cubic-bezier(0.22, 1, 0.36, 1),
            background 0.25s ease;
        }
        .gs-card.gs-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .gs-card:hover {
          background: #0d0d0d;
        }

        .gs-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .gs-card-num {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.12em;
          color: #c8c4bc;
          transition: color 0.25s ease;
        }
        .gs-card:hover .gs-card-num {
          color: rgba(255,255,255,0.35);
        }

        .gs-card-arrow {
          width: 28px;
          height: 28px;
          border: 1px solid #e2e0da;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition:
            border-color 0.25s ease,
            background 0.25s ease,
            transform 0.25s ease;
        }
        .gs-card:hover .gs-card-arrow {
          border-color: rgba(255,255,255,0.25);
          background: rgba(255,255,255,0.08);
          transform: translate(2px, -2px);
        }

        .gs-card-arrow svg {
          width: 12px;
          height: 12px;
          stroke: #8a8680;
          fill: none;
          transition: stroke 0.25s ease;
        }
        .gs-card:hover .gs-card-arrow svg {
          stroke: rgba(255,255,255,0.7);
        }

        .gs-card-bottom {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .gs-card-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #8a8680;
          transition: color 0.25s ease;
        }
        .gs-card:hover .gs-card-sub {
          color: rgba(255,255,255,0.4);
        }

        .gs-card-label {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(1.3rem, 2vw, 1.7rem);
          font-weight: 400;
          letter-spacing: -0.01em;
          color: #0d0d0d;
          line-height: 1.1;
          transition: color 0.25s ease;
        }
        .gs-card:hover .gs-card-label {
          color: #ffffff;
        }

        .gs-card-line {
          position: absolute;
          bottom: 0;
          left: 24px;
          right: 24px;
          height: 1px;
          background: #0d0d0d;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .gs-card:hover .gs-card-line {
          transform: scaleX(1);
        }

        @media (max-width: 900px) {
          .gs-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 640px) {
          .gs-root {
            padding: 64px 20px 56px;
          }
          .gs-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 400px) {
          .gs-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <section className="gs-root" ref={sectionRef}>
        <div className="gs-inner">
          <header className="gs-header">
            <span className="gs-eyebrow" data-reveal>Collections / SS 2025</span>
            <h2 className="gs-title" data-reveal>
              Shop by <em>Category</em>
            </h2>
            <div className="gs-rule" data-reveal />
          </header>

          <div className="gs-grid">
            {GENDER_SECTIONS.map(({ gender, label, sub, num }, idx) => (
              <Link
                key={gender}
                to={`/category/${gender}`}
                className="gs-card"
                data-reveal
                style={{ transitionDelay: `${0.05 + idx * 0.07}s` }}
              >
                <div className="gs-card-top">
                  <span className="gs-card-num">{num}</span>
                  <div className="gs-card-arrow">
                    <svg viewBox="0 0 12 12" strokeWidth="1.5">
                      <path d="M2 10 L10 2 M5 2 L10 2 L10 7" />
                    </svg>
                  </div>
                </div>

                <div className="gs-card-bottom">
                  <span className="gs-card-sub">{sub}</span>
                  <span className="gs-card-label">{label}</span>
                </div>

                <div className="gs-card-line" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default GenderSelection;