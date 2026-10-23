import { ImageResponse } from 'next/og'

export const dynamic = 'force-static'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#111b28',
          position: 'relative',
        }}
      >
        <span
          style={{
            color: 'white',
            fontWeight: 700,
            fontSize: 256,
            fontFamily: 'sans-serif',
          }}
        >
          P
        </span>

        <div
          style={{
            position: 'absolute',
            bottom: 108,
            right: 108,
            width: 90,
            height: 90,
            borderRadius: '50%',
            background: '#006fd9',
            border: '16px solid #faf9f6',
          }}
        />
      </div>
    ),
    {
      width: 512,
      height: 512,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
  )
}