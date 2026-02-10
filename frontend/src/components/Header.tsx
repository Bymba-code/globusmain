'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import api from '@/lib/api'

// API shape from admin/header-menu
interface MenuItem {
  id: string
  title: string
  href: string
  order: number
  isActive: boolean
  parentId: string | null
  children?: MenuItem[]
}

interface HeaderApiResponse {
  logo?: string
  menus: MenuItem[]
  styles?: any
}

export default function Header() {
  const { language, setLanguage } = useLanguage()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [activeSubDropdown, setActiveSubDropdown] = useState<string | null>(null)
  const [mobileActiveDropdown, setMobileActiveDropdown] = useState<string | null>(null)
  const [mobileActiveSubDropdown, setMobileActiveSubDropdown] = useState<string | null>(null)
  const [langOpen, setLangOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [logoUrl, setLogoUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const langRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchHeaderMenu = async () => {
      try {
        const response = await api.get('/admin/header-menu/')
        if (response && response.status === 200) {
          const data: HeaderApiResponse = response.data
          
          if (data.logo) {
            setLogoUrl(data.logo)
          }
          
          const menuData = Array.isArray(data.menus) ? data.menus : (Array.isArray(data) ? data : [])
          const sorted = (menuData as MenuItem[]).sort((a: MenuItem, b: MenuItem) => a.order - b.order)
          
          const roots = sorted.filter((item: MenuItem) => !item.parentId && item.isActive)
          
          const buildTree = (parent: MenuItem) => {
            const children = sorted
              .filter((item: MenuItem) => item.parentId === parent.id && item.isActive)
              .sort((a: MenuItem, b: MenuItem) => a.order - b.order)
            
            if (children.length > 0) {
              parent.children = children.map((child: MenuItem) => {
                const grandchildren = sorted.filter(
                  (item: MenuItem) => item.parentId === child.id && item.isActive
                )
                return {
                  ...child,
                  children: grandchildren.sort((a: MenuItem, b: MenuItem) => a.order - b.order)
                }
              })
            }
            return parent
          }
          
          const tree = roots.map(buildTree)
          setMenuItems(tree)
        }
      } catch (error) {
        console.error('Failed to fetch header menu:', error)
        setMenuItems([])
      } finally {
        setLoading(false)
      }
    }

    fetchHeaderMenu()
  }, [])

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 6)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null)
        setActiveSubDropdown(null)
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (loading) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[1240px] z-[99999]">
        <div className="h-16 bg-white/80 rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <>
      {/* Floating Header Container */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[1240px] z-[99999]">
        <header
          className={`w-full rounded-2xl transition-all duration-300 border ${
            scrolled
              ? 'bg-white/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border-white/50'
              : 'bg-white/70 backdrop-blur-lg shadow-[0_4px_24px_rgba(0,0,0,0.08)] border-white/40'
          }`}
        >
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 lg:h-16">
              {/* Logo */}
              <div className="flex items-center gap-6 lg:gap-8">
                <Link href="/" className="flex items-center">
                  <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-full overflow-hidden flex items-center justify-center bg-gray-100">
                    {logoUrl ? (
                      <Image
                        src={logoUrl}
                        alt="Logo"
                        width={44}
                        height={44}
                        className="object-contain"
                      />
                    ) : (
                      <div className="w-full h-full bg-teal-600 flex items-center justify-center text-white font-bold">
                        B
                      </div>
                    )}
                  </div>
                </Link>

                {/* Desktop Navigation - From API */}
                <nav className="hidden lg:flex items-center gap-1" ref={dropdownRef}>
                  {menuItems.map((item) => (
                    <div
                      key={item.id}
                      className="relative"
                      onMouseEnter={() => item.children && setActiveDropdown(item.id)}
                      onMouseLeave={() => {
                        if (!item.children) return
                        setActiveDropdown(null)
                        setActiveSubDropdown(null)
                      }}
                    >
                      {item.children && item.children.length > 0 ? (
                        <>
                          <button
                            className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              activeDropdown === item.id
                                ? 'bg-gray-100 text-teal-600'
                                : 'text-gray-700 hover:bg-gray-50 hover:text-teal-600'
                            }`}
                          >
                            {item.title}
                            <svg
                              className={`w-4 h-4 transition-transform ${
                                activeDropdown === item.id ? 'rotate-180' : ''
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

                          {/* Level 2 Dropdown */}
                          {activeDropdown === item.id && (
                            <div className="absolute top-full left-0 pt-2 w-72">
                              <div className="bg-white rounded-xl shadow-xl border border-gray-100 py-2">
                                {item.children.map((subItem) => (
                                  <div
                                    key={subItem.id}
                                    className="relative"
                                    onMouseEnter={() =>
                                      subItem.children && setActiveSubDropdown(subItem.id)
                                    }
                                  >
                                    {subItem.children && subItem.children.length > 0 ? (
                                      <div
                                        className={`flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 cursor-pointer ${
                                          activeSubDropdown === subItem.id ? 'bg-gray-50' : ''
                                        }`}
                                      >
                                        <div className="text-sm font-medium text-gray-900">
                                          {subItem.title}
                                        </div>
                                        <svg
                                          className="w-4 h-4 text-gray-400"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                          />
                                        </svg>
                                      </div>
                                    ) : (
                                      <Link
                                        href={subItem.href}
                                        className="block px-4 py-2.5 hover:bg-gray-50 text-sm font-medium text-gray-900 hover:text-teal-600"
                                        onClick={() => {
                                          setActiveDropdown(null)
                                          setActiveSubDropdown(null)
                                        }}
                                      >
                                        {subItem.title}
                                      </Link>
                                    )}

                                    {/* Level 3 Dropdown */}
                                    {activeSubDropdown === subItem.id &&
                                      subItem.children &&
                                      subItem.children.length > 0 && (
                                        <div className="absolute left-full top-0 pl-2 w-64">
                                          <div className="bg-white rounded-xl shadow-xl border border-gray-100 py-2">
                                            {subItem.children.map((tertiaryItem) => (
                                              <Link
                                                key={tertiaryItem.id}
                                                href={tertiaryItem.href}
                                                className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-teal-600"
                                                onClick={() => {
                                                  setActiveDropdown(null)
                                                  setActiveSubDropdown(null)
                                                }}
                                              >
                                                {tertiaryItem.title}
                                              </Link>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <Link
                          href={item.href}
                          className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-teal-600 transition-colors"
                        >
                          {item.title}
                        </Link>
                      )}
                    </div>
                  ))}
                </nav>
              </div>

              {/* Right Side Actions */}
              <div className="flex items-center gap-2">
                {/* Language Selector */}
                <div className="relative" ref={langRef}>
                  <button
                    onClick={() => setLangOpen(!langOpen)}
                    className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                    aria-label="Хэл сонгох"
                  >
                    <svg
                      className="w-4 h-4 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                      />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">
                      {language === 'mn' ? 'MN' : 'EN'}
                    </span>
                    <svg
                      className={`w-3 h-3 text-gray-500 transition-transform ${langOpen ? 'rotate-180' : ''}`}
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

                  {langOpen && (
                    <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 py-2">
                      <button
                        onClick={() => {
                          setLanguage('mn')
                          setLangOpen(false)
                        }}
                        className={`flex items-center gap-2 w-full px-4 py-2 text-left text-sm font-medium transition-colors ${
                          language === 'mn'
                            ? 'text-teal-600 bg-teal-50 hover:bg-teal-100'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-base">🇲🇳</span>
                        Монгол
                      </button>
                      <button
                        onClick={() => {
                          setLanguage('en')
                          setLangOpen(false)
                        }}
                        className={`flex items-center gap-2 w-full px-4 py-2 text-left text-sm font-medium transition-colors ${
                          language === 'en'
                            ? 'text-teal-600 bg-teal-50 hover:bg-teal-100'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-base">🇺🇸</span>
                        English
                      </button>
                    </div>
                  )}
                </div>

                {/* Mobile Menu Button */}
                <button
                  className="lg:hidden p-2.5 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                  onClick={() => setMobileOpen(!mobileOpen)}
                  aria-label="Цэс"
                >
                  {mobileOpen ? (
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Navigation */}
            {mobileOpen && (
              <div className="lg:hidden py-4 border-t border-gray-100">
                <nav className="space-y-1 max-h-[70vh] overflow-y-auto">
                  {menuItems.map((item) => (
                    <div key={item.id}>
                      {item.children && item.children.length > 0 ? (
                        <div>
                          <button
                            onClick={() =>
                              setMobileActiveDropdown(
                                mobileActiveDropdown === item.id ? null : item.id
                              )
                            }
                            className="flex items-center justify-between w-full px-4 py-3 text-gray-700 hover:bg-gray-50/80 rounded-lg"
                          >
                            <span className="font-medium">{item.title}</span>
                            <svg
                              className={`w-5 h-5 transition-transform duration-200 ${
                                mobileActiveDropdown === item.id ? 'rotate-180' : ''
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

                          {mobileActiveDropdown === item.id && (
                            <div className="pl-4 mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                              {item.children.map((subItem) => (
                                <div key={subItem.id}>
                                  {subItem.children && subItem.children.length > 0 ? (
                                    <>
                                      <button
                                        onClick={() =>
                                          setMobileActiveSubDropdown(
                                            mobileActiveSubDropdown === subItem.id
                                              ? null
                                              : subItem.id
                                          )
                                        }
                                        className="flex items-center justify-between w-full px-4 py-2.5 text-gray-600 hover:bg-gray-50/80 rounded-lg"
                                      >
                                        <span className="text-sm">{subItem.title}</span>
                                        <svg
                                          className={`w-4 h-4 transition-transform duration-200 ${
                                            mobileActiveSubDropdown === subItem.id
                                              ? 'rotate-90'
                                              : ''
                                          }`}
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                          />
                                        </svg>
                                      </button>

                                      {mobileActiveSubDropdown === subItem.id && (
                                        <div className="pl-4 mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                          {subItem.children.map((tertiaryItem) => (
                                            <Link
                                              key={tertiaryItem.id}
                                              href={tertiaryItem.href}
                                              className="block px-4 py-2 text-sm text-gray-500 hover:text-teal-600 hover:bg-gray-50/80 rounded-lg"
                                              onClick={() => {
                                                setMobileOpen(false)
                                                setMobileActiveDropdown(null)
                                                setMobileActiveSubDropdown(null)
                                              }}
                                            >
                                              {tertiaryItem.title}
                                            </Link>
                                          ))}
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <Link
                                      href={subItem.href}
                                      className="block px-4 py-2.5 text-sm text-gray-600 hover:text-teal-600 hover:bg-gray-50/80 rounded-lg"
                                      onClick={() => {
                                        setMobileOpen(false)
                                        setMobileActiveDropdown(null)
                                      }}
                                    >
                                      {subItem.title}
                                    </Link>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Link
                          href={item.href}
                          className="block px-4 py-3 text-gray-700 font-medium hover:bg-gray-50/80 rounded-lg"
                          onClick={() => setMobileOpen(false)}
                        >
                          {item.title}
                        </Link>
                      )}
                    </div>
                  ))}
                </nav>
              </div>
            )}
          </div>
        </header>
      </div>
    </>
  )
}
