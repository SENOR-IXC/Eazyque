import { NextRequest } from 'next/server'
import { POST } from '../src/app/api/auth/login/route'

// Mock fetch
global.fetch = jest.fn()

describe('/api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('successfully logs in with valid credentials', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        success: true,
        data: {
          token: 'test-jwt-token',
          user: {
            id: '1',
            email: 'admin@eazyque.com',
            role: 'ADMIN'
          }
        }
      })
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@eazyque.com',
        password: 'admin123'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.token).toBe('test-jwt-token')
    expect(data.data.user.email).toBe('admin@eazyque.com')
  })

  it('returns error for invalid credentials', async () => {
    const mockResponse = {
      ok: false,
      status: 401,
      json: async () => ({
        success: false,
        error: 'Invalid credentials'
      })
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'wrong@email.com',
        password: 'wrongpassword'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Invalid credentials')
  })

  it('handles missing email and password', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Email and password are required')
  })

  it('handles invalid JSON', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: 'invalid json',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Invalid request format')
  })

  it('handles network errors', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@eazyque.com',
        password: 'admin123'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Authentication service unavailable')
  })

  it('forwards correct request to backend API', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ success: true, data: {} })
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpass'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    await POST(request)

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpass'
      })
    })
  })
})
