'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Puducherry'
]

interface UserFormData {
  name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  role: 'SHOP_OWNER' | 'CASHIER'
}

interface ShopFormData {
  name: string
  gstNumber: string
  panNumber: string
  phone: string
  email: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  pincode: string
}

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [signupType, setSignupType] = useState<'shop_owner' | 'employee'>('shop_owner')
  
  const [userForm, setUserForm] = useState<UserFormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'SHOP_OWNER'
  })

  const [shopForm, setShopForm] = useState<ShopFormData>({
    name: '',
    gstNumber: '',
    panNumber: '',
    phone: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: ''
  })

  const [existingShops, setExistingShops] = useState<Array<{id: string, name: string}>>([])
  const [selectedShopId, setSelectedShopId] = useState('')

  // Fetch existing shops for employee signup
  const fetchShops = async () => {
    try {
      const response = await fetch('/api/shops/public')
      if (response.ok) {
        const data = await response.json()
        setExistingShops(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch shops:', error)
    }
  }

  const validateForm = () => {
    console.log('🔍 Validating form...', { signupType, userForm: { ...userForm, password: '***' }, shopForm })
    
    // Validate user fields
    if (!userForm.name?.trim()) {
      setError('Please enter your name')
      return false
    }

    if (!userForm.email?.trim()) {
      setError('Please enter your email')
      return false
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(userForm.email)) {
      setError('Please enter a valid email address')
      return false
    }

    if (!userForm.phone?.trim()) {
      setError('Please enter your phone number')
      return false
    }

    // Phone validation (Indian format)
    const phoneRegex = /^[6-9]\d{9}$/
    if (!phoneRegex.test(userForm.phone)) {
      setError('Please enter a valid 10-digit Indian mobile number')
      return false
    }

    if (!userForm.password) {
      setError('Please enter a password')
      return false
    }

    if (userForm.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return false
    }

    if (userForm.password !== userForm.confirmPassword) {
      setError('Passwords do not match')
      return false
    }

    // Validate shop-specific fields
    if (signupType === 'shop_owner') {
      const requiredShopFields = {
        name: 'Shop name',
        gstNumber: 'GST number',
        panNumber: 'PAN number',
        addressLine1: 'Address',
        city: 'City',
        state: 'State',
        pincode: 'Pincode'
      }

      for (const [field, label] of Object.entries(requiredShopFields)) {
        if (!shopForm[field as keyof typeof shopForm]?.trim()) {
          setError(`Please enter ${label}`)
          return false
        }
      }
      
      // Validate pincode format
      if (!/^\d{6}$/.test(shopForm.pincode)) {
        setError('Please enter a valid 6-digit pincode')
        return false
      }
      
      // Validate GST number format (must match backend ValidationUtils)
      if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(shopForm.gstNumber)) {
        setError('Please enter a valid GST number (e.g., 29ABCDE1234F1Z5)')
        return false
      }
      
      // Validate PAN number format (must match backend ValidationUtils)
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(shopForm.panNumber)) {
        setError('Please enter a valid PAN number (e.g., ABCDE1234F)')
        return false
      }
    } else {
      // Employee signup validation
      if (!selectedShopId) {
        setError('Please select a shop to join')
        return false
      }
    }

    console.log('✅ Form validation passed')
    return true
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!validateForm()) return

    setIsLoading(true)

    try {
      let shopId = selectedShopId

      console.log('🚀 Starting signup process...', { signupType, shopId })

      // STEP 1: Create shop first if shop owner
      if (signupType === 'shop_owner') {
        console.log('📝 Creating shop...', shopForm)
        
        // Ensure shop email is set (use user email if shop email is empty)
        const shopData = {
          ...shopForm,
          email: shopForm.email || userForm.email // Use user email as fallback
        }
        
        const shopResponse = await fetch('/api/shops/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(shopData)
        })

        console.log('🏪 Shop creation response status:', shopResponse.status)

        if (!shopResponse.ok) {
          const shopError = await shopResponse.text()
          console.error('❌ Shop creation failed:', shopError)
          let errorMessage = 'Failed to create shop'
          
          try {
            const parsedError = JSON.parse(shopError)
            errorMessage = parsedError.message || parsedError.error || errorMessage
          } catch {
            errorMessage = shopError || errorMessage
          }
          
          throw new Error(errorMessage)
        }

        const shopData_response = await shopResponse.json()
        console.log('✅ Shop created successfully:', shopData_response)
        
        if (!shopData_response.success || !shopData_response.data?.id) {
          throw new Error('Invalid shop creation response')
        }
        
        shopId = shopData_response.data.id
      }

      // STEP 2: Create user account
      console.log('👤 Creating user account...', { 
        name: userForm.name, 
        email: userForm.email, 
        shopId,
        role: signupType === 'shop_owner' ? 'SHOP_OWNER' : 'CASHIER'
      })

      const userPayload = {
        name: userForm.name,
        email: userForm.email,
        phone: userForm.phone,
        password: userForm.password,
        shopId,
        role: signupType === 'shop_owner' ? 'SHOP_OWNER' : 'CASHIER'
      }

      const userResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userPayload)
      })

      console.log('👤 User creation response status:', userResponse.status)

      if (!userResponse.ok) {
        const userError = await userResponse.text()
        console.error('❌ User creation failed:', userError)
        let errorMessage = 'Failed to create user account'
        
        try {
          const parsedError = JSON.parse(userError)
          errorMessage = parsedError.message || parsedError.error || errorMessage
        } catch {
          errorMessage = userError || errorMessage
        }
        
        throw new Error(errorMessage)
      }

      const userData = await userResponse.json()
      console.log('✅ User created successfully:', userData)
      
      if (!userData.success || !userData.data?.token) {
        throw new Error('Invalid user creation response')
      }
      
      // STEP 3: Store authentication and redirect
      const token = userData.data.token
      localStorage.setItem('token', token)
      console.log('🔐 Token stored, redirecting to dashboard...')
      
      setSuccess('Account created successfully! Redirecting to dashboard...')
      
      // Immediate redirect without timeout for better UX
      router.push('/dashboard')

    } catch (err: any) {
      console.error('❌ Signup failed:', err)
      const errorMessage = err.message || 'Failed to create account. Please try again.'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTabChange = (type: 'shop_owner' | 'employee') => {
    setSignupType(type)
    if (type === 'employee') fetchShops()
    setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900 text-center">Join EazyQue</h1>
          <p className="text-lg text-gray-600 text-center mt-2">
            Create your account and start managing your retail business
          </p>
        </div>

        <div className="p-8">
          {/* Tab Selection */}
          <div className="flex border-b-2 border-gray-200 mb-8">
            <button
              type="button"
              className={`flex-1 py-4 px-6 text-center font-semibold transition-all duration-200 relative ${
                signupType === 'shop_owner'
                  ? 'border-b-4 border-blue-500 text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => handleTabChange('shop_owner')}
            >
              <span className="flex items-center justify-center gap-2">
                🏪 Shop Owner
                {signupType === 'shop_owner' && <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">Active</span>}
              </span>
            </button>
            <button
              type="button"
              className={`flex-1 py-4 px-6 text-center font-semibold transition-all duration-200 relative ${
                signupType === 'employee'
                  ? 'border-b-4 border-blue-500 text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => handleTabChange('employee')}
            >
              <span className="flex items-center justify-center gap-2">
                👤 Employee
                {signupType === 'employee' && <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">Active</span>}
              </span>
            </button>
          </div>

          <form onSubmit={handleSignup} className="space-y-8" noValidate>
            {/* User Details Section */}
            <div className="space-y-6 bg-gray-50 p-6 rounded-lg border">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">👤</span>
                <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                <span className="text-sm text-gray-500">(Required for all users)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
                    Full Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={userForm.name}
                    onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                    placeholder="Enter your email address"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-900 mb-2">
                    Phone Number *
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                    placeholder="10-digit mobile number"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
                    Password *
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                    placeholder="Create a secure password"
                    required
                  />
                </div>
                <div className="md:col-span-1">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={userForm.confirmPassword}
                    onChange={(e) => setUserForm({...userForm, confirmPassword: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Shop Details Section */}
            {signupType === 'shop_owner' && (
              <div className="space-y-6 bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🏢</span>
                  <h3 className="text-lg font-semibold text-gray-900">Shop Information</h3>
                  <span className="text-sm text-gray-500">(Business details for shop owners)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="shopName" className="block text-sm font-medium text-gray-900 mb-2">
                      Shop Name *
                    </label>
                    <input
                      id="shopName"
                      type="text"
                      value={shopForm.name}
                      onChange={(e) => setShopForm({...shopForm, name: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      placeholder="Enter your shop name"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="gstNumber" className="block text-sm font-medium text-gray-900 mb-2">
                      GST Number *
                    </label>
                    <input
                      id="gstNumber"
                      type="text"
                      value={shopForm.gstNumber}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                        if (value.length <= 15) {
                          setShopForm({...shopForm, gstNumber: value});
                        }
                      }}
                      placeholder="15-digit GST number (e.g., 27ABCDE1234F1Z5)"
                      maxLength={15}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="panNumber" className="block text-sm font-medium text-gray-900 mb-2">
                      PAN Number *
                    </label>
                    <input
                      id="panNumber"
                      type="text"
                      value={shopForm.panNumber}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                        if (value.length <= 10) {
                          setShopForm({...shopForm, panNumber: value});
                        }
                      }}
                      placeholder="10-character PAN (e.g., ABCDE1234F)"
                      maxLength={10}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="shopPhone" className="block text-sm font-medium text-gray-900 mb-2">
                      Shop Phone
                    </label>
                    <input
                      id="shopPhone"
                      type="tel"
                      value={shopForm.phone}
                      onChange={(e) => setShopForm({...shopForm, phone: e.target.value})}
                      placeholder="Shop contact number (optional)"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label htmlFor="shopEmail" className="block text-sm font-medium text-gray-900 mb-2">
                      Shop Email <span className="text-gray-500">(optional - will use your email if empty)</span>
                    </label>
                    <input
                      id="shopEmail"
                      type="email"
                      value={shopForm.email}
                      onChange={(e) => setShopForm({...shopForm, email: e.target.value})}
                      placeholder={`Shop email address (default: ${userForm.email})`}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                    />
                  </div>
                </div>

                <div className="space-y-6 bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    📍 Shop Address
                    <span className="text-sm font-normal text-gray-500">(Complete address required)</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-900 mb-2">
                        Address Line 1 *
                      </label>
                      <input
                        id="addressLine1"
                        type="text"
                        value={shopForm.addressLine1}
                        onChange={(e) => setShopForm({...shopForm, addressLine1: e.target.value})}
                        placeholder="Street address, building number"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-900 mb-2">
                        Address Line 2
                      </label>
                      <input
                        id="addressLine2"
                        type="text"
                        value={shopForm.addressLine2}
                        onChange={(e) => setShopForm({...shopForm, addressLine2: e.target.value})}
                        placeholder="Landmark, area (optional)"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      />
                    </div>
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-900 mb-2">
                        City *
                      </label>
                      <input
                        id="city"
                        type="text"
                        value={shopForm.city}
                        onChange={(e) => setShopForm({...shopForm, city: e.target.value})}
                        placeholder="Enter city name"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-gray-900 mb-2">
                        State *
                      </label>
                      <select
                        id="state"
                        value={shopForm.state}
                        onChange={(e) => setShopForm({...shopForm, state: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                        required
                      >
                        <option value="">Select state</option>
                        {INDIAN_STATES.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="pincode" className="block text-sm font-medium text-gray-900 mb-2">
                        Pincode *
                      </label>
                      <input
                        id="pincode"
                        type="tel"
                        value={shopForm.pincode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                          if (value.length <= 6) {
                            setShopForm({...shopForm, pincode: value});
                          }
                        }}
                        placeholder="6-digit pincode"
                        maxLength={6}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Employee Shop Selection */}
            {signupType === 'employee' && (
              <div className="space-y-6 bg-green-50 p-6 rounded-lg border-2 border-green-200">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🏪</span>
                  <h3 className="text-lg font-semibold text-gray-900">Select Shop</h3>
                  <span className="text-sm text-gray-500">(Choose your workplace)</span>
                </div>
                
                <div>
                  <label htmlFor="shop" className="block text-sm font-medium text-gray-900 mb-2">
                    Choose Shop *
                  </label>
                  <select
                    id="shop"
                    value={selectedShopId}
                    onChange={(e) => setSelectedShopId(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                    required
                  >
                    <option value="">Select the shop you'll work for</option>
                    {existingShops.map((shop) => (
                      <option key={shop.id} value={shop.id}>
                        {shop.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {existingShops.length === 0 && (
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-600">⚠️</span>
                      <p className="text-yellow-800 font-medium">
                        No shops available for employee registration
                      </p>
                    </div>
                    <p className="text-yellow-700 text-sm mt-2">
                      Please contact your shop owner to register the shop first, or register as a shop owner if you're starting a new business.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Error and Success Messages */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <span className="text-red-600">❌</span>
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <p className="text-green-800 font-medium">{success}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg hover:shadow-xl"
                disabled={isLoading || (signupType === 'employee' && existingShops.length === 0)}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    🚀 Create Account
                  </span>
                )}
              </button>
            </div>

            {/* Login Link */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium hover:underline">
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
