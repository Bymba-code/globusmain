'use client'

import { useState, useEffect } from 'react'
import ServicePage from '@/components/ServicePage'
import type { ServiceData } from '../trust/page'

export default function HbutsPage() {
  const [data, setData] = useState<ServiceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true)
        setError(null)
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
        const response = await fetch(`${apiUrl}/api/services/hbuts`)
        if (!response.ok) throw new Error('Failed to fetch service')
        const serviceData = await response.json()
        setData(serviceData)
      } catch (err) {
        console.error('Error:', err)
        setError('Failed to load service')
      } finally {
        setLoading(false)
      }
    }
    fetchService()
  }, [])

  if (loading) return <div className="flex justify-center items-center min-h-screen">Ачаалж байна...</div>
  if (error) return <div className="flex justify-center items-center min-h-screen text-red-600">{error}</div>
  if (!data) return <div className="flex justify-center items-center min-h-screen">Мэдээлэл олдсонгүй</div>

  return <ServicePage data={data} />
}
