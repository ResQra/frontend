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
    return <div className={cn('font-mono text-[10px] uppercase font-bold text-slate-500', className)}>{title}</div>
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-slate-200 font-mono text-[10px] uppercase font-bold text-slate-600 hover:text-slate-900"
          >
            <span>{title}</span>
            {column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 size-3.5" />
            ) : column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 size-3.5" />
            ) : (
              <ChevronsUpDown className="ml-2 size-3.5 text-slate-500" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="border-slate-200 bg-slate-100">
          <DropdownMenuItem onClick={() => column.toggleSorting(false)} className="text-xs">
            <ArrowUp className="mr-2 size-3.5 text-slate-500" /> Ascending
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(true)} className="text-xs">
            <ArrowDown className="mr-2 size-3.5 text-slate-500" /> Descending
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => column.toggleVisibility(false)} className="text-xs">
            <EyeOff className="mr-2 size-3.5 text-slate-500" /> Hide Column
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
