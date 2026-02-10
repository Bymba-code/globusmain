"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import api from "@/lib/api";

// Logo resolution:
// Admin stores: logoImage: { type: 'upload'|'url'|'svg', value: string }
// Backend resolves to: logo_image: string (unified value)
// This ensures single source of truth for logo data

interface SocialLink {
  id?: number
  name: string
  url: string
  icon_svg?: string
}

interface FooterData {
  id?: number
  logo_image?: string
  description_mn?: string
  description_en?: string
  address_mn?: string
  address_en?: string
  email?: string
  phone?: string
  social_links?: SocialLink[]
  quick_links?: Array<{
    name_mn: string
    name_en: string
    url: string
  }>
  copyright_text?: string
  textColor?: string
  textSize?: string
  bgColor?: string
  iconColor?: string
}

const sanitizeSvg = (svg: string): string => {
  if (!svg) return ''
  //  SECURITY: Basic sanitization - blocks <script> tags
  // This prevents XSS attacks from malicious SVG code
  // Admin users should only paste verified SVG from trusted sources
  // 
  // Note: Backend should also validate/sanitize SVG on save
  // Recommended: Use a library like DOMPurify on backend for production
  if (svg.toLowerCase().includes('<script')) {
    console.warn(' SVG contains script tag - blocked for security')
    return ''
  }
  return svg
}



const defaultSocialIcons: Record<string, string> = {
  facebook: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12a10 10 0 10-11.5 9.9v-7h-2v-3h2v-2.3c0-2 1.2-3.1 3-3.1.9 0 1.8.1 1.8.1v2h-1c-1 0-1.3.6-1.3 1.2V12h2.7l-.4 3h-2.3v7A10 10 0 0022 12z"/></svg>`,
  instagram: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="5" stroke-width="2" /><path stroke-width="2" d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>`,
  twitter: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.1 1 5.4 5.4 0 002.4-3 10.9 10.9 0 01-3.4 1.3A5.4 5.4 0 0016.1 2a5.4 5.4 0 00-5.4 5.3c0 .4 0 .9.1 1.2-4.4-.2-8.3-2.3-10.9-5.5A5.4 5.4 0 002 9.3a5.2 5.2 0 01-2.4-.7v.1a5.4 5.4 0 004.3 5.3 5.4 5.4 0 01-2.4.1 5.4 5.4 0 005 3.7A10.9 10.9 0 010 19.5a15.3 15.3 0 008.3 2.4c10 0 15.5-8.1 15.5-15.1V5A11 11 0 0023 3z" /></svg>`,
  linkedin: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.5a1.5 1.5 0 00-3 0V19h-3v-9h3v1.32a3 3 0 015.6 1.4V19z"/></svg>`,
  youtube: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.175h-15.23a2.412 2.412 0 00-2.412 2.413v12.814a2.412 2.412 0 002.412 2.413h15.23a2.413 2.413 0 002.413-2.413V5.588a2.413 2.413 0 00-2.413-2.413zm-9.612 16.04V4.852h5.76v14.363h-5.76z"/><circle cx="9.913" cy="12" r="2.4"/></svg>`
}

export default function Footer() {
  const { language } = useLanguage();
  const [data, setData] = useState<FooterData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const languageId = language === 'mn' ? 2 : 1;

  useEffect(() => {
    const fetchFooterData = async () => {
      try {
        const response = await api.get('/footer/current/');
        if (response && response.status === 200) {
          setData(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch footer data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFooterData();
  }, []);

  if (loading || !data) {
    return (
      <footer className="border-t mt-8 sm:mt-12" style={{ backgroundColor: '#ffffff' }}>
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </footer>
    );
  }

  const description = languageId === 2 ? data.description_mn : data.description_en;
  const address = languageId === 2 ? data.address_mn : data.address_en;
  const textColor = data.textColor || '#4b5563';
  const textSize = data.textSize || 'text-sm';

  return (
    <footer 
      className="border-t mt-8 sm:mt-12"
      style={{ backgroundColor: data.bgColor || '#ffffff' }}
    >
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Logo + Description */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="text-2xl font-extrabold text-teal-600 tracking-tight hover:text-teal-700 transition">
              {data.logo_image ? (
                <img src={data.logo_image} alt="Logo" className="h-8 object-contain" />
              ) : (
                'BichilGlobus'
              )}
            </Link>

            <p 
              className="mt-3 leading-relaxed"
              style={{ color: data.textColor || '#4b5563' }}
            >
              {description}
            </p>

            {/* Social icons */}
            <div className="flex gap-4 mt-5">
              {data.social_links && data.social_links.map((social) => (
                <a
                  key={social.id || social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="hover:opacity-80 transition"
                  style={{ color: data.iconColor || '#9ca3af' }}
                >
                  {social.icon_svg ? (
                    <div dangerouslySetInnerHTML={{ __html: sanitizeSvg(social.icon_svg) }} />
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: defaultSocialIcons[social.name.toLowerCase()] || defaultSocialIcons.facebook }} />
                  )}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 
              className="font-semibold mb-4"
              style={{ color: data.textColor || '#374151' }}
            >
              {languageId === 2 ? 'Холбоосууд' : 'Quick Links'}
            </h3>
            <nav 
              className="flex flex-col gap-2"
              style={{ color: data.textColor || '#4b5563' }}
            >
              {data.quick_links && data.quick_links.map((link, idx) => (
                <Link
                  key={idx}
                  href={link.url}
                  className="hover:opacity-80 transition"
                >
                  {languageId === 2 ? link.name_mn : link.name_en}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h3 
              className="font-semibold mb-4"
              style={{ color: data.textColor || '#374151' }}
            >
              {languageId === 2 ? 'Холбоо барих' : 'Contact Us'}
            </h3>
            <div 
              className="space-y-2"
              style={{ color: data.textColor || '#4b5563' }}
            >
              {address && (
                <p className="flex items-center gap-2">
                  <span className="text-teal-600"></span>
                  {address}
                </p>
              )}

              {data.email && (
                <p className="flex items-center gap-2">
                  <span className="text-teal-600">✉️</span>
                  <a href={`mailto:${data.email}`} className="hover:text-teal-600 transition">
                    {data.email}
                  </a>
                </p>
              )}

              {data.phone && (
                <p className="flex items-center gap-2">
                  <span className="text-teal-600"></span>
                  <a href={`tel:${data.phone}`} className="hover:text-teal-600 transition">
                    {data.phone}
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t flex flex-col md:flex-row justify-between items-center gap-4">
          <div 
            className={`${data.textSize || 'text-sm'}`}
            style={{ color: data.textColor || '#4b5563' }}
          >
            © {new Date().getFullYear()} {data.copyright_text}
          </div>
        </div>
      </div>
    </footer>
  );
}
