from pydantic import BaseModel


class OptimizeSequenceRequest(BaseModel):
    clinic_specialities: list[str]
    patient_token: str


class SequenceItem(BaseModel):
    task_id: str
    service_type: str
    room_id: str
    sequence_order: int


class CostMetrics(BaseModel):
    total_cost: float
    travel_cost: float
    queue_cost: float
    priority_penalty: float


class OptimizeSequenceResponse(BaseModel):
    journey_id: str
    patient_token: str
    optimal_sequence: list[SequenceItem]
    metrics: CostMetrics
