export interface RouteSource {
  legs: {
    encodedPolyline?: string;
    encodedPolylinePrecision?: number;
    points: {
      latitude: number;
      longitude: number;
    }[];
    summary: Summary;
  }[];
  summary: Summary;
  guidance: {
    instructions: GuidanceInstruction[];
  };
  progress: Progress[];
  sections: Section[];
}

export interface Summary {
  departureTime: string;
  arrivalTime: string;
  lengthInMeters: number;
  trafficDelayInSeconds: number;
  trafficLengthInMeters: number;
  travelTimeInSeconds: number;
  remainingChargeAtArrivalInkWh?: number;
  totalChargingTimeInSeconds?: number;
  chargingInformationAtEndOfLeg?: Record<string, unknown>;
  deviationTime?: number;
  deviationDistance?: number;
  deviationPoint?: {
    latitude: number;
    longitude: number;
  };
}

export interface GuidanceInstruction {
  drivingSide: string;
  maneuver?: string;
  maneuverPoint?: {
    latitude: number;
    longitude: number;
  };
  point?: {
    latitude: number;
    longitude: number;
  };
  instructionType?: string;
  message?: string;
  street?: string;
  routeOffsetInMeters?: number;
  nextRoadInfo?: {
    streetName?: string | { text?: string };
    text?: string;
  };
}

interface Progress {
  distanceInMeters: number;
  pointIndex: number;
  travelTimeInSeconds: number;
}

interface Section {
  delayInSeconds: number;
  effectiveSpeedInKmh: number;
  endPointIndex: number;
  magnitudeOfDelay: number;
  sectionType: string;
  simpleCategory: string;
  startPointIndex: number;
  tec?: {
    effectCode: number;
    causes: {
      mainCauseCode: number;
    }[];
  };
}

export interface TrafficSection {
  sectionType: string;
  simpleCategory: string;
  startPointIndex: number;
  endPointIndex: number;
  delayInSeconds: number;
  effectiveSpeedInKmh: number;
  magnitudeOfDelay: number;
  eventId?: string;
}
