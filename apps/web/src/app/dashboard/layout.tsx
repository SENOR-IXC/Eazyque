import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Dashboard",
  description: "EazyQue retail dashboard with real-time analytics and order management",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
