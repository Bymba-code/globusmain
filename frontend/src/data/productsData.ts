//  DEPRECATED: All product data now comes from backend API
// Mock data has been removed completely
// See: ProductPage.tsx for API integration
// Endpoint: GET /api/products/{productId}

export interface ProductData {
  name_mn: string
  name_en: string
  category_mn: string
  category_en: string
  description_mn: string
  description_en: string
  stats: {
    interest: string
    decision: string
    term: string
  }
  details: {
    amount: string
    fee: string
    interest: string
    term: string
    decision: string
  }
  materials: string[]
  collateral: string[]
  conditions: string[]
}

/**
 * Empty export - all data must come from backend API
 * Do NOT populate this with mock data
 */
export const productsData: Record<string, ProductData> = {}
