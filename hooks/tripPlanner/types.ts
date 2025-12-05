export type TripSegment = {
  id: string;
  type: 'walk' | 'subway' | 'bus' | 'transfer';
  line?: string;
  from: string;
  to: string;
  duration: number; // in minutes
  instructions: string;
  kidFriendlyTip: string;
  safetyNote?: string;
  funThingsToSee?: string[];
  accessibility: {
    wheelchairAccessible: boolean;
    strollerFriendly: boolean;
    elevatorRequired: boolean;
  };
};

export type TripPlan = {
  id: string;
  from: string;
  to: string;
  totalDuration: number;
  totalWalkingTime: number;
  segments: TripSegment[];
  kidFriendlyRating: number; // 1-5 stars
  difficulty: 'Easy' | 'Medium' | 'Hard';
  bestTimeToGo: string;
  thingsToRemember: string[];
  emergencyInfo: {
    nearestHospital: string;
    transitPolice: string;
    helpfulStaff: string[];
  };
  funAlongTheWay: string[];
  estimatedCost: {
    adult: number;
    child: number; // under 44 inches ride free
  };
};

export type GroupSize = {
  adults: number;
  children: number;
};

export type AccessibilityNeeds = {
  wheelchair: boolean;
  stroller: boolean;
  elevatorOnly: boolean;
};
