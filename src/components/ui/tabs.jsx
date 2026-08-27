import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '../../lib/utils.js'

const Tabs = TabsPrimitive.Root

function TabsList({ className, ...props }) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex h-9 items-center justify-center rounded-lg bg-zinc-950 p-1 text-zinc-400 border border-zinc-800',
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-mono font-medium transition-all focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:font-bold data-[state=active]:shadow-xs',
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }) {
  return (
    <TabsPrimitive.Content
      className={cn(
        'mt-2 focus-visible:outline-hidden',
        className
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
