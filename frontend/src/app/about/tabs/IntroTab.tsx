'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import clsx from 'clsx';

// API Types
interface TimelineEvent {
  id: string;
  year: string;
  title_mn: string;
  title_en?: string;
  short_mn: string;
  short_en?: string;
  desc_mn: string;
  desc_en?: string;
  year_color?: string;
  title_color?: string;
  short_color?: string;
  desc_color?: string;
}

interface IntroData {
  origin_title_mn?: string;
  origin_title_en?: string;
  origin_p1_mn?: string;
  origin_p1_en?: string;
  origin_p2_mn?: string;
  origin_p2_en?: string;
  origin_p3_mn?: string;
  origin_p3_en?: string;
  origin_image?: string;
  origin_title_color?: string;
  what_we_do_title_mn?: string;
  what_we_do_title_en?: string;
  what_we_do_desc_mn?: string;
  what_we_do_desc_en?: string;
  what_we_do_color?: string;
  sme_title_mn?: string;
  sme_title_en?: string;
  sme_desc_1_mn?: string;
  sme_desc_1_en?: string;
  sme_desc_2_mn?: string;
  sme_desc_2_en?: string;
  sme_color?: string;
  citizen_title_mn?: string;
  citizen_title_en?: string;
  citizen_desc_1_mn?: string;
  citizen_desc_1_en?: string;
  citizen_desc_2_mn?: string;
  citizen_desc_2_en?: string;
  citizen_color?: string;
  timeline_title_mn?: string;
  timeline_title_en?: string;
  timeline_color?: string;
}

// Reusable IntersectionObserver hook for animations
function useInViewAnimation() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      {
        threshold: 0.35,
        rootMargin: '0px 0px -80px 0px',
      }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

// Safe color alpha helper - works with hex, rgb, hsl
function withAlpha(color: string | undefined, alpha = '30'): string {
  if (!color) return '#0891b2' + alpha;
  if (color.startsWith('#')) return `${color}${alpha}`;
  return color; // rgb(), hsl() passed as-is
}

