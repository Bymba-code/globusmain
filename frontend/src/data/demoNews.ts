export interface NewsItem {
  id: string
  title: string
  excerpt: string
  content: string
  bannerImage: string
  category: string
  publishedAt: string
  readTime: number
  isActive: boolean
  isPinnedNews: boolean
  isPinnedHome: boolean
}

//  DEPRECATED: All news data now comes from backend API
// Mock data has been removed completely
// See: NewsContent.tsx and NewsSection.tsx for API integration
// Endpoint: GET /api/news

/**
 * This export is kept for type reference only.
 * Do NOT add mock data here - all data must come from backend.
 */
export const demoNews: NewsItem[] = []
