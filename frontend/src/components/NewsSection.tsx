'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { axiosInstance } from '@/lib/axios'

interface ApiTranslation {
  language: number 
  label: string
  font: string
  family: string
  weight: string
  size: string
}

interface ApiImage {
  image: string
}

interface ApiSocial {
  social: string
  icon: string
}

interface ApiNewsItem {
  id: number
  category: number
  image: string 
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

const getTranslation = (translations: ApiTranslation[], language: number): ApiTranslation | undefined => {
  return translations.find(t => t.language === language)
}

const getCategoryTranslation = (translations: CategoryTranslation[], language: number): CategoryTranslation | undefined => {
  return translations.find(t => t.language === language)
}

const mapAPICategoryToCategory = (apiCategory: CategoryAPI): Category => {
  const labelMn = getCategoryTranslation(apiCategory.translations, 1)
  
  return {
    id: apiCategory.id,
    label: labelMn?.label || '',
  }
}

const mapApiNewsToFrontend = (item: ApiNewsItem): NewsItem => {
  const titleMn = getTranslation(item.title_translations, 1)

  return {
    id: item.id,
    title: titleMn?.label || '',
    slug: item.slug,
    bannerImage: item.image,
    category: item.category,
    publishedAt: item.date,
    readTime: item.readtime || 2,
    isPinnedNews: item.feature,
  }
}

export default function NewsSection() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
    fetchNews()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get<CategoryAPI[]>('/news-category/')
      const transformedCategories = response.data.map(mapAPICategoryToCategory)
      setCategories(transformedCategories)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchNews = async () => {
    setLoading(true)
    try {
      const response = await axiosInstance.get<ApiNewsItem[]>('/news/')
      const transformedNews = response.data
        .filter(item => item.render) 
        .map(mapApiNewsToFrontend)
      setNews(transformedNews)
    } catch (error) {
      console.error('Failed to fetch news:', error)
    } finally {
      setLoading(false)
    }
  }

  // Sort news: pinned first, then by date
  const sortedNews = [...news].sort((a, b) => {
    if (a.isPinnedNews === b.isPinnedNews) {
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    }
    return a.isPinnedNews ? -1 : 1
  })

  const pinnedNews = sortedNews.filter((item) => item.isPinnedNews)
  const displayNews = pinnedNews.slice(0, 3)

  // Get category label
  const getCategoryLabel = (categoryId: number): string => {
    return categories.find(c => c.id === categoryId)?.label || 'Мэдээ'
  }

  return (
    <section className="py-16 sm:py-20 lg:py-32 px-5 sm:px-20 flex flex-col">
      <div className="flex flex-col">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-20">
          <div className="inline-block">
            <p className="text-teal-600 text-sm font-semibold uppercase tracking-wider mb-2">Онцолсон мэдээ</p>
            <h2 className="text-4xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">Мэдээ</h2>
            <div className="w-16 h-1 bg-teal-600 mx-auto rounded-full"></div>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        )}

        {!loading && displayNews.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-10 mb-10 lg:mb-20 lg:max-w-[1280px] lg:mx-auto">
              <Link
                href={`/news/${displayNews[0].slug}`}
                className="bg-white cursor-pointer rounded-1xl sm:rounded-[20px] lg:rounded-l-[28px] flex flex-col h-[257px] sm:col-span-2 sm:h-[592px] lg:h-[480px] lg:flex-row group shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="relative rounded-t-2xl sm:rounded-t-[20px] lg:rounded-l-[28px] lg:rounded-r-none overflow-hidden h-[45%] sm:h-5/5 lg:h-auto lg:w-2/4 bg-gray-200">
                  <Image
                    src={displayNews[0].bannerImage}
                    alt={displayNews[0].title}
                    fill
                    unoptimized
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="flex flex-col justify-between h-[55%] p-5 lg:p-8 lg:h-auto lg:w-1/3">
                  <div className="flex flex-col gap-2 sm:gap-4">
                    <p className="text-sm font-medium text-teal-600">
                      {getCategoryLabel(displayNews[0].category)}
                    </p>
                    <p className="text-gray-900 text-xl font-semibold leading-8 max-h-[128px] overflow-y-hidden text-ellipsis lg:text-2xl lg:leading-10 sm:text-[28px] lg:max-h-[250px]">
                      {displayNews[0].title}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-gray-500">
                    {new Date(displayNews[0].publishedAt).toLocaleDateString('mn-MN')} • {displayNews[0].readTime} минут унших
                  </p>
                </div>
              </Link>

              {displayNews.slice(1, 3).map((item) => (
                <Link
                  key={item.id}
                  href={`/news/${item.slug}`}
                  className="bg-white cursor-pointer rounded-2xl sm:rounded-[20px] lg:rounded-l-[28px] flex flex-col h-[467px] lg:h-[658px] group shadow-sm hover:shadow-lg transition-shadow"
                >
                  <div className="relative rounded-t-2xl sm:rounded-t-[20px] lg:rounded-t-[28px] overflow-hidden h-[45%] lg:h-1/2 bg-gray-200">
                    <Image
                      src={item.bannerImage}
                      alt={item.title}
                      fill
                      unoptimized
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex flex-col justify-between h-[55%] p-5 lg:p-8 lg:h-1/2 lg:pt-5">
                    <div className="flex flex-col gap-2 sm:gap-4">
                      <p className="text-sm font-medium text-teal-600">
                        {getCategoryLabel(item.category)}
                      </p>
                      <p className="text-gray-900 text-xl font-semibold leading-8 max-h-[128px] overflow-y-hidden text-ellipsis lg:text-2xl lg:leading-10">
                        {item.title}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-gray-500">
                      {new Date(item.publishedAt).toLocaleDateString('mn-MN')} • {item.readTime} минут унших
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="flex justify-center mt-6">
              <Link
                href="/news"
                className="inline-flex items-center gap-2 px-8 py-3 bg-teal-600 text-white font-semibold rounded-full hover:bg-teal-700 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Дэлгэрэнгүй
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </>
        )}

        {!loading && displayNews.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Онцлох мэдээ байхгүй байна</h3>
            <p className="text-gray-500 mb-6">Удахгүй онцлох мэдээнүүд нэмэгдэх болно.</p>
            <Link
              href="/news"
              className="inline-flex items-center gap-2 px-8 py-3 bg-teal-600 text-white font-semibold rounded-full hover:bg-teal-700 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Бүх мэдээг үзэх
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}