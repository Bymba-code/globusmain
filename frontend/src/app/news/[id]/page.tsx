"use client";

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import Container from "@/components/Container"
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
  content: string
  bannerImage: string
  category: number
  categoryLabel: string
  publishedAt: string
  readTime: number
  isPinnedNews: boolean
  images: string[]
  socials: { social: string; icon: string }[]
}

const getTranslation = (translations: ApiTranslation[], language: number): ApiTranslation | undefined => {
  return translations.find(t => t.language === language)
}

const getCategoryTranslation = (translations: CategoryTranslation[], language: number): string => {
  const translation = translations.find(t => t.language === language)
  return translation?.label || 'Мэдээ'
}

export default function NewsDetailPage() {
  const params = useParams();
  const newsSlug = params.id as string;
  const [news, setNews] = useState<NewsItem | null>(null);
  const [categories, setCategories] = useState<CategoryAPI[]>([]);
  const [allNews, setAllNews] = useState<ApiNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchAllNews();
  }, []);

  useEffect(() => {
    if (allNews.length > 0 && categories.length > 0) {
      fetchNews();
    }
  }, [newsSlug, allNews, categories]);

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get<CategoryAPI[]>('/news-category/')
      if (response.data && Array.isArray(response.data)) {
        setCategories(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchAllNews = async () => {
    try {
      const response = await axiosInstance.get<ApiNewsItem[]>('/news/')
      if (response.data && Array.isArray(response.data)) {
        setAllNews(response.data.filter(item => item.render))
      }
    } catch (error) {
      console.error('Failed to fetch all news:', error)
    }
  }

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(false);
      
      // Find news by slug
      const foundNews = allNews.find((item) => item.slug === newsSlug);
      
      if (!foundNews) {
        setNews(null);
        setLoading(false);
        return;
      }

      // Get translations
      const titleMn = getTranslation(foundNews.title_translations, 1);
      const excerptMn = getTranslation(foundNews.shortdesc_translations, 1);
      const contentMn = getTranslation(foundNews.content_translations, 1);

      // Get category label
      const category = categories.find(c => c.id === foundNews.category);
      const categoryLabel = category ? getCategoryTranslation(category.translations, 1) : 'Мэдээ';

      // Use image_url if available
      const imageUrl = foundNews.image_url || foundNews.image || '/placeholder-news.jpg';

      // Map to frontend format
      const mappedNews: NewsItem = {
        id: foundNews.id,
        title: titleMn?.label || 'Гарчиггүй',
        slug: foundNews.slug || `news-${foundNews.id}`,
        excerpt: excerptMn?.label || '',
        content: contentMn?.label || '',
        bannerImage: imageUrl,
        category: foundNews.category,
        categoryLabel: categoryLabel,
        publishedAt: foundNews.date,
        readTime: foundNews.readtime || 5,
        isPinnedNews: foundNews.feature || false,
        images: foundNews.images?.map(img => img.image) || [],
        socials: foundNews.socials?.map(s => ({ social: s.social, icon: s.icon })) || [],
      };

      setNews(mappedNews);
    } catch (error) {
      console.error("Failed to fetch news:", error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Get related news (same category, excluding current)
  const getRelatedNews = (): NewsItem[] => {
    if (!news || allNews.length === 0) return [];

    return allNews
      .filter(item => 
        item.slug !== newsSlug && 
        item.category === news.category &&
        item.render
      )
      .slice(0, 3)
      .map(item => {
        const titleMn = getTranslation(item.title_translations, 1);
        const category = categories.find(c => c.id === item.category);
        const categoryLabel = category ? getCategoryTranslation(category.translations, 1) : 'Мэдээ';
        const imageUrl = item.image_url || item.image || '/placeholder-news.jpg';

        return {
          id: item.id,
          title: titleMn?.label || 'Гарчиггүй',
          slug: item.slug || `news-${item.id}`,
          excerpt: '',
          content: '',
          bannerImage: imageUrl,
          category: item.category,
          categoryLabel: categoryLabel,
          publishedAt: item.date,
          readTime: item.readtime || 5,
          isPinnedNews: item.feature || false,
          images: [],
          socials: [],
        };
      });
  };

  // Get next news (by date)
  const getNextNews = (): NewsItem | null => {
    if (allNews.length === 0) return null;

    const sortedByDate = [...allNews]
      .filter(item => item.render)
      .sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    
    const currentIndex = sortedByDate.findIndex(item => item.slug === newsSlug);
    
    if (currentIndex >= 0 && currentIndex < sortedByDate.length - 1) {
      const nextItem = sortedByDate[currentIndex + 1];
      const titleMn = getTranslation(nextItem.title_translations, 1);
      const category = categories.find(c => c.id === nextItem.category);
      const categoryLabel = category ? getCategoryTranslation(category.translations, 1) : 'Мэдээ';
      const imageUrl = nextItem.image_url || nextItem.image || '/placeholder-news.jpg';

      return {
        id: nextItem.id,
        title: titleMn?.label || 'Гарчиггүй',
        slug: nextItem.slug || `news-${nextItem.id}`,
        excerpt: '',
        content: '',
        bannerImage: imageUrl,
        category: nextItem.category,
        categoryLabel: categoryLabel,
        publishedAt: nextItem.date,
        readTime: nextItem.readtime || 5,
        isPinnedNews: nextItem.feature || false,
        images: [],
        socials: [],
      };
    }
    
    return null;
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Container>
          {/* Breadcrumb Skeleton */}
          <div className="py-4">
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>

          {/* Main Content Skeleton */}
          <div className="py-8">
            {/* Back Button Skeleton */}
            <div className="mb-6 h-10 bg-gray-200 rounded-lg w-24 animate-pulse"></div>

            {/* Content Card */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg p-8">
              {/* Category & Date Skeleton */}
              <div className="flex items-center gap-3 mb-6">
                <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
              </div>

              {/* Title Skeleton */}
              <div className="mb-4 space-y-3">
                <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </div>

              {/* Excerpt Skeleton */}
              <div className="mb-8 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
              </div>

              {/* Banner Image Skeleton */}
              <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-8 bg-gray-200 animate-pulse"></div>

              {/* Content Skeleton */}
              <div className="space-y-3 mb-8">
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              </div>
            </div>
          </div>
        </Container>
      </main>
    );
  }

  if (!news) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Container>
          <div className="py-20 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Мэдээ олдсонгүй</h1>
            <Link href="/news" className="inline-flex items-center gap-2 px-6 py-3 text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-all duration-200 font-medium">
              Мэдээ рүү буцах
            </Link>
          </div>
        </Container>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Container>
          <div className="py-20 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Алдаа гарлаа</h1>
            <p className="text-gray-600 mb-6">Мэдээ ачаалахад асуудал гарав. Дахин оролдоно уу.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setError(false);
                  setLoading(true);
                  fetchNews();
                }}
                className="px-6 py-2.5 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-all duration-200"
              >
                Дахин ачаалах
              </button>
              <Link
                href="/news"
                className="px-6 py-2.5 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 transition-all duration-200"
              >
                Мэдээ рүү буцах
              </Link>
            </div>
          </div>
        </Container>
      </main>
    );
  }

  const relatedNews = getRelatedNews();
  const nextNews = getNextNews();

  return (
    <main className="min-h-screen bg-gray-50">
      <Container>
        {/* Breadcrumb */}
        <div className="py-4 flex items-center gap-2 text-sm text-gray-600">
          <Link href="/" className="hover:text-teal-600 transition-colors">
            Нүүр
          </Link>
          <span>/</span>
          <Link href="/news" className="hover:text-teal-600 transition-colors">
            Мэдээ
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium truncate">{news.title}</span>
        </div>

        {/* Header */}
        <div className="py-8">
          <Link href="/news" className="inline-flex items-center gap-2 px-4 py-2.5 text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-all duration-300 mb-6 font-medium group">
            <svg className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Буцах</span>
          </Link>

          <div className="bg-white rounded-2xl overflow-hidden shadow-lg p-8">
            {/* Title & Category */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium">
                  {news.categoryLabel}
                </span>
                {news.isPinnedNews && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                    </svg>
                    Онцлох
                  </span>
                )}
                <span className="text-gray-500 text-sm">{new Date(news.publishedAt).toLocaleDateString('mn-MN')} • {news.readTime} мин</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {news.title}
              </h1>
              {news.excerpt && (
                <p className="text-lg text-gray-600">
                  {news.excerpt}
                </p>
              )}
            </div>

            {/* Banner Image */}
            <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-8 cursor-pointer hover:shadow-xl transition-shadow"
              onClick={() => setSelectedImage(news.bannerImage)}>
              <Image
                src={news.bannerImage}
                alt={news.title}
                fill
                unoptimized
                className="object-cover hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/placeholder-news.jpg'
                }}
              />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                <div className="text-white opacity-0 hover:opacity-100 transition-opacity">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Content */}
            {news.content && (
              <div className="prose prose-lg max-w-none mb-8">
                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {news.content}
                </div>
              </div>
            )}

            {/* Additional Images */}
            {news.images && news.images.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Нэмэлт зургууд</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {news.images.map((img, index) => (
                    <div 
                      key={index} 
                      className="relative aspect-video rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => setSelectedImage(img)}
                    >
                      <Image
                        src={img}
                        alt={`${news.title} - Зураг ${index + 1}`}
                        fill
                        unoptimized
                        className="object-cover hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/placeholder-news.jpg'
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Social Share */}
            <div className="border-t border-b py-8 mb-8">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Мэдээг хуваалцах</h3>
              <div className="flex items-center gap-3">
               
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
           
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.514l-5.106-6.694-5.979 6.694H2.42l7.728-8.835L1.497 2.25h6.886l4.612 6.105L17.457 2.25zM16.369 20.033h1.83L5.337 4.059H3.425l12.944 15.974z" />
                  </svg>
                

                {/* Copy Link */}
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Мэдээний холбоосыг хуулсан');
                    }
                  }}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-700 hover:bg-teal-500 hover:text-white transition-all duration-300"
                  title="Холбоос хуулах"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Related News */}
            {relatedNews.length > 0 && (
              <div className="border-t pt-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Холбоотой мэдээ</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {relatedNews.map((item) => (
                    <Link
                      key={item.id}
                      href={`/news/${item.slug}`}
                      className="group bg-gray-50 rounded-lg overflow-hidden hover:shadow-lg transition-all hover:bg-white"
                    >
                      <div className="relative aspect-video overflow-hidden bg-gray-200">
                        <Image
                          src={item.bannerImage}
                          alt={item.title}
                          fill
                          unoptimized
                          className="object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/placeholder-news.jpg'
                          }}
                        />
                      </div>
                      <div className="p-3">
                        <p className="text-xs text-gray-500 mb-2">{item.categoryLabel}</p>
                        <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-teal-600 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-2">{new Date(item.publishedAt).toLocaleDateString('mn-MN')}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Next News */}
            {nextNews && (
              <div className="border-t pt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Дараагийн мэдээ</h2>
                <Link
                  href={`/news/${nextNews.slug}`}
                  className="group flex gap-4 bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all hover:border-teal-300"
                >
                  <div className="relative w-40 aspect-video overflow-hidden bg-gray-100 flex-shrink-0">
                    <Image
                      src={nextNews.bannerImage}
                      alt={nextNews.title}
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/placeholder-news.jpg'
                      }}
                    />
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-2">{nextNews.categoryLabel}</p>
                      <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-teal-600 transition-colors">
                        {nextNews.title}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{new Date(nextNews.publishedAt).toLocaleDateString('mn-MN')}</p>
                  </div>
                  <div className="flex items-center pr-4 text-teal-600 group-hover:translate-x-1 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </Container>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-6xl w-full" onClick={(e) => e.stopPropagation()}>
            <Image
              src={selectedImage}
              alt="Том зураг"
              width={1200}
              height={800}
              unoptimized
              className="object-contain w-full h-auto max-h-[90vh]"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = '/placeholder-news.jpg'
              }}
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white/90 text-gray-900 rounded-full p-2 hover:bg-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </main>
  );
}