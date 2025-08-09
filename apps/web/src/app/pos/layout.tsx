import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "POS - Point of Sale",
  description: "Process sales, accept payments, and manage customer transactions",
}

export default function POSLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
