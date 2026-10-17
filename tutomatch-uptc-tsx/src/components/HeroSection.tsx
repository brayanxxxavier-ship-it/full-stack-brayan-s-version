import React from 'react';

interface HeroSectionProps {
  title: string;
}

export function HeroSection({ title }: HeroSectionProps) {
  return (
    <section className="hero-section" style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto' }}>
      <div className="intro">
        <div className="eyebrow" style={{ textAlign: 'center' }}>
          <span className="eyebrow-line" /> Centro de tutorías UPTC
        </div>
        <h1 style={{ textAlign: 'center', lineHeight: '1.25', margin: '20px 0 15px' }}>
          {/* El key={title} fuerza a React a animar cada cambio de palabra de forma limpia */}
          <span 
            key={title} 
            className="hero-animated-word"
            style={{ display: 'inline-block', minWidth: '240px', textAlign: 'center' }}
          >
            {title}
          </span>
          <span style={{ display: 'block', fontStyle: 'normal', fontWeight: 'normal', color: 'var(--muted)' }}>
            se siente mejor
          </span>
          <span style={{ display: 'block' }}>cuando no lo haces solo.</span>
        </h1>
        <p className="intro-copy" style={{ textAlign: 'center', margin: '0 auto 20px' }}>
          Conecta con acompañamiento académico a tu ritmo, con el respaldo de la Universidad Pedagógica y Tecnológica de Colombia.
        </p>
      </div>

      {/* Modelo 3D limpio sin caja y con scroll bloqueado */}
      <div style={{ position: 'relative', width: '100%', height: '380px', margin: '10px auto 0' }}>
        {React.createElement('model-viewer', {
          src: '/pitagoras.glb',
          alt: 'Modelo 3D de Pitágoras',
          'auto-rotate': true,
          'rotation-per-second': '20deg',
          'disable-zoom': true,
          'disable-pan': true,
          'disable-tap': true,
          style: { width: '100%', height: '100%', backgroundColor: 'transparent', pointerEvents: 'none' }
        })}
        <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '8px' }}>
          <strong>Pitágoras</strong> como muestra del conocimiento matemático.
        </p>
      </div>
    </section>
  );
}