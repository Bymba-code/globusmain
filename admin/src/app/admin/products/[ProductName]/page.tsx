'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import { Input, Textarea, PageHeader } from '@/components/FormElements'
import ProductPage from '@/components/ProductPage'
import DocumentSelector from '@/components/DocumentSelector'
import { axiosInstance } from '@/lib/axios'
import { useProduct } from '@/contexts/productContext'

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

interface Document {
  id: number
  translations: Translation[]
}

interface ProductDocument {
  id: number
  document: Document
}

interface Collateral {
  id: number
  translations: Translation[]
}

interface ProductCollateral {
  id: number
  collateral: Collateral
}

interface Condition {
  id: number
  translations: Translation[]
}

interface ProductCondition {
  id: number
  condition: Condition
}

interface ApiProductResponse {
  id: number
  product_type: number
  translations: Translation[]
  details: ProductDetail[]
  documents: ProductDocument[]
  collaterals: ProductCollateral[]
  conditions: ProductCondition[]
}

interface SelectedDocument {
  id: number
  product_relation_id?: number
  label_mn: string
  label_en: string
}

interface ProductDetailsForm {
  amount: string
  min_fee_percent: string
  max_fee_percent: string
  min_interest_rate: string
  max_interest_rate: string
  term_months: string
  min_processing_hours: string
  max_processing_hours: string
}

interface ProductData {
  id: string
  product_type: number
  name_mn: string
  name_en: string
  category_mn: string
  category_en: string
  description_mn: string
  description_en: string
  details: ProductDetailsForm
  detailsId?: number
  documents: SelectedDocument[]
  collaterals: SelectedDocument[]
  conditions: SelectedDocument[]
  status: 'draft' | 'published'
}


const getTranslation = (translations: Translation[], languageId: number): string => {
  const translation = translations.find(t => t.language === languageId)
  return translation?.label || ''
}

const transformApiToUi = (apiData: ApiProductResponse): ProductData => {
  const detail = apiData.details?.[0] || {
    id: 0,
    amount: '0',
    min_fee_percent: '0',
    max_fee_percent: '0',
    min_interest_rate: '0',
    max_interest_rate: '0',
    term_months: 0,
    min_processing_hours: 0,
    max_processing_hoyrs: 0
  }
  
  return {
    id: apiData.id.toString(),
    product_type: apiData.product_type,
    name_mn: getTranslation(apiData.translations, 2),
    name_en: getTranslation(apiData.translations, 1),
    category_mn: 'Бизнес · Санхүүжилт',
    category_en: 'Business · Financing',
    description_mn: '',
    description_en: '',
    details: {
      amount: detail.amount,
      min_fee_percent: detail.min_fee_percent,
      max_fee_percent: detail.max_fee_percent,
      min_interest_rate: detail.min_interest_rate,
      max_interest_rate: detail.max_interest_rate,
      term_months: detail.term_months.toString(),
      min_processing_hours: detail.min_processing_hours.toString(),
      max_processing_hours: detail.max_processing_hoyrs.toString(),
    },
    detailsId: detail.id,
    documents: apiData.documents?.map((doc) => ({
      id: doc.document.id,
      product_relation_id: doc.id,
      label_mn: getTranslation(doc.document.translations, 2),
      label_en: getTranslation(doc.document.translations, 1),
    })) || [],
    collaterals: apiData.collaterals?.map((coll) => ({
      id: coll.collateral.id,
      product_relation_id: coll.id,
      label_mn: getTranslation(coll.collateral.translations, 2),
      label_en: getTranslation(coll.collateral.translations, 1),
    })) || [],
    conditions: apiData.conditions?.map((cond) => ({
      id: cond.condition.id,
      product_relation_id: cond.id,
      label_mn: getTranslation(cond.condition.translations, 2),
      label_en: getTranslation(cond.condition.translations, 1),
    })) || [],
    status: 'draft',
  }
}

const createDefaultData = (): ProductData => ({
  id: '',
  product_type: 1,
  name_mn: '',
  name_en: '',
  category_mn: 'Бизнес · Санхүүжилт',
  category_en: 'Business · Financing',
  description_mn: '',
  description_en: '',
  details: {
    amount: '0',
    min_fee_percent: '0',
    max_fee_percent: '0',
    min_interest_rate: '0',
    max_interest_rate: '0',
    term_months: '0',
    min_processing_hours: '0',
    max_processing_hours: '0',
  },
  documents: [],
  collaterals: [],
  conditions: [],
  status: 'draft',
})

