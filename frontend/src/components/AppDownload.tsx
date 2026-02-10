'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import api from '@/lib/api'
import Image from 'next/image'

// API types
interface Translation {
  language_id: number
  label: string
}

interface Position {
  top: number
  left: number
  rotate: number
  size: number
}

interface Title {
  translations: Translation[]
  positions: Position[]
}

interface Feature {
  translations: Translation[]
  active?: boolean
  icon?: string
  color?: string
  iconColor?: string
  fontWeight?: string
  fontFamily?: string
}

interface AppDownloadData {
  id?: number
  image: string
  appstore: string
  playstore: string
  title_position: number
  divide: number
  font: string
  titlecolor: string
  fontcolor: string
  listcolor: string
  iconcolor: string
  buttonbgcolor: string
  buttonfontcolor: string
  appSvgCode?: string
  googleButtonBgColor?: string
  googleButtonTextColor?: string
  buttonStyle: string
  deviceFrame: string
  featuresTextSize: string
  titles: Title[]
  lists: Feature[]
}

const getTranslation = (translations: Translation[], languageId: number): string => {
  return translations.find(t => t.language_id === languageId)?.label || ''
}

export default function AppDownload() {
  const { language } = useLanguage()
  const [data, setData] = useState<AppDownloadData | null>(null)
  const [loading, setLoading] = useState(true)
  const languageId = language === 'mn' ? 2 : 1

  useEffect(() => {
    const fetchAppDownloadData = async () => {
      try {
        const response = await api.get('/app-download/1/')
        if (response && response.status === 200) {
          setData(response.data)
        }
      } catch (error) {
        console.error('Failed to fetch app download data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAppDownloadData()
  }, [])

  if (loading) {
    return (
      <section className="relative overflow-hidden py-20 md:py-28 px-5 bg-linear-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="animate-pulse h-96 bg-gray-200 rounded-lg" />
        </div>
      </section>
    )
  }

  if (!data) {
    return null
  }

  // Icon map for feature icons
  const iconMap: Record<string, React.ComponentType<any>> = {
    check: () => <span className="text-lg">✓</span>,
    shield: () => <span className="text-lg"></span>,
    bolt: () => <span className="text-lg"></span>,
    clock: () => <span className="text-lg"></span>,
    user: () => <span className="text-lg"></span>,
    card: () => <span className="text-lg"></span>,
    globe: () => <span className="text-lg"></span>,
    star: () => <span className="text-lg"></span>,
    sparkles: () => <span className="text-lg"></span>,
  }

  return (
    <section
      className="relative overflow-hidden py-20 md:py-28 px-5 bg-linear-to-b from-slate-50 to-white"
      style={{ backgroundColor: `${data.buttonbgcolor}0A` }}
    >
      {/* Subtle background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[520px] h-[520px] bg-blue-500/10 blur-3xl rounded-full" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          {/* RIGHT - Mobile/Image */}
          <div className={`flex justify-center lg:justify-end relative ${data.title_position === 2 ? '' : 'lg:order-2'}`}>
            <div className="absolute -inset-10 bg-blue-500/5 blur-3xl rounded-full" />

            {data.appSvgCode ? (
              <div
                className="relative z-10 w-full max-w-md drop-shadow-[0_40px_80px_rgba(0,0,0,0.12)] transition-transform duration-500 hover:-translate-y-1"
                dangerouslySetInnerHTML={{ __html: data.appSvgCode }}
              />
            ) : data.image ? (
              <Image
                src={data.image}
                alt="Mobile App"
                width={400}
                height={500}
                className="relative z-10 w-full max-w-md drop-shadow-[0_40px_80px_rgba(0,0,0,0.12)] transition-transform duration-500 hover:-translate-y-1 object-contain"
              />
            ) : null}
          </div>

          {/* LEFT - Content */}
          <div className={`flex flex-col gap-8 text-center lg:text-left ${data.title_position === 2 ? 'lg:order-2' : 'lg:order-1'}`}>
            {/* Scattered headline */}
            {data.titles && data.titles.length > 0 && (
              <div className="relative min-h-[300px]">
                {data.titles.map((title, idx) => {
                  const position = title.positions[0]
                  const text = getTranslation(title.translations, languageId)

                  if (!text || !position) return null

                  return (
                    <span
                      key={idx}
                      className="absolute font-extrabold whitespace-nowrap"
                      style={{
                        top: `${position.top}px`,
                        left: `${position.left}px`,
                        transform: `rotate(${position.rotate}deg)`,
                        fontSize: `${position.size}px`,
                        color: data.titlecolor,
                        fontFamily: data.font,
                      }}
                    >
                      {text}
                    </span>
                  )
                })}
              </div>
            )}

            {/* Features */}
            {data.lists && data.lists.length > 0 && (
              <div className="flex flex-col gap-4 mt-2">
                {data.lists
                  .filter(f => f.active !== false)
                  .map((feature, idx) => {
                    const text = getTranslation(feature.translations, languageId)
                    if (!text) return null

                    const IconComponent = feature.icon ? iconMap[feature.icon] : iconMap['check']

                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${feature.iconColor || data.iconcolor}20` }}
                        >
                          <div
                            style={{ color: feature.iconColor || data.iconcolor }}
                          >
                            {IconComponent ? <IconComponent /> : <span>✓</span>}
                          </div>
                        </div>
                        <span
                          className={`${data.featuresTextSize}`}
                          style={{
                            color: data.fontcolor,
                            fontWeight: feature.fontWeight,
                            fontFamily: feature.fontFamily
                          }}
                        >
                          {text}
                        </span>
                      </div>
                    )
                  })}
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-6 justify-center lg:justify-start">
              {/* App Store */}
              {data.appstore && (
                <a
                  href={data.appstore}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-medium transition-all duration-300 shadow-md hover:shadow-lg"
                  style={{
                    backgroundColor: data.buttonbgcolor,
                    color: data.buttonfontcolor,
                    border: `1px solid ${data.buttonbgcolor}40`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1'
                  }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  App Store
                </a>
              )}

              {/* Google Play */}
              {data.playstore && (
                <a
                  href={data.playstore}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-medium transition-all duration-300 shadow-md hover:shadow-lg"
                  style={{
                    backgroundColor: data.googleButtonBgColor || '#f0f0f0',
                    color: data.googleButtonTextColor || '#000',
                    border: '1px solid #e0e0e0',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1'
                  }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.303 2.303-8.635-8.635z" />
                  </svg>
                  Google Play
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
