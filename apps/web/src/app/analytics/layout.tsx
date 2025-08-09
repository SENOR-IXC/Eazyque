import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Enhanced Analytics - EazyQue',
  description: 'Real-time business analytics and insights for your retail store',
}

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}
