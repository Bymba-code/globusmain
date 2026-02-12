'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import Modal from '@/components/Modal';
import { Button } from '@/components/FormElements';
import {
  PlusIcon, DocumentTextIcon, TrashIcon, PencilIcon, EyeIcon,
  LinkIcon, CalendarIcon, PhotoIcon, SparklesIcon, GlobeAltIcon,
  CheckCircleIcon, ClockIcon, ChevronDownIcon, ChevronUpIcon,
} from '@heroicons/react/24/outline';
import {axiosInstance} from '@/lib/axios';

// ─── API Types ────────────────────────────────────────────────────────────────

interface ApiTranslation {
  id?: number
  language: number          // 1 = MN, 2 = EN
  label: string
  font?: string
  family?: string
  weight?: string
  size?: string
}

interface ApiPage {
  id: number
  url: string
  active: boolean
  image: string | null
  title_translations: ApiTranslation[]
  description_translations: ApiTranslation[]
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormData {
  url: string
  active: boolean
  image: string
  title_mn: string
  title_en: string
  title_font: string
  title_family: string
  title_weight: string
  title_size: string
  description_mn: string
  description_en: string
  desc_font: string
  desc_family: string
  desc_weight: string
  desc_size: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getTrans = (translations: ApiTranslation[], langId: number): ApiTranslation =>
  translations.find(t => t.language === langId) || { language: langId, label: '' }

const defaultForm = (): FormData => ({
  url: '',
  active: true,
  image: '',
  title_mn: '',
  title_en: '',
  title_font: 'Arial',
  title_family: 'sans-serif',
  title_weight: 'bold',
  title_size: '32px',
  description_mn: '',
  description_en: '',
  desc_font: 'Arial',
  desc_family: 'sans-serif',
  desc_weight: 'normal',
  desc_size: '16px',
})

const toPayload = (f: FormData) => ({
  url: f.url,
  active: f.active,
  image: f.image || null,
  title_translations: [
    { language: 1, label: f.title_mn, font: f.title_font, family: f.title_family, weight: f.title_weight, size: f.title_size },
    { language: 2, label: f.title_en, font: f.title_font, family: f.title_family, weight: f.title_weight, size: f.title_size },
  ],
  description_translations: [
    { language: 1, label: f.description_mn, font: f.desc_font, family: f.desc_family, weight: f.desc_weight, size: f.desc_size },
    { language: 2, label: f.description_en, font: f.desc_font, family: f.desc_family, weight: f.desc_weight, size: f.desc_size },
  ],
})

const fromApi = (p: ApiPage): FormData => {
  const tmn = getTrans(p.title_translations, 1)
  const ten = getTrans(p.title_translations, 2)
  const dmn = getTrans(p.description_translations, 1)
  return {
    url:            p.url,
    active:         p.active,
    image:          p.image || '',
    title_mn:       tmn.label,
    title_en:       ten.label,
    title_font:     tmn.font   || 'Arial',
    title_family:   tmn.family || 'sans-serif',
    title_weight:   tmn.weight || 'bold',
    title_size:     tmn.size   || '32px',
    description_mn: dmn.label,
    description_en: getTrans(p.description_translations, 2).label,
    desc_font:      dmn.font   || 'Arial',
    desc_family:    dmn.family || 'sans-serif',
    desc_weight:    dmn.weight || 'normal',
    desc_size:      dmn.size   || '16px',
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PagesManager() {
  const [pages,         setPages]         = useState<ApiPage[]>([])
  const [formData,      setFormData]      = useState<FormData>(defaultForm())
  const [editingPage,   setEditingPage]   = useState<ApiPage | null>(null)
  const [isEditing,     setIsEditing]     = useState(false)
  const [showPreview,   setShowPreview]   = useState(false)
  const [previewPage,   setPreviewPage]   = useState<ApiPage | null>(null)
  const [loading,       setLoading]       = useState(false)
  const [saving,        setSaving]        = useState(false)
  const [showList,      setShowList]      = useState(true)

  useEffect(() => { loadPages() }, [])

  // ── CRUD ────────────────────────────────────────────────────────────────────

  const loadPages = async () => {
    try {
      setLoading(true)
      const res = await axiosInstance.get<ApiPage[]>('/page/')
      setPages(res.data)
    } catch (err) {
      console.error('Failed to load pages:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = toPayload(formData)
      if (isEditing && editingPage) {
        await axiosInstance.put(`/page/${editingPage.id}/`, payload)
        alert('Хуудас амжилттай шинэчлэгдлээ!')
      } else {
        await axiosInstance.post('/page/', payload)
        alert('Шинэ хуудас амжилттай үүслээ!')
      }
      await loadPages()
      resetForm()
    } catch (err: any) {
      console.error('Save failed:', err)
      alert(`Хадгалахад алдаа гарлаа: ${err.response?.data?.detail || err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (page: ApiPage) => {
    setEditingPage(page)
    setFormData(fromApi(page))
    setIsEditing(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Энэ хуудсыг устгахдаа итгэлтэй байна уу?')) return
    try {
      await axiosInstance.delete(`/page/${id}/`)
      alert('Хуудас устгагдлаа!')
      await loadPages()
    } catch (err: any) {
      console.error('Delete failed:', err)
      alert(`Устгахад алдаа гарлаа: ${err.response?.data?.detail || err.message}`)
    }
  }

  const resetForm = () => {
    setFormData(defaultForm())
    setEditingPage(null)
    setIsEditing(false)
  }

  const upd = (patch: Partial<FormData>) => setFormData(prev => ({ ...prev, ...patch }))

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Хуулагдлаа!')
  }


  return (
    <AdminLayout title="Хуудас удирдах">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Хуудас удирдах</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Нийт хуудас',  value: pages.length },
            { label: 'Идэвхтэй',     value: pages.filter(p => p.active).length },
            { label: 'Идэвхгүй',     value: pages.filter(p => !p.active).length },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="text-sm font-medium text-gray-600 mb-2">{s.label}</div>
              <div className="text-3xl font-bold text-gray-900">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isEditing && (
                  <div className="p-2 rounded-lg bg-amber-100">
                    <PencilIcon className="h-5 w-5 text-amber-600" />
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {isEditing ? 'Хуудас засварлах' : 'Шинэ хуудас'}
                  </h2>
                  {isEditing && (
                    <p className="text-sm text-gray-500">
                      "{getTrans(editingPage!.title_translations, 1).label}" хуудсыг засварлаж байна
                    </p>
                  )}
                </div>
              </div>
              {isEditing && (
                <Button onClick={resetForm} variant="secondary" className="hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                  Болих
                </Button>
              )}
            </div>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">

              <div className="bg-gradient-to-r from-teal-50/50 to-teal-50/30 rounded-xl p-6 border border-teal-100">
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-teal-500" />
                  URL Хаяг
                </label>
                <input
                  type="text"
                  value={formData.url}
                  onChange={e => upd({ url: e.target.value })}
                  required
                  placeholder="/about-us"
                  className="w-full px-4 py-3 border border-teal-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                />
                {formData.url && (
                  <div className="mt-3 flex items-center gap-3">
                    <code className="flex-1 bg-white text-teal-700 px-4 py-2.5 rounded-lg font-mono text-sm border border-teal-100">
                      {formData.url}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`${window.location.origin}${formData.url}`)}
                      className="p-2.5 bg-teal-100 text-teal-600 rounded-lg hover:bg-teal-200 transition-colors"
                    >
                      <LinkIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-teal-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <GlobeAltIcon className="h-5 w-5 text-teal-600" />
                    Контент - Агуулга
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Монгол болон англи хэл дээрх мэдээллийг оруулна уу</p>
                </div>

                <div className="p-6 space-y-8">
                  {/* Titles */}
                  <div className="space-y-4">
                    <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <span>🇲🇳</span> Гарчиг (Монгол)
                      </label>
                      <input
                        type="text"
                        value={formData.title_mn}
                        onChange={e => upd({ title_mn: e.target.value })}
                        required
                        placeholder="Хуудасны гарчиг"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      />
                    </div>
                    <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <span>🇺🇸</span> Title (English)
                      </label>
                      <input
                        type="text"
                        value={formData.title_en}
                        onChange={e => upd({ title_en: e.target.value })}
                        required
                        placeholder="Page title"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      />
                    </div>
                  </div>

                  {/* Title Styling */}
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                    <h3 className="text-base font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <SparklesIcon className="h-5 w-5 text-teal-500" />
                      Гарчиг тохиргоо
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-800">Font</label>
                        <input
                          type="text"
                          value={formData.title_font}
                          onChange={e => upd({ title_font: e.target.value })}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          placeholder="Arial"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-800">Font family</label>
                        <select
                          value={formData.title_family}
                          onChange={e => upd({ title_family: e.target.value })}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="sans-serif">Sans-serif</option>
                          <option value="serif">Serif</option>
                          <option value="monospace">Monospace</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-800">Жин (weight)</label>
                        <select
                          value={formData.title_weight}
                          onChange={e => upd({ title_weight: e.target.value })}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="normal">Normal</option>
                          <option value="bold">Bold</option>
                          <option value="600">Semibold (600)</option>
                          <option value="700">Bold (700)</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-800">Хэмжээ (size)</label>
                        <input
                          type="text"
                          value={formData.title_size}
                          onChange={e => upd({ title_size: e.target.value })}
                          placeholder="32px"
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                    {/* Title preview */}
                    <div className="mt-4 p-4 border border-gray-200 rounded-xl bg-white">
                      <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide font-semibold">Урьдчилан харах</p>
                      <div style={{
                        fontFamily: `${formData.title_font}, ${formData.title_family}`,
                        fontWeight: formData.title_weight,
                        fontSize: formData.title_size,
                      }}>
                        {formData.title_mn || 'Гарчигны жишээ'}
                      </div>
                    </div>
                  </div>

                  {/* Descriptions */}
                  <div className="space-y-4">
                    <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <span>🇲🇳</span> Агуулга (Монгол)
                      </label>
                      <textarea
                        value={formData.description_mn}
                        onChange={e => upd({ description_mn: e.target.value })}
                        required
                        rows={6}
                        placeholder="Хуудасны агуулга..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                      />
                    </div>
                    <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <span>🇺🇸</span> Content (English)
                      </label>
                      <textarea
                        value={formData.description_en}
                        onChange={e => upd({ description_en: e.target.value })}
                        required
                        rows={6}
                        placeholder="Page content..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                      />
                    </div>
                  </div>

                  {/* Description Styling */}
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                    <h3 className="text-base font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <SparklesIcon className="h-5 w-5 text-amber-500" />
                      Агуулга тохиргоо
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-800">Font</label>
                        <input
                          type="text"
                          value={formData.desc_font}
                          onChange={e => upd({ desc_font: e.target.value })}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          placeholder="Arial"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-800">Font family</label>
                        <select
                          value={formData.desc_family}
                          onChange={e => upd({ desc_family: e.target.value })}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="sans-serif">Sans-serif</option>
                          <option value="serif">Serif</option>
                          <option value="monospace">Monospace</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-800">Жин (weight)</label>
                        <select
                          value={formData.desc_weight}
                          onChange={e => upd({ desc_weight: e.target.value })}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="normal">Normal</option>
                          <option value="bold">Bold</option>
                          <option value="600">Semibold (600)</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-800">Хэмжээ (size)</label>
                        <input
                          type="text"
                          value={formData.desc_size}
                          onChange={e => upd({ desc_size: e.target.value })}
                          placeholder="16px"
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                    {/* Desc preview */}
                    <div className="mt-4 p-4 border border-gray-200 rounded-xl bg-white">
                      <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide font-semibold">Урьдчилан харах</p>
                      <div style={{
                        fontFamily: `${formData.desc_font}, ${formData.desc_family}`,
                        fontWeight: formData.desc_weight,
                        fontSize: formData.desc_size,
                      }}>
                        {formData.description_mn || 'Агуулгын жишээ текст...'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Image */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <PhotoIcon className="h-4 w-4 text-teal-500" />
                  Зураг (Image URL)
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 hover:border-teal-400 transition-colors bg-gray-50/50">
                  {formData.image ? (
                    <div className="space-y-4">
                      <div className="relative group">
                        <img src={formData.image} alt="Preview" className="w-full h-64 object-cover rounded-xl shadow-lg" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => upd({ image: '' })}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={formData.image}
                        onChange={e => upd({ image: e.target.value })}
                        placeholder="Зургийн URL эсвэл зам"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <PhotoIcon className="h-8 w-8 text-teal-500" />
                      </div>
                      <input
                        type="text"
                        value={formData.image}
                        onChange={e => upd({ image: e.target.value })}
                        placeholder="Зургийн URL эсвэл зам (жнь: /images/about.jpg)"
                        className="w-full max-w-md mx-auto px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 mb-4"
                      />
                      <div className="text-sm text-gray-400">эсвэл</div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onload = ev => upd({ image: ev.target?.result as string })
                            reader.readAsDataURL(file)
                          }
                        }}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="inline-flex items-center px-6 py-3 mt-4 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors cursor-pointer font-medium"
                      >
                        <PhotoIcon className="h-5 w-5 mr-2" />
                        Файл сонгох
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  {formData.active ? (
                    <CheckCircleIcon className="h-6 w-6 text-emerald-500" />
                  ) : (
                    <ClockIcon className="h-6 w-6 text-amber-500" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {formData.active ? 'Идэвхтэй' : 'Идэвхгүй'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formData.active ? 'Хуудас вэбсайтад харагдаж байна' : 'Хуудас нууцлагдсан байна'}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={e => upd({ active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-teal-600" />
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  onClick={() => {
                    // Build a temp ApiPage for preview
                    const tmp: ApiPage = {
                      id: editingPage?.id || 0,
                      url: formData.url,
                      active: formData.active,
                      image: formData.image || null,
                      title_translations: [
                        { language: 1, label: formData.title_mn, font: formData.title_font, family: formData.title_family, weight: formData.title_weight, size: formData.title_size },
                        { language: 2, label: formData.title_en, font: formData.title_font, family: formData.title_family, weight: formData.title_weight, size: formData.title_size },
                      ],
                      description_translations: [
                        { language: 1, label: formData.description_mn, font: formData.desc_font, family: formData.desc_family, weight: formData.desc_weight, size: formData.desc_size },
                        { language: 2, label: formData.description_en, font: formData.desc_font, family: formData.desc_family, weight: formData.desc_weight, size: formData.desc_size },
                      ],
                    }
                    setPreviewPage(tmp)
                    setShowPreview(true)
                  }}
                  variant="secondary"
                  disabled={!formData.title_mn || !formData.description_mn || saving}
                  className="flex items-center gap-2"
                >
                  <EyeIcon className="h-4 w-4" />
                  Урьдчилан үзэх
                </Button>
                <div className="flex gap-3">
                  {isEditing && (
                    <Button onClick={resetForm} variant="secondary" type="button" disabled={saving}>
                      Болих
                    </Button>
                  )}
                  <Button type="submit" disabled={saving} className="bg-teal-600 hover:bg-teal-700 text-white px-6">
                    {saving ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Хадгалж байна...
                      </div>
                    ) : isEditing ? (
                      <><PencilIcon className="h-4 w-4 mr-2" />Хадгалах</>
                    ) : (
                      <><PlusIcon className="h-4 w-4 mr-2" />Үүсгэх</>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Preview Modal */}
        <Modal isOpen={showPreview && previewPage !== null} onClose={() => setShowPreview(false)} title="Хуудас урьдчилан үзэх" size="xl">
          {previewPage && (() => {
            const tmn = getTrans(previewPage.title_translations, 1)
            const ten = getTrans(previewPage.title_translations, 2)
            const dmn = getTrans(previewPage.description_translations, 1)
            const den = getTrans(previewPage.description_translations, 2)
            const titleStyle = { fontFamily: `${tmn.font || 'Arial'}, ${tmn.family || 'sans-serif'}`, fontWeight: tmn.weight || 'bold', fontSize: tmn.size || '32px' }
            const descStyle  = { fontFamily: `${dmn.font || 'Arial'}, ${dmn.family || 'sans-serif'}`, fontWeight: dmn.weight || 'normal', fontSize: dmn.size || '16px' }
            return (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 px-4 py-2 rounded-full text-sm">
                    <LinkIcon className="h-4 w-4" />{previewPage.url}
                  </div>
                </div>
                {previewPage.image && (
                  <img src={previewPage.image} alt="" className="w-full h-48 md:h-64 object-cover rounded-2xl shadow-lg" />
                )}
                {/* MN */}
                <div className="rounded-2xl border border-blue-200 overflow-hidden">
                  <div className="px-6 py-3 border-b border-blue-100 bg-blue-50 flex items-center gap-2">
                    <span>🇲🇳</span><span className="text-sm font-semibold text-gray-700">Монгол</span>
                  </div>
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 style={titleStyle}>{tmn.label}</h2>
                  </div>
                  <div className="px-6 py-6">
                    <div className="whitespace-pre-wrap leading-relaxed" style={descStyle}>{dmn.label}</div>
                  </div>
                </div>
                {/* EN */}
                <div className="rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                    <span>🇺🇸</span><span className="text-sm font-semibold text-gray-700">English</span>
                  </div>
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 style={titleStyle}>{ten.label}</h2>
                  </div>
                  <div className="px-6 py-6">
                    <div className="whitespace-pre-wrap leading-relaxed" style={descStyle}>{den.label}</div>
                  </div>
                  <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-sm text-gray-500">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${previewPage.active ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {previewPage.active ? 'Идэвхтэй' : 'Идэвхгүй'}
                    </span>
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <button onClick={() => setShowPreview(false)} className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium">
                    Хаах
                  </button>
                </div>
              </div>
            )
          })()}
        </Modal>

        {/* Pages List */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div
            className="px-6 py-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setShowList(!showList)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-teal-100 rounded-xl">
                  <DocumentTextIcon className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Бүх хуудсууд</h2>
                  <p className="text-sm text-gray-500">
                    {loading ? 'Уншиж байна...' : `${pages.length} хуудас үүссэн`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
                    {pages.filter(p => p.active).length} идэвхтэй
                  </span>
                  <span className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">
                    {pages.filter(p => !p.active).length} идэвхгүй
                  </span>
                </div>
                <button className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                  {showList ? <ChevronUpIcon className="h-5 w-5 text-gray-500" /> : <ChevronDownIcon className="h-5 w-5 text-gray-500" />}
                </button>
              </div>
            </div>
          </div>

          {showList && (
            <div className="p-6">
              {loading ? (
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-10 w-10 border-3 border-teal-600 border-t-transparent mx-auto mb-4" />
                  <p className="text-teal-600">Хуудсуудыг уншиж байна...</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {pages.map(page => {
                    const tmn = getTrans(page.title_translations, 1)
                    const ten = getTrans(page.title_translations, 2)
                    return (
                      <div key={page.id} className="group border border-gray-200 rounded-xl p-5 hover:border-teal-300 hover:shadow-md transition-all duration-200 bg-white">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 flex gap-4">
                            {/* Thumbnail */}
                            <div className="flex-shrink-0">
                              {page.image ? (
                                <img src={page.image} alt={tmn.label} className="w-20 h-20 rounded-xl object-cover shadow-sm" />
                              ) : (
                                <div className={`w-20 h-20 rounded-xl flex items-center justify-center ${page.active ? 'bg-gradient-to-br from-emerald-100 to-emerald-50' : 'bg-gradient-to-br from-amber-100 to-amber-50'}`}>
                                  <DocumentTextIcon className={`h-8 w-8 ${page.active ? 'text-emerald-500' : 'text-amber-500'}`} />
                                </div>
                              )}
                            </div>
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-base font-semibold text-gray-900 truncate">{tmn.label}</h3>
                                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${page.active ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {page.active ? 'ИДЭВХТЭЙ' : 'ИДЭВХГҮЙ'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{ten.label}</p>
                              <button
                                onClick={() => copyToClipboard(`${window.location.origin}${page.url}`)}
                                className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-medium mb-2"
                              >
                                <LinkIcon className="h-3.5 w-3.5" />{page.url}
                              </button>
                              <p className="text-sm text-gray-500 line-clamp-2">
                                {getTrans(page.description_translations, 1).label}
                              </p>
                            </div>
                          </div>
                          {/* Actions */}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setPreviewPage(page); setShowPreview(true) }}
                              className="p-2.5 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-colors"
                              title="Урьдчилан үзэх"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleEdit(page)}
                              className="p-2.5 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-colors"
                              title="Засах"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(page.id)}
                              className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                              title="Устгах"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {!loading && pages.length === 0 && (
                    <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                      <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <DocumentTextIcon className="h-10 w-10 text-teal-500" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Хуудас байхгүй байна</h3>
                      <p className="text-gray-600 mb-8">Эхний хуудсаа үүсгээд эхэлцгээе!</p>
                      <Button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="bg-teal-600 hover:bg-teal-700 text-white"
                      >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Шинэ хуудас үүсгэх
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}