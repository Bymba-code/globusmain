import axios from 'axios'

export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// axiosInstance.interceptors.request.use(
//   (config) => {
//     const token = process.env.API_TOKEN
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`
//     }
//     console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`)
//     return config
//   },
//   (error) => {
//     console.error('[API Request Error]', error)
//     return Promise.reject(error)
//   }
// )

// axiosInstance.interceptors.response.use(
//   (response) => {
//     console.log(`[API Response] ${response.status} ${response.config.url}`)
//     return response
//   },
//   (error) => {
//     console.error('[API Response Error]', error.response?.status, error.message)
//     return Promise.reject(error)
//   }
// )