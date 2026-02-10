import axios from 'axios'

const API_BASE_URL = 'http://127.0.0:8000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    // Add auth token if exists
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       if (typeof window !== 'undefined') {
//         localStorage.removeItem('token')
//       }
//     }
//     return Promise.reject(error)
//   }
// )

export const fetcher = async <T>(url: string): Promise<T> => {
  const response = await api.get<T>(url)
  return response.data
}

export const postData = async <T, D = unknown>(url: string, data: D): Promise<T> => {
  const response = await api.post<T>(url, data)
  return response.data
}

export default api
