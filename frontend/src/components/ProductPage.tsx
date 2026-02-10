'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import LoanCalculator from './LoanCalculator'

interface ProductData {
  id?: string
  name_mn: string
  name_en: string
  category_mn: string
  category_en: string
  description_mn: string
  description_en: string
  stats: {
    interest?: string
    decision?: string
    term?: string
  }
  details: {
    amount?: string
    fee?: string
    interest?: string
    term?: string
    decision?: string
  }
  materials: string[]
  collateral?: string[]
  conditions?: string[]
}

interface ProductPageProps {
  productId?: string
  data?: ProductData
}

export default function ProductPage({ productId, data: staticData }: ProductPageProps) {
  const { language, t } = useLanguage()
  const [data, setData] = useState<ProductData | null>(staticData || null)
  const [loading, setLoading] = useState(!staticData && !productId)
  const [error, setError] = useState<string | null>(null)

  // Fetch product from backend if productId is provided and no static data
  useEffect(() => {
    if (!productId || staticData) return

    const fetchProduct = async () => {
      try {
        setLoading(true)
        setError(null)
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
        const response = await fetch(`${apiUrl}/api/products/${productId}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch product: ${response.status}`)
        }
        const product = await response.json()
        setData(product)
      } catch (err) {
        console.error('Error fetching product:', err)
        setError('Бүтээгдэхүүний мэдээлэл ачаалахад алдаа гарлаа')
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId, staticData])

  const name = language === 'mn' ? data?.name_mn : data?.name_en
  const category = language === 'mn' ? data?.category_mn : data?.category_en
  const description = language === 'mn' ? data?.description_mn : data?.description_en

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Бүтээгдэхүүний мэдээлэл ачаалж байна...</p>
        </div>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center max-w-md">
          <svg className="w-12 h-12 text-red-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-lg font-semibold text-red-900 mb-2">Алдаа гарлаа</h2>
          <p className="text-red-700 mb-4">{error || 'Бүтээгдэхүүн олдсонгүй'}</p>
          <Link href="/products" className="inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            Буцах
          </Link>
        </div>
      </main>
    )
  }

  const stats = [
    data.stats.interest && { value: data.stats.interest, label: t('Сарын хүү', 'Interest Rate') },
    data.stats.decision && { value: data.stats.decision, label: t('Шийдвэр', 'Decision') },
    data.stats.term && { value: data.stats.term, label: t('Хамгийн урт хугацаа', 'Max Term') },
  ].filter(Boolean) as { value: string; label: string }[]

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-16 md:py-20 space-y-14">
        {/* Hero */}
        <header className="grid gap-10 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 px-4 py-1.5 rounded-full text-xs font-medium mb-4">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {category}
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-3">
              {name}
            </h1>
            <p className="text-sm md:text-base text-slate-600 max-w-xl">
              {description}
            </p>
          </div>

          {/* Stats */}
          {stats.length > 0 && (
            <section aria-label="Key stats" className="flex flex-row gap-2">
              {stats.map((s, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-center shadow-sm flex-1">
                  <div className="text-sm md:text-base font-bold text-teal-700 mb-0.5">{s.value}</div>
                  <div className="text-[10px] text-slate-500">{s.label}</div>
                </div>
              ))}
            </section>
          )}
        </header>

        {/* Main content */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,0.9fr)] items-start">
          {/* LEFT: product details */}
          <section className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-7 shadow-sm">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">{name}</h2>
              <p className="text-xs text-slate-500 mb-4">
                {t('Бүтээгдэхүүний үндсэн нөхцөл ба шаардлагууд', 'Product conditions and requirements')}
              </p>

              {/* Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {data.details.amount && (
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] text-slate-500 mb-1">{t('Хэмжээ /₮/', 'Amount')}</p>
                    <p className="text-base font-semibold text-slate-900">{data.details.amount}</p>
                  </div>
                )}
                {data.details.fee && (
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] text-slate-500 mb-1">{t('Шимтгэл /%/', 'Fee')}</p>
                    <p className="text-base font-semibold text-slate-900">{data.details.fee}</p>
                  </div>
                )}
                {data.details.interest && (
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] text-slate-500 mb-1">{t('Хүү /сарын/', 'Interest')}</p>
                    <p className="text-base font-semibold text-slate-900">{data.details.interest}</p>
                  </div>
                )}
                {data.details.term && (
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] text-slate-500 mb-1">{t('Зээлийн хугацаа', 'Loan Term')}</p>
                    <p className="text-base font-semibold text-slate-900">{data.details.term}</p>
                  </div>
                )}
                {data.details.decision && (
                  <div className="rounded-xl bg-slate-50 p-3 md:col-span-2">
                    <p className="text-[11px] text-slate-500 mb-1">{t('Шийдвэрлэх хугацаа', 'Decision Time')}</p>
                    <p className="text-base font-semibold text-slate-900">{data.details.decision}</p>
                  </div>
                )}
              </div>

              {/* Materials */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-900 mb-3">
                  {t('Шаардагдах материал', 'Required Documents')}
                </h3>
                <ul className="space-y-2">
                  {data.materials.map((m, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <svg className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Collateral */}
              {data.collateral && data.collateral.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">
                    {t('Барьцаа хөрөнгө', 'Collateral')}
                  </h3>
                  <ul className="space-y-2">
                    {data.collateral.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                        <svg className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Conditions */}
              {data.conditions && data.conditions.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3">
                    {t('Нөхцөл', 'Conditions')}
                  </h3>
                  <ul className="space-y-2">
                    {data.conditions.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                        <svg className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>

          {/* RIGHT: Calculator */}
          <aside>
            <div className="sticky top-24">
              <LoanCalculator />
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
