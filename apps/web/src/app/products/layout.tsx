import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Products",
  description: "Manage your product catalog, inventory, and pricing",
}

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
