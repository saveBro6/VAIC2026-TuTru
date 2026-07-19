import { useQuery } from '@tanstack/react-query'
import { patientApi } from '../api/patientApi'
import { POLLING } from '../utils/constants'
export const usePatientPathway = () => useQuery({ queryKey: ['patient-pathway', 'current'], queryFn: () => patientApi.getCurrentPathway(), refetchInterval: (query) => ['COMPLETED', 'CANCELLED'].includes(query.state.data?.visitStatus ?? '') ? false : POLLING.patientPathway })
