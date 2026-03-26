import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'ElektroSmart PRO - Program do Kosztorysowania Elektrycznego z AI'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        }}
      >
        {/* Grid Pattern Overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        
        {/* Glow Effect */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            {/* Lightning Icon */}
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 20px 40px rgba(59, 130, 246, 0.4)',
              }}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
              </svg>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '56px',
                  fontWeight: 800,
                  color: 'white',
                  letterSpacing: '-2px',
                }}
              >
                ElektroSmart
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                    padding: '4px 16px',
                    borderRadius: '8px',
                    color: 'white',
                  }}
                >
                  PRO v4.0
                </span>
                <span
                  style={{
                    fontSize: '20px',
                    color: '#94a3b8',
                  }}
                >
                  Ekspertowy System
                </span>
              </div>
            </div>
          </div>

          {/* Tagline */}
          <p
            style={{
              fontSize: '32px',
              color: '#e2e8f0',
              textAlign: 'center',
              maxWidth: '800px',
              lineHeight: 1.4,
              marginBottom: '32px',
            }}
          >
            Ekspertowy system kosztorysowy z normami KNR i AI
          </p>

          {/* Features */}
          <div
            style={{
              display: 'flex',
              gap: '24px',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {['📂 Baza KNR', '🔌 120+ DIN', '⚡ ES-Engine', '🌐 Portal Klienta', '📄 PDF/Excel'].map((feature) => (
              <div
                key={feature}
                style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '20px',
                  color: '#93c5fd',
                }}
              >
                {feature}
              </div>
            ))}
          </div>

          {/* URL */}
          <p
            style={{
              fontSize: '20px',
              color: '#64748b',
              marginTop: '40px',
            }}
          >
            elektrosmart.pro
          </p>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
