'use client'
import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import DataTable from '@/components/DataTable'
import Modal from '@/components/Modal'
import { PlusIcon } from '@heroicons/react/24/outline'
import { useSaveReset } from '@/hooks/useSaveReset'
import { SaveResetButtons } from '@/components/SaveResetButtons'
import { axiosInstance } from '@/lib/axios'

interface BranchAPI {
  id: number
  name: string
  location: string
  image?: string
  image_url?: string | null
  area?: string | null
  city?: string | null
  district?: string | null
  open?: string | null
  time?: string | null
  latitude: string  
  longitude: string 
  phones: { id?: number; phone: string }[]
}

interface Branch {
  id: number
  name: string
  location: string
  image?: string | null
  image_url: string | null
  area?: string | null
  city?: string | null
  district?: string | null
  open?: string | null
  time?: string | null
  latitude: number | null
  longitude: number | null
  phones: { id?: number; phone: string }[]
}

interface BranchFormData {
  name: string
  location: string
  open: string
  time: string
  latitude: number | null
  longitude: number | null
  phones: string[]
  area: string
  city: string
  district: string
  imageFile: File | null
}

const initialFormData: BranchFormData = {
  name: '',
  location: '',
  open: 'Даваа-Баасан',
  time: '09:00-18:00',
  latitude: 47.9184,
  longitude: 106.9177,
  phones: [''],
  area: '',
  city: '',
  district: '',
  imageFile: null,
}

const transformAPIToBranch = (apiData: BranchAPI): Branch => ({
  ...apiData,
  image: apiData.image_url || apiData.image || null,
  latitude: apiData.latitude ? parseFloat(apiData.latitude) : null,
  longitude: apiData.longitude ? parseFloat(apiData.longitude) : null,
})

