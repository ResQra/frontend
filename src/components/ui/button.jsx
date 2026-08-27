import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils.js'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 select-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          'bg-white text-black shadow hover:bg-zinc-200 active:scale-[0.98]',
        destructive:
          'bg-red-950 text-red-200 border border-red-800 hover:bg-red-900',
        outline:
          'border border-zinc-800 bg-black text-zinc-200 hover:bg-zinc-900 hover:text-white hover:border-zinc-700',
        secondary:
          'bg-zinc-900 text-zinc-100 border border-zinc-800 hover:bg-zinc-800',
        ghost:
          'text-zinc-400 hover:bg-zinc-900 hover:text-white',
        link: 'text-white underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-6',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
