'use client'
import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import Modal from '@/components/Modal'
import ImageUpload from '@/components/ImageUpload'
import { Input, Textarea, Select, Button } from '@/components/FormElements'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import { axiosInstance } from '@/lib/axios'

interface ApiTranslation {
  id?: number
  language: number
  label: string
  font: string
  family: string
  weight: string
  size: string
}

interface ApiImage {
  id?: number
  image: string
}

interface ApiSocial {
  id?: number
  social: string
  icon: string
}

interface ApiNewsItem {
  id: number
  category: number
  image: string
  image_url?: string
  video: string
  feature: boolean
  render: boolean
  readtime: number
  slug: string
  date: string
  images: ApiImage[]
  socials: ApiSocial[]
  title_translations: ApiTranslation[]
  shortdesc_translations: ApiTranslation[]
  content_translations: ApiTranslation[]
}

// ===== CATEGORY INTERFACES =====
interface CategoryTranslation {
  id: number
  language: number
  label: string
}

interface CategoryAPI {
  id: number
  translations: CategoryTranslation[]
}

interface Category {
  id: number
  label_mn: string
  label_en: string
}

// ===== FRONTEND INTERFACES =====
interface NewsItem {
  id: string
  title_mn: string
  title_en: string
  slug: string
  excerpt_mn: string
  excerpt_en: string
  content_mn: string
  content_en: string
  titleTextColor: string
  titleTextSize: number
  titleFontWeight: string
  titleFontFamily: string
  excerptTextColor: string
  excerptTextSize: number
  excerptFontWeight: string
  excerptFontFamily: string
  contentTextColor: string
  contentTextSize: number
  contentFontWeight: string
  contentFontFamily: string
  bannerImage: string
  category: number
  publishedAt: string
  readTime: number
  isActive: boolean
  isPinnedNews: boolean
  socialLinks: SocialLink[]
  additionalImages?: string[]
  videoUrl?: string
}

interface SocialLink {
  id: string
  platform: string
  url: string
  active: boolean
  icon: string
}

const getSocialIcon = (platform: string) => {
  const map: Record<string, string> = {
    facebook: '👍',
    instagram: '📸',
    twitter: '✖',
    x: '✖',
    youtube: '▶',
    linkedin: '💼',
    custom: '🔗',
  }
  return map[platform.toLowerCase()] || '🔗'
}

const getTranslation = (translations: ApiTranslation[], language: number): ApiTranslation | undefined => {
  return translations.find(t => t.language === language)
}

const getCategoryTranslation = (translations: CategoryTranslation[], language: number): CategoryTranslation | undefined => {
  return translations.find(t => t.language === language)
}

const mapAPICategoryToCategory = (apiCategory: CategoryAPI): Category => {
  const labelMn = getCategoryTranslation(apiCategory.translations, 1)
  const labelEn = getCategoryTranslation(apiCategory.translations, 2)
  
  return {
    id: apiCategory.id,
    label_mn: labelMn?.label || '',
    label_en: labelEn?.label || '',
  }
}

const mapApiNewsToAdmin = (item: ApiNewsItem): NewsItem => {
  const titleMn = getTranslation(item.title_translations, 1)
  const titleEn = getTranslation(item.title_translations, 2)
  const excerptMn = getTranslation(item.shortdesc_translations, 1)
  const excerptEn = getTranslation(item.shortdesc_translations, 2)
  const contentMn = getTranslation(item.content_translations, 1)
  const contentEn = getTranslation(item.content_translations, 2)

  return {
    id: String(item.id),
    title_mn: titleMn?.label || '',
    title_en: titleEn?.label || '',
    slug: item.slug,
    excerpt_mn: excerptMn?.label || '',
    excerpt_en: excerptEn?.label || '',
    content_mn: contentMn?.label || '',
    content_en: contentEn?.label || '',
    titleTextColor: titleMn?.font || '#0f172a',
    titleTextSize: parseInt(titleMn?.size || '32'),
    titleFontWeight: titleMn?.weight || '700',
    titleFontFamily: titleMn?.family || 'Roboto',
    excerptTextColor: excerptMn?.font || '#0f172a',
    excerptTextSize: parseInt(excerptMn?.size || '16'),
    excerptFontWeight: excerptMn?.weight || '400',
    excerptFontFamily: excerptMn?.family || 'Roboto',
    contentTextColor: contentMn?.font || '#0f172a',
    contentTextSize: parseInt(contentMn?.size || '14'),
    contentFontWeight: contentMn?.weight || '400',
    contentFontFamily: contentMn?.family || 'Roboto',
    bannerImage: item.image_url || item.image,
    category: item.category,
    publishedAt: item.date,
    readTime: item.readtime,
    isActive: item.render,
    isPinnedNews: item.feature,
    socialLinks: item.socials.map((s, idx) => ({
      id: `${s.icon}-${idx}`,
      platform: s.icon,
      url: s.social,
      active: true,
      icon: getSocialIcon(s.icon),
    })),
    additionalImages: item.images.map(img => img.image),
    videoUrl: item.video,
  }
}

