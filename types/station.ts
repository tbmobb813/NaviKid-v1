/**
 * Station Types
 * Types for MTA station finder functionality
 */

export type StationType = 'subway' | 'bus';

export type StationAccessibility = {
  wheelchairAccessible: boolean;
  elevators?: string[];
  escalators: boolean;
  visualAids?: string[];
  audioAids?: string[];
};

export type StationExit = {
  name: string;
  description: string;
  isAccessible?: boolean;
};

export type KidFriendlyInfo = {
  nickname: string;
  whatToSee: string[];
  tip: string;
  funFact: string;
  safetyNote?: string;
};

export type Coordinates = {
  lat: number;
  lng: number;
};

export type StationInfo = {
  id: string;
  name: string;
  type: StationType;
  borough: string;
  lines: string[];
  coordinates: Coordinates;
  distance?: number; // in meters
  accessibility: StationAccessibility;
  kidFriendlyInfo: KidFriendlyInfo;
  exits: StationExit[];
  amenities?: string[];
  nearbyAttractions?: string[];
};

export type StationFilterType = 'all' | 'subway' | 'bus';
