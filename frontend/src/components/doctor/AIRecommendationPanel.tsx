import { BrainCircuit } from 'lucide-react'
import type { AIRecommendation } from '../../types'
import { RoutingRecommendationCard } from '../patient/RoutingRecommendationCard'
export function AIRecommendationPanel({ recommendation }: { recommendation: AIRecommendation }) { return <section><h2 className="section-title mb-3"><BrainCircuit/>Đề xuất hỗ trợ quyết định</h2><RoutingRecommendationCard recommendation={recommendation}/></section> }
