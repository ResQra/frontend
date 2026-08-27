import * as React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils.js'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded px-2 py-0.5 font-mono text-[10px] font-semibold border transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-white text-black border-white font-bold shadow-xs',
        secondary: 'bg-zinc-900 text-zinc-300 border-zinc-800',
        outline: 'border-zinc-700 text-zinc-300 bg-transparent',
        critical: 'bg-white text-black border-white font-black animate-pulse shadow-md',
        elevated: 'bg-zinc-800 text-zinc-200 border-zinc-600 font-bold',
        low: 'bg-zinc-950 text-zinc-400 border-zinc-800',
        success: 'bg-zinc-900 text-emerald-400 border-emerald-900',
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
