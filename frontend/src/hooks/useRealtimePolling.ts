import { useQuery, type QueryKey } from '@tanstack/react-query'
export const useRealtimePolling = <T>(queryKey: QueryKey, queryFn: () => Promise<T>, interval: number) => useQuery({ queryKey, queryFn, refetchInterval: interval })
