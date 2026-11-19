import { ImageResponse } from 'next/og';

export const alt = 'AntLegal - Modern Law Firm Management Suite';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 80px',
          background: 'linear-gradient(135deg, #071526 0%, #0e2340 50%, #1a3a5c 100%)',
          fontFamily: 'sans-serif',
          color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #c9a96e 0%, #e8c989 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(201, 169, 110, 0.3)',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0e2340" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                <path d="M7 21h10" />
                <path d="M12 3v18" />
                <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
              </svg>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '36px', fontWeight: '800', letterSpacing: '-0.5px' }}>
              <span>Ant</span>
              <span style={{ color: '#c9a96e' }}>Legal</span>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 20px',
              borderRadius: '999px',
              background: 'rgba(201, 169, 110, 0.15)',
              border: '1px solid rgba(201, 169, 110, 0.3)',
              color: '#e8c989',
              fontSize: '16px',
              fontWeight: '600',
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}
          >
            AI-Powered Legal OS
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              fontSize: '56px',
              fontWeight: '800',
              lineHeight: '1.15',
              letterSpacing: '-1.5px',
              maxWidth: '960px',
            }}
          >
            <span>Modern Law Firm&nbsp;</span>
            <span style={{ color: '#c9a96e' }}>Management&nbsp;</span>
            <span>Suite</span>
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: '24px',
              color: '#94a3b8',
              lineHeight: '1.4',
              maxWidth: '850px',
            }}
          >
            <span>The complete operating system for modern law firms. Client intake, OCR document drafting, automated court hearing calendars, and seamless billing.</span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '32px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '18px',
            color: '#cbd5e1',
          }}
        >
          <div style={{ display: 'flex', gap: '40px' }}>
            <span>⭐ 4.9 Rating (2,400+ Reviews)</span>
            <span>⚖️ 500+ Law Firms</span>
            <span>🔒 Enterprise Grade Security</span>
          </div>
          <span style={{ color: '#c9a96e', fontWeight: '600' }}>antlegal.anthemgt.com</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
