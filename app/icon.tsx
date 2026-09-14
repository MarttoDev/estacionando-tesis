import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
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
          borderRadius: 7,
          position: 'relative',
        }}
      >
        <span style={{ color: 'white', fontWeight: 700, fontSize: 20, fontFamily: 'sans-serif' }}>P</span>
        <div
          style={{
            position: 'absolute',
            bottom: -1,
            right: -1,
            width: 9,
            height: 9,
            borderRadius: '50%',
            background: '#006fd9',
            border: '2px solid #faf9f6',
          }}
        />
      </div>
    ),
    { ...size },
  )
}
