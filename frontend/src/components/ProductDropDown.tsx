import { useEffect, useState } from 'react';

// ---------------- TYPES ----------------
type Translation = {
  language: number; // 1 = EN, 2 = MN
  label: string;
};

type Product = {
  id: number;
};

type ProductType = {
  id: number;
  translations: Translation[];
  products: Product[];
};

type Category = {
  id: number;
  translations: Translation[];
  product_types: ProductType[];
};

export default function ProductDropDown() {
  const [categories, setCategories] = useState<Category[]>([])
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        setError(null)
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
        const response = await fetch(`${apiUrl}/api/categories/`)
        if (!response.ok) throw new Error('Failed to fetch categories')
        const data = await response.json()
        setCategories(data)
      } catch (error) {
        console.error('Failed to fetch categories', error)
        setError('Failed to load categories')
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  if (loading) return <div className="text-xs text-gray-500">Ачаалж байна...</div>
  if (error) return <div className="text-xs text-red-600">{error}</div>
  if (categories.length === 0) return <div className="text-xs text-gray-500">Категори олдсонгүй</div>

  return (
    <div className="flex gap-2">
      {categories.map((category, index) => {
        // Get first translation as fallback for language detection
        const categoryLabel = category.translations?.[0]?.label || 'Category'
        return (
          <div key={category.id} className="relative">
            <button
              onClick={() =>
                setActiveDropdown(activeDropdown === index ? null : index)
              }
              className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeDropdown === index
                  ? 'bg-gray-100 text-teal-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-teal-600'
              }`}
            >
              {categoryLabel}

              <svg
                className={`w-4 h-4 transition-transform ${
                  activeDropdown === index ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* DROPDOWN */}
          {activeDropdown === index && (
            <div className="absolute mt-2 w-48 rounded-lg bg-white shadow-lg border">
              {category.product_types?.map((type) => {
                const typeLabel = type.translations?.[0]?.label
                return (
                  <div
                    key={type.id}
                    className="px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                  >
                    {typeLabel}
                  </div>
                )
              })}
            </div>
          )}
        </div>
        )
      })}
    </div>
  );
}
