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
            fontSize: 96,
            fontFamily: 'sans-serif',
          }}
        >
          P
        </span>

        <div
          style={{
            position: 'absolute',
            bottom: 40,
            right: 40,
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: '#006fd9',
            border: '6px solid #faf9f6',
          }}
        />
      </div>
    ),
    {
      width: 192,
      height: 192,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
  )
}