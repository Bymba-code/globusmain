'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import LoanCalculator from '../../../components/LoanCalculator'
import { axiosInstance } from '@/lib/axios'


interface Translation {
  id: number
  language: number
  label: string
}

interface ProductDetail {
  id: number
  amount: string
  min_fee_percent: string
  max_fee_percent: string
  min_interest_rate: string
  max_interest_rate: string
  term_months: number
  min_processing_hours: number
  max_processing_hoyrs: number
}

interface RawDocument {
  id: number
  translations: Translation[]
}

interface ApiProductResponse {
  id: number
  product_type: number
  translations: Translation[]
  details: ProductDetail[]
  documents:   { id: number; document:   RawDocument }[]
  collaterals: { id: number; collateral: RawDocument }[]
  conditions:  { id: number; condition:  RawDocument }[]
}


const getTranslation = (translations: Translation[], languageId: number): string =>
  translations.find(t => t.language === languageId)?.label || ''


export default function ProductPage() {
  const params    = useParams()
  const productId = params?.productID as string
  const { language, t } = useLanguage()

  const [apiData, setApiData] = useState<ApiProductResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const langId = language === 'mn' ? 2 : 1


  useEffect(() => {
    if (!productId) {
      setError('Product ID олдсонгүй')
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await axiosInstance.get<ApiProductResponse>(`/product/${productId}`)
        setApiData(res.data)
      } catch (err: any) {
        console.error('Failed to fetch product:', err)
        setError(err.response?.data?.message || err.message || 'Алдаа гарлаа')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [productId])


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{t('Ачаалж байна...', 'Loading...')}</p>
        </div>
      </div>
    )
  }


  if (error || !apiData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {t('Алдаа гарлаа', 'Error')}
          </h2>
          <p className="text-gray-600">{error || t('Бүтээгдэхүүн олдсонгүй', 'Product not found')}</p>
        </div>
      </div>
    )
  }

  // ── Transform API → UI ───────────────────────────────────────────────────

  const detail = apiData.details?.[0] || {
    amount: '0', min_fee_percent: '0', max_fee_percent: '0',
    min_interest_rate: '0', max_interest_rate: '0',
    term_months: 0, min_processing_hours: 0, max_processing_hoyrs: 0,
  }

  const data = {
    name_mn:        getTranslation(apiData.translations, 2),
    name_en:        getTranslation(apiData.translations, 1),
    category_mn:    'Бизнес · Санхүүжилт',
    category_en:    'Business · Financing',
    description_mn: '',
    description_en: '',
    stats: {
      interest: `${detail.min_interest_rate}% - ${detail.max_interest_rate}%`,
      decision: `${detail.min_processing_hours}-${detail.max_processing_hoyrs} ${t('цаг', 'hrs')}`,
      term:     `${detail.term_months} ${t('сар', 'mo')}`,
    },
    details: {
      amount:   `${parseFloat(detail.amount || '0').toLocaleString()}₮`,
      fee:      `${detail.min_fee_percent}-${detail.max_fee_percent}%`,
      interest: `${detail.min_interest_rate}% - ${detail.max_interest_rate}%`,
      term:     `${detail.term_months} ${t('сар', 'months')}`,
      decision: `${detail.min_processing_hours}-${detail.max_processing_hoyrs} ${t('цаг', 'hours')}`,
    },
    materials:  apiData.documents?.map(d  => getTranslation(d.document.translations,   langId)) || [],
    collateral: apiData.collaterals?.map(c => getTranslation(c.collateral.translations, langId)) || [],
    conditions: apiData.conditions?.map(c  => getTranslation(c.condition.translations,  langId)) || [],
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const name        = language === 'mn' ? data.name_mn        : data.name_en
  const category    = language === 'mn' ? data.category_mn    : data.category_en
  const description = language === 'mn' ? data.description_mn : data.description_en

  const stats = [
    data.stats.interest && { value: data.stats.interest, label: t('Сарын хүү', 'Interest Rate') },
    data.stats.decision && { value: data.stats.decision, label: t('Шийдвэр', 'Decision') },
    data.stats.term     && { value: data.stats.term,     label: t('Хамгийн урт хугацаа', 'Max Term') },
  ].filter(Boolean) as { value: string; label: string }[]

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-16 md:py-20 space-y-14">
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

        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,0.9fr)] items-start">
          <section className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-7 shadow-sm">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">{name}</h2>
              <p className="text-xs text-slate-500 mb-4">
                {t('Бүтээгдэхүүний үндсэн нөхцөл ба шаардлагууд', 'Product conditions and requirements')}
              </p>

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