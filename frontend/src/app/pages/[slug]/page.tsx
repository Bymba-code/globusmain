'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Container from '@/components/Container';
import Header from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchPageBySlug, getTranslation, type PageData } from '@/lib/pagesApi';

const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .animate-fade-in {
    animation: fadeIn 0.5s ease-out;
  }
  .animate-fade-in-up {
    animation: fadeInUp 0.6s ease-out;
  }
  .animate-scale-in {
    animation: scaleIn 0.4s ease-out;
  }
  .loading-shimmer {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
`;

export default function DynamicPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { language } = useLanguage(); // Use LanguageContext
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convert language context ('mn' | 'en') to language ID (1 | 2)
  const currentLanguageId = language === 'mn' ? 1 : 2;

  useEffect(() => {
    if (!slug) return;

    const loadPage = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch from real API
        const data = await fetchPageBySlug(slug);
        
        if (!data) {
          setError('NOT_FOUND');
          return;
        }
        
        // Check if page is active
        if (!data.active) {
          setError('INACTIVE');
          return;
        }
        
        setPage(data);
      } catch (err) {
        console.error('Error loading page:', err);
        setError('NETWORK_ERROR');
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [slug]);

  // Copy link to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert(language === 'mn' ? 'Линк хуулагдлаа!' : 'Link copied!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
        <style dangerouslySetInnerHTML={{ __html: styles }} />
        <Header />
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-teal-100 rounded-full mx-auto mb-6"></div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 border-4 border-transparent border-t-teal-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-teal-600 font-medium">
              {language === 'mn' ? 'Уншиж байна...' : 'Loading...'}
            </p>
            <p className="text-slate-400 text-sm mt-1">
              {language === 'mn' ? 'Түр хүлээнэ үү' : 'Please wait'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error states
  if (error || !page) {
    const errorMessages = {
      NOT_FOUND: {
        mn: { title: 'Хуудас олдсонгүй', message: 'Уучлаарай, таны хайсан хуудас олдсонгүй.' },
        en: { title: 'Page Not Found', message: 'Sorry, the page you are looking for could not be found.' }
      },
      INACTIVE: {
        mn: { title: 'Хуудас идэвхгүй', message: 'Энэ хуудас одоогоор идэвхгүй байна.' },
        en: { title: 'Page Inactive', message: 'This page is currently inactive.' }
      },
      SERVER_ERROR: {
        mn: { title: 'Серверийн алдаа', message: 'Уучлаарай, серверт алдаа гарлаа.' },
        en: { title: 'Server Error', message: 'Sorry, a server error occurred.' }
      },
      NETWORK_ERROR: {
        mn: { title: 'Сүлжээний алдаа', message: 'Сүлжээний холболт тасарсан байна.' },
        en: { title: 'Network Error', message: 'Network connection failed.' }
      }
    };

    const currentError = errorMessages[error as keyof typeof errorMessages] || errorMessages.NOT_FOUND;
    const errorText = language === 'mn' ? currentError.mn : currentError.en;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50/30">
        <style dangerouslySetInnerHTML={{ __html: styles }} />
        <Header />
        <Container>
          <div className="py-24 text-center animate-fade-in">
            <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-red-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-red-100">
              <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent mb-4">404</h1>
            <p className="text-xl text-slate-600 mb-4">{errorText.title}</p>
            <p className="text-slate-500 mb-10 max-w-md mx-auto">
              {errorText.message}
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 bg-teal-600 text-white rounded-2xl hover:bg-teal-700 transition-all duration-300 font-medium shadow-lg shadow-teal-200 hover:shadow-xl hover:shadow-teal-300 hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {language === 'mn' ? 'Нүүр хуудас руу буцах' : 'Back to Home'}
            </a>
          </div>
        </Container>
      </div>
    );
  }

  // Get translations using current language from context
  const title = getTranslation(page.title_translations, currentLanguageId);
  const description = getTranslation(page.description_translations, currentLanguageId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <Header />
      
      <main className="py-8 md:py-16 lg:py-20">
        <Container>
          <article className="max-w-3xl mx-auto relative">
            {/* Back Button */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 md:absolute md:bottom-auto md:top-0 md:left-0 md:translate-x-0 animate-fade-in">
              <a
                href="/"
                className="inline-flex items-center justify-center w-12 h-12 bg-white/95 backdrop-blur-sm text-slate-700 rounded-full hover:bg-teal-50 hover:text-teal-600 hover:shadow-xl transition-all duration-300 group shadow-lg border border-slate-200/80 hover:border-teal-300/80"
                title={language === 'mn' ? 'Нүүр хуудас' : 'Home'}
                aria-label={language === 'mn' ? 'Нүүр хуудас руу буцах' : 'Back to home'}
              >
                <svg className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </a>
            </div>

            {/* Hero Section */}
            <div className="mb-12 animate-fade-in md:pt-8">
              {/* Title Section */}
              <div className="text-center mb-8">
                <h1 
                  className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4 leading-tight tracking-tight"
                  style={{
                    fontFamily: title.family || 'system-ui',
                    fontWeight: title.weight || 'bold',
                  }}
                >
                  {title.label}
                </h1>
                <div className="h-1 w-16 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full mx-auto"></div>
              </div>

              {/* Feature Image */}
              {page.image && (
                <div className="relative rounded-2xl overflow-hidden shadow-xl animate-scale-in mb-12 group">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-transparent z-10 group-hover:from-slate-900/30 transition-colors duration-300"></div>
                  <img
                    src={page.image}
                    alt={title.label}
                    className="w-full h-[280px] md:h-[380px] object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.src = '/images/placeholder.jpg';
                      e.currentTarget.onerror = null;
                    }}
                    loading="lazy"
                  />
                </div>
              )}
            </div>

            {/* Content Card */}
            <div 
              className="rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden animate-fade-in-up hover:shadow-xl transition-shadow duration-500 backdrop-blur-sm bg-white"
            >
              {/* Content Body */}
              <div className="px-6 md:px-10 lg:px-12 py-10 md:py-14">
                <div className="prose prose-slate max-w-none">
                  <div 
                    className="whitespace-pre-wrap animate-fade-in space-y-4"
                    style={{
                      fontFamily: description.family || 'system-ui',
                      fontSize: description.size || '17px',
                      fontWeight: description.weight || 'normal',
                      lineHeight: '1.8'
                    }}
                  >
                    {description.label}
                  </div>
                </div>
              </div>

              {/* Content Footer */}
              <div className="px-6 md:px-10 lg:px-12 py-5 border-t border-slate-200/30 bg-gradient-to-r from-slate-50/50 to-transparent">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-xs md:text-sm text-slate-500">
                    <svg className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">
                      {language === 'mn' ? 'Шинэчлэгдсэн' : 'Updated'}: {new Date(page.updated_at).toLocaleDateString(language === 'mn' ? 'mn-MN' : 'en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  
                  {/* Share Button */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleCopyLink}
                      className="p-2 rounded-lg bg-slate-100/70 hover:bg-teal-100 text-slate-600 hover:text-teal-600 transition-all duration-300 hover:shadow-md"
                      title={language === 'mn' ? "Линк хуулах" : "Copy link"}
                      aria-label={language === 'mn' ? "Линк хуулах" : "Copy link"}
                    >
                      <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Spacer for mobile fixed button */}
            <div className="h-20 md:hidden"></div>
          </article>
        </Container>
      </main>
    </div>
  );
}