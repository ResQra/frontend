import * as React from 'react'
import { cn } from '../../lib/utils.js'

function Card({ className, ...props }) {
  return (
    <div
      data-slot="card"
      className={cn(
        'flex flex-col rounded-xl border border-zinc-800 bg-[#09090b] text-zinc-100 shadow-xl',
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }) {
  return (
    <div
      data-slot="card-header"
      className={cn('flex flex-col gap-1.5 p-4 border-b border-zinc-800/80', className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }) {
  return (
    <h3
      data-slot="card-title"
      className={cn('font-mono text-xs font-bold uppercase tracking-wider text-white', className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }) {
  return (
    <p
      data-slot="card-description"
      className={cn('text-xs text-zinc-400', className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }) {
  return (
    <div
      data-slot="card-content"
      className={cn('p-4', className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center p-4 border-t border-zinc-800/80', className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
}