const urlToFile = async (url: string, filename: string): Promise<File | null> => {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return new File([blob], filename, { type: blob.type })
  } catch (error) {
    console.error('Error converting URL to file:', error)
    return null
  }
}

const initialFormData = {
  title_mn: '',
  title_en: '',
  slug: '',
  excerpt_mn: '',
  excerpt_en: '',
  content_mn: '',
  content_en: '',
  titleTextColor: '#0f172a',
  titleTextSize: 32,
  titleFontWeight: '700',
  titleFontFamily: 'Roboto',
  excerptTextColor: '#0f172a',
  excerptTextSize: 16,
  excerptFontWeight: '400',
  excerptFontFamily: 'Roboto',
  contentTextColor: '#0f172a',
  contentTextSize: 14,
  contentFontWeight: '400',
  contentFontFamily: 'Roboto',
  bannerImage: '',
  category: 1,
  readTime: 5,
  isActive: true,
  isPinnedNews: false,
  socialLinks: [] as SocialLink[],
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [activeCategory, setActiveCategory] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null)
  const [formData, setFormData] = useState(initialFormData)
  const [categoryTabs, setCategoryTabs] = useState<Category[]>([])
  const [categoryTabsBackup, setCategoryTabsBackup] = useState<Category[] | null>(null)
  const [newCategoryNameMn, setNewCategoryNameMn] = useState('')
  const [newCategoryNameEn, setNewCategoryNameEn] = useState('')
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [additionalImages, setAdditionalImages] = useState<string[]>([])
  const [videoUrl, setVideoUrl] = useState('')
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null)

  useEffect(() => {
    fetchNews()
    fetchCategories()
  }, [])

  useEffect(() => {
    if (!editingNews && formData.title_en) {
      const autoSlug = formData.title_en
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
      
      if (autoSlug && autoSlug !== formData.slug) {
        setFormData(prev => ({ ...prev, slug: autoSlug }))
      }
    }
  }, [formData.title_en, editingNews, formData.slug])

  const canAddCategory = newCategoryNameMn.trim().length > 0 && newCategoryNameEn.trim().length > 0

  const filteredNews = activeCategory === 0
    ? news
    : news.filter(item => item.category === activeCategory)

  const sortedNews = [...filteredNews].sort((a, b) => {
    const aPinned = a.isPinnedNews
    const bPinned = b.isPinnedNews
    if (aPinned === bPinned) {
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    }
    return aPinned ? -1 : 1
  })

  const toEmbedUrl = (url: string) => {
    if (!url) return ''
    try {
      const u = new URL(url)
      if (u.hostname.includes('youtube.com')) {
        const vid = u.searchParams.get('v')
        return vid ? `https://www.youtube.com/embed/${vid}` : ''
      }
      if (u.hostname === 'youtu.be') {
        const vid = u.pathname.replace('/', '')
        return vid ? `https://www.youtube.com/embed/${vid}` : ''
      }
      return ''
    } catch {
      return ''
    }
  }

  const PinBadge = () => (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-black text-white shadow-sm" aria-label="Pinned">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 6.75h9m-7.5 0 1.5 4.5v4.5l3-2.25v-2.25l1.5-4.5m-6 0h6" />
      </svg>
    </span>
  )

  const derivePlatformFromUrl = (url: string) => {
    try {
      const host = new URL(url).hostname
      if (host.includes('facebook')) return 'facebook'
      if (host.includes('instagram')) return 'instagram'
      if (host.includes('twitter') || host === 'x.com' || host.endsWith('.x.com')) return 'twitter'
      if (host.includes('youtube')) return 'youtube'
      if (host.includes('linkedin')) return 'linkedin'
      return host.replace(/^www\./, '') || 'link'
    } catch {
      return 'link'
    }
  }

  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {}
    if (!formData.title_mn.trim()) errors.title_mn = 'Монгол гарчиг оруулна уу'
    if (!formData.title_en.trim()) errors.title_en = 'Англи гарчиг оруулна уу'
    if (!formData.excerpt_mn.trim()) errors.excerpt_mn = 'Монгол товч тайлбар оруулна уу'
    if (!formData.excerpt_en.trim()) errors.excerpt_en = 'Англи товч тайлбар оруулна уу'
    if (!formData.content_mn.trim()) errors.content_mn = 'Монгол агуулга оруулна уу'
    if (!formData.content_en.trim()) errors.content_en = 'Англи агуулга оруулна уу'
    if (!formData.bannerImage && !bannerImageFile) errors.bannerImage = 'Үндсэн зураг заавал оруулна уу'

    const invalidLinks = (formData.socialLinks || []).filter((link) => {
      try { new URL(link.url); return false } catch { return true }
    })
    if (invalidLinks.length > 0) errors.socialLinks = 'Сошиал холбооснуудын URL буруу байна'
    if (videoUrl && !toEmbedUrl(videoUrl)) errors.video = 'YouTube видеоны URL буруу байна'

    if (formData.isPinnedNews && !editingNews) {
      const pinnedInCategory = news.filter(item => item.isPinnedNews && item.category === formData.category).length
      if (pinnedInCategory >= 1) errors.pinnedNews = `Энэ ангилалд аль хэдийн онцлох мэдээ байгаа`
    }
    if (editingNews && formData.isPinnedNews) {
      const pinnedInCategory = news.filter(item => item.isPinnedNews && item.category === formData.category && item.id !== editingNews.id).length
      if (pinnedInCategory >= 1) errors.pinnedNews = `Энэ ангилалд аль хэдийн онцлох мэдээ байгаа`
    }

    setFormErrors(errors)
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      const errorList = Object.values(errors).filter(Boolean)
      setErrorMessage(errorList.length > 0 ? errorList[0] : 'Маягтыг шалгаж дахин оруулна уу')
      return
    }

    setIsSaving(true)
    try {
      const formDataToSend = new FormData()

      formDataToSend.append('category', formData.category.toString())
      formDataToSend.append('video', videoUrl || '')
      formDataToSend.append('feature', formData.isPinnedNews.toString())
      formDataToSend.append('render', formData.isActive.toString())
      formDataToSend.append('readtime', formData.readTime.toString())
      formDataToSend.append('slug', formData.slug || '')
      formDataToSend.append('date', new Date().toISOString())

      if (bannerImageFile) {
        formDataToSend.append('image', bannerImageFile)
      }

      // Add nested data as JSON strings
      formDataToSend.append('images', JSON.stringify(
        additionalImages.map(img => ({ image: img }))
      ))

      formDataToSend.append('socials', JSON.stringify(
        (formData.socialLinks || []).map((link: SocialLink) => ({
          social: link.url,
          icon: link.platform,
        }))
      ))

      formDataToSend.append('title_translations', JSON.stringify([
        {
          language: 1,
          label: formData.title_mn,
          font: formData.titleTextColor,
          family: formData.titleFontFamily,
          weight: formData.titleFontWeight,
          size: formData.titleTextSize.toString(),
        },
        {
          language: 2,
          label: formData.title_en,
          font: formData.titleTextColor,
          family: formData.titleFontFamily,
          weight: formData.titleFontWeight,
          size: formData.titleTextSize.toString(),
        },
      ]))

      formDataToSend.append('shortdesc_translations', JSON.stringify([
        {
          language: 1,
          label: formData.excerpt_mn,
          font: formData.excerptTextColor,
          family: formData.excerptFontFamily,
          weight: formData.excerptFontWeight,
          size: formData.excerptTextSize.toString(),
        },
        {
          language: 2,
          label: formData.excerpt_en,
          font: formData.excerptTextColor,
          family: formData.excerptFontFamily,
          weight: formData.excerptFontWeight,
          size: formData.excerptTextSize.toString(),
        },
      ]))

      formDataToSend.append('content_translations', JSON.stringify([
        {
          language: 1,
          label: formData.content_mn,
          font: formData.contentTextColor,
          family: formData.contentFontFamily,
          weight: formData.contentFontWeight,
          size: formData.contentTextSize.toString(),
        },
        {
          language: 2,
          label: formData.content_en,
          font: formData.contentTextColor,
          family: formData.contentFontFamily,
          weight: formData.contentFontWeight,
          size: formData.contentTextSize.toString(),
        },
      ]))

      if (editingNews) {
        await axiosInstance.put(`/news/${editingNews.id}/`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        setSuccessMessage('Мэдээ амжилттай шинэчлэгдлээ')
      } else {
        await axiosInstance.post('/news/', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        setSuccessMessage('Шинэ мэдээ амжилттай нэмэгдлээ')
      }
      
      await fetchNews()
      setTimeout(() => { handleCloseModal(); setSuccessMessage('') }, 1500)
    } catch (error: any) {
      console.log(error?.response)
      console.error('Submit error:', error)
      let errorMsg = editingNews ? 'Шинэчлэхэд алдаа гарлаа' : 'Үүсгэхэд алдаа гарлаа'
      
      if (error.response?.data) {
        const errorData = error.response.data
        if (errorData.feature) errorMsg = Array.isArray(errorData.feature) ? errorData.feature[0] : errorData.feature
        else if (errorData.slug) errorMsg = 'Slug давхцаж байна. Өөр нэр сонгоно уу.'
        else if (errorData.detail) errorMsg = errorData.detail
        else if (errorData.non_field_errors) errorMsg = Array.isArray(errorData.non_field_errors) ? errorData.non_field_errors[0] : errorData.non_field_errors
      }
      
      setErrorMessage(errorMsg)
      setTimeout(() => setErrorMessage(''), 4000)
    } finally {
      setIsSaving(false)
    }
  }

  const fetchNews = async () => {
    try {
      const response = await axiosInstance.get('/news/')
      const data: ApiNewsItem[] = response.data
      setNews(data.map(mapApiNewsToAdmin))
    } catch (error) {
      console.error('Failed to fetch news:', error)
      setErrorMessage('Мэдээг ачаалахад алдаа гарлаа')
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get<CategoryAPI[]>('/news-category/')
      const transformedCategories = response.data.map(mapAPICategoryToCategory)
      setCategoryTabs(transformedCategories)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const handleEdit = (item: NewsItem) => {
    setEditingNews(item)
    setFormData({
      title_mn: item.title_mn,
      title_en: item.title_en,
      slug: item.slug,
      excerpt_mn: item.excerpt_mn,
      excerpt_en: item.excerpt_en,
      content_mn: item.content_mn,
      content_en: item.content_en,
      titleTextColor: item.titleTextColor || '#0f172a',
      titleTextSize: item.titleTextSize || 32,
      titleFontWeight: item.titleFontWeight || '700',
      titleFontFamily: item.titleFontFamily || 'Roboto',
      excerptTextColor: item.excerptTextColor || '#0f172a',
      excerptTextSize: item.excerptTextSize || 16,
      excerptFontWeight: item.excerptFontWeight || '400',
      excerptFontFamily: item.excerptFontFamily || 'Roboto',
      contentTextColor: item.contentTextColor || '#0f172a',
      contentTextSize: item.contentTextSize || 14,
      contentFontWeight: item.contentFontWeight || '400',
      contentFontFamily: item.contentFontFamily || 'Roboto',
      bannerImage: item.bannerImage,
      category: item.category,
      readTime: item.readTime || 5,
      isActive: item.isActive,
      isPinnedNews: item.isPinnedNews,
      socialLinks: item.socialLinks || [],
    })
    setAdditionalImages(item.additionalImages || [])
    setVideoUrl(item.videoUrl || '')
    setBannerImageFile(null)
    setModalOpen(true)
  }

  const handleDelete = async (item: NewsItem) => {
    if (confirm('Энэ мэдээг устгахыг сайн дүгнэлээ?')) {
      setIsDeleting(item.id)
      try {
        await axiosInstance.delete(`/news/${item.id}/`)
        setNews(news.filter(n => n.id !== item.id))
        setSuccessMessage('Мэдээ амжилттай устгалаа')
        setTimeout(() => setSuccessMessage(''), 3000)
      } catch (error) {
        console.error(error)
        setErrorMessage('Устгахад алдаа гарлаа')
        setTimeout(() => setErrorMessage(''), 3000)
      } finally {
        setIsDeleting(null)
      }
    }
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingNews(null)
    setFormData(initialFormData)
    setFormErrors({})
    setErrorMessage('')
    setSuccessMessage('')
    setAdditionalImages([])
    setVideoUrl('')
    setBannerImageFile(null)
  }

  const handleBannerImageChange = (url: string) => {
    setFormData({ ...formData, bannerImage: url })
    if (formErrors.bannerImage) setFormErrors({ ...formErrors, bannerImage: '' })
    
    // Convert URL to File for upload
    urlToFile(url, 'banner.jpg').then(file => {
      if (file) setBannerImageFile(file)
    })
  }

  const handleAddCategory = async () => {
    if (!newCategoryNameMn.trim() || !newCategoryNameEn.trim()) {
      alert('Ангиллын нэрийг Монгол болон Англиар оруулна уу!')
      return
    }

    try {
      const response = await axiosInstance.post('/news-category/', {
        translations: [
          { language: 1, label: newCategoryNameMn.trim() },
          { language: 2, label: newCategoryNameEn.trim() },
        ],
      })

      const newCategoryData: CategoryAPI = response.data
      const newCategory = mapAPICategoryToCategory(newCategoryData)

      setCategoryTabs([...categoryTabs, newCategory])
      setNewCategoryNameMn('')
      setNewCategoryNameEn('')
      setShowAddCategory(false)
      setSuccessMessage('Ангилал амжилттай үүсгэлээ')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Failed to add category:', error)
      setErrorMessage('Ангилал үүсгэхэд алдаа гарлаа')
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Энэ ангиллыг устгахыг сайн дүгнэлээ?')) return

    try {
      await axiosInstance.delete(`/news-category/${id}/`)
      setCategoryTabs(categoryTabs.filter((cat) => cat.id !== id))
      setSuccessMessage('Ангилал амжилттай устгалаа')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error: any) {
      console.error('Failed to delete category:', error)
      const errorMsg = error.response?.data?.detail || 'Ангилал устгахад алдаа гарлаа'
      alert(errorMsg)
      setErrorMessage(errorMsg)
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  const handleAddSocialLink = () => {
    const newSocialUrl = (document.getElementById('new-social-url') as HTMLInputElement)?.value || ''
    
    if (!newSocialUrl.trim()) {
      alert('URL оруулна уу')
      return
    }

    const newLink: SocialLink = {
      id: `${Date.now()}`,
      platform: derivePlatformFromUrl(newSocialUrl.trim()),
      url: newSocialUrl.trim(),
      active: true,
      icon: getSocialIcon(derivePlatformFromUrl(newSocialUrl.trim())),
    }

    setFormData({
      ...formData,
      socialLinks: [...(formData.socialLinks || []), newLink],
    })
    
    const input = document.getElementById('new-social-url') as HTMLInputElement
    if (input) input.value = ''
  }

  const handleToggleSocialLink = (id: string) => {
    setFormData({
      ...formData,
      socialLinks: (formData.socialLinks || []).map((link) =>
        link.id === id ? { ...link, active: !link.active } : link
      ),
    })
  }

  const handleDeleteSocialLink = (id: string) => {
    setFormData({
      ...formData,
      socialLinks: (formData.socialLinks || []).filter((link) => link.id !== id),
    })
  }

  const renderSocialIcon = (icon?: string, platform?: string) => {
    const content = icon?.trim()
    if (content && content.startsWith('<svg')) {
      return <span className="inline-flex w-4 h-4 items-center justify-center" aria-hidden dangerouslySetInnerHTML={{ __html: content }} />
    }
    return <span className="text-base leading-none">{content || getSocialIcon(platform || '')}</span>
  }

  return (
    <AdminLayout title="Мэдээ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error/Success Messages */}
        {errorMessage && (
          <div className="fixed top-4 right-4 z-50 animate-fade-in">
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 shadow-lg flex items-start gap-3 max-w-sm">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="font-medium text-red-900">Алдаа</h3>
                <p className="text-sm text-red-800 mt-0.5">{errorMessage}</p>
              </div>
              <button onClick={() => setErrorMessage('')} className="flex-shrink-0 text-red-400 hover:text-red-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="fixed top-4 right-4 z-50 animate-fade-in">
            <div className="p-4 rounded-lg bg-green-50 border border-green-200 shadow-lg flex items-start gap-3 max-w-sm">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="font-medium text-green-900">Амжилттай</h3>
                <p className="text-sm text-green-800 mt-0.5">{successMessage}</p>
              </div>
              <button onClick={() => setSuccessMessage('')} className="flex-shrink-0 text-green-400 hover:text-green-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Мэдээ мэдээлэл</h1>
            <p className="text-sm text-gray-500 mt-1">Компанийн мэдээ, мэдээлэл удирдах</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors shadow-sm"
          >
            <PlusIcon className="h-5 w-5" />
            Шинэ мэдээ
          </button>
        </div>

        {/* Category Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setActiveCategory(0)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === 0 ? 'bg-teal-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Бүгд
            </button>
            
            {categoryTabs.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeCategory === cat.id ? 'bg-teal-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat.label_mn}
              </button>
            ))}
            <button
              onClick={() => setShowAddCategory(!showAddCategory)}
              className="px-5 py-2.5 rounded-full text-sm font-medium bg-teal-600 text-white transition-all duration-300 flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Шинэ ангилал
            </button>
          </div>

          {/* Category Management Panel */}
          {showAddCategory && (
            <div className="mb-4 rounded-lg border border-gray-200 bg-white shadow-sm p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                <PlusIcon className="h-4 w-4 text-gray-500" />
                Шинэ ангилал нэмэх
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  type="text"
                  value={newCategoryNameMn}
                  onChange={(e) => setNewCategoryNameMn(e.target.value)}
                  placeholder="Нэр (MN)"
                  maxLength={50}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  autoFocus
                />
                <input
                  type="text"
                  value={newCategoryNameEn}
                  onChange={(e) => setNewCategoryNameEn(e.target.value)}
                  placeholder="Name (EN)"
                  maxLength={50}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddCategory}
                  disabled={!canAddCategory}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg transition-colors font-medium shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Нэмэх
                </button>
                <button
                  onClick={() => setShowAddCategory(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Цуцлах
                </button>
              </div>

              {categoryTabs.length > 0 && (
                <div className="pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500 mb-2">Одоо байгаа ангиллууд</div>
                  <div className="space-y-2">
                    {categoryTabs.map((cat) => (
                      <div key={cat.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-gray-900">{cat.label_mn}</div>
                            <div className="text-xs text-gray-600">{cat.label_en}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-2 rounded-lg bg-white text-red-600 border border-red-200 hover:bg-red-50 transition-colors shrink-0"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {sortedNews.map((item) => (
            <div key={item.id} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="relative aspect-4/3 overflow-hidden bg-gray-100">
                {item.bannerImage ? (
                  <Image src={item.bannerImage} alt={item.title_mn} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                {item.isPinnedNews && (
                  <span className="absolute top-2 left-2"><PinBadge /></span>
                )}

                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(item)} disabled={isSaving || isDeleting === item.id} className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                    <PencilIcon className="h-4 w-4 text-gray-700" />
                  </button>
                  <button onClick={() => handleDelete(item)} disabled={isSaving || isDeleting !== null} className="p-2 bg-white rounded-lg shadow-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                    {isDeleting === item.id ? (
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin" />
                    ) : (
                      <TrashIcon className="h-4 w-4 text-red-600" />
                    )}
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="px-2.5 py-1 rounded-lg font-medium bg-teal-600 text-white">
                    {categoryTabs.find((c) => c.id === item.category)?.label_mn || 'Ангилал'}
                  </span>
                  <span className="text-slate-500">{new Date(item.publishedAt).toLocaleDateString('mn-MN')}</span>
                </div>
                <h3 className="font-semibold text-slate-800 line-clamp-2 mb-2">{item.title_mn}</h3>
                <p className="text-xs text-slate-500 line-clamp-2">{item.excerpt_mn}</p>
                {(item.socialLinks && item.socialLinks.length > 0) && (
                  <div className="flex flex-wrap gap-2 mt-3 text-xs text-slate-600">
                    {item.socialLinks.filter((link) => link.active).map((link) => (
                      <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                        {renderSocialIcon(link.icon, link.platform)}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {sortedNews.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-800 mb-1">Мэдээ олдсонгүй</h3>
            <p className="text-slate-500">Энэ төрлийн мэдээ одоогоор байхгүй байна.</p>
          </div>
        )}
      </div>

      {/* Modal - News Form */}
      <Modal isOpen={modalOpen} onClose={handleCloseModal} title={editingNews ? 'Мэдээ засах' : 'Шинэ мэдээ'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-5 pb-4">
          
          {/* Title Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-base font-semibold text-gray-900 mb-4">Гарчиг (Title)</h4>
            <div className="space-y-4">
              <Input 
                label="Гарчиг (Монгол)" 
                value={formData.title_mn} 
                onChange={(e) => { 
                  setFormData({ ...formData, title_mn: e.target.value })
                  if (formErrors.title_mn) setFormErrors({ ...formErrors, title_mn: '' }) 
                }} 
                placeholder="Мэдээний гарчиг" 
                error={formErrors.title_mn} 
                required 
              />
              <Input 
                label="Гарчиг (English)" 
                value={formData.title_en} 
                onChange={(e) => { 
                  setFormData({ ...formData, title_en: e.target.value })
                  if (formErrors.title_en) setFormErrors({ ...formErrors, title_en: '' }) 
                }} 
                placeholder="News title" 
                error={formErrors.title_en} 
                required 
              />
            </div>
          </div>

          {/* Excerpt Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-base font-semibold text-gray-900 mb-4">Товч тайлбар (Summary)</h4>
            <div className="space-y-4">
              <Textarea 
                label="Товч тайлбар (Монгол)" 
                value={formData.excerpt_mn} 
                onChange={(e) => { 
                  setFormData({ ...formData, excerpt_mn: e.target.value })
                  if (formErrors.excerpt_mn) setFormErrors({ ...formErrors, excerpt_mn: '' }) 
                }} 
                error={formErrors.excerpt_mn} 
                rows={2} 
                placeholder="Мэдээний товч тайлбар..." 
              />
              <Textarea 
                label="Товч тайлбар (English)" 
                value={formData.excerpt_en} 
                onChange={(e) => { 
                  setFormData({ ...formData, excerpt_en: e.target.value })
                  if (formErrors.excerpt_en) setFormErrors({ ...formErrors, excerpt_en: '' }) 
                }} 
                error={formErrors.excerpt_en} 
                rows={2} 
                placeholder="Brief description..." 
              />
            </div>
          </div>

          {/* Content Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-base font-semibold text-gray-900 mb-4">Агуулга (Content)</h4>
            <div className="space-y-4">
              <Textarea 
                label="Агуулга (Монгол)" 
                value={formData.content_mn} 
                onChange={(e) => { 
                  setFormData({ ...formData, content_mn: e.target.value })
                  if (formErrors.content_mn) setFormErrors({ ...formErrors, content_mn: '' }) 
                }} 
                error={formErrors.content_mn} 
                rows={8} 
                placeholder="Мэдээний дэлгэрэнгүй агуулга..." 
              />
              <Textarea 
                label="Агуулга (English)" 
                value={formData.content_en} 
                onChange={(e) => { 
                  setFormData({ ...formData, content_en: e.target.value })
                  if (formErrors.content_en) setFormErrors({ ...formErrors, content_en: '' }) 
                }} 
                error={formErrors.content_en} 
                rows={8} 
                placeholder="Detailed content..." 
              />
            </div>
          </div>

          {/* Banner Image */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-base font-semibold text-gray-900 mb-4">Үндсэн зураг (Заавал)</h4>
            <ImageUpload 
              label="Үндсэн зураг нэмэх" 
              value={formData.bannerImage} 
              onChange={handleBannerImageChange}
            />
            {formErrors.bannerImage && (
              <p className="mt-2 text-sm text-red-600">{formErrors.bannerImage}</p>
            )}
          </div>

          {/* Additional Images */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h5 className="text-base font-semibold text-gray-900 mb-4">Нэмэлт зургууд</h5>
            
            <div className="mb-4">
              <ImageUpload 
                label="Зураг нэмэх" 
                value="" 
                onChange={(url) => { 
                  if (url && !additionalImages.includes(url)) 
                    setAdditionalImages([...additionalImages, url]) 
                }} 
              />
            </div>

            {additionalImages.length > 0 && (
              <div className="grid gap-3 grid-cols-3">
                {additionalImages.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <div className="bg-gray-100 rounded-lg aspect-square overflow-hidden flex items-center justify-center border-2 border-gray-300">
                      <img src={img} alt={`Зураг ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute top-2 left-2 bg-gray-900 text-white text-xs font-semibold px-2 py-1 rounded-full">{idx + 1}</div>
                    <button 
                      type="button" 
                      onClick={() => setAdditionalImages(additionalImages.filter((_, i) => i !== idx))} 
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-lg text-xs opacity-0 group-hover:opacity-100"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Video */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h5 className="text-base font-semibold text-gray-900 mb-4">Видео (YouTube)</h5>
            <Input 
              label="YouTube URL" 
              value={videoUrl} 
              onChange={(e) => setVideoUrl(e.target.value)} 
              placeholder="https://www.youtube.com/watch?v=..." 
              error={formErrors.video} 
            />
            {videoUrl && toEmbedUrl(videoUrl) && (
              <div className="mt-4 rounded-lg border border-gray-200 overflow-hidden">
                <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                  <iframe 
                    src={toEmbedUrl(videoUrl)} 
                    title="preview-video" 
                    className="absolute inset-0 w-full h-full" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen 
                  />
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-base font-semibold text-gray-900 mb-4">Сонголт (Settings)</h4>
            <div className="space-y-4">
              <Input 
                label="Slug (URL)" 
                value={formData.slug} 
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })} 
                placeholder="sustainability-report-2024" 
              />
              <Select 
                label="Ангилал" 
                value={formData.category} 
                onChange={(e) => setFormData({ ...formData, category: Number(e.target.value) })} 
                options={categoryTabs.map(cat => ({ value: cat.id, label: cat.label_mn }))} 
              />
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-800">Унших минут</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="range" 
                    min={1} 
                    max={20} 
                    step={1} 
                    value={formData.readTime || 5} 
                    onChange={(e) => setFormData({ ...formData, readTime: Number(e.target.value) })} 
                    className="flex-1" 
                  />
                  <input 
                    type="number" 
                    min={1} 
                    max={20} 
                    value={formData.readTime || 5} 
                    onChange={(e) => setFormData({ ...formData, readTime: Number(e.target.value) || 5 })} 
                    className="w-16 rounded border border-gray-200 px-2 py-2 text-sm" 
                  />
                  <span className="text-sm text-gray-500">мин</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input 
                  id="pin-news" 
                  type="checkbox" 
                  checked={formData.isPinnedNews} 
                  onChange={(e) => { 
                    setFormData({ ...formData, isPinnedNews: e.target.checked })
                    if (formErrors.pinnedNews) setFormErrors({ ...formErrors, pinnedNews: '' }) 
                  }} 
                  className="h-4 w-4 text-teal-600 rounded" 
                />
                <label htmlFor="pin-news" className="text-sm font-semibold text-gray-900">
                  Онцлох (Мэдээ хуудас)
                </label>
              </div>
              {formErrors.pinnedNews && <p className="text-xs text-red-600">{formErrors.pinnedNews}</p>}
            </div>
          </div>

          {/* Social Links */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-base font-semibold text-gray-900 mb-3">Сошиал холбоос</h4>
            <div className="grid gap-3 md:grid-cols-2 items-end">
              <Input 
                id="new-social-url"
                label="URL" 
                placeholder="https://facebook.com/yourpage" 
              />
              <Button 
                type="button" 
                onClick={handleAddSocialLink}
              >
                Холбоос нэмэх
              </Button>
            </div>

            {(formData.socialLinks || []).length > 0 && (
              <div className="mt-4 space-y-2">
                {(formData.socialLinks || []).map((link) => (
                  <div key={link.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <input 
                        type="checkbox" 
                        checked={link.active} 
                        onChange={() => handleToggleSocialLink(link.id)} 
                        className="h-4 w-4" 
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900">{link.platform}</div>
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-xs text-teal-700 hover:underline truncate"
                        >
                          {link.url}
                        </a>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleDeleteSocialLink(link.id)} 
                      className="p-2 rounded-lg bg-white text-red-600 border border-red-200 hover:bg-red-50"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end border-t border-gray-200 pt-4">
            <button 
              type="button" 
              onClick={handleCloseModal} 
              disabled={isSaving} 
              className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Цуцлах
            </button>
            <button 
              type="submit" 
              disabled={isSaving} 
              className="px-6 py-2.5 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Хадгалж байна...
                </>
              ) : (
                editingNews ? 'Шинэчлэх' : 'Нэмэх'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  )
}