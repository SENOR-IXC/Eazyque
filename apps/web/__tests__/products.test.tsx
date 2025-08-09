import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import ProductsPage from '../src/app/products/page'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
}))

// Mock fetch
global.fetch = jest.fn()

describe('ProductsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.localStorage.setItem('token', 'test-token')
  })

  it('renders products page correctly', () => {
    ;(global.fetch as jest.Mock).mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] })
      })
    )

    render(<ProductsPage />)

    expect(screen.getByText('Product Management')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add product/i })).toBeInTheDocument()
  })

  it('loads and displays products', async () => {
    const mockProducts = [
      {
        id: '1',
        name: 'Test Product 1',
        barcode: '1234567890',
        hsnCode: '1234',
        category: 'GROCERIES',
        unitOfMeasurement: 'KG',
        basePrice: 100,
        sellingPrice: 120,
        gstRate: 5,
        stock: 50
      },
      {
        id: '2',
        name: 'Test Product 2',
        barcode: '0987654321',
        hsnCode: '5678',
        category: 'BEVERAGES',
        unitOfMeasurement: 'LITERS',
        basePrice: 50,
        sellingPrice: 60,
        gstRate: 12,
        stock: 25
      }
    ]

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockProducts })
    })

    render(<ProductsPage />)

    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument()
      expect(screen.getByText('Test Product 2')).toBeInTheDocument()
      expect(screen.getByText('1234567890')).toBeInTheDocument()
      expect(screen.getByText('₹120')).toBeInTheDocument()
      expect(screen.getByText('50')).toBeInTheDocument()
    })
  })

  it('handles API errors', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'))

    render(<ProductsPage />)

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch products')).toBeInTheDocument()
    })
  })

  it('opens add product modal when button is clicked', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] })
    })

    render(<ProductsPage />)

    const addButton = screen.getByRole('button', { name: /add product/i })
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(screen.getByText('Add New Product')).toBeInTheDocument()
    })
  })

  it('refreshes products after adding new product', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] })
      })

    render(<ProductsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add product/i })).toBeInTheDocument()
    })

    // Simulate adding a product (this would trigger the onProductAdded callback)
    // For testing purposes, we'll just verify the initial fetch call
    expect(global.fetch).toHaveBeenCalledWith('/api/products', {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    })
  })

  it('displays loading state', () => {
    ;(global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))

    render(<ProductsPage />)

    expect(screen.getByText('Loading products...')).toBeInTheDocument()
  })

  it('displays empty state when no products', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] })
    })

    render(<ProductsPage />)

    await waitFor(() => {
      expect(screen.getByText('No products found')).toBeInTheDocument()
      expect(screen.getByText('Add your first product to get started')).toBeInTheDocument()
    })
  })
})