export default function ProductAdminPage() {
  const params = useParams()
  const productId = params?.ProductName as string
  
  const [data, setData] = useState<ProductData>(createDefaultData())
  const [previewLang, setPreviewLang] = useState<'mn' | 'en'>('mn')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  const [availableDocuments, setAvailableDocuments] = useState<Document[]>([])
  const [availableCollaterals, setAvailableCollaterals] = useState<Document[]>([])
  const [availableConditions, setAvailableConditions] = useState<Document[]>([])
  const [loadingAvailable, setLoadingAvailable] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!productId) {
        setError('Product ID олдсонгүй')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setLoadingAvailable(true)
        setError(null)
        
        const [productRes, docsRes, collsRes, condsRes] = await Promise.all([
          axiosInstance.get<ApiProductResponse>(`/product/${productId}`),
          axiosInstance.get<Document[]>('/document/'),
          axiosInstance.get<Document[]>('/collateral/'),
          axiosInstance.get<Document[]>('/condition/')
        ])
        
        setData(transformApiToUi(productRes.data))
        setAvailableDocuments(docsRes.data)
        setAvailableCollaterals(collsRes.data)
        setAvailableConditions(condsRes.data)
        
      } catch (err: any) {
        console.error('Failed to fetch data:', err)
        setError(`Алдаа гарлаа: ${err.response?.data?.message || err.message}`)
      } finally {
        setLoading(false)
        setLoadingAvailable(false)
      }
    }

    fetchData()
  }, [productId])

  const updateData = (updater: (prev: ProductData) => ProductData) => {
    setData(updater)
  }

  const handleAddDocument = async (document: Document): Promise<boolean> => {
    try {
      const newDoc: SelectedDocument = {
        id: document.id,
        label_mn: getTranslation(document.translations, 2),
        label_en: getTranslation(document.translations, 1),
      }

      setData(prev => ({
        ...prev,
        documents: [...prev.documents, newDoc]
      }))

      return true
    } catch (error: any) {
      throw new Error('Баримт нэмэхэд алдаа гарлаа')
    }
  }

  const handleRemoveDocument = async (documentId: number): Promise<boolean> => {
    try {
      setData(prev => ({
        ...prev,
        documents: prev.documents.filter(d => d.id !== documentId)
      }))

      return true
    } catch (error: any) {
      throw new Error('Баримт устгахад алдаа гарлаа')
    }
  }

  const handleAddCollateral = async (collateral: Document): Promise<boolean> => {
    try {
      const newColl: SelectedDocument = {
        id: collateral.id,
        label_mn: getTranslation(collateral.translations, 2),
        label_en: getTranslation(collateral.translations, 1),
      }

      setData(prev => ({
        ...prev,
        collaterals: [...prev.collaterals, newColl]
      }))

      return true
    } catch (error: any) {
      throw new Error('Барьцаа нэмэхэд алдаа гарлаа')
    }
  }

  const handleRemoveCollateral = async (collateralId: number): Promise<boolean> => {
    try {
      setData(prev => ({
        ...prev,
        collaterals: prev.collaterals.filter(c => c.id !== collateralId)
      }))

      return true
    } catch (error: any) {
      throw new Error('Барьцаа устгахад алдаа гарлаа')
    }
  }

  const handleAddCondition = async (condition: Document): Promise<boolean> => {
    try {
      const newCond: SelectedDocument = {
        id: condition.id,
        label_mn: getTranslation(condition.translations, 2),
        label_en: getTranslation(condition.translations, 1),
      }

      setData(prev => ({
        ...prev,
        conditions: [...prev.conditions, newCond]
      }))

      return true
    } catch (error: any) {
      throw new Error('Нөхцөл нэмэхэд алдаа гарлаа')
    }
  }

  const handleRemoveCondition = async (conditionId: number): Promise<boolean> => {
    try {
      setData(prev => ({
        ...prev,
        conditions: prev.conditions.filter(c => c.id !== conditionId)
      }))

      return true
    } catch (error: any) {
      throw new Error('Нөхцөл устгахад алдаа гарлаа')
    }
  }

 

  const handleSaveAll = async () => {
    if (!productId) return

    setIsSaving(true)
    try {
      const updatePayload = {
        product_type: data.product_type,
        translations: [
          { language: 1, label: data.name_en },
          { language: 2, label: data.name_mn }
        ],
        details: {
          amount: parseFloat(data.details.amount),
          min_fee_percent: parseFloat(data.details.min_fee_percent),
          max_fee_percent: parseFloat(data.details.max_fee_percent),
          min_interest_rate: parseFloat(data.details.min_interest_rate),
          max_interest_rate: parseFloat(data.details.max_interest_rate),
          term_months: parseInt(data.details.term_months),
          min_processing_hours: parseInt(data.details.min_processing_hours),
          max_processing_hoyrs: parseInt(data.details.max_processing_hours),
        },
        documents: data.documents.map(doc => ({
          document: doc.id
        })),
        collaterals: data.collaterals.map(coll => ({
          collateral: coll.id
        })),
        conditions: data.conditions.map(cond => ({
          condition: cond.id
        }))
      }

      await axiosInstance.put(`/product/${productId}/`, updatePayload)
      alert('Бүх мэдээлэл амжилттай хадгалагдлаа!')
      
      const productRes = await axiosInstance.get<ApiProductResponse>(`/product/${productId}`)
      setData(transformApiToUi(productRes.data))
      
    } catch (error: any) {
      console.error('Save failed:', error)
      const errorMsg = error.response?.data?.detail 
        || error.response?.data?.message 
        || error.message 
        || 'Тодорхойгүй алдаа'
      alert(`Алдаа: ${errorMsg}`)
    } finally {
      setIsSaving(false)
    }
  }

  const previewStats = {
    interest: `${data.details.min_interest_rate}% - ${data.details.max_interest_rate}%`,
    decision: `${data.details.min_processing_hours}-${data.details.max_processing_hours} цаг`,
    term: `${data.details.term_months} сар`,
  }

  const previewDetails = {
    amount: `${parseFloat(data.details.amount || '0').toLocaleString()}₮`,
    fee: `${data.details.min_fee_percent}-${data.details.max_fee_percent}%`,
    interest: `${data.details.min_interest_rate}% - ${data.details.max_interest_rate}%`,
    term: `${data.details.term_months} сар`,
    decision: `${data.details.min_processing_hours}-${data.details.max_processing_hours} цаг`,
  }

  if (loading) {
    return (
      <AdminLayout title="Бүтээгдэхүүн">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Уншиж байна...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout title="Алдаа">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Алдаа гарлаа</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title={data.name_mn || 'Бүтээгдэхүүн'}>
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title={data.name_mn || 'Бүтээгдэхүүн'}
          description={`ID: ${productId}`}
          action={
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors shadow-sm"
            >
              {isSaving ? ' Хадгалж байна...' : 'Бүгдийг хадгалах'}
            </button>
          }
        />

        <div className="mb-8 rounded-2xl overflow-hidden border border-slate-200 bg-gradient-to-b from-slate-100 to-slate-50 shadow-sm">
          <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between bg-white/50 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Live Preview
              </span>
            </div>
            
            <div className="flex bg-slate-200/80 p-1 rounded-lg">
               <button 
                 onClick={() => setPreviewLang('mn')}
                 className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                   previewLang === 'mn' 
                     ? 'bg-white text-teal-700 shadow-sm' 
                     : 'text-slate-500 hover:text-slate-700'
                 }`}
               >
                 MN
               </button>
               <button 
                 onClick={() => setPreviewLang('en')}
                 className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                   previewLang === 'en' 
                     ? 'bg-white text-teal-700 shadow-sm' 
                     : 'text-slate-500 hover:text-slate-700'
                 }`}
               >
                 EN
               </button>
            </div>
          </div>
          
          <div className="bg-white">
            <ProductPage 
              data={{
                ...data,
                stats: previewStats,
                details: previewDetails,
                materials: data.documents.map(doc => ({ 
                  id: doc.id.toString(), 
                  mn: doc.label_mn, 
                  en: doc.label_en 
                })),
                collateral: data.collaterals.map(coll => ({ 
                  id: coll.id.toString(), 
                  mn: coll.label_mn, 
                  en: coll.label_en 
                })),
                conditions: data.conditions.map(cond => ({ 
                  id: cond.id.toString(), 
                  mn: cond.label_mn, 
                  en: cond.label_en 
                })),
                name_style: { color: '#0f172a', fontSize: { mobile: 24, desktop: 32 }, fontWeight: 'bold', align: 'center' },
                category_style: { color: '#64748b', fontSize: { mobile: 12, desktop: 14 }, fontWeight: 'normal', align: 'center' },
                description_style: { color: '#334155', fontSize: { mobile: 14, desktop: 16 }, fontWeight: 'normal', align: 'center' },
                statsLabelStyle: { color: '#64748b', fontSize: { mobile: 10, desktop: 11 }, fontWeight: 'normal', align: 'center' },
                statsValueStyle: { color: '#0d9488', fontSize: { mobile: 14, desktop: 16 }, fontWeight: 'bold', align: 'center' },
                detailsSectionTitle_mn: 'Бүтээгдэхүүний үндсэн нөхцөл',
                detailsSectionTitle_en: 'Product conditions',
                detailsSectionTitleStyle: { color: '#64748b', fontSize: { mobile: 11, desktop: 12 }, fontWeight: 'normal', align: 'left' },
                detailsSubtitle_mn: data.name_mn,
                detailsSubtitle_en: data.name_en,
                detailsSubtitleStyle: { color: '#0f172a', fontSize: { mobile: 20, desktop: 24 }, fontWeight: 'bold', align: 'left' },
                metricsLabelStyle: { color: '#64748b', fontSize: { mobile: 11, desktop: 11 }, fontWeight: 'normal', align: 'left' },
                metricsValueStyle: { color: '#0f172a', fontSize: { mobile: 14, desktop: 16 }, fontWeight: 'bold', align: 'left' },
                materialsTitle_mn: 'Шаардагдах материал',
                materialsTitle_en: 'Required Documents',
                materialsTitleStyle: { color: '#0f172a', fontSize: { mobile: 14, desktop: 14 }, fontWeight: 'bold', align: 'left' },
                materialsTextStyle: { color: '#334155', fontSize: { mobile: 12, desktop: 12 }, fontWeight: 'normal', align: 'left' },
                materialsIconColor: '#0d9488',
                collateralTitle_mn: 'Барьцаа хөрөнгө',
                collateralTitle_en: 'Collateral',
                collateralTitleStyle: { color: '#0f172a', fontSize: { mobile: 14, desktop: 14 }, fontWeight: 'bold', align: 'left' },
                collateralTextStyle: { color: '#334155', fontSize: { mobile: 12, desktop: 12 }, fontWeight: 'normal', align: 'left' },
                collateralIconColor: '#0d9488',
                conditionsTitle_mn: 'Нөхцөл',
                conditionsTitle_en: 'Conditions',
                conditionsTitleStyle: { color: '#0f172a', fontSize: { mobile: 14, desktop: 14 }, fontWeight: 'bold', align: 'left' },
                conditionsTextStyle: { color: '#334155', fontSize: { mobile: 12, desktop: 12 }, fontWeight: 'normal', align: 'left' },
                conditionsIconColor: '#f97316',
                blocks: [],
              }} 
              forceLang={previewLang} 
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              Үндсэн мэдээлэл / Basic Information
            </h3>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <Input
                  label="Нэр (MN)"
                  value={data.name_mn}
                  onChange={(e) => updateData((prev) => ({ ...prev, name_mn: e.target.value }))}
                  placeholder="Бүтээгдэхүүний нэр монгол хэлээр..."
                />
                <Input
                  label="Name (EN)"
                  value={data.name_en}
                  onChange={(e) => updateData((prev) => ({ ...prev, name_en: e.target.value }))}
                  placeholder="Product name in English..."
                />
              </div>

              {/* <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <Input
                  label="Ангилал (MN)"
                  value={data.category_mn}
                  onChange={(e) => updateData((prev) => ({ ...prev, category_mn: e.target.value }))}
                  placeholder="Жишээ: Бизнес · Санхүүжилт"
                />
                <Input
                  label="Category (EN)"
                  value={data.category_en}
                  onChange={(e) => updateData((prev) => ({ ...prev, category_en: e.target.value }))}
                  placeholder="Example: Business · Financing"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <Textarea
                  label="Тайлбар (MN)"
                  value={data.description_mn}
                  onChange={(e) => updateData((prev) => ({ ...prev, description_mn: e.target.value }))}
                  rows={3}
                  placeholder="Дэлгэрэнгүй тайлбар..."
                />
                <Textarea
                  label="Description (EN)"
                  value={data.description_en}
                  onChange={(e) => updateData((prev) => ({ ...prev, description_en: e.target.value }))}
                  rows={3}
                  placeholder="Detailed description..."
                />
              </div> */}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <span>📊</span>
              Дэлгэрэнгүй мэдээлэл / Product Details
            </h3>

            <div className="space-y-4">
              {/* Amount */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Дүн / Amount
                </label>
                <Input
                  value={data.details.amount}
                  onChange={(e) => updateData((prev) => ({
                    ...prev,
                    details: { ...prev.details, amount: e.target.value }
                  }))}
                  placeholder="0"
                  type="number"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Шимтгэл хамгийн бага % / Min Fee %
                  </label>
                  <Input
                    value={data.details.min_fee_percent}
                    onChange={(e) => updateData((prev) => ({
                      ...prev,
                      details: { ...prev.details, min_fee_percent: e.target.value }
                    }))}
                    placeholder="0"
                    type="number"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Шимтгэл хамгийн их % / Max Fee %
                  </label>
                  <Input
                    value={data.details.max_fee_percent}
                    onChange={(e) => updateData((prev) => ({
                      ...prev,
                      details: { ...prev.details, max_fee_percent: e.target.value }
                    }))}
                    placeholder="0"
                    type="number"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Хүү хамгийн бага % / Min Interest %
                  </label>
                  <Input
                    value={data.details.min_interest_rate}
                    onChange={(e) => updateData((prev) => ({
                      ...prev,
                      details: { ...prev.details, min_interest_rate: e.target.value }
                    }))}
                    placeholder="0"
                    type="number"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Хүү хамгийн их % / Max Interest %
                  </label>
                  <Input
                    value={data.details.max_interest_rate}
                    onChange={(e) => updateData((prev) => ({
                      ...prev,
                      details: { ...prev.details, max_interest_rate: e.target.value }
                    }))}
                    placeholder="0"
                    type="number"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="p-4 bg-teal-50 rounded-xl border border-teal-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Хугацаа (сар) / Term (months)
                </label>
                <Input
                  value={data.details.term_months}
                  onChange={(e) => updateData((prev) => ({
                    ...prev,
                    details: { ...prev.details, term_months: e.target.value }
                  }))}
                  placeholder="0"
                  type="number"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4 p-4 bg-orange-50 rounded-xl border border-orange-100">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Шийдвэр хамгийн бага (цаг) / Min Processing (hours)
                  </label>
                  <Input
                    value={data.details.min_processing_hours}
                    onChange={(e) => updateData((prev) => ({
                      ...prev,
                      details: { ...prev.details, min_processing_hours: e.target.value }
                    }))}
                    placeholder="0"
                    type="number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Шийдвэр хамгийн их (цаг) / Max Processing (hours)
                  </label>
                  <Input
                    value={data.details.max_processing_hours}
                    onChange={(e) => updateData((prev) => ({
                      ...prev,
                      details: { ...prev.details, max_processing_hours: e.target.value }
                    }))}
                    placeholder="0"
                    type="number"
                  />
                </div>
              </div>
            </div>
          </div>

          <DocumentSelector
            title="Шаардагдах материал / Required Documents"
            selectedDocuments={data.documents}
            availableDocuments={availableDocuments}
            onAdd={handleAddDocument}
            onRemove={handleRemoveDocument}
            loading={loadingAvailable}
          />

          <DocumentSelector
            title="Барьцаа хөрөнгө / Collateral"
            selectedDocuments={data.collaterals}
            availableDocuments={availableCollaterals}
            onAdd={handleAddCollateral}
            onRemove={handleRemoveCollateral}
            loading={loadingAvailable}
          />

          <DocumentSelector
            title=" Нөхцөл / Conditions"
            selectedDocuments={data.conditions}
            availableDocuments={availableConditions}
            onAdd={handleAddCondition}
            onRemove={handleRemoveCondition}
            loading={loadingAvailable}
          />
        </div>
      </div>
    </AdminLayout>
  )
}