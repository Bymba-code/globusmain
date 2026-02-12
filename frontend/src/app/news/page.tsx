'use client'

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { axiosInstance } from '@/lib/axios'
import { useLanguage } from '@/contexts/LanguageContext'

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
  id: number
  image: string
}

interface ApiSocial {
  id: number
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

interface CategoryTranslation {
  id: number
  language: number
  label: string
}

interface CategoryAPI {
  id: number
  translations: CategoryTranslation[]
}

interface NewsItem {
  id: number
  title: string
  slug: string
  excerpt: string
  bannerImage: string
  category: number
  publishedAt: string
  readTime: number
  isPinnedNews: boolean
}

interface Category {
  id: number
  label: string
}

const getTranslation = (translations: ApiTranslation[], languageId: number): ApiTranslation | undefined => {
  return translations.find(t => t.language === languageId)
}

const getCategoryTranslation = (translations: CategoryTranslation[], languageId: number): CategoryTranslation | undefined => {
  return translations.find(t => t.language === languageId)
}

const mapAPICategoryToCategory = (apiCategory: CategoryAPI, languageId: number): Category => {
  const translation = getCategoryTranslation(apiCategory.translations, languageId)
  
  return {
    id: apiCategory.id,
    label: translation?.label || '',
  }
}

const mapApiNewsToFrontend = (item: ApiNewsItem, languageId: number): NewsItem => {
  const titleTranslation = getTranslation(item.title_translations, languageId)
  const excerptTranslation = getTranslation(item.shortdesc_translations, languageId)

  const imageUrl = item.image_url || item.image || '/placeholder-news.jpg'

  return {
    id: item.id,
    title: titleTranslation?.label || 'Гарчиггүй',
    slug: item.slug || `news-${item.id}`,
    excerpt: excerptTranslation?.label || '',
    bannerImage: imageUrl,
    category: item.category,
    publishedAt: item.date,
    readTime: item.readtime || 5,
    isPinnedNews: item.feature || false,
  }
}

export default function NewsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { language, setLanguage, t } = useLanguage()
  
  const [activeCategory, setActiveCategory] = useState(0)
  const [sortOrder, setSortOrder] = useState("newest")
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [stickyBarShadow, setStickyBarShadow] = useState(false)
  
