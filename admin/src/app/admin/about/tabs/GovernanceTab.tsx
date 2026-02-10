'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import clsx from 'clsx'
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/Modal'
import ImageUpload from '@/components/ImageUpload'
import { Input, Textarea, Button } from '@/components/FormElements'

interface I18nText {
  mn?: string
  en?: string
}

interface GovernancePerson {
  id: string
  name: I18nText
  role?: I18nText
  position?: I18nText
  desc?: I18nText
  location?: I18nText
  district?: I18nText
  image: string
  type: 'shareholder' | 'management' | 'branch'
}

const governanceType = [
  { value: 'shareholder', label: 'Хувьцаа эзэмшигч' },
  { value: 'management', label: 'Менежмент' },
  { value: 'branch', label: 'Салбар' }
]

const tabs: { id: GovernancePerson['type']; label: string }[] = [
  { id: 'shareholder', label: 'Хувьцаа эзэмшигчид' },
  { id: 'management', label: 'Менежментийн баг' },
  { id: 'branch', label: 'Салбар' }
]

const initialFormData = {
  name: { mn: '', en: '' },
  role: { mn: '', en: '' },
  position: { mn: '', en: '' },
  desc: { mn: '', en: '' },
  location: { mn: '', en: '' },
  district: { mn: '', en: '' },
  image: '',
  type: 'shareholder' as GovernancePerson['type']
}

