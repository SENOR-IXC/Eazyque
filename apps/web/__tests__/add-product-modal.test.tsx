import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import AddProductModal from '../src/components/AddProductModal'

// Mock fetch
global.fetch = jest.fn()

describe('AddProductModal', () => {
  const mockOnClose = jest.fn()
  const mockOnProductAdded = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    global.localStorage.setItem('token', 'test-token')
  })

  it('renders modal correctly when open', () => {
    render(
      <AddProductModal
        isOpen={true}
        onClose={mockOnClose}
        onProductAdded={mockOnProductAdded}
      />
    )

    expect(screen.getByText('Add New Product')).toBeInTheDocument()
    expect(screen.getByLabelText('Product Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
    expect(screen.getByLabelText('Barcode')).toBeInTheDocument()
    expect(screen.getByLabelText('HSN Code')).toBeInTheDocument()
    expect(screen.getByLabelText('Category')).toBeInTheDocument()
    expect(screen.getByLabelText('Unit of Measurement')).toBeInTheDocument()
    expect(screen.getByLabelText('Base Price (₹)')).toBeInTheDocument()
    expect(screen.getByLabelText('Selling Price (₹)')).toBeInTheDocument()
    expect(screen.getByLabelText('GST Rate (%)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add product/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(
      <AddProductModal
        isOpen={false}
        onClose={mockOnClose}
        onProductAdded={mockOnProductAdded}
      />
    )

    expect(screen.queryByText('Add New Product')).not.toBeInTheDocument()
  })

  it('shows validation errors for empty required fields', async () => {
    render(
      <AddProductModal
        isOpen={true}
        onClose={mockOnClose}
        onProductAdded={mockOnProductAdded}
      />
    )

    const addButton = screen.getByRole('button', { name: /add product/i })
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(screen.getByText('Product name is required')).toBeInTheDocument()
      expect(screen.getByText('Barcode is required')).toBeInTheDocument()
      expect(screen.getByText('HSN code is required')).toBeInTheDocument()
      expect(screen.getByText('Base price must be greater than 0')).toBeInTheDocument()
      expect(screen.getByText('Selling price must be greater than 0')).toBeInTheDocument()
    })
  })

  it('validates numeric fields', async () => {
    render(
      <AddProductModal
        isOpen={true}
        onClose={mockOnClose}
        onProductAdded={mockOnProductAdded}
      />
    )

    const basePriceInput = screen.getByLabelText('Base Price (₹)')
    const sellingPriceInput = screen.getByLabelText('Selling Price (₹)')
    const gstRateInput = screen.getByLabelText('GST Rate (%)')

    fireEvent.change(basePriceInput, { target: { value: '-10' } })
    fireEvent.change(sellingPriceInput, { target: { value: '0' } })
    fireEvent.change(gstRateInput, { target: { value: '101' } })

    const addButton = screen.getByRole('button', { name: /add product/i })
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(screen.getByText('Base price must be greater than 0')).toBeInTheDocument()
      expect(screen.getByText('Selling price must be greater than 0')).toBeInTheDocument()
      expect(screen.getByText('GST rate must be between 0 and 100')).toBeInTheDocument()
    })
  })

  it('successfully submits valid product data', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        success: true,
        data: {
          id: '1',
          name: 'Test Product',
          barcode: '1234567890'
        }
      })
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

    render(
      <AddProductModal
        isOpen={true}
        onClose={mockOnClose}
        onProductAdded={mockOnProductAdded}
      />
    )

    // Fill in all required fields
    fireEvent.change(screen.getByLabelText('Product Name'), {
      target: { value: 'Test Product' }
    })
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Test Description' }
    })
    fireEvent.change(screen.getByLabelText('Barcode'), {
      target: { value: '1234567890' }
    })
    fireEvent.change(screen.getByLabelText('HSN Code'), {
      target: { value: '1234' }
    })
    fireEvent.change(screen.getByLabelText('Base Price (₹)'), {
      target: { value: '100' }
    })
    fireEvent.change(screen.getByLabelText('Selling Price (₹)'), {
      target: { value: '120' }
    })
    fireEvent.change(screen.getByLabelText('GST Rate (%)'), {
      target: { value: '5' }
    })

    const addButton = screen.getByRole('button', { name: /add product/i })
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          name: 'Test Product',
          description: 'Test Description',
          barcode: '1234567890',
          hsnCode: '1234',
          category: 'GROCERIES',
          unitOfMeasurement: 'PIECES',
          basePrice: 100,
          sellingPrice: 120,
          gstRate: 5
        })
      })

      expect(mockOnProductAdded).toHaveBeenCalled()
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('handles API errors', async () => {
    const mockResponse = {
      ok: false,
      json: async () => ({
        success: false,
        error: 'Product with this barcode already exists'
      })
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

    render(
      <AddProductModal
        isOpen={true}
        onClose={mockOnClose}
        onProductAdded={mockOnProductAdded}
      />
    )

    // Fill in required fields
    fireEvent.change(screen.getByLabelText('Product Name'), {
      target: { value: 'Test Product' }
    })
    fireEvent.change(screen.getByLabelText('Barcode'), {
      target: { value: '1234567890' }
    })
    fireEvent.change(screen.getByLabelText('HSN Code'), {
      target: { value: '1234' }
    })
    fireEvent.change(screen.getByLabelText('Base Price (₹)'), {
      target: { value: '100' }
    })
    fireEvent.change(screen.getByLabelText('Selling Price (₹)'), {
      target: { value: '120' }
    })

    const addButton = screen.getByRole('button', { name: /add product/i })
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(screen.getByText('Product with this barcode already exists')).toBeInTheDocument()
    })
  })

  it('closes modal when cancel button is clicked', () => {
    render(
      <AddProductModal
        isOpen={true}
        onClose={mockOnClose}
        onProductAdded={mockOnProductAdded}
      />
    )

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('closes modal when backdrop is clicked', () => {
    render(
      <AddProductModal
        isOpen={true}
        onClose={mockOnClose}
        onProductAdded={mockOnProductAdded}
      />
    )

    const backdrop = screen.getByTestId('modal-backdrop')
    fireEvent.click(backdrop)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('shows loading state during submission', async () => {
    let resolvePromise: (value: any) => void
    const mockPromise = new Promise((resolve) => {
      resolvePromise = resolve
    })

    ;(global.fetch as jest.Mock).mockReturnValueOnce(mockPromise)

    render(
      <AddProductModal
        isOpen={true}
        onClose={mockOnClose}
        onProductAdded={mockOnProductAdded}
      />
    )

    // Fill in required fields
    fireEvent.change(screen.getByLabelText('Product Name'), {
      target: { value: 'Test Product' }
    })
    fireEvent.change(screen.getByLabelText('Barcode'), {
      target: { value: '1234567890' }
    })
    fireEvent.change(screen.getByLabelText('HSN Code'), {
      target: { value: '1234' }
    })
    fireEvent.change(screen.getByLabelText('Base Price (₹)'), {
      target: { value: '100' }
    })
    fireEvent.change(screen.getByLabelText('Selling Price (₹)'), {
      target: { value: '120' }
    })

    const addButton = screen.getByRole('button', { name: /add product/i })
    fireEvent.click(addButton)

    expect(screen.getByText('Adding...')).toBeInTheDocument()
    expect(addButton).toBeDisabled()

    // Resolve the promise to finish the test
    resolvePromise!({
      ok: true,
      json: async () => ({ success: true, data: {} })
    })
  })
})
