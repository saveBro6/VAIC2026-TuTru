import { forwardRef, type InputHTMLAttributes } from 'react'
interface Props extends InputHTMLAttributes<HTMLInputElement> { label: string; error?: string }
export const AppInput = forwardRef<HTMLInputElement, Props>(({ label, error, className = '', ...props }, ref) => <label className="block space-y-1.5"><span className="text-sm font-semibold text-slate-700">{label}</span><input ref={ref} className={`w-full rounded-xl border bg-white px-5 py-3 text-slate-900 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-50 ${error ? 'border-red-500' : 'border-slate-200'} ${className}`} {...props}/>{error && <span className="text-sm text-red-600">{error}</span>}</label>)
AppInput.displayName = 'AppInput'
