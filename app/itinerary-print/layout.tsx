import type { ReactNode } from 'react'

export const metadata = {
  title: 'Itinerary — Omnia Destinations',
  description: 'Omnia Travel Itinerary',
}

export default function PrintLayout({ children }: { children: ReactNode }) {
  // Completely bare layout — no sidebar, no nav, no dashboard chrome.
  // Only the print content renders here.
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#FAFAF7' }}>
        {children}
      </body>
    </html>
  )
}
