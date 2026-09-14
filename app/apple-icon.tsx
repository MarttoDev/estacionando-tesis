import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
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
        <span style={{ color: 'white', fontWeight: 700, fontSize: 96, fontFamily: 'sans-serif' }}>P</span>
        <div
          style={{
            position: 'absolute',
            bottom: 18,
            right: 18,
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: '#006fd9',
            border: '8px solid #faf9f6',
          }}
        />
      </div>
    ),
    { ...size },
  )
}
