  'use client'

  import { useState, useEffect } from "react"
  import { useRouter, useSearchParams } from "next/navigation"
  import Image from "next/image"
  import Link from "next/link"
  import Container from "@/components/Container"

  // Backend category structure
  interface CategoryType {
    id: number
    slug: string
    label: string
  }

  // News Item type definition
  export interface NewsItem {
    id: string
    title: string
    excerpt: string
    content: string
    bannerImage: string
    category: CategoryType
    publishedAt: string
    readTime: number
    isActive: boolean
    isPinnedNews: boolean
    isPinnedHome: boolean
  }

  // Default categories - will be fetched from backend API
  const DEFAULT_CATEGORIES: CategoryType[] = [
    { id: 0, slug: "all", label: "Бүгд" },
    { id: 1, slug: "announcement", label: "Мэдээлэл" },
    { id: 2, slug: "maintenance", label: "Үйлчилгээ" },
    { id: 3, slug: "advice", label: "Зөвлөгөө" },
    { id: 4, slug: "video", label: "Видео бичлэг" },
    { id: 5, slug: "community", label: "Нийгэмд" },
  ]

  export default function NewsPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [news, setNews] = useState<NewsItem[]>([])
    const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeCategory, setActiveCategory] = useState("all")
    const [sortOrder, setSortOrder] = useState("newest")
    const [limit, setLimit] = useState(6)
    const [sortDropdownOpen, setSortDropdownOpen] = useState(false)
    const [scrollPosition, setScrollPosition] = useState(0)
    const [stickyBarShadow, setStickyBarShadow] = useState(false)

    // Fetch categories from backend API
    useEffect(() => {
      const fetchCategories = async () => {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
          const lang = 'mn' // TODO: Get from LanguageContext
          const response = await fetch(`${apiUrl}/api/categories/?lang=${lang}`)
          if (response.ok) {
            const data = await response.json()
            // Add "all" category at the beginning
            const categoriesWithAll = [
              { id: "all", label: "Бүгд" },
              ...data
            ]
            setCategories(categoriesWithAll)
          }
        } catch (err) {
          console.error('Error fetching categories:', err)
          // Use DEFAULT_CATEGORIES if fetch fails
        }
      }
      fetchCategories()
    }, [])

    // Fetch news from backend API
    useEffect(() => {
      const fetchNews = async () => {
        try {
          setLoading(true)
          setError(null)
          const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
          const lang = 'mn' // TODO: Get from LanguageContext or header
          const response = await fetch(`${apiUrl}/api/news/?lang=${lang}`)
          if (!response.ok) {
            throw new Error(`Failed to fetch news: ${response.status}`)
          }
          const data = await response.json()
          setNews(Array.isArray(data) ? data : data.results || [])
        } catch (err) {
          console.error('Error fetching news:', err)
          setError('Мэдээг ачаалахад алдаа гарлаа. Дараа дахин оролдоно уу.')
          setNews([])
        } finally {
          setLoading(false)
        }
      }
      fetchNews()
    }, [])

    // Scroll position memory
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

    // Close dropdown on outside click
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        const sortDiv = document.getElementById("sort-dropdown-container")
        if (sortDiv && !sortDiv.contains(e.target as Node)) {
          setSortDropdownOpen(false)
        }
      }

      // Close dropdown on Esc
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

    // Toggle sort dropdown
    const toggleSort = () => setSortDropdownOpen(v => !v)

    // Handle sort selection
    const handleSortChange = (newSortOrder: string) => {
      setSortOrder(newSortOrder)
      setSortDropdownOpen(false)
    }

    // URL-аас category авах
    useEffect(() => {
      const categoryParam = searchParams.get("category") || "all"
      setActiveCategory(categoryParam)
    }, [searchParams])

    // Category солихдээ URL-г шинэчлэх
    const handleCategoryChange = (categoryId: string) => {
      // Clear scroll memory when changing category (new content context)
      sessionStorage.removeItem("newsScrollPosition")
      setActiveCategory(categoryId)
      if (categoryId === "all") {
        router.push("/news")
      } else {
        router.push(`/news?category=${categoryId}`)
      }
    }

    const sortedNews = [...news].sort((a, b) => {
      if (a.isPinnedNews === b.isPinnedNews) {
        if (sortOrder === "a-z") {
          return a.title.localeCompare(b.title, 'mn')
        } else if (sortOrder === "z-a") {
          return b.title.localeCompare(a.title, 'mn')
        } else {
          const timeA = new Date(a.publishedAt).getTime()
          const timeB = new Date(b.publishedAt).getTime()
          return sortOrder === "newest" ? timeB - timeA : timeA - timeB
        }
      }
      return a.isPinnedNews ? -1 : 1
    })

    const filteredNews = sortedNews.filter((item) => {
      if (activeCategory === "all") return true
      return item.category.slug === activeCategory
    })

    // Pinned news (max 3)
    const pinnedNews = filteredNews.filter((item) => item.isPinnedNews).slice(0, 3)
    // Regular news
    const gridItems = filteredNews.filter((item) => !item.isPinnedNews)

    return (
      <main className="min-h-screen bg-white">
        <div className="flex flex-col px-5 sm:px-20 lg:max-w-[1280px] lg:mx-auto">
          
          {/* Header */}
          <p className="text-gray-900 font-bold text-center text-2xl sm:text-3xl mb-6 sm:mb-9 lg:mb-16 pt-8 sm:pt-12">
            Мэдээ
          </p>

          {/* Category Tabs and Sort */}
          <div className="flex flex-col gap-4 mb-10 sm:mb-16">
            {/* Category Tabs and Sort Controls - Sticky */}
            <div className={`sticky top-0 z-40 bg-white -mx-5 sm:-mx-20 px-5 sm:px-20 transition-all duration-300 ${stickyBarShadow ? 'py-2 shadow-md border-b border-gray-100' : 'py-4 border-b border-gray-200'}`}>
              <div className="lg:max-w-[1280px] lg:mx-auto">
                <div className="flex gap-3 items-center justify-between flex-wrap lg:flex-nowrap">
                  {/* Category Tabs */}
                  <div className="flex items-center flex-1 gap-2 sm:gap-3 flex-nowrap sm:flex-wrap overflow-x-auto sm:overflow-visible">
                    {(categories.length > 0 ? categories : DEFAULT_CATEGORIES).map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleCategoryChange(cat.slug)}
                        className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap ${
                          activeCategory === cat.slug
                            ? "bg-teal-600 text-white"
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
                      onClick={toggleSort}
                      aria-label={`Эрэмбэлэх: ${sortOrder === "newest" ? "Шинэ" : sortOrder === "oldest" ? "Хуучин" : sortOrder === "a-z" ? "A–Z" : "Z–A"}`}
                      aria-expanded={sortDropdownOpen}
                      aria-haspopup="menu"
                      className="flex items-center gap-2 text-sm text-gray-500 hover:text-teal-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 016 0v14a1 1 0 01-6 0V4zM15 4a1 1 0 016 0v14a1 1 0 01-6 0V4z" />
                      </svg>
                      <span className="text-gray-400 text-xs">Эрэмбэ:</span>
                      <span className="font-medium text-gray-700">
                        {sortOrder === "newest" ? "Шинэ" : sortOrder === "oldest" ? "Хуучин" : sortOrder === "a-z" ? "A–Z" : "Z–A"}
                      </span>
                    </button>

                    {/* Dropdown Menu */}
                    {sortDropdownOpen && (
                      <div className={`
                        absolute right-0 mt-2 w-20 bg-white border border-gray-200
                        rounded-lg shadow-lg z-10
                        transition-opacity duration-150 ease-out
                        ${sortDropdownOpen
                          ? "opacity-100 pointer-events-auto"
                          : "opacity-0 pointer-events-none"
                        }
                      `} role="menu">
                        {/* Caret arrow pointing up */}
                        <div className="absolute -top-2 right-4 w-3 h-3 bg-white rotate-45 border-l border-t border-gray-200" />
                        <button
                          onClick={() => handleSortChange("newest")}
                          role="menuitem"
                          className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center gap-2 focus:outline-none active:bg-teal-100 ${
                            sortOrder === "newest"
                              ? "bg-teal-50 text-teal-700 font-medium"
                              : "text-gray-700 hover:bg-teal-50 hover:pl-5"
                          }`}
                        >
                          {sortOrder === "newest" && <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                          Шинэ
                        </button>
                        <button
                          onClick={() => handleSortChange("oldest")}
                          role="menuitem"
                          className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center gap-2 focus:outline-none active:bg-teal-100 ${
                            sortOrder === "oldest"
                              ? "bg-teal-50 text-teal-700 font-medium"
                              : "text-gray-700 hover:bg-teal-50 hover:pl-5"
                          }`}
                        >
                          {sortOrder === "oldest" && <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                          Хуучин
                        </button>
                        <button
                          onClick={() => handleSortChange("a-z")}
                          role="menuitem"
                          className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center gap-2 focus:outline-none active:bg-teal-100 ${
                            sortOrder === "a-z"
                              ? "bg-teal-50 text-teal-700 font-medium"
                              : "text-gray-700 hover:bg-teal-50 hover:pl-5"
                          }`}
                        >
                          {sortOrder === "a-z" && <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                          A–Z
                        </button>
                        <button
                          onClick={() => handleSortChange("z-a")}
                          role="menuitem"
                          className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center gap-2 focus:outline-none active:bg-teal-100 ${
                            sortOrder === "z-a"
                              ? "bg-teal-50 text-teal-700 font-medium"
                              : "text-gray-700 hover:bg-teal-50 hover:pl-5"
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
            <div className="pb-16">
              <div className="flex justify-center items-center py-16">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
                  <p className="text-gray-600 font-medium">Мэдээг ачаалж байна...</p>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="pb-16">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <svg className="w-12 h-12 text-red-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-red-900 mb-1">Алдаа гарлаа</h3>
                <p className="text-red-700 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Дахин оролдох
                </button>
              </div>
            </div>
          )}

          {/* News Grid */}
          {!loading && !error && (
          <div className="pb-16">
            {/* Contextual Info */}
            {filteredNews.length > 0 && (
              <div className="mb-8 text-xs text-gray-500 tracking-wide uppercase">
                <p>
                  <span className="font-semibold text-gray-600">{(categories.length > 0 ? categories : DEFAULT_CATEGORIES).find(c => c.slug === activeCategory)?.label}</span> ангилалд <span className="font-semibold text-gray-600">{filteredNews.length}</span> мэдээ байна
                </p>
              </div>
            )}

            {/* Featured/Pinned News Section - Large Featured Card */}
            {pinnedNews.length > 0 && (
              <div className="mb-10 sm:mb-16 bg-gray-50 rounded-2xl p-6 sm:p-8">
                <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                  </svg>
                  Онцлох мэдээ
                </h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* First pinned news - Large card spanning 2 columns */}
                  {pinnedNews[0] && (
                    <Link
                      href={`/news/${pinnedNews[0].id}`}
                      className="group bg-white cursor-pointer rounded-2xl sm:rounded-[20px] lg:rounded-l-[28px] flex flex-col min-h-[420px] sm:col-span-2 lg:flex-row hover:shadow-lg transition-all border border-gray-200"
                    >
                      {/* Image Container */}
                      <div className="relative rounded-t-2xl sm:rounded-t-[20px] lg:rounded-t-none lg:rounded-l-[28px] overflow-hidden h-[200px] sm:h-[300px] lg:h-auto lg:w-2/3 bg-gray-200">
                        <Image
                          src={pinnedNews[0].bannerImage}
                          alt={pinnedNews[0].title}
                          fill
                          unoptimized
                          className="object-cover object-center group-hover:scale-105 transition-transform duration-500 aspect-video lg:aspect-auto"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex flex-col justify-between flex-1 p-5 lg:p-8 lg:w-1/3">
                        <div className="flex flex-col gap-2 sm:gap-4">
                          <div className="flex items-center gap-2">
                            <span className="inline-block px-2.5 py-1 bg-teal-100 text-teal-700 text-xs font-semibold rounded-full">
                              {pinnedNews[0].category.label}
                            </span>
                          </div>
                          <p className="text-gray-900 text-xl font-bold leading-8 max-h-[128px] overflow-y-hidden text-ellipsis sm:text-2xl sm:leading-10 lg:text-2xl lg:leading-10 lg:max-h-[250px]">
                            {pinnedNews[0].title}
                          </p>
                        </div>
                        <p className="text-xs text-gray-400">{new Date(pinnedNews[0].publishedAt).toLocaleDateString()} • {pinnedNews[0].readTime || 2} минут унших</p>
                      </div>
                    </Link>
                  )}

                  {/* Second and Third pinned news - Smaller cards */}
                  {pinnedNews.slice(1, 3).map((item) => (
                    <Link
                      key={item.id}
                      href={`/news/${item.id}`}
                      className="group bg-white cursor-pointer rounded-2xl sm:rounded-[20px] lg:rounded-l-[28px] flex flex-col min-h-[420px] hover:shadow-lg transition-all border border-gray-200"
                    >
                      {/* Image Container */}
                      <div className="relative rounded-t-2xl sm:rounded-t-[20px] lg:rounded-t-[28px] overflow-hidden h-[200px] sm:h-[250px] bg-gray-200">
                        <Image
                          src={item.bannerImage}
                          alt={item.title}
                          fill
                          unoptimized
                          className="object-cover object-center group-hover:scale-105 transition-transform duration-500 aspect-video"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex flex-col justify-between flex-1 p-5 lg:p-8">
                        <div className="flex flex-col gap-2 sm:gap-4">
                          <div className="flex items-center gap-2">
                            <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                              {item.category.label}
                            </span>
                          </div>
                          <p className="text-gray-900 text-xl font-bold leading-8 max-h-[128px] overflow-y-hidden text-ellipsis lg:text-2xl lg:leading-10">
                            {item.title}
                          </p>
                        </div>
                        <p className="text-xs text-gray-400">{new Date(item.publishedAt).toLocaleDateString()} • {item.readTime || 2} минут унших</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Regular News Section - Grid */}
            {gridItems.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Сүүлийн мэдээнүүд</h3>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {gridItems.slice(0, limit).map((item) => (
                    <Link
                      key={item.id}
                      href={`/news/${item.id}`}
                      className="group bg-white cursor-pointer rounded-2xl sm:rounded-[20px] lg:rounded-l-[28px] flex flex-col min-h-[420px] hover:shadow-lg transition-all border border-gray-200 hover:translate-y-[-2px]"
                    >
                      {/* Image Container */}
                      <div className="relative rounded-t-2xl sm:rounded-t-[20px] lg:rounded-t-[28px] overflow-hidden h-[200px] sm:h-[250px] bg-gray-200">
                        <Image
                          src={item.bannerImage}
                          alt={item.title}
                          fill
                          unoptimized
                          className="object-cover object-center group-hover:scale-105 transition-transform duration-500 aspect-video"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex flex-col justify-between flex-1 p-5 lg:p-8">
                        <div className="flex flex-col gap-2 sm:gap-4">
                          <div className="flex items-center gap-2">
                            <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                              {item.category.label}
                            </span>
                          </div>
                          <p className="text-gray-900 text-xl font-bold leading-8 max-h-[128px] overflow-y-hidden text-ellipsis lg:text-2xl lg:leading-10 group-hover:underline group-hover:decoration-teal-300 decoration-1 underline-offset-2 transition-all">
                            {item.title}
                          </p>
                        </div>
                        <p className="text-xs text-gray-400">{new Date(item.publishedAt).toLocaleDateString()} • {item.readTime || 2} минут унших</p>
                      </div>
                    </Link>
                  ))}
                </div>


              </div>
            )}

            {/* Empty state */}
            {filteredNews.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Мэдээ олдсонгүй</h3>
                <p className="text-gray-500 mb-6">Энэ төрлийн мэдээ одоогоор байхгүй байна.</p>
                <div className="flex flex-col gap-2 items-center justify-center">
                  {activeCategory !== "all" && (
                    <button
                      onClick={() => handleCategoryChange("all")}
                      className="px-4 py-2 text-sm text-teal-600 font-medium hover:text-teal-700 transition-all duration-300"
                    >
                      ← Бүх ангилалд буцах
                    </button>
                  )}
                  <button
                    onClick={() => handleCategoryChange("all")}
                    className="px-4 py-2 text-sm text-gray-600 font-medium hover:text-gray-700 transition-all duration-300"
                  >
                    Онцлох мэдээг үзэх
                  </button>
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      </main>
    )
  }
