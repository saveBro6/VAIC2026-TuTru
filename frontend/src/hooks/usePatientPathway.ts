import { useQuery } from '@tanstack/react-query'
import { patientApi } from '../api/patientApi'
import { POLLING } from '../utils/constants'
export const usePatientPathway = (visitId: string | null) => useQuery({ queryKey: ['patient-pathway', visitId], queryFn: () => patientApi.getPathway(visitId!), enabled: Boolean(visitId), refetchInterval: (query) => ['COMPLETED', 'CANCELLED'].includes(query.state.data?.visitStatus ?? '') ? false : POLLING.patientPathway })
