import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '../../lib/utils'
export const Tabs = TabsPrimitive.Root
export const TabsList = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) => <TabsPrimitive.List className={cn('inline-flex h-11 items-center rounded-xl bg-muted p-1 text-muted-foreground', className)} {...props}/>
export const TabsTrigger = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) => <TabsPrimitive.Trigger className={cn('inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-semibold transition data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm', className)} {...props}/>
export const TabsContent = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) => <TabsPrimitive.Content className={cn('mt-5 focus-visible:outline-none', className)} {...props}/>
