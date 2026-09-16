export interface TrainFormValues {
  physical_status: "high" | "middle" | "low" | "";
  energy_status: "high" | "middle" | "low" | "";
  do_you_have_injury: "yes, i have" | "no, i haven't" | "";
  the_place_of_injury: string;
  the_severity_of_injury: string;
  available_time: "5min" | "15min" | "30min" | "60min" | "";
  train_goal: string;
}

export interface HistoryItem {
  id: string;
  createdAt: string;
  input: TrainFormValues;
  outputs: Record<string, unknown>;
}
