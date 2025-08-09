import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import POSPage from '../src/app/pos/page'

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

describe('POSPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.localStorage.setItem('token', 'test-token')
  })

  it('renders POS interface correctly', async () => {
    const mockProducts = [
      {
        id: '1',
        name: 'Test Product',
        barcode: '1234567890',
        sellingPrice: 120,
        stock: 50
      }
    ]

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockProducts })
    })

    render(<POSPage />)

    await waitFor(() => {
      expect(screen.getByText('Point of Sale')).toBeInTheDocument()
      expect(screen.getByText('Cart')).toBeInTheDocument()
      expect(screen.getByText('Products')).toBeInTheDocument()
      expect(screen.getByText('Test Product')).toBeInTheDocument()
    })
  })

  it('adds product to cart when clicked', async () => {
    const mockProducts = [
      {
        id: '1',
        name: 'Test Product',
        barcode: '1234567890',
        sellingPrice: 120,
        stock: 50
      }
    ]

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockProducts })
    })

    render(<POSPage />)

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument()
    })

    const productButton = screen.getByText('Test Product')
    fireEvent.click(productButton)

    await waitFor(() => {
      expect(screen.getByText('₹120')).toBeInTheDocument()
    })
  })

  it('calculates total correctly', async () => {
    const mockProducts = [
      {
        id: '1',
        name: 'Product 1',
        barcode: '1234567890',
        sellingPrice: 100,
        stock: 50
      },
      {
        id: '2',
        name: 'Product 2',
        barcode: '0987654321',
        sellingPrice: 200,
        stock: 30
      }
    ]

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockProducts })
    })

    render(<POSPage />)

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument()
      expect(screen.getByText('Product 2')).toBeInTheDocument()
    })

    // Add products to cart
    fireEvent.click(screen.getByText('Product 1'))
    fireEvent.click(screen.getByText('Product 2'))

    await waitFor(() => {
      expect(screen.getByText('₹300')).toBeInTheDocument() // Total should be 100 + 200
    })
  })

  it('processes order successfully', async () => {
    const mockProducts = [
      {
        id: '1',
        name: 'Test Product',
        barcode: '1234567890',
        sellingPrice: 120,
        stock: 50
      }
    ]

    const mockOrderResponse = {
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          id: 'order-1',
          orderNumber: 'ORD001',
          totalAmount: 120
        }
      })
    }

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockProducts })
      })
      .mockResolvedValueOnce(mockOrderResponse)

    render(<POSPage />)

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument()
    })

    // Add product to cart
    fireEvent.click(screen.getByText('Test Product'))

    await waitFor(() => {
      expect(screen.getByText('₹120')).toBeInTheDocument()
    })

    // Fill customer details
    const customerNameInput = screen.getByLabelText('Customer Name')
    const customerPhoneInput = screen.getByLabelText('Customer Phone')

    fireEvent.change(customerNameInput, { target: { value: 'John Doe' } })
    fireEvent.change(customerPhoneInput, { target: { value: '+91-9876543210' } })

    // Process order
    const processOrderButton = screen.getByRole('button', { name: /process order/i })
    fireEvent.click(processOrderButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/orders', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }),
        body: expect.stringContaining('John Doe')
      }))
    })
  })

  it('handles empty cart validation', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] })
    })

    render(<POSPage />)

    await waitFor(() => {
      expect(screen.getByText('Point of Sale')).toBeInTheDocument()
    })

    const processOrderButton = screen.getByRole('button', { name: /process order/i })
    fireEvent.click(processOrderButton)

    await waitFor(() => {
      expect(screen.getByText('Cart is empty')).toBeInTheDocument()
    })
  })

  it('clears cart after successful order', async () => {
    const mockProducts = [
      {
        id: '1',
        name: 'Test Product',
        barcode: '1234567890',
        sellingPrice: 120,
        stock: 50
      }
    ]

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockProducts })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { id: 'order-1', orderNumber: 'ORD001' }
        })
      })

    render(<POSPage />)

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument()
    })

    // Add product and process order
    fireEvent.click(screen.getByText('Test Product'))

    const customerNameInput = screen.getByLabelText('Customer Name')
    fireEvent.change(customerNameInput, { target: { value: 'John Doe' } })

    const processOrderButton = screen.getByRole('button', { name: /process order/i })
    fireEvent.click(processOrderButton)

    await waitFor(() => {
      expect(screen.getByText('₹0')).toBeInTheDocument() // Cart should be cleared
    })
  })
})
