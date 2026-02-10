'use client';

import { useState, useEffect } from 'react';

interface Department {
  id: string;
  name_mn: string;
  name_en: string;
  order: number;
}

export default function StructureTab() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load departments from backend
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/organizational-structure/departments/`
        );

        if (!response.ok) {
          throw new Error('Failed to load departments');
        }

        const data = await response.json();
        
        if (!Array.isArray(data)) {
          throw new Error('Invalid response format');
        }

        setDepartments(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load departments:', err);
        setError('Failed to load organizational structure');
        setDepartments([]);
      } finally {
        setLoading(false);
      }
    };

    loadDepartments();
  }, []);

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-500">
        
        {/* Intro Text */}
       <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Бүтэц, зохион байгуулалт</h2>
       </div>

        {/* Organization Chart */}
       <div className="overflow-x-auto pb-8">
           <div className="min-w-[800px] flex flex-col items-center">
               
                {/* Level 2 Container */}
                <div className="flex justify-between w-full relative px-4">
                     {/* Horizontal Connecting Line */}
                     <div className="absolute top-0 left-16 right-16 h-0.5 bg-gray-300 -translate-y-0.5"></div>

                     {/* Department Nodes */}
                     {departments.length > 0 ? (
                       departments
                         .sort((a, b) => a.order - b.order)
                         .map((dept) => (
                           <div key={dept.id} className="flex flex-col items-center relative pt-8 mx-2">
                             {/* Vertical Connector from Top Line */}
                             <div className="absolute top-0 w-0.5 h-8 bg-gray-300"></div>
                             
                             <div className="w-40 bg-white border-2 border-teal-100 rounded-xl p-3 shadow-sm hover:shadow-md hover:border-teal-300 transition-all text-center group cursor-default">
                               <h4 className="text-sm font-semibold text-gray-800 group-hover:text-teal-700">{dept.name_mn}</h4>
                             </div>
                           </div>
                         ))
                     ) : (
                       <div className="text-center text-gray-500 py-8 col-span-full">
                         {loading ? 'Ачаалж байна...' : error ? 'Алдаа гарлаа' : 'Өгөгдөл байхгүй'}
                       </div>
                     )}
                </div>
           </div>
       </div>

    </div>
  );
}