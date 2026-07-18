import type { HTMLAttributes, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'
export const Table = ({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) => <div className="relative w-full overflow-auto"><table className={cn('w-full caption-bottom text-sm', className)} {...props}/></div>
export const TableHeader = ({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) => <thead className={cn('[&_tr]:border-b [&_tr]:bg-muted/40', className)} {...props}/>
export const TableBody = ({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) => <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props}/>
export const TableRow = ({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) => <tr className={cn('border-b border-border/70 transition-colors hover:bg-primary/[.035]', className)} {...props}/>
export const TableHead = ({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) => <th className={cn('h-12 px-4 text-left align-middle text-xs font-semibold uppercase tracking-wider text-muted-foreground', className)} {...props}/>
export const TableCell = ({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) => <td className={cn('px-4 py-4 align-middle', className)} {...props}/>
