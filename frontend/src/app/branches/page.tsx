"use client";

import { useState, useMemo, useEffect } from "react";
import Container from "@/components/Container";
import BranchesMap from "@/components/BranchesMap";

// Type definition (Backend shape from Postman)
interface Branch {
  id: string
  name: string
  location: string
  image?: string | null
  area?: string | null
  city?: string | null
  district?: string | null
  open?: string | null
  time?: string | null
  latitude: number | null
  longitude: number | null
  phones: { phone: string }[]
}

// Backend-ready fetch
const getBranches = async (): Promise<Branch[]> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
    const response = await fetch(`${apiUrl}/api/branches/`)
    if (!response.ok) {
      throw new Error(`Failed to fetch branches: ${response.status}`)
    }
    return response.ok ? response.json() : []
  } catch (error) {
    console.error('Error fetching branches:', error)
    return []
  }
};

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRegion, setActiveRegion] = useState<"all" | "ulaanbaatar" | "aimag">("all");
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getBranches();
        setBranches(data);
      } catch (error) {
        console.error('Failed to load branches:', error);
        setError('Салбаруудыг ачаалахад алдаа гарлаа');
        setBranches([]);
      } finally {
        setLoading(false);
      }
    };
    loadBranches();
  }, []);

  // Шүүлтүүр - city дээр үндэслэн (Backend-д city заавал ирдэг)
  const filteredBranches = useMemo(() => {
    if (activeRegion === "ulaanbaatar") {
      return branches.filter((b) => (b.city ?? '') === "Улаанбаатар")
    } else if (activeRegion === "aimag") {
      return branches.filter((b) => (b.city ?? '') !== "Улаанбаатар")
    }
    return branches
  }, [activeRegion, branches])

  return (
    <main className="min-h-screen bg-white">
      <Container>
        <div className="py-6 md:py-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Салбарын байршил</h1>

          {/* Шүүлтүүр */}
          <div className="flex items-center gap-1 mb-8 border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => {
                setActiveRegion("all");
                setSelectedBranch(null);
              }}
              className={`px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px whitespace-nowrap ${activeRegion === "all"
                ? "text-teal-600 border-teal-600"
                : "text-gray-500 border-transparent hover:text-gray-900"
                }`}
            >
              Бүгд
            </button>
            <button
              onClick={() => {
                setActiveRegion("ulaanbaatar");
                setSelectedBranch(null);
              }}
              className={`px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px whitespace-nowrap ${activeRegion === "ulaanbaatar"
                ? "text-teal-600 border-teal-600"
                : "text-gray-500 border-transparent hover:text-gray-900"
                }`}
            >
              Улаанбаатар
            </button>
            <button
              onClick={() => {
                setActiveRegion("aimag");
                setSelectedBranch(null);
              }}
              className={`px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px whitespace-nowrap ${activeRegion === "aimag"
                ? "text-teal-600 border-teal-600"
                : "text-gray-500 border-transparent hover:text-gray-900"
                }`}
            >
              Орон нутаг
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-16">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
                <p className="text-gray-600 font-medium">Салбаруудыг ачаалж байна...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <svg className="w-12 h-12 text-red-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-red-900 mb-1">Алдаа гарлаа</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Дахин оролдох
              </button>
            </div>
          )}

          {/* Content */}
          {!loading && !error && (
          <div className="space-y-6">
            {/* Google Map */}
            <div className="h-[300px] md:h-[400px] bg-gray-100 rounded-2xl overflow-hidden relative shadow-inner">
              <BranchesMap
                branches={filteredBranches}
                selectedBranch={selectedBranch}
                onSelect={setSelectedBranch}
              />
            </div>
          </div>
          )}
        </div>
      </Container>
    </main>
  );
}
