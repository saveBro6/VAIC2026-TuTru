import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 15_000 } } })
createRoot(document.getElementById('root')!).render(<StrictMode><QueryClientProvider client={queryClient}><BrowserRouter><App/><Toaster position="top-right" toastOptions={{ duration: 3500 }}/></BrowserRouter></QueryClientProvider></StrictMode>)
