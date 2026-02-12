"use client";

import { useState, useEffect, useMemo } from "react";
import Container from "@/components/Container";
import BranchesMap from "@/components/BranchesMap";
import { MapPin, Clock, Phone, Calendar } from "lucide-react";
import {axiosInstance} from "@/lib/axios"; 

interface Phone {
  id: number;
  phone: string;
}

interface Branch {
  id: number;
  name: string;
  location: string;
  image: string;
  image_url: string;
  area: string;
  city: string;
  district: string;
  open: string;
  time: string;
  latitude: string;
  longitude: string;
  phones: Phone[];
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRegion, setActiveRegion] = useState<"all" | "ulaanbaatar" | "aimag">("all");
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axiosInstance.get("/branch"); 
        setBranches(response.data);
      } catch (err: any) {
        console.error("Error fetching branches:", err);
        setError(err.response?.data?.message || "Салбаруудыг ачааллахад алдаа гарлаа");
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, []);

  const filteredBranches = useMemo(() => {
    if (activeRegion === "ulaanbaatar") {
      return branches.filter((b) => b.city.toLowerCase().includes("улаанбаатар"));
    } else if (activeRegion === "aimag") {
      return branches.filter((b) => !b.city.toLowerCase().includes("улаанбаатар"));
    }
    return branches;
  }, [activeRegion, branches]);

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <Container>
          <div className="py-6 md:py-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Салбарын байршил</h1>
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4"></div>
                <p className="text-gray-600">Ачааллаж байна...</p>
              </div>
            </div>
          </div>
        </Container>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-white">
        <Container>
          <div className="py-6 md:py-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Салбарын байршил</h1>
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Дахин оролдох
                </button>
              </div>
            </div>
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <Container>
        <div className="py-6 md:py-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Салбарын байршил</h1>

          <div className="flex items-center gap-1 mb-8 border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => {
                setActiveRegion("all");
                setSelectedBranch(null);
              }}
              className={`px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px whitespace-nowrap ${
                activeRegion === "all"
                  ? "text-teal-600 border-teal-600"
                  : "text-gray-500 border-transparent hover:text-gray-900"
              }`}
            >
              Бүгд ({branches.length})
            </button>
            <button
              onClick={() => {
                setActiveRegion("ulaanbaatar");
                setSelectedBranch(null);
              }}
              className={`px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px whitespace-nowrap ${
                activeRegion === "ulaanbaatar"
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
              className={`px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px whitespace-nowrap ${
                activeRegion === "aimag"
                  ? "text-teal-600 border-teal-600"
                  : "text-gray-500 border-transparent hover:text-gray-900"
              }`}
            >
              Орон нутаг
            </button>
          </div>

          <div className="space-y-6">
            <div className="h-[300px] md:h-[400px] bg-gray-100 rounded-2xl overflow-hidden relative shadow-inner">
              <BranchesMap
                branches={filteredBranches}
                selectedBranch={selectedBranch}
                onSelect={setSelectedBranch}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBranches.map((branch) => (
                <div
                  key={branch.id}
                  onClick={() => setSelectedBranch(branch)}
                  className={`bg-white border rounded-xl overflow-hidden transition-all cursor-pointer hover:shadow-lg ${
                    selectedBranch?.id === branch.id
                      ? "border-teal-500 shadow-md"
                      : "border-gray-200"
                  }`}
                >
                  {branch.image_url && (
                    <div className="relative h-48 w-full bg-gray-100">
                      <img
                        src={`http://127.0.0.1:8000${branch.image_url}`}
                        alt={branch.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder-branch.jpg"; 
                        }}
                      />
                    </div>
                  )}

                  <div className="p-5 space-y-3">
                    <h3 className="text-xl font-bold text-gray-900">{branch.name}</h3>

                    <div className="flex items-start gap-2 text-gray-600">
                      <MapPin className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p>{branch.location}</p>
                        <p className="text-gray-500">
                          {branch.area}, {branch.city}, {branch.district}-р хороо
                        </p>
                      </div>
                    </div>

                    {/* Цагийн хуваарь */}
                    <div className="flex items-start gap-2 text-gray-600">
                      <Calendar className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p>{branch.open}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-5 h-5 text-teal-600 flex-shrink-0" />
                      <p className="text-sm">{branch.time}</p>
                    </div>

                    {/* Утас */}
                    {branch.phones && branch.phones.length > 0 && (
                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-start gap-2 text-gray-600">
                          <Phone className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                          <div className="text-sm space-y-1">
                            {branch.phones.map((phone) => (
                              <a
                                key={phone.id}
                                href={`tel:${phone.phone}`}
                                className="block hover:text-teal-600 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {phone.phone}
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBranch(branch);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-full mt-4 px-4 py-2 bg-teal-50 text-teal-600 rounded-lg text-sm font-medium hover:bg-teal-100 transition-colors"
                    >
                      Газрын зургаас харах
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredBranches.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Салбар олдсонгүй</p>
              </div>
            )}
          </div>
        </div>
      </Container>
    </main>
  );
}