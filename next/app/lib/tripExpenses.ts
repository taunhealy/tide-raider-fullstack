export interface FlightCost {
  from: string;
  to: string;
  price: number;
  airline: string;
  duration: string;
}

export interface DailyExpenses {
  food: number;
  transport: number;
  activities: number;
  medical: number;
}
