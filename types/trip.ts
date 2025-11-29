/**
 * Trip Planning Types
 * Types for kid-friendly trip planning functionality
 */

export type TripSegmentType = 'walk' | 'subway' | 'bus' | 'transfer';

export type TripDifficulty = 'Easy' | 'Medium' | 'Hard';

export type AccessibilityInfo = {
  wheelchairAccessible: boolean;
  strollerFriendly: boolean;
  elevatorRequired: boolean;
};

export type TripSegment = {
  id: string;
  type: TripSegmentType;
  line?: string;
  from: string;
  to: string;
  duration: number; // in minutes
  instructions: string;
  kidFriendlyTip: string;
  safetyNote?: string;
  funThingsToSee?: string[];
  accessibility: AccessibilityInfo;
};

export type EmergencyInfo = {
  nearestHospital: string;
  transitPolice: string;
  helpfulStaff: string[];
};

export type TripCost = {
  adult: number;
  child: number; // under 44 inches ride free
};

export type TripPlan = {
  id: string;
  from: string;
  to: string;
  totalDuration: number;
  totalWalkingTime: number;
  segments: TripSegment[];
  kidFriendlyRating: number; // 1-5 stars
  difficulty: TripDifficulty;
  bestTimeToGo: string;
  thingsToRemember: string[];
  emergencyInfo: EmergencyInfo;
  funAlongTheWay: string[];
  estimatedCost: TripCost;
};

export type AccessibilityNeeds = {
  wheelchair: boolean;
  stroller: boolean;
  elevatorOnly: boolean;
};

export type GroupSize = {
  adults: number;
  children: number;
};

export type TravelTime = 'now' | 'later';