export default function GovernanceTab({ 
  onSave, 
  loading 
}: { 
  onSave?: (data: GovernancePerson[]) => void
  loading?: boolean 
}) {
  const [governance, setGovernance] = useState<GovernancePerson[]>([])
  const [lang, setLang] = useState<'mn' | 'en'>('mn')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPerson, setEditingPerson] = useState<GovernancePerson | null>(null)
  const [selectedDetail, setSelectedDetail] = useState<GovernancePerson | null>(null)
  const [formData, setFormData] = useState(initialFormData)
  const [activeType, setActiveType] = useState<GovernancePerson['type']>('shareholder')

  const getDisplayedPeople = () => governance.filter(p => p.type === activeType)

  const t = (text?: I18nText) =>
    lang === 'mn' ? text?.mn || text?.en : text?.en || text?.mn

  const getTypeLabelMn = (type: GovernancePerson['type']) => {
    return governanceType.find(t => t.value === type)?.label || ''
  }

  const openAddModal = () => {
    setEditingPerson(null)
    setFormData(initialFormData)
    setModalOpen(true)
  }

  const openEditModal = (person: GovernancePerson) => {
    setEditingPerson(person)
    setFormData({
      name: { mn: person.name.mn || '', en: person.name.en || '' },
      role: { mn: person.role?.mn || '', en: person.role?.en || '' },
      position: { mn: person.position?.mn || '', en: person.position?.en || '' },
      desc: { mn: person.desc?.mn || '', en: person.desc?.en || '' },
      location: { mn: person.location?.mn || '', en: person.location?.en || '' },
      district: { mn: person.district?.mn || '', en: person.district?.en || '' },
      image: person.image,
      type: person.type
    })
    setModalOpen(true)
  }

  const openDetailModal = (person: GovernancePerson) => {
    setSelectedDetail(person)
  }

  const handleSave = async () => {
    if (!formData.name.mn?.trim() && !formData.name.en?.trim()) {
      setErrorMessage('Нэр оруулна уу')
      return
    }

    setIsSaving(true)
    setErrorMessage('')

    try {
      if (editingPerson) {
        setGovernance(governance.map(item =>
          item.id === editingPerson.id
            ? { ...editingPerson, ...formData }
            : item
        ))
        setSuccessMessage('Амжилттай шинэчиллэ')
      } else {
        const newPerson: GovernancePerson = {
          ...formData,
          id: Date.now().toString()
        }
        setGovernance([...governance, newPerson])
        setSuccessMessage('Амжилттай нэмэгдлээ')
      }

      setModalOpen(false)
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      setErrorMessage('Алдаа гарлаа')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Үнэхээр устгах уу?')) return

    setIsDeleting(id)
    setErrorMessage('')

    try {
      setGovernance(governance.filter(item => item.id !== id))
      setSuccessMessage('Амжилттай устгалаа')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      setErrorMessage('Алдаа гарлаа')
    } finally {
      setIsDeleting(null)
    }
  }

  const handleCloseModal = () => {
    const isDirty = JSON.stringify(formData) !== JSON.stringify(editingPerson || initialFormData)
    if (isDirty && !confirm('Хадгалаагүй өөрчлөлт байна. Гарах уу?')) {
      return
    }
    setModalOpen(false)
  }

  // Ctrl + S = Save
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        if (modalOpen) {
          handleSave()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalOpen, formData])

  // Esc = Close modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalOpen) {
        handleCloseModal()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalOpen, formData])

  // Server submission function
  const handleServerSubmit = async () => {
    setIsSaving(true)
    setErrorMessage('')
    try {
      const response = await fetch('/api/admin/about/governance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ governance })
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`)
      }

      await response.json()
      setSuccessMessage(' Үндсэн сан, удирдлагын өгөгдөл серверт амжилттай илгээлээ')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Failed to submit governance data:', error)
      setErrorMessage(` Илгээхэд алдаа гарлаа: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {successMessage && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700 border border-green-200">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          {errorMessage}
        </div>
      )}

      {/* Frontend Preview Style */}
      <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-200">
        <div className="flex items-center justify-between mb-8">
          <h2 className="sr-only">Компанийн засаглал</h2>
          
          {/* Language Toggle */}
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setLang('mn')}
              className={clsx(
                "px-3 py-1 rounded-md font-medium transition-colors text-sm",
                lang === 'mn'
                  ? "bg-white text-teal-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              MN
            </button>
            <button
              onClick={() => setLang('en')}
              className={clsx(
                "px-3 py-1 rounded-md font-medium transition-colors text-sm",
                lang === 'en'
                  ? "bg-white text-teal-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              EN
            </button>
          </div>
        </div>
        
        {/* Tabs Navigation */}
        <div className="flex justify-center gap-8 border-b border-gray-200 mb-12">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveType(tab.id)}
              className={clsx(
                "pb-3 text-sm font-medium transition-colors duration-200 outline-none focus:ring-offset-2 focus:ring-2 focus:ring-teal-500",
                activeType === tab.id
                  ? "text-teal-600 border-b-2 border-teal-600"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10">
          {getDisplayedPeople().map((person, idx) => (
            <div 
              key={person.id}
              className="group bg-white border border-gray-200 rounded-xl p-4 sm:p-6 transition-colors duration-200 outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 hover:border-teal-300"
            >
              <div className="relative w-full aspect-[3/4] max-h-[220px] sm:max-h-none mb-3 sm:mb-4 rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={person.image || '/img/avatar-placeholder.png'}
                  alt={t(person.name) || ''}
                  fill
                  priority={idx === 0}
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover object-top"
                />
                
                {/* Edit & Delete Icons Overlay */}
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      openEditModal(person)
                    }}
                    className="p-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-colors"
                    title="Засварлах"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(person.id)
                    }}
                    className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                    title="Устгах"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <p className="text-sm font-semibold text-gray-900">
                {t(person.name)}
              </p>
              <p className="text-xs text-gray-600">
                {t(person.role) || t(person.position)}
              </p>

              {person.type === 'branch' && (
                <p className="text-xs text-gray-500 mt-3">
                  {t(person.location)} · {t(person.district)}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Admin Toolbar */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-slate-700">Удирдлага:</label>
          <span className="text-sm text-slate-500">Нийт {governance.length} хүн</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleServerSubmit}
            disabled={isSaving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-white ${
              isSaving
                ? 'bg-emerald-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isSaving ? ' Илгээж байна...' : ' Серверт илгээх'}
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors font-medium"
          >
            <PlusIcon className="w-5 h-5" />
            Нэмэх
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedDetail && (
        <div 
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-0 sm:items-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto"
          onClick={() => setSelectedDetail(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div 
            className="bg-white w-full max-w-4xl rounded-2xl p-8 relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setSelectedDetail(null)}
              aria-label="Хаах"
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors outline-none focus:ring-2 focus:ring-teal-500"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>

            <div className="flex flex-col md:flex-row gap-8 md:gap-12">
              
              {/* Image Side */}
              <div className="w-full md:w-1/3 flex-shrink-0">
                <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-gray-100">
                  <Image
                    src={selectedDetail.image || '/img/avatar-placeholder.png'}
                    alt={t(selectedDetail.name) || ''}
                    fill
                    className="object-cover object-top"
                  />
                </div>
              </div>

              {/* Content Side */}
              <div className="w-full md:w-2/3 flex flex-col justify-start">
                <h3 id="modal-title" className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900">
                  {t(selectedDetail.name)}
                </h3>
                <p className="text-xs sm:text-sm text-teal-600 uppercase tracking-wide mt-1 mb-4 sm:mb-6 md:mb-8">
                  {t(selectedDetail.role) || t(selectedDetail.position)}
                </p>
                
                {(selectedDetail.location?.mn || selectedDetail.location?.en) && (
                  <p className="text-xs sm:text-sm text-slate-600 mb-4">
                    <span className="font-medium">{lang === 'mn' ? 'Байршил' : 'Location'}:</span> {t(selectedDetail.location)} - {t(selectedDetail.district)}
                  </p>
                )}

                {(selectedDetail.desc?.mn || selectedDetail.desc?.en) && (
                  <div className="space-y-3 sm:space-y-4 md:space-y-5 text-gray-600 leading-6 sm:leading-7 md:leading-7 text-xs sm:text-sm mb-6">
                    {(t(selectedDetail.desc) || '').split('\n\n').map((paragraph: string, i: number) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                )}

                {/* Admin Actions in Detail Modal */}
                <div className="flex gap-3 pt-6 border-t border-slate-200">
                  <button
                    onClick={() => {
                      openEditModal(selectedDetail)
                      setSelectedDetail(null)
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors font-medium text-sm"
                  >
                    <PencilIcon className="w-4 h-4" />
                    Засварлах
                  </button>
                  <button
                    onClick={() => {
                      handleDelete(selectedDetail.id)
                      setSelectedDetail(null)
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium text-sm"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Устгах
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Modal isOpen={modalOpen} onClose={handleCloseModal} title={editingPerson ? 'Засварлах' : 'Нэмэх'}>
        <div className="space-y-6">
          {/* Form */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Төрөл *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as GovernancePerson['type'] })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                {governanceType.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* MN */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Нэр (Монгол)
                </label>
                <Input
                  value={formData.name.mn || ''}
                  onChange={(e) => setFormData({ ...formData, name: { ...formData.name, mn: e.target.value } })}
                  placeholder="Монгол нэр"
                />
              </div>

              {/* EN */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Name (English)
                </label>
                <Input
                  value={formData.name.en || ''}
                  onChange={(e) => setFormData({ ...formData, name: { ...formData.name, en: e.target.value } })}
                  placeholder="English name"
                />
              </div>
            </div>

            {formData.type === 'branch' ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Албан тушаал (Монгол)</label>
                    <Input
                      value={formData.position?.mn || ''}
                      onChange={(e) => setFormData({ ...formData, position: { ...formData.position, mn: e.target.value } })}
                      placeholder="Албан тушаал"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Position (English)</label>
                    <Input
                      value={formData.position?.en || ''}
                      onChange={(e) => setFormData({ ...formData, position: { ...formData.position, en: e.target.value } })}
                      placeholder="Position"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Байршил (Монгол)</label>
                    <Input
                      value={formData.location?.mn || ''}
                      onChange={(e) => setFormData({ ...formData, location: { ...formData.location, mn: e.target.value } })}
                      placeholder="Байршил"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Location (English)</label>
                    <Input
                      value={formData.location?.en || ''}
                      onChange={(e) => setFormData({ ...formData, location: { ...formData.location, en: e.target.value } })}
                      placeholder="Location"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Дүүрэг (Монгол)</label>
                    <Input
                      value={formData.district?.mn || ''}
                      onChange={(e) => setFormData({ ...formData, district: { ...formData.district, mn: e.target.value } })}
                      placeholder="Дүүрэг"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">District (English)</label>
                    <Input
                      value={formData.district?.en || ''}
                      onChange={(e) => setFormData({ ...formData, district: { ...formData.district, en: e.target.value } })}
                      placeholder="District"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Албан тушаал (Монгол)</label>
                  <Input
                    value={formData.role?.mn || ''}
                    onChange={(e) => setFormData({ ...formData, role: { ...formData.role, mn: e.target.value } })}
                    placeholder="Албан тушаал"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Role (English)</label>
                  <Input
                    value={formData.role?.en || ''}
                    onChange={(e) => setFormData({ ...formData, role: { ...formData.role, en: e.target.value } })}
                    placeholder="Role"
                  />
                </div>
              </div>
            )}

            {formData.type !== 'branch' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Тайлбар (Монгол)</label>
                    <Textarea
                      value={formData.desc?.mn || ''}
                      onChange={(e) => setFormData({ ...formData, desc: { ...formData.desc, mn: e.target.value } })}
                      placeholder="Тайлбар"
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Description (English)</label>
                    <Textarea
                      value={formData.desc?.en || ''}
                      onChange={(e) => setFormData({ ...formData, desc: { ...formData.desc, en: e.target.value } })}
                      placeholder="Description"
                      rows={4}
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Зураг</label>
              <ImageUpload
                onChange={(url) => setFormData({ ...formData, image: url })}
                value={formData.image}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t border-slate-200">
            <div className="flex-1" />
            <button
              onClick={handleCloseModal}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Цуцлах
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 font-medium"
            >
              {isSaving ? 'Хадгалж байна...' : 'Хадгалах'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
