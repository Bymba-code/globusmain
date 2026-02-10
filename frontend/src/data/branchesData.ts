/**
 * DEPRECATED - Mock Branches File Removed
 * 
 * All branches data now comes from backend API.
 * Endpoint: GET /api/branches/
 * 
 * This file contains only type definitions for reference.
 * Do not add mock data here.
 */

export interface Branch {
  branch_id: number;
  branch_name: string;
  address: string;
  work_days: string | null;
  work_hours: string | null;
  latitude: string | null;
  longitude: string | null;
  phone_numbers: string[] | null;
  province_name: string | null;
  district_name: string | null;
  region_name: string | null;
  image?: string;
}

