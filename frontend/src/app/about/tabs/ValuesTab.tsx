'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

// API Types
interface Value {
  id: string;
  title_mn: string;
  title_en?: string;
  desc_mn: string;
  desc_en?: string;
  icon?: string;
  title_color?: string;
  desc_color?: string;
}

interface ValuesData {
  vision: Value;
  mission: Value;
}

// Icon mapping - backend sends icon names, frontend renders them
const ICON_MAP: Record<string, (className: string) => React.ReactNode> = {
  'shield-check': (className) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  'users': (className) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  'lightning': (className) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  'check-circle': (className) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  'trend-up': (className) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
};

// Reusable IntersectionObserver hook for animations
function useInViewAnimation() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );

    if (ref.current) observer.observe(ref.current);

    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

// Safe color alpha helper
function withAlpha(color: string | undefined, alpha = '30'): string {
  if (!color) return '#16a34a' + alpha;
  if (color.startsWith('#')) return `${color}${alpha}`;
  return color;
}


export default function ValuesTab() {
  const vision = useInViewAnimation();
  const mission = useInViewAnimation();
  const valuesSection = useInViewAnimation();

  // API States
  const [visionData, setVisionData] = useState<Value | null>(null);
  const [missionData, setMissionData] = useState<Value | null>(null);
  const [coreValues, setCoreValues] = useState<Value[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch API data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
        
        const response = await fetch(`${apiUrl}/api/values`);

        if (!response.ok) {
          throw new Error('Failed to fetch values data');
        }

        const data = await response.json();

        setVisionData(data.vision);
        setMissionData(data.mission);
        setCoreValues(Array.isArray(data.values) ? data.values : []);
      } catch (err) {
        console.error('Error fetching ValuesTab data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderIcon = (iconName: string | undefined, color: string = '#16a34a') => {
    if (!iconName || !ICON_MAP[iconName]) {
      return (
        <svg className="w-6 h-6" style={{ color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    }
    return ICON_MAP[iconName](`w-6 h-6`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-32">
        
        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-32">
            <div className="animate-pulse space-y-8 w-full max-w-3xl">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            Error loading values: {error}
          </div>
        )}

        {/* Content */}
        {!loading && !error && (!visionData || !missionData || coreValues.length === 0) ? (
          <div className="text-center text-gray-500 py-32">
            No data available. Please check the API.
          </div>
        ) : !loading && !error ? (
        <>
        
        {/* 1. VISION */}
        <section 
          ref={vision.ref}
          className={`grid md:grid-cols-2 gap-16 items-center transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform will-change-opacity
            ${vision.visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}
          `}
        >
            <div className="space-y-6">
                <span 
                  className="text-sm font-semibold tracking-wider uppercase"
                  style={{ color: visionData?.title_color || '#16a34a' }}
                >
                    Алсын хараа
                </span>
                <h2 
                  className="text-3xl font-bold leading-tight"
                  style={{ color: visionData?.desc_color || '#0f172a' }}
                >
                    {visionData?.desc_mn}
                </h2>
            </div>
            <div className="relative h-[360px] w-full overflow-hidden rounded-2xl border border-gray-100">
                <Image
                    src="/images/news1.jpg" 
                    alt="Vision"
                    fill
                    className={`object-cover transition-transform duration-1000 ease-out
                      ${vision.visible ? 'scale-100' : 'scale-105'}
                    `}
                />
            </div>
        </section>

        {/* Divider */}
        <div className="hidden md:block h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

        {/* 2. MISSION */}
        <section 
          ref={mission.ref}
          className={`grid md:grid-cols-2 gap-16 items-center transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform will-change-opacity
            ${mission.visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}
          `}
        >
             <div className="order-2 md:order-1 relative h-[360px] w-full overflow-hidden rounded-2xl border border-gray-100">
                 <Image
                    src="/images/news2.jpg" 
                    alt="Mission"
                    fill
                    className={`object-cover transition-transform duration-1000 ease-out
                      ${mission.visible ? 'scale-100' : 'scale-105'}
                    `}
                />
            </div>

            <div className="order-1 md:order-2 space-y-6">
                 <span 
                   className="text-sm font-semibold tracking-wider uppercase"
                   style={{ color: missionData?.title_color || '#16a34a' }}
                 >
                    Эрхэм зорилго
                </span>
                <h2 
                  className="text-3xl font-bold leading-tight"
                  style={{ color: missionData?.desc_color || '#0f172a' }}
                >
                    {missionData?.desc_mn}
                </h2>
            </div>
        </section>

        {/* 3. CORE VALUES */}
        <section
          ref={valuesSection.ref}
          className={`transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform will-change-opacity
            ${valuesSection.visible
              ? 'motion-safe:opacity-100 motion-safe:translate-y-0 motion-reduce:opacity-100'
              : 'motion-safe:opacity-0 motion-safe:translate-y-10 motion-reduce:opacity-0'}
          `}
        >
             <div className="max-w-3xl mb-16">
                <h2 
                  className="text-2xl font-semibold mb-4 font-serif"
                  style={{ color: visionData?.title_color || '#16a34a' }}
                >
                  Бидний үнэт зүйлс
                </h2>
                <div className="w-12 h-px mb-6" style={{ backgroundColor: visionData?.title_color || '#d1d5db' }}></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coreValues.map((value, index) => (
                    <div 
                        key={value.id}
                        role="article"
                        aria-label={value.title_mn}
                        className={`bg-white border border-gray-200 rounded-lg p-6
                          transition-all duration-1000 sm:duration-700
                          hover:border-gray-300 hover:bg-gray-50
                          ${valuesSection.visible
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-6'}
                        `}
                        style={{ transitionDelay: `${index * 150}ms` }}
                    >
                        <div className="mb-4 flex items-center gap-3">
                          <div style={{ color: value.title_color || '#16a34a' }}>
                            {renderIcon(value.icon, value.title_color || '#16a34a')}
                          </div>
                          <h3 
                            className="text-base font-semibold"
                            style={{ color: value.title_color || '#374151' }}
                          >
                            {value.title_mn}
                          </h3>
                        </div>
                        <p 
                          className="text-sm leading-relaxed"
                          style={{ color: value.desc_color || '#9ca3af' }}
                        >
                            {value.desc_mn}
                        </p>
                    </div>
                ))}
            </div>
        </section>

        </>
        ) : null}

    </div>
  );
}