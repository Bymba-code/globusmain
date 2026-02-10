'use client'
import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import DataTable from '@/components/DataTable'
import Modal from '@/components/Modal'
import ImageUpload from '@/components/ImageUpload'
import { Input, Select, Textarea, Checkbox, Button, PageHeader, StatusBadge, FormActions } from '@/components/FormElements'
import { PlusIcon, PhotoIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import { useSaveReset } from '@/hooks/useSaveReset'
import { SaveResetButtons } from '@/components/SaveResetButtons'

interface Product {
  id: string
  category: string
  subcategory?: string
  title: string
  shortDescription: string
  heroImage: string
  interestRate: string
  maxAmount: string
  maxTerm: string
  isActive: boolean
}

const categories = [
  { 
    value: 'business', 
    label: 'Бизнес зээл',
    subcategories: []
  },
  { 
    value: 'car-loan', 
    label: 'Автомашины зээл',
    subcategories: [
      { value: 'collateral', label: 'Автомашин барьцаалсан зээл (Зогсоол)' },
      { value: 'purchase', label: 'Автомашин авах зээл (Унах)' },
    ]
  },
  { 
    value: 'real-estate', 
    label: 'Үл хөдлөх хөрөнгийн зээл',
    subcategories: [
      { value: 'land', label: 'Газар барьцаалсан зээл' },
      { value: 'fence', label: 'Хашаа барьцаалсан зээл' },
      { value: 'apartment', label: 'Орон сууц барьцаалсан зээл' },
    ]
  },
  { 
    value: 'phone-number', 
    label: 'Дугаар барьцаалсан зээл',
    subcategories: []
  },
]

const initialFormData = {
  category: 'business',
  subcategory: '',
  title: '',
  shortDescription: '',
  heroImage: '',
  interestRate: '',
  maxAmount: '',
  maxTerm: '',
  isActive: true,
}

// Default products - empty array, data will come from backend
const defaultProducts: Product[] = []

export default function ProductsPage() {
  const { data: products, setData: setProducts, saveSuccess, handleSave: saveData, handleReset } = useSaveReset<Product[]>('products', defaultProducts)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState(initialFormData)
  const [selectedCategory, setSelectedCategory] = useState(categories[0])

  useEffect(() => {
    const cat = categories.find(c => c.value === formData.category)
    if (cat) setSelectedCategory(cat)
  }, [formData.category])

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/admin/products')
      if (res.ok) {
        const text = await res.text()
        if (text) {
          const data = JSON.parse(text)
          if (Array.isArray(data)) setProducts(data)
        }
      }
    } catch (error) {
      console.warn('API холболт байхгүй, default утга ашиглаж байна')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingProduct
        ? `/api/admin/products?id=${editingProduct.id}`
        : '/api/admin/products'

      const res = await fetch(url, {
        method: editingProduct ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error('Failed to save')

      await fetchProducts()
      handleCloseModal()
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Хадгалахад алдаа гарлаа')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (product: Product) => {
    if (!confirm('Устгахдаа итгэлтэй байна уу?')) return

    try {
      const res = await fetch(`/api/admin/products?id=${product.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete')

      await fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Устгахад алдаа гарлаа')
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      category: product.category,
      subcategory: product.subcategory || '',
      title: product.title,
      shortDescription: product.shortDescription,
      heroImage: product.heroImage,
      interestRate: product.interestRate,
      maxAmount: product.maxAmount,
      maxTerm: product.maxTerm,
      isActive: product.isActive,
    })
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingProduct(null)
    setFormData(initialFormData)
  }

  const columns = [
    {
      key: 'heroImage',
      label: 'Зураг',
      render: (product: Product) => (
        <div className="h-12 w-20 relative rounded-lg overflow-hidden bg-gray-100 ring-1 ring-gray-200">
          {product.heroImage ? (
            <Image src={product.heroImage} alt={product.title} fill className="object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <PhotoIcon className="h-5 w-5 text-gray-300" />
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'title',
      label: 'Нэр',
      render: (product: Product) => (
        <div>
          <p className="font-medium text-gray-900">{product.title || '—'}</p>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{product.shortDescription || ''}</p>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Ангилал',
      render: (product: Product) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 text-xs font-medium text-gray-700">
          {categories.find(c => c.value === product.category)?.label || product.category}
        </span>
      ),
    },
    {
      key: 'interestRate',
      label: 'Хүү',
      render: (product: Product) => (
        <span className="font-medium text-primary">{product.interestRate || '—'}</span>
      ),
    },
    {
      key: 'isActive',
      label: 'Төлөв',
      render: (product: Product) => <StatusBadge active={product.isActive} />,
    },
  ]

  return (
    <AdminLayout title="Бүтээгдэхүүн">
      {saveSuccess && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-emerald-900">Амжилттай хадгалагдлаа!</h4>
            <p className="text-xs text-emerald-700 mt-0.5">Өөрчлөлтүүд хадгалагдсан.</p>
          </div>
        </div>
      )}
      
      <PageHeader
        title="Зээлийн бүтээгдэхүүн"
        description="Бүх төрлийн зээлийн бүтээгдэхүүнүүдийг удирдах"
        action={
          <div className="flex items-center gap-3">
            <SaveResetButtons 
              onSave={saveData}
              onReset={handleReset}
              confirmMessage="Та хадгалахдаа итгэлтэй байна уу?"
            />
            <Button variant="dark" onClick={() => setModalOpen(true)} icon={<PlusIcon className="h-4 w-4" />}>
              Шинэ бүтээгдэхүүн
            </Button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingProduct ? 'Бүтээгдэхүүн засварлах' : 'Шинэ бүтээгдэхүүн нэмэх'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Select
            label="Ангилал"
            value={formData.category}
            onChange={(e) => {
              const newCategory = e.target.value
              setFormData({ ...formData, category: newCategory, subcategory: '' })
              const cat = categories.find(c => c.value === newCategory)
              if (cat) setSelectedCategory(cat)
            }}
            options={categories.map(c => ({ value: c.value, label: c.label }))}
          />

          {selectedCategory.subcategories.length > 0 && (
            <Select
              label="Дэд ангилал"
              value={formData.subcategory}
              onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
              options={selectedCategory.subcategories}
            />
          )}

          <Input
            label="Нэр"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Автомашин барьцаалсан зээл"
          />

          <Textarea
            label="Богино тайлбар"
            value={formData.shortDescription}
            onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
            rows={2}
            placeholder="Таны одоо байгаа автомашиныг барьцаалж зээл авах"
          />

          <ImageUpload
            label="Hero зураг"
            value={formData.heroImage}
            onChange={(url) => setFormData({ ...formData, heroImage: url })}
          />

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Хүү (сарын)"
              value={formData.interestRate}
              onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
              placeholder="1.5%"
            />
            <Input
              label="Дээд дүн"
              value={formData.maxAmount}
              onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
              placeholder="100 сая"
            />
            <Input
              label="Хугацаа"
              value={formData.maxTerm}
              onChange={(e) => setFormData({ ...formData, maxTerm: e.target.value })}
              placeholder="36 сар"
            />
          </div>

          <FormActions onCancel={handleCloseModal} loading={saving} />
        </form>
      </Modal>
    </AdminLayout>
  )
}
