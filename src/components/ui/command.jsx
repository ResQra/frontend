import * as React from 'react'
import { Command as CommandPrimitive } from 'cmdk'
import { Search } from 'lucide-react'
import { cn } from '../../lib/utils.js'
import { Dialog, DialogContent } from './dialog.jsx'

function Command({ className, ...props }) {
  return (
    <CommandPrimitive
      className={cn(
        'flex h-full w-full flex-col overflow-hidden rounded-md bg-[#09090b] text-zinc-100',
        className
      )}
      {...props}
    />
  )
}

function CommandDialog({ children, ...props }) {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0 shadow-2xl border-zinc-800 bg-[#09090b]">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-zinc-500 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:size-4 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-2.5 [&_[cmdk-item]]:text-xs [&_[cmdk-item]_svg]:size-4">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

function CommandInput({ className, ...props }) {
  return (
    <div className="flex items-center border-b border-zinc-800 px-3" cmdk-input-wrapper="">
      <Search className="mr-2 size-4 shrink-0 text-zinc-500" />
      <CommandPrimitive.Input
        className={cn(
          'flex h-11 w-full rounded-md bg-transparent py-3 text-xs outline-hidden placeholder:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-50 text-white font-mono',
          className
        )}
        {...props}
      />
    </div>
  )
}

function CommandList({ className, ...props }) {
  return (
    <CommandPrimitive.List
      className={cn('max-h-[300px] overflow-y-auto overflow-x-hidden p-1', className)}
      {...props}
    />
  )
}

function CommandEmpty(props) {
  return (
    <CommandPrimitive.Empty
      className="py-6 text-center text-xs text-zinc-500 font-mono"
      {...props}
    />
  )
}

function CommandGroup({ className, ...props }) {
  return (
    <CommandPrimitive.Group
      className={cn(
        'overflow-hidden p-1 text-zinc-300 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-zinc-500',
        className
      )}
      {...props}
    />
  )
}

function CommandSeparator({ className, ...props }) {
  return (
    <CommandPrimitive.Separator
      className={cn('-mx-1 h-px bg-zinc-800', className)}
      {...props}
    />
  )
}

function CommandItem({ className, ...props }) {
  return (
    <CommandPrimitive.Item
      className={cn(
        'relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-xs outline-hidden data-[selected=true]:bg-zinc-800 data-[selected=true]:text-white text-zinc-300 transition-colors',
        className
      )}
      {...props}
    />
  )
}

function CommandShortcut({ className, ...props }) {
  return (
    <span
      className={cn(
        'ml-auto font-mono text-[10px] tracking-widest text-zinc-500',
        className
      )}
      {...props}
    />
  )
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
