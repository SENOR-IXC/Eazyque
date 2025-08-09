'use client'

import { useState } from 'react'

export default function TestForm() {
  const [pincode, setPincode] = useState('')

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Test Form</h1>
        
        <form noValidate>
          <div className="mb-4">
            <label htmlFor="test-pincode" className="block text-sm font-medium text-gray-700 mb-2">
              Test Pincode
            </label>
            <input
              id="test-pincode"
              type="tel"
              value={pincode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                if (value.length <= 6) {
                  setPincode(value);
                }
              }}
              placeholder="Enter 6-digit pincode"
              maxLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
            />
          </div>
          
          <button
            type="button"
            onClick={() => alert(`Pincode entered: ${pincode}`)}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Test Submit
          </button>
        </form>
        
        <div className="mt-4 text-sm text-gray-600">
          Current value: {pincode}
        </div>
      </div>
    </div>
  )
}
