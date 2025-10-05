import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'AMFB Notifier - Notificări pentru programul echipelor de minifotbal';
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
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
          backgroundImage: 'radial-gradient(circle at 25px 25px, #10b981 2px, transparent 0), radial-gradient(circle at 75px 75px, #10b981 2px, transparent 0)',
          backgroundSize: '100px 100px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: '80px',
            borderRadius: '20px',
            border: '2px solid #10b981',
          }}
        >
          <div
            style={{
              fontSize: '80px',
              marginBottom: '20px',
            }}
          >
            ⚽
          </div>
          <div
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
              marginBottom: '20px',
            }}
          >
            AMFB Notifier
          </div>
          <div
            style={{
              fontSize: '32px',
              color: '#10b981',
              textAlign: 'center',
              marginBottom: '20px',
            }}
          >
            Grupa 2014 Galben
          </div>
          <div
            style={{
              fontSize: '24px',
              color: '#a3a3a3',
              textAlign: 'center',
              maxWidth: '800px',
            }}
          >
            Notificări email automate pentru programul echipelor de minifotbal
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}