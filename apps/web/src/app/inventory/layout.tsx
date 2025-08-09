import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Inventory",
  description: "Track stock levels, manage inventory, and monitor product availability",
}

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