  // Data states
  const [news, setNews] = useState<NewsItem[]>([])
  const [rawNews, setRawNews] = useState<ApiNewsItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [rawCategories, setRawCategories] = useState<CategoryAPI[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get language ID (1 for Mongolian, 2 for English)
  const languageId = language === 'mn' ? 1 : 2

  // Translations
  const trans = {
    newsTitle: t('Мэдээ', 'News'),
    all: t('Бүгд', 'All'),
    sort: t('Эрэмбэ', 'Sort'),
    newest: t('Шинэ', 'Newest'),
    oldest: t('Хуучин', 'Oldest'),
    sortBy: t('Эрэмбэлэх', 'Sort by'),
    categoryInfo: t('ангилалд', 'in category'),
    newsCount: t('мэдээ байна', 'news found'),
    featured: t('Онцлох мэдээ', 'Featured News'),
    latestNews: t('Сүүлийн мэдээнүүд', 'Latest News'),
    noNews: t('Мэдээ олдсонгүй', 'No news found'),
    noNewsDesc: t('Энэ төрлийн мэдээ одоогоор байхгүй байна.', 'No news available in this category.'),
    backToAll: t('Бүх ангилалд буцах', 'Back to all categories'),
    readTime: t('минут унших', 'min read'),
    errorLoading: t('Мэдээ ачаалахад алдаа гарлаа', 'Failed to load news'),
    errorCategories: t('Ангилал ачаалахад алдаа гарлаа', 'Failed to load categories'),
    tryAgain: t('Дахин оролдох', 'Try again'),
  }

  useEffect(() => {
    fetchCategories()
    fetchNews()
  }, [])

  // Re-map data when language changes
  useEffect(() => {
    if (rawNews.length > 0) {
      const transformedNews = rawNews
        .filter(item => item.render)
        .map(item => mapApiNewsToFrontend(item, languageId))
      setNews(transformedNews)
    }
  }, [language, rawNews])

  useEffect(() => {
    if (rawCategories.length > 0) {
      const transformedCategories = rawCategories.map(cat => mapAPICategoryToCategory(cat, languageId))
      setCategories([
        { id: 0, label: trans.all },
        ...transformedCategories
      ])
    }
  }, [language, rawCategories])

  useEffect(() => {
    const savedPosition = sessionStorage.getItem("newsScrollPosition")
    if (savedPosition) {
      window.scrollTo(0, parseInt(savedPosition))
      sessionStorage.removeItem("newsScrollPosition")
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY)
      setStickyBarShadow(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const sortDiv = document.getElementById("sort-dropdown-container")
      if (sortDiv && !sortDiv.contains(e.target as Node)) {
        setSortDropdownOpen(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSortDropdownOpen(false)
      }
    }

    if (sortDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleKeyDown)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [sortDropdownOpen])

  useEffect(() => {
    const categoryParam = searchParams.get("category")
    if (categoryParam) {
      setActiveCategory(parseInt(categoryParam))
    } else {
      setActiveCategory(0)
    }
  }, [searchParams])

  // Fetch Categories
  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get<CategoryAPI[]>('/news-category/')
      if (response.data && Array.isArray(response.data)) {
        setRawCategories(response.data)
        const transformedCategories = response.data.map(cat => mapAPICategoryToCategory(cat, languageId))
        setCategories([
          { id: 0, label: trans.all },
          ...transformedCategories
        ])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      setError(trans.errorCategories)
    }
  }

  // Fetch News
  const fetchNews = async () => {
    setLoading(true)
    try {
      const response = await axiosInstance.get<ApiNewsItem[]>('/news/')
      if (response.data && Array.isArray(response.data)) {
        setRawNews(response.data)
        const transformedNews = response.data
          .filter(item => item.render)
          .map(item => mapApiNewsToFrontend(item, languageId))
        setNews(transformedNews)
        setError(null)
      } else {
        setNews([])
      }
    } catch (error) {
      console.error('Failed to fetch news:', error)
      setError(trans.errorLoading)
    } finally {
      setLoading(false)
    }
  }

  // Category солихдээ URL-г шинэчлэх
  const handleCategoryChange = (categoryId: number) => {
    sessionStorage.removeItem("newsScrollPosition")
    setActiveCategory(categoryId)
    if (categoryId === 0) {
      router.push("/news")
    } else {
      router.push(`/news?category=${categoryId}`)
    }
  }

  // Sort and filter news
  const sortedNews = [...news].sort((a, b) => {
    if (a.isPinnedNews === b.isPinnedNews) {
      if (sortOrder === "a-z") {
        return a.title.localeCompare(b.title, language)
      } else if (sortOrder === "z-a") {
        return b.title.localeCompare(a.title, language)
      } else {
        const timeA = new Date(a.publishedAt).getTime()
        const timeB = new Date(b.publishedAt).getTime()
        return sortOrder === "newest" ? timeB - timeA : timeA - timeB
      }
    }
    return a.isPinnedNews ? -1 : 1
  })

  const filteredNews = sortedNews.filter((item) => {
    if (activeCategory === 0) return true
    return item.category === activeCategory
  })

  // Pinned news (max 3)
  const pinnedNews = filteredNews.filter((item) => item.isPinnedNews).slice(0, 3)
  // Regular news
  const gridItems = filteredNews.filter((item) => !item.isPinnedNews)

  return (
    <main className="min-h-screen bg-white">
      <div className="flex flex-col px-5 sm:px-20 lg:max-w-[1280px] lg:mx-auto">
        
        {/* Header with Language Switcher */}
        <div className="flex items-center justify-between pt-8 sm:pt-12 mb-6 sm:mb-9 lg:mb-16">
          <div className="flex-1"></div>
          <p className="text-gray-900 font-bold text-center text-2xl sm:text-3xl flex-1">
            {trans.newsTitle}
          </p>
          <div className="flex-1 flex justify-end">
            <div className="bg-gray-100 rounded-lg p-1.5 border border-gray-300 shadow-sm">
              <div className="flex gap-1">
                <button
                  onClick={() => setLanguage('mn')}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                    language === 'mn'
                      ? 'bg-gray-900 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                  }`}
                >
                  🇲🇳 MN
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                    language === 'en'
                      ? 'bg-gray-900 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                  }`}
                >
                  🇺🇸 EN
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
            <button 
              onClick={() => {
                fetchNews()
                fetchCategories()
              }}
              className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              {trans.tryAgain}
            </button>
          </div>
        )}

        {/* Category Tabs and Sort */}
        <div className="flex flex-col gap-4 mb-10 sm:mb-16">
          {/* Category Tabs and Sort Controls - Sticky */}
          <div className={`sticky top-0 z-40 bg-white -mx-5 sm:-mx-20 px-5 sm:px-20 pt-4 pb-4 transition-shadow duration-300 ${stickyBarShadow ? 'shadow-md border-b border-gray-100' : 'border-b border-gray-200'}`}>
            <div className="lg:max-w-[1280px] lg:mx-auto">
              <div className="flex gap-3 items-center justify-between flex-wrap lg:flex-nowrap">
                {/* Category Tabs */}
                <div className="flex gap-3 items-center overflow-x-scroll lg:overflow-x-auto flex-1">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryChange(cat.id)}
                      aria-pressed={activeCategory === cat.id}
                      className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
                        activeCategory === cat.id
                          ? "bg-teal-600 text-white shadow-md transform scale-105"
                          : "text-gray-500 hover:text-teal-600 hover:bg-teal-50"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Sort Dropdown */}
                <div className="relative" id="sort-dropdown-container">
                  <button
                    onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                    aria-label={`${trans.sortBy}: ${sortOrder === "newest" ? trans.newest : sortOrder === "oldest" ? trans.oldest : sortOrder === "a-z" ? "A–Z" : "Z–A"}`}
                    aria-expanded={sortDropdownOpen}
                    aria-haspopup="menu"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-300 flex items-center gap-2 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                    <span>
                      {trans.sort}: <span className="font-semibold">
                        {sortOrder === "newest" ? trans.newest : sortOrder === "oldest" ? trans.oldest : sortOrder === "a-z" ? "A–Z" : "Z–A"}
                      </span>
                    </span>
                    <svg className={`w-4 h-4 transition-transform duration-300 ${sortDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {sortDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10" role="menu">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{trans.sortBy}</p>
                      </div>
                      <button
                        onClick={() => {
                          setSortOrder("newest")
                          setSortDropdownOpen(false)
                        }}
                        role="menuitem"
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-300 flex items-center gap-2 focus:outline-none focus:bg-teal-50 ${
                          sortOrder === "newest"
                            ? "bg-teal-50 text-teal-700 font-medium"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {sortOrder === "newest" && <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                        {trans.newest}
                      </button>
                      <button
                        onClick={() => {
                          setSortOrder("oldest")
                          setSortDropdownOpen(false)
                        }}
                        role="menuitem"
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-300 flex items-center gap-2 focus:outline-none focus:bg-teal-50 ${
                          sortOrder === "oldest"
                            ? "bg-teal-50 text-teal-700 font-medium"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {sortOrder === "oldest" && <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                        {trans.oldest}
                      </button>
                      <button
                        onClick={() => {
                          setSortOrder("a-z")
                          setSortDropdownOpen(false)
                        }}
                        role="menuitem"
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-300 flex items-center gap-2 focus:outline-none focus:bg-teal-50 ${
                          sortOrder === "a-z"
                            ? "bg-teal-50 text-teal-700 font-medium"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {sortOrder === "a-z" && <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                        A–Z
                      </button>
                      <button
                        onClick={() => {
                          setSortOrder("z-a")
                          setSortDropdownOpen(false)
                        }}
                        role="menuitem"
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-300 flex items-center gap-2 focus:outline-none focus:bg-teal-50 ${
                          sortOrder === "z-a"
                            ? "bg-teal-50 text-teal-700 font-medium"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {sortOrder === "z-a" && <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                        Z–A
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        )}

        {/* News Grid */}
        {!loading && (
          <div className="pb-16">
            {/* Contextual Info */}
            {filteredNews.length > 0 && (
              <div className="mb-8 text-xs text-gray-500 tracking-wide uppercase">
                <p>
                  <span className="font-semibold text-gray-600">{categories.find(c => c.id === activeCategory)?.label}</span> {trans.categoryInfo} <span className="font-semibold text-gray-600">{filteredNews.length}</span> {trans.newsCount}
                </p>
              </div>
            )}

            {/* Featured/Pinned News Section */}
            {pinnedNews.length > 0 && (
              <div className="mb-10 sm:mb-16 bg-gray-50 rounded-2xl p-6 sm:p-8">
                <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                  </svg>
                  {trans.featured}
                </h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* First pinned news - Large card */}
                  {pinnedNews[0] && (
                    <Link
                      href={`/news/${pinnedNews[0].slug}`}
                      className="group bg-white cursor-pointer rounded-2xl sm:rounded-[20px] lg:rounded-l-[28px] flex flex-col min-h-[420px] sm:col-span-2 lg:flex-row hover:shadow-lg transition-all border border-gray-200"
                    >
                      <div className="relative rounded-t-2xl sm:rounded-t-[20px] lg:rounded-t-none lg:rounded-l-[28px] overflow-hidden h-[200px] sm:h-[300px] lg:h-auto lg:w-2/3 bg-gray-200">
                        <Image
                          src={pinnedNews[0].bannerImage}
                          alt={pinnedNews[0].title}
                          fill
                          unoptimized
                          className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/placeholder-news.jpg'
                          }}
                        />
                      </div>

                      <div className="flex flex-col justify-between flex-1 p-5 lg:p-8 lg:w-1/3">
                        <div className="flex flex-col gap-2 sm:gap-4">
                          <div className="flex items-center gap-2">
                            <span className="inline-block px-2.5 py-1 bg-teal-100 text-teal-700 text-xs font-semibold rounded-full">
                              {categories.find(c => c.id === pinnedNews[0].category)?.label || trans.newsTitle}
                            </span>
                          </div>
                          <p className="text-gray-900 text-xl font-bold leading-8 max-h-[128px] overflow-y-hidden text-ellipsis sm:text-2xl sm:leading-10 lg:text-2xl lg:leading-10 lg:max-h-[250px]">
                            {pinnedNews[0].title}
                          </p>
                        </div>
                        <p className="text-xs text-gray-400 mt-4">
                          {new Date(pinnedNews[0].publishedAt).toLocaleDateString(language === 'mn' ? 'mn-MN' : 'en-US')} • {pinnedNews[0].readTime} {trans.readTime}
                        </p>
                      </div>
                    </Link>
                  )}

                  {/* Other pinned news */}
                  {pinnedNews.slice(1, 3).map((item) => (
                    <Link
                      key={item.id}
                      href={`/news/${item.slug}`}
                      className="group bg-white cursor-pointer rounded-2xl sm:rounded-[20px] lg:rounded-l-[28px] flex flex-col min-h-[420px] hover:shadow-lg transition-all border border-gray-200"
                    >
                      <div className="relative rounded-t-2xl sm:rounded-t-[20px] lg:rounded-t-[28px] overflow-hidden h-[200px] sm:h-[250px] bg-gray-200">
                        <Image
                          src={item.bannerImage}
                          alt={item.title}
                          fill
                          unoptimized
                          className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/placeholder-news.jpg'
                          }}
                        />
                      </div>

                      <div className="flex flex-col justify-between flex-1 p-5 lg:p-8">
                        <div className="flex flex-col gap-2 sm:gap-4">
                          <div className="flex items-center gap-2">
                            <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                              {categories.find(c => c.id === item.category)?.label || trans.newsTitle}
                            </span>
                          </div>
                          <p className="text-gray-900 text-xl font-bold leading-8 max-h-[128px] overflow-y-hidden text-ellipsis lg:text-2xl lg:leading-10">
                            {item.title}
                          </p>
                        </div>
                        <p className="text-xs text-gray-400 mt-4">
                          {new Date(item.publishedAt).toLocaleDateString(language === 'mn' ? 'mn-MN' : 'en-US')} • {item.readTime} {trans.readTime}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Regular News Section */}
            {gridItems.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">{trans.latestNews}</h3>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {gridItems.map((item) => (
                    <Link
                      key={item.id}
                      href={`/news/${item.slug}`}
                      className="group bg-white cursor-pointer rounded-2xl sm:rounded-[20px] lg:rounded-l-[28px] flex flex-col min-h-[420px] hover:shadow-lg transition-all border border-gray-200 hover:translate-y-[-2px]"
                    >
                      <div className="relative rounded-t-2xl sm:rounded-t-[20px] lg:rounded-t-[28px] overflow-hidden h-[200px] sm:h-[250px] bg-gray-200">
                        <Image
                          src={item.bannerImage}
                          alt={item.title}
                          fill
                          unoptimized
                          className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/placeholder-news.jpg'
                          }}
                        />
                      </div>

                      <div className="flex flex-col justify-between flex-1 p-5 lg:p-8">
                        <div className="flex flex-col gap-2 sm:gap-4">
                          <div className="flex items-center gap-2">
                            <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                              {categories.find(c => c.id === item.category)?.label || trans.newsTitle}
                            </span>
                          </div>
                          <p className="text-gray-900 text-xl font-bold leading-8 max-h-[128px] overflow-y-hidden text-ellipsis lg:text-2xl lg:leading-10 group-hover:underline group-hover:decoration-teal-300 decoration-1 underline-offset-2 transition-all">
                            {item.title}
                          </p>
                        </div>
                        <p className="text-xs text-gray-400 mt-4">
                          {new Date(item.publishedAt).toLocaleDateString(language === 'mn' ? 'mn-MN' : 'en-US')} • {item.readTime} {trans.readTime}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {filteredNews.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">{trans.noNews}</h3>
                <p className="text-gray-500 mb-6">{trans.noNewsDesc}</p>
                <div className="flex flex-col gap-2 items-center justify-center">
                  {activeCategory !== 0 && (
                    <button
                      onClick={() => handleCategoryChange(0)}
                      className="px-4 py-2 text-sm text-teal-600 font-medium hover:text-teal-700 transition-all duration-300"
                    >
                      ← {trans.backToAll}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}