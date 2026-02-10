'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import clsx from 'clsx';
import { useSearchParams } from 'next/navigation';

// Types
interface Shareholder {
  id: string
  name: string
  role: string
  desc: string
  image?: string
}

interface ManagementMember {
  id: string
  name: string
  role: string
  desc: string
  image?: string
}

interface BranchManager {
  id: string
  name: string
  location: string
  position: string
  district: string
  image?: string
}

type Person = Shareholder | ManagementMember | BranchManager;

const tabs = [
  { id: 'shareholders', label: 'Хувьцаа эзэмшигчид' },
  { id: 'management', label: 'Менежментийн баг' },
  { id: 'branches', label: 'Салбар' }
];

// Reusable PersonCard component
interface PersonCardProps {
  image: string;
  name: string;
  subtitle: string;
  onClick: () => void;
}

function PersonCard({ image, name, subtitle, onClick }: PersonCardProps) {
  return (
    <div 
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="group cursor-pointer bg-white border border-gray-200 rounded-xl p-4 sm:p-6 transition-colors duration-200 outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
    >
      <div className="relative w-full aspect-[3/4] max-h-[220px] sm:max-h-none mb-3 sm:mb-4 rounded-lg overflow-hidden bg-gray-100">
        <Image
          src={image || '/img/avatar-placeholder.png'}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover object-top"
        />
      </div>

      <h3 className="text-sm sm:text-[15px] font-semibold text-gray-900 transition-colors">
        {name}
      </h3>

      <p className="hidden sm:block text-[11px] text-gray-500 uppercase tracking-widest mt-2">
        {subtitle}
      </p>
    </div>
  );
}

function ShareholdersGrid({ shareholders, onSelect }: { shareholders: Shareholder[]; onSelect: (person: Shareholder) => void }) {
  return (
    <>
      <h3 className="sr-only">Хувьцаа эзэмшигчид</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10">
        {shareholders.map((person) => (
          <PersonCard
            key={person.id}
            image={person.image || '/img/avatar-placeholder.png'}
            name={person.name}
            subtitle={person.role}
            onClick={() => onSelect(person)}
          />
        ))}
      </div>
    </>
  );
}

function ManagementGrid({ management, onSelect }: { management: ManagementMember[]; onSelect: (person: ManagementMember) => void }) {
  return (
    <>
      <h3 className="sr-only">Менежментийн баг</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10">
        {management.map((person) => (
          <PersonCard
            key={person.id}
            image={person.image || '/img/avatar-placeholder.png'}
            name={person.name}
            subtitle={person.role}
            onClick={() => onSelect(person)}
          />
        ))}
      </div>
    </>
  );
}

function BranchesGrid({ branches, onSelect }: { branches: BranchManager[]; onSelect: (person: BranchManager) => void }) {
  return (
    <>
      <h3 className="sr-only">Салбар</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10">
        {branches.map((branch) => (
          <PersonCard
            key={branch.id}
            image={branch.image || '/img/avatar-placeholder.png'}
            name={branch.name}
            subtitle={branch.position}
            onClick={() => onSelect(branch)}
          />
        ))}
      </div>
    </>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-24 text-center text-gray-500">
      <p className="text-sm">{text}</p>
    </div>
  );
}
// Main component
export default function GovernanceTab() {
  const searchParams = useSearchParams();
  const activeSubTab = searchParams.get('sub') || 'shareholders';

  const [shareholders, setShareholders] = useState<Shareholder[]>([])
  const [management, setManagement] = useState<ManagementMember[]>([])
  const [branches, setBranches] = useState<BranchManager[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)

  // Update tab when URL changes
  useEffect(() => {
    setSelectedPerson(null)
  }, [activeSubTab])

  useEffect(() => {
    const fetchGovernanceData = async () => {
      try {
        setLoading(true)
        setError(null)
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
        
        // Fetch all governance data
        const [shareholdersRes, managementRes, branchesRes] = await Promise.all([
          fetch(`${apiUrl}/api/governance/shareholders`),
          fetch(`${apiUrl}/api/governance/management`),
          fetch(`${apiUrl}/api/governance/branches`),
        ])

        if (shareholdersRes.ok) {
          const data = await shareholdersRes.json()
          setShareholders(Array.isArray(data) ? data : data.data || [])
        }
        if (managementRes.ok) {
          const data = await managementRes.json()
          setManagement(Array.isArray(data) ? data : data.data || [])
        }
        if (branchesRes.ok) {
          const data = await branchesRes.json()
          setBranches(Array.isArray(data) ? data : data.data || [])
        }
      } catch (err) {
        console.error('Error fetching governance data:', err)
        setError('Компанийн засаглалын мэдээлэл ачаалж чадсангүй')
      } finally {
        setLoading(false)
      }
    }

    fetchGovernanceData()
  }, [])

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = selectedPerson ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [selectedPerson])

  // ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedPerson(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (loading) return <div className="text-center py-20">Ачаалж байна...</div>
  if (error) return <div className="text-center py-20 text-red-600">{error}</div>

  // Content map for scalability
  const contentMap: Record<string, React.ReactNode> = {
    shareholders: <ShareholdersGrid shareholders={shareholders} onSelect={setSelectedPerson} />,
    management: <ManagementGrid management={management} onSelect={setSelectedPerson} />,
    branches: <BranchesGrid branches={branches} onSelect={setSelectedPerson} />
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="sr-only">Компанийн засаглал</h2>
      
      {/* Sub-navigation (Tabs) */}
      <div className="flex justify-center gap-8 border-b border-gray-200 mb-12">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setSelectedPerson(null)
              window.history.pushState({}, '', `?sub=${tab.id}`)
            }}
            className={clsx(
              'pb-3 text-sm font-medium transition-colors duration-200 outline-none focus:ring-offset-2 focus:ring-2 focus:ring-teal-500',
              activeSubTab === tab.id
                ? 'text-teal-600 border-b-2 border-teal-600'
                : 'text-gray-500 hover:text-gray-900'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div>
        {contentMap[activeSubTab] || <EmptyState text="Өгөгдөл олдсонгүй" />}
      </div>

      {/* Modal */}
      {selectedPerson && (
        <div 
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-0 sm:items-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto"
          onClick={() => setSelectedPerson(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div 
            className="bg-white w-full max-w-4xl rounded-2xl p-8 relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setSelectedPerson(null)}
              aria-label="Хаах"
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors outline-none focus:ring-2 focus:ring-teal-500"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-col md:flex-row gap-8 md:gap-12">
              {/* Image Side */}
              <div className="w-full md:w-1/3 flex-shrink-0">
                <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-gray-100">
                  <Image
                    src={selectedPerson.image || '/img/avatar-placeholder.png'}
                    alt={selectedPerson.name}
                    fill
                    className="object-cover object-top"
                  />
                </div>
              </div>

              {/* Content Side */}
              <div className="w-full md:w-2/3 flex flex-col justify-start">
                <h3 id="modal-title" className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900">
                  {selectedPerson.name}
                </h3>
                <p className="text-xs sm:text-sm text-teal-600 uppercase tracking-wide mt-1 mb-4 sm:mb-6 md:mb-8">
                  {'role' in selectedPerson ? selectedPerson.role : selectedPerson.position}
                </p>
                
                {'desc' in selectedPerson && (
                  <div className="space-y-3 sm:space-y-4 md:space-y-5 text-gray-600 leading-6 sm:leading-7 md:leading-7 text-xs sm:text-sm">
                    {selectedPerson.desc.split('\n\n').map((paragraph: string, i: number) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}