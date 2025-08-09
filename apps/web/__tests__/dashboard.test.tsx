import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Dashboard from '../src/app/dashboard/page'

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

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock localStorage with valid token
    global.localStorage.setItem('token', 'test-token')
    global.localStorage.setItem('user', JSON.stringify({
      id: '1',
      email: 'admin@eazyque.com',
      role: 'ADMIN'
    }))
  })

  it('renders dashboard components correctly', async () => {
    const mockStats = {
      ok: true,
      json: async () => ({
        success: true,
        data: {
          totalRevenue: 15000,
          totalOrders: 25,
          totalProducts: 6,
          totalCustomers: 8
        }
      })
    }

    const mockOrders = {
      ok: true,
      json: async () => ({
        success: true,
        data: []
      })
    }

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce(mockStats)
      .mockResolvedValueOnce(mockOrders)

    render(<Dashboard />)

    expect(screen.getByText('Dashboard Overview')).toBeInTheDocument()
    expect(screen.getByText('Recent Activity')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('₹15,000')).toBeInTheDocument()
      expect(screen.getByText('25')).toBeInTheDocument()
      expect(screen.getByText('6')).toBeInTheDocument()
      expect(screen.getByText('8')).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'))

    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Error loading dashboard data')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    ;(global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))

    render(<Dashboard />)

    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument()
  })

  it('refreshes data when refresh button is clicked', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        success: true,
        data: {
          totalRevenue: 15000,
          totalOrders: 25,
          totalProducts: 6,
          totalCustomers: 8
        }
      })
    }

    ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('₹15,000')).toBeInTheDocument()
    })

    const refreshButton = screen.getByRole('button', { name: /refresh/i })
    fireEvent.click(refreshButton)

    expect(global.fetch).toHaveBeenCalledTimes(4) // Initial calls + refresh calls
  })

  it('displays pending orders correctly', async () => {
    const mockStats = {
      ok: true,
      json: async () => ({
        success: true,
        data: {
          totalRevenue: 15000,
          totalOrders: 25,
          totalProducts: 6,
          totalCustomers: 8
        }
      })
    }

    const mockOrders = {
      ok: true,
      json: async () => ({
        success: true,
        data: [
          {
            id: '1',
            orderNumber: 'ORD001',
            customerName: 'John Doe',
            totalAmount: 1500,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            items: [
              {
                id: '1',
                productName: 'Test Product',
                quantity: 2,
                unitPrice: 750
              }
            ]
          }
        ]
      })
    }

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce(mockStats)
      .mockResolvedValueOnce(mockOrders)

    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('ORD001')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('₹1,500')).toBeInTheDocument()
      expect(screen.getByText('PENDING')).toBeInTheDocument()
    })
  })

  it('handles order status updates', async () => {
    const mockStats = {
      ok: true,
      json: async () => ({
        success: true,
        data: {
          totalRevenue: 15000,
          totalOrders: 25,
          totalProducts: 6,
          totalCustomers: 8
        }
      })
    }

    const mockOrders = {
      ok: true,
      json: async () => ({
        success: true,
        data: [
          {
            id: '1',
            orderNumber: 'ORD001',
            customerName: 'John Doe',
            totalAmount: 1500,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            items: []
          }
        ]
      })
    }

    const mockUpdateResponse = {
      ok: true,
      json: async () => ({
        success: true,
        data: { status: 'COMPLETED' }
      })
    }

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce(mockStats)
      .mockResolvedValueOnce(mockOrders)
      .mockResolvedValueOnce(mockUpdateResponse)
      .mockResolvedValueOnce(mockStats)
      .mockResolvedValueOnce(mockOrders)

    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('ORD001')).toBeInTheDocument()
    })

    const completeButton = screen.getByRole('button', { name: /complete/i })
    fireEvent.click(completeButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/orders/1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({ status: 'COMPLETED' })
      })
    })
  })
})
