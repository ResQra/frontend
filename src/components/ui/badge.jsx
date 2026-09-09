import * as React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils.js'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded px-2 py-0.5 font-mono text-[10px] font-semibold border transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-slate-900 text-white border-slate-900 font-bold shadow-xs',
        secondary: 'bg-slate-100 text-slate-600 border-slate-200',
        outline: 'border-slate-300 text-slate-600 bg-transparent',
        critical: 'bg-red-600 text-white border-red-600 font-black animate-pulse shadow-md',
        elevated: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
        low: 'bg-slate-50 text-slate-500 border-slate-200',
        success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
