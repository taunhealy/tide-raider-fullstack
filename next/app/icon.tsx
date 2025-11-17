import { ImageResponse } from 'next/og'

// Route segment config
export const alt = 'Tide Raider'
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
  try {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 24,
            background: 'linear-gradient(135deg, #1CD9FF 0%, #0EA5E9 100%)',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
          }}
        >
          TR
        </div>
      ),
      {
        ...size,
      }
    )
  } catch (error) {
    // Fallback: return a simple SVG if ImageResponse fails
    return new Response(
      `<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" fill="#1CD9FF"/>
        <text x="50%" y="50%" font-size="20" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">TR</text>
      </svg>`,
      {
        headers: {
          'Content-Type': 'image/svg+xml',
        },
      }
    )
  }
}