export default function BranchesPage() {
  const { data: branches, setData: setBranches, saveSuccess, handleSave: saveData, handleReset } = useSaveReset<Branch[]>('branches', [])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [formData, setFormData] = useState<BranchFormData>(initialFormData)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchBranches()
  }, [])

  const fetchBranches = async () => {
    setLoading(true)
    try {
      const response = await axiosInstance.get<BranchAPI[]>('/branch/')
      
      if (response.data && Array.isArray(response.data)) {
        const transformedBranches = response.data.map(transformAPIToBranch)
        setBranches(transformedBranches)
      } else {
        setBranches([])
      }
    } catch (error) {
      console.error('Салбарын мэдээлэл татахад алдаа гарлаа:', error)
      alert('Салбарын мэдээлэл татахад алдаа гарлаа. Дахин оролдоно уу.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const formDataToSend = new FormData()
      
      // Add basic fields
      formDataToSend.append('name', formData.name)
      formDataToSend.append('location', formData.location)
      formDataToSend.append('area', formData.area || '')
      formDataToSend.append('city', formData.city || '')
      formDataToSend.append('district', formData.district || '')
      formDataToSend.append('open', formData.open || '')
      formDataToSend.append('time', formData.time || '')
      formDataToSend.append('latitude', formData.latitude !== null ? formData.latitude.toString() : '0')
      formDataToSend.append('longitude', formData.longitude !== null ? formData.longitude.toString() : '0')
      
      // Add image file if selected
      if (formData.imageFile) {
        formDataToSend.append('image', formData.imageFile)
      }
      
      // Add phones as JSON string
      const validPhones = formData.phones.filter(p => p.trim() !== '')
      
      // Validate phones
      if (validPhones.length === 0) {
        alert('Дор хаяж нэг утасны дугаар оруулна уу')
        setSubmitting(false)
        return
      }
      
      const phonesData = validPhones.map(p => ({ phone: p.trim() }))
      formDataToSend.append('phones', JSON.stringify(phonesData))

      let response
      if (editingBranch) {
        response = await axiosInstance.put(`/branch/${editingBranch.id}/`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      } else {
        response = await axiosInstance.post('/branch/', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      }
      
      await fetchBranches()
      handleCloseModal()
      
      alert(editingBranch ? 'Салбар амжилттай засагдлаа!' : 'Салбар амжилттай нэмэгдлээ!')
    } catch (error: any) {
      console.error('Салбар хадгалахад алдаа гарлаа:', error)
      console.error('Error response:', error.response?.data)
      
      let errorMessage = 'Хадгалахад алдаа гарлаа'
      
      if (error.response?.data) {
        const errors = error.response.data
        const errorMessages: string[] = []
        
        // Handle phones errors
        if (errors.phones) {
          if (typeof errors.phones === 'string') {
            errorMessages.push(`Утас: ${errors.phones}`)
          } else if (Array.isArray(errors.phones)) {
            errors.phones.forEach((phoneError: any, index: number) => {
              if (typeof phoneError === 'string') {
                errorMessages.push(`Утас: ${phoneError}`)
              } else if (phoneError && typeof phoneError === 'object') {
                Object.entries(phoneError).forEach(([field, messages]) => {
                  if (Array.isArray(messages)) {
                    errorMessages.push(`Утас ${index + 1} - ${field}: ${messages.join(', ')}`)
                  }
                })
              }
            })
          }
        }
        
        // Handle other errors
        for (const [field, messages] of Object.entries(errors)) {
          if (field === 'phones') continue // Already handled
          
          if (Array.isArray(messages)) {
            errorMessages.push(`${field}: ${messages.join(', ')}`)
          } else if (typeof messages === 'string') {
            errorMessages.push(`${field}: ${messages}`)
          }
        }
        
        if (errorMessages.length > 0) {
          errorMessage = errorMessages.join('\n')
        }
      }
      
      alert(`Алдаа:\n${errorMessage}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (branch: Branch) => {
    if (!confirm(`"${branch.name}" салбарыг устгахдаа итгэлтэй байна уу?`)) return

    try {
      await axiosInstance.delete(`/branch/${branch.id}/`)
      await fetchBranches()
      alert('Салбар амжилттай устгагдлаа!')
    } catch (error: any) {
      console.error('Салбар устгахад алдаа гарлаа:', error)
      const errorMessage = error.response?.data?.message
        || error.response?.data?.error 
        || error.message 
        || 'Устгахад алдаа гарлаа'
      alert(`Алдаа: ${errorMessage}`)
    }
  }

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch)
    setFormData({
      name: branch.name,
      location: branch.location,
      open: branch.open || 'Даваа-Баасан',
      time: branch.time || '09:00-18:00',
      latitude: branch.latitude || 47.9184,
      longitude: branch.longitude || 106.9177,
      phones: branch.phones && branch.phones.length > 0 
        ? branch.phones.map(p => p.phone) 
        : [''],
      area: branch.area || '',
      city: branch.city || '',
      district: branch.district || '',
      imageFile: null,
    })
    // Set existing image as preview
    setImagePreview(branch.image || '')
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingBranch(null)
    setFormData(initialFormData)
    setImagePreview('')
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Зургийн хэмжээ 5MB-аас бага байх ёстой')
      e.target.value = ''
      return
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Зөвхөн зураг оруулна уу')
      e.target.value = ''
      return
    }

    // Store the file
    setFormData(prev => ({ ...prev, imageFile: file }))

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.onerror = () => {
      alert('Зураг унших үед алдаа гарлаа')
      setFormData(prev => ({ ...prev, imageFile: null }))
      setImagePreview('')
      e.target.value = ''
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, imageFile: null }))
    setImagePreview('')
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  const handleAddPhone = () => {
    setFormData(prev => ({ 
      ...prev, 
      phones: [...prev.phones, ''] 
    }))
  }

  const handleRemovePhone = (index: number) => {
    const newPhones = formData.phones.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, phones: newPhones.length > 0 ? newPhones : [''] }))
  }

  const handlePhoneChange = (index: number, value: string) => {
    const newPhones = [...formData.phones]
    newPhones[index] = value
    setFormData(prev => ({ ...prev, phones: newPhones }))
  }

  const columns = [
    { 
      key: 'image', 
      label: 'Зураг',
      render: (branch: Branch) => (
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
          {branch.image ? (
            <img 
              src={`http://127.0.0.1:8000${branch.image_url}`} 
              alt={branch.name} 
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          ) : (
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </div>
      )
    },
    { 
      key: 'name', 
      label: 'Нэр',
      render: (branch: Branch) => (
        <div className="font-medium text-gray-900">{branch.name}</div>
      )
    },
    { 
      key: 'location', 
      label: 'Хаяг',
      render: (branch: Branch) => (
        <div className="text-sm text-gray-600">{branch.location}</div>
      )
    },
    { 
      key: 'phones', 
      label: 'Утас',
      render: (branch: Branch) => (
        <div className="space-y-1">
          {branch.phones && branch.phones.length > 0 ? (
            branch.phones.slice(0, 2).map((p, i) => (
              <div key={p.id || i} className="text-sm text-gray-700">{p.phone}</div>
            ))
          ) : (
            <span className="text-sm text-gray-400">-</span>
          )}
          {branch.phones && branch.phones.length > 2 && (
            <div className="text-xs text-gray-500">+{branch.phones.length - 2} бусад</div>
          )}
        </div>
      )
    },
    { 
      key: 'location_details', 
      label: 'Байршил',
      render: (branch: Branch) => (
        <div className="text-xs space-y-0.5">
          {branch.district && <div className="text-gray-900 font-medium">{branch.district}</div>}
          {branch.area && <div className="text-gray-600">{branch.area}</div>}
          {branch.city && <div className="text-gray-500">{branch.city}</div>}
          {!branch.district && !branch.area && !branch.city && <span className="text-gray-400">-</span>}
        </div>
      )
    },
    { 
      key: 'time', 
      label: 'Ажлын цаг',
      render: (branch: Branch) => (
        <div className="text-xs space-y-0.5">
          {branch.open && <div className="text-gray-700">{branch.open}</div>}
          {branch.time && <div className="text-gray-600">{branch.time}</div>}
          {!branch.open && !branch.time && <span className="text-gray-400">-</span>}
        </div>
      )
    },
  ]

  return (
    <AdminLayout title="Салбарууд">
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
      
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Салбарууд</h2>
          <p className="text-sm text-gray-600 mt-1">Нийт {branches.length} салбар</p>
        </div>
        <div className="flex items-center gap-3">
          <SaveResetButtons 
            onSave={saveData}
            onReset={handleReset}
            confirmMessage="Та хадгалахдаа итгэлтэй байна уу?"
          />
          <button 
            onClick={() => setModalOpen(true)} 
            className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 shadow-sm transition-all hover:shadow-md"
          >
            <PlusIcon className="h-5 w-5" />
            Шинэ салбар
          </button>
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={branches} 
        loading={loading} 
        onEdit={handleEdit} 
        onDelete={handleDelete} 
      />

      <Modal 
        isOpen={modalOpen} 
        onClose={handleCloseModal} 
        title={editingBranch ? 'Салбар засварлах' : 'Шинэ салбар'} 
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Салбарын нэр <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} 
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                placeholder="Төв салбар"
                required 
                disabled={submitting}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Хаяг <span className="text-red-500">*</span>
              </label>
              <textarea 
                value={formData.location} 
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))} 
                rows={2} 
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all resize-none"
                placeholder="Сүхбаатарын талбай 1"
                required
                disabled={submitting}
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Зураг
              <span className="text-xs text-gray-500 ml-2">(Хэмжээ: 5MB хүртэл)</span>
            </label>
            <div className="space-y-3">
              <input 
                type="file" 
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handleImageUpload}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 file:cursor-pointer cursor-pointer"
                disabled={submitting}
              />
            </div>
            {imagePreview && (
              <div className="mt-3 relative">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-48 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg transition-colors"
                  disabled={submitting}
                  title="Зураг устгах"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Location Details */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Дүүрэг/Сум</label>
              <input 
                type="text" 
                value={formData.area || ''} 
                onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))} 
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                placeholder="Сүхбаатар дүүрэг"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Хот/Аймаг</label>
              <input 
                type="text" 
                value={formData.city || ''} 
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))} 
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                placeholder="Улаанбаатар"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Хороо/Баг</label>
              <input 
                type="text" 
                value={formData.district || ''} 
                onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))} 
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                placeholder="1-р хороо"
                disabled={submitting}
              />
            </div>
          </div>

          {/* Working Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ажлын өдрүүд</label>
              <input 
                type="text" 
                value={formData.open || ''} 
                onChange={(e) => setFormData(prev => ({ ...prev, open: e.target.value }))} 
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                placeholder="Даваа-Баасан"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ажлын цаг</label>
              <input 
                type="text" 
                value={formData.time || ''} 
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))} 
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                placeholder="09:00-18:00"
                disabled={submitting}
              />
            </div>
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Өргөрөг (Latitude)
              </label>
              <input 
                type="number" 
                step="0.0001"
                value={formData.latitude ?? ''} 
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  latitude: e.target.value ? parseFloat(e.target.value) : null 
                }))} 
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                placeholder="47.9184"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Уртраг (Longitude)
              </label>
              <input 
                type="number" 
                step="0.0001"
                value={formData.longitude ?? ''} 
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  longitude: e.target.value ? parseFloat(e.target.value) : null 
                }))} 
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                placeholder="106.9177"
                disabled={submitting}
              />
            </div>
          </div>

          {/* Phone Numbers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Утасны дугаарууд <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {formData.phones.map((phone, index) => (
                <div key={index} className="flex gap-2">
                  <input 
                    type="text" 
                    value={phone} 
                    onChange={(e) => handlePhoneChange(index, e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                    placeholder="70111111"
                    disabled={submitting}
                  />
                  {formData.phones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePhone(index)}
                      className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={submitting}
                    >
                      Устгах
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddPhone}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={submitting}
              >
                + Утас нэмэх
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button 
              type="button" 
              onClick={handleCloseModal} 
              className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              Цуцлах
            </button>
            <button 
              type="submit" 
              className="px-5 py-2.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={submitting}
            >
              {submitting && (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {submitting ? 'Хадгалж байна...' : 'Хадгалах'}
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  )
}