import { ArrowDown, ArrowUp, ChevronsUpDown, EyeOff } from 'lucide-react'
import { cn } from '../../lib/utils.js'
import { Button } from '../ui/button.jsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu.jsx'

export function ColumnHeader({ column, title, className }) {
  if (!column.getCanSort()) {
    return <div className={cn('font-mono text-[10px] uppercase font-bold text-zinc-400', className)}>{title}</div>
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-zinc-800 font-mono text-[10px] uppercase font-bold text-zinc-300 hover:text-white"
          >
            <span>{title}</span>
            {column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 size-3.5" />
            ) : column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 size-3.5" />
            ) : (
              <ChevronsUpDown className="ml-2 size-3.5 text-zinc-500" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="border-zinc-800 bg-[#09090b]">
          <DropdownMenuItem onClick={() => column.toggleSorting(false)} className="text-xs">
            <ArrowUp className="mr-2 size-3.5 text-zinc-400" /> Ascending
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(true)} className="text-xs">
            <ArrowDown className="mr-2 size-3.5 text-zinc-400" /> Descending
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => column.toggleVisibility(false)} className="text-xs">
            <EyeOff className="mr-2 size-3.5 text-zinc-400" /> Hide Column
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
