import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import LoginPage from '../src/app/login/page'
import { useRouter } from 'next/navigation'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

describe('LoginPage', () => {
  const mockPush = jest.fn()
  const mockRouter = { push: mockPush }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    global.localStorage.clear()
  })

  it('renders login form correctly', () => {
    render(<LoginPage />)
    
    expect(screen.getByText('EazyQue')).toBeInTheDocument()
    expect(screen.getByText('Welcome to EazyQue Retail Platform')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    render(<LoginPage />)
    
    const signInButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(signInButton)

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument()
      expect(screen.getByText('Password is required')).toBeInTheDocument()
    })
  })

  it('shows validation error for invalid email format', async () => {
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText('Email')
    const signInButton = screen.getByRole('button', { name: /sign in/i })
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.click(signInButton)

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email')).toBeInTheDocument()
    })
  })

  it('handles successful login', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        success: true,
        data: {
          token: 'test-token',
          user: { id: '1', email: 'admin@eazyque.com', role: 'ADMIN' }
        }
      })
    }
    
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const signInButton = screen.getByRole('button', { name: /sign in/i })
    
    fireEvent.change(emailInput, { target: { value: 'admin@eazyque.com' } })
    fireEvent.change(passwordInput, { target: { value: 'admin123' } })
    fireEvent.click(signInButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@eazyque.com',
          password: 'admin123'
        })
      })
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'test-token')
      expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify({
        id: '1',
        email: 'admin@eazyque.com',
        role: 'ADMIN'
      }))
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('handles login failure', async () => {
    const mockResponse = {
      ok: false,
      json: async () => ({
        success: false,
        error: 'Invalid credentials'
      })
    }
    
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const signInButton = screen.getByRole('button', { name: /sign in/i })
    
    fireEvent.change(emailInput, { target: { value: 'admin@eazyque.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrong-password' } })
    fireEvent.click(signInButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('handles network error', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const signInButton = screen.getByRole('button', { name: /sign in/i })
    
    fireEvent.change(emailInput, { target: { value: 'admin@eazyque.com' } })
    fireEvent.change(passwordInput, { target: { value: 'admin123' } })
    fireEvent.click(signInButton)

    await waitFor(() => {
      expect(screen.getByText('Network error occurred. Please try again.')).toBeInTheDocument()
    })
  })

  it('shows loading state during login', async () => {
    let resolvePromise: (value: any) => void
    const mockPromise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    
    ;(global.fetch as jest.Mock).mockReturnValueOnce(mockPromise)

    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const signInButton = screen.getByRole('button', { name: /sign in/i })
    
    fireEvent.change(emailInput, { target: { value: 'admin@eazyque.com' } })
    fireEvent.change(passwordInput, { target: { value: 'admin123' } })
    fireEvent.click(signInButton)

    expect(screen.getByText('Signing in...')).toBeInTheDocument()
    expect(signInButton).toBeDisabled()

    // Resolve the promise to finish the test
    resolvePromise!({
      ok: true,
      json: async () => ({
        success: true,
        data: { token: 'test-token', user: { id: '1' } }
      })
    })
  })
})