export default function IntroTab() {
  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [revealedIndexes, setRevealedIndexes] = useState<Set<number>>(new Set());
  const [revealedSections, setRevealedSections] = useState<Set<string>>(new Set());
  const [timelineTitleRevealed, setTimelineTitleRevealed] = useState(false);
  
  // API States
  const [introData, setIntroData] = useState<IntroData | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const whatWeDo = useInViewAnimation();
  const smeSection = useInViewAnimation();
  const citizenSection = useInViewAnimation();
  const timelineTitle = useInViewAnimation();
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Fetch API data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
        
        const [introRes, timelineRes] = await Promise.all([
          fetch(`${apiUrl}/api/pages/intro`),
          fetch(`${apiUrl}/api/timeline-events`),
        ]);

        if (!introRes.ok || !timelineRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const introJson = await introRes.json();
        const timelineJson = await timelineRes.json();

        setIntroData(introJson);
        setTimelineEvents(Array.isArray(timelineJson) ? timelineJson : timelineJson.data || []);
      } catch (err) {
        console.error('Error fetching IntroTab data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // IntersectionObserver for timeline items (viewport band reveal)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const newlyVisible: number[] = [];

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            newlyVisible.push(index);
          }
        });

        if (newlyVisible.length) {
          setActiveIndex(newlyVisible[newlyVisible.length - 1]);

          setRevealedIndexes(prev => {
            const next = new Set(prev);
            newlyVisible.forEach(i => next.add(i));
            return next;
          });
        }
      },
      {
        rootMargin: '-30% 0px -30% 0px',
        threshold: 0.1,
      }
    );

    itemRefs.current.forEach((el) => el && observer.observe(el));

    return () => observer.disconnect();
  }, [timelineEvents]);

  const isTimelineEnd = activeIndex !== null && activeIndex >= timelineEvents.length - 2;

  // Track SME and Citizen section reveals (one-time animation)
  useEffect(() => {
    if (smeSection.visible && !revealedSections.has('sme')) {
      setRevealedSections(prev => {
        const next = new Set(prev);
        next.add('sme');
        return next;
      });
    }
  }, [smeSection.visible, revealedSections]);

  useEffect(() => {
    if (citizenSection.visible && !revealedSections.has('citizen')) {
      setRevealedSections(prev => {
        const next = new Set(prev);
        next.add('citizen');
        return next;
      });
    }
  }, [citizenSection.visible, revealedSections]);

  useEffect(() => {
    if (whatWeDo.visible && !revealedSections.has('whatWeDo')) {
      setRevealedSections(prev => {
        const next = new Set(prev);
        next.add('whatWeDo');
        return next;
      });
    }
  }, [whatWeDo.visible, revealedSections]);

  useEffect(() => {
    if (timelineTitle.visible && !timelineTitleRevealed) {
      setTimelineTitleRevealed(true);
    }
  }, [timelineTitle.visible, timelineTitleRevealed]);

  const toggleYear = (index: number) => {
    setExpandedYear(expandedYear === index ? null : index);
  };

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-500">
      {/* Origin Story */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6"> 
          <div 
            className="inline-block px-4 py-1.5 rounded-full text-sm font-medium"
            style={{
              backgroundColor: withAlpha(introData?.origin_title_color, '15'),
              color: introData?.origin_title_color || '#0891b2',
            }}
          >
             Бидний түүх
          </div>
          <h2 
            className="text-3xl font-bold leading-tight"
            style={{ color: introData?.origin_title_color || '#0891b2' }}
          >
            {introData?.origin_title_mn}
          </h2>
          <div className="space-y-4 text-gray-600 leading-relaxed text-lg text-justify">
            <p>
              {introData?.origin_p1_mn}
            </p>
            <p>
              {introData?.origin_p2_mn}
            </p>
             <p 
               className="font-semibold"
               style={{ color: introData?.origin_title_color || '#0891b2' }}
             >
                {introData?.origin_p3_mn}
            </p>
          </div>
        </div>
        <div className="relative h-[600px] w-full rounded-2xl overflow-hidden shadow-xl">
          {introData?.origin_image ? (
            <Image
              src={introData.origin_image}
              alt="About Us"
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 animate-pulse" />
          )}
        </div>
      </div>

       {/* What We Do Section */}
       <div 
         ref={whatWeDo.ref}
         className={`bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]
           ${revealedSections.has('whatWeDo')
             ? 'opacity-100 translate-y-0'
             : 'opacity-0 translate-y-12'}
         `}
       >
           <h3 
             className="text-2xl font-bold mb-4 flex items-center gap-3"
             style={{ color: introData?.what_we_do_color || '#0891b2' }}
           >
               <span 
                 className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                 style={{ backgroundColor: introData?.what_we_do_color || '#0891b2' }}
               >
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </span>
               {introData?.what_we_do_title_mn}
           </h3>
           <p className="text-gray-600 leading-relaxed text-justify">
               {introData?.what_we_do_desc_mn}
           </p>
       </div>

       {/* SME and Citizen Wealth */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
             {/* SME */}
            <div 
              ref={smeSection.ref}
              className={`space-y-4 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]
                ${revealedSections.has('sme')
                  ? 'opacity-100 translate-x-0'
                  : 'opacity-0 -translate-x-8'}
              `}
            >
                <h3 
                  className="text-2xl font-bold border-b-2 pb-2 inline-block"
                  style={{ 
                    color: introData?.sme_color || '#0891b2',
                    borderColor: introData?.sme_color || '#0891b2'
                  }}
                >
                  {introData?.sme_title_mn}
                </h3>
                <div className="text-gray-600 text-justify leading-relaxed space-y-4">
                    <p>{introData?.sme_desc_1_mn}</p>
                    <p>{introData?.sme_desc_2_mn}</p>
                </div>
            </div>
             {/* Citizen Wealth */}
            <div 
              ref={citizenSection.ref}
              className={`space-y-4 transition-all duration-900 delay-150 ease-[cubic-bezier(0.16,1,0.3,1)]
                ${revealedSections.has('citizen')
                  ? 'opacity-100 translate-x-0'
                  : 'opacity-0 translate-x-8'}
              `}
            >
                <h3 
                  className="text-2xl font-bold border-b-2 pb-2 inline-block"
                  style={{ 
                    color: introData?.citizen_color || '#0891b2',
                    borderColor: introData?.citizen_color || '#0891b2'
                  }}
                >
                  {introData?.citizen_title_mn}
                </h3>
                 <div className="text-gray-600 text-justify leading-relaxed space-y-4">
                    <p>{introData?.citizen_desc_1_mn}</p>
                    <p>{introData?.citizen_desc_2_mn}</p>
                </div>
            </div>
        </div>

        {/* Timeline Section */}
        <div ref={timelineRef} className="py-12 relative overflow-hidden">
            <h3 
              ref={timelineTitle.ref}
              className={`text-3xl font-bold text-center mb-16
                transition-all duration-600 ease-out
                ${timelineTitleRevealed
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-8'}
              `}
              style={{ color: introData?.timeline_color || '#0891b2' }}
            >
              {introData?.timeline_title_mn}
            </h3>
            
            {/* Vertical Line */}
            <div 
              className="absolute left-[27px] md:left-1/2 top-32 bottom-12 w-0.5 transform md:-translate-x-1/2"
              style={{ backgroundColor: withAlpha(introData?.timeline_color) }}
            ></div>

            <div className="space-y-12">
                {timelineEvents.map((event, index) => {
                     const isExpanded = expandedYear === index;
                     const isEven = index % 2 === 0;

                     // Content Card Component
                     const ContentCard = (
                        <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all group relative z-10">
                            <div className="md:hidden flex items-center gap-3 mb-4">
                                <span 
                                  className="text-2xl font-bold"
                                  style={{ color: event.year_color || '#0891b2' }}
                                >
                                  {event.year}
                                </span>
                                <div 
                                  className="h-px flex-1"
                                  style={{ backgroundColor: withAlpha(event.year_color, '40') }}
                                ></div>
                            </div>

                            <h4 
                              className="text-lg font-bold mb-2 group-hover:opacity-75 transition-colors"
                              style={{ color: event.title_color || '#0f172a' }}
                            >
                              {event.title_mn}
                            </h4>
                            <p 
                              className="text-sm leading-relaxed"
                              style={{ color: event.short_color || '#4b5563' }}
                            >
                                {event.short_mn}
                            </p>
                            
                            <div className={clsx(
                                "grid transition-all duration-300 ease-in-out",
                                isExpanded ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0 mt-0"
                            )}>
                                <div className="overflow-hidden min-h-0">
                                    <div 
                                      className="pt-4 border-t text-sm leading-relaxed text-justify"
                                      style={{ 
                                        borderColor: `${event.desc_color || '#e5e7eb'}`,
                                        color: event.desc_color || '#4b5563'
                                      }}
                                    >
                                        {event.desc_mn}
                                    </div>
                                </div>
                            </div>

                           <button
                              onClick={() => toggleYear(index)}
                              className="flex items-center gap-2 text-sm font-medium mt-4 hover:bg-gray-50 px-3 py-1.5 rounded-lg -ml-3 w-fit transition-colors"
                              style={{ color: event.year_color || '#16a34a' }}
                            >
                              {isExpanded ? 'Хураангуйлах' : 'Дэлгэрэнгүй'}
                              <svg 
                                className={clsx("w-4 h-4 transition-transform duration-300", isExpanded ? "rotate-180" : "")} 
                                fill="none" viewBox="0 0 24 24" stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                        </div>
                     );

                     return (
                        <div 
                          key={event.id}
                          ref={(el) => { if (el) itemRefs.current[index] = el; }}
                          data-index={index}
                          className={clsx(
                            "relative flex flex-col md:flex-row items-center md:items-start group",
                            "transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
                            revealedIndexes.has(index)
                              ? "opacity-100 translate-x-0"
                              : isEven
                                ? "opacity-0 -translate-x-8"
                                : "opacity-0 translate-x-8",
                            activeIndex === index && "z-10"
                          )}
                        >
                            {/* Mobile/Desktop Dot */}
                            <div 
                              className="absolute left-[18px] md:left-1/2 w-5 h-5 rounded-full border-4 border-white shadow-sm z-20 top-0 md:top-8 transform md:-translate-x-1/2"
                              style={{ backgroundColor: event.year_color || '#0891b2' }}
                            ></div>
                            
                            {/* Left Side (Desktop) */}
                            <div className={clsx(
                                "w-full md:w-1/2 pl-16 md:pl-0 md:pr-12 md:text-right flex md:block",
                                isEven ? "" : "md:flex md:justify-end" 
                            )}>
                                {/* Mobile: Always Show Card */}
                                <div className="md:hidden w-full">
                                    {ContentCard}
                                </div>

                                {/* Desktop: Show Card if Even, Year if Odd */}
                                <div className="hidden md:block w-full">
                                    {isEven ? ContentCard : (
                                         <span 
                                           className="text-5xl font-bold sticky top-32 transition-colors duration-300"
                                           style={{ 
                                             color: activeIndex === index ? (event.year_color || '#0891b2') : `${event.year_color || '#0891b2'}40`
                                           }}
                                         >
                                           {event.year}
                                         </span>
                                    )}
                                </div>
                            </div>

                            {/* Right Side (Desktop) */}
                            <div className="hidden md:block w-full md:w-1/2 md:pl-12 text-left">
                                 {/* Desktop: Show Year if Even, Card if Odd */}
                                 {isEven ? (
                                      <span 
                                        className="text-5xl font-bold sticky top-32 transition-colors duration-300"
                                        style={{ 
                                          color: activeIndex === index ? (event.year_color || '#0891b2') : `${event.year_color || '#0891b2'}40`
                                        }}
                                      >
                                        {event.year}
                                      </span>
                                 ) : ContentCard}
                            </div>
                        </div>
                     );
                })}
            </div>

            {/* Bottom Blur Overlay */}
            <div
              className={clsx(
                "pointer-events-none absolute bottom-0 left-0 w-full h-32 transition-all duration-700",
                isTimelineEnd
                  ? "backdrop-blur-0 opacity-0"
                  : "backdrop-blur-sm opacity-100"
              )}
            >
              <div className="absolute inset-0 bg-linear-to-t from-white via-white/80 to-transparent" />
            </div>
        </div>

    </div>
  );
}
