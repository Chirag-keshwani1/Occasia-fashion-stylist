'use client';

export default function GlobalError({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _error,
  reset,
}: {
  _error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', padding: '20px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Critical Application Error</h2>
          <p style={{ color: '#666', marginBottom: '24px', maxWidth: '400px' }}>
            A critical error occurred that prevented the application from rendering.
          </p>
          <button 
            onClick={() => reset()}
            style={{ padding: '10px 20px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
