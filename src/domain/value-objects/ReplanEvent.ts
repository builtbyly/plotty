export type ReplanCategory = "behavioral" | "interval";
export type ReplanOutcome = "triggered" | "failed";

export interface ReplanEvent {
  readonly category: ReplanCategory;
  readonly outcome: ReplanOutcome;
  readonly reason: string;
  readonly errorMessage: string | null;
  readonly lineNumber: number;
  readonly timestamp: number | null;
  readonly timezoneOffsetMinutes: number | null;
  readonly nearestPointIndex: number;
}
