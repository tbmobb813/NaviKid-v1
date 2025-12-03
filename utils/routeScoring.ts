import { TripPlan, TripSegment, AccessibilityNeeds } from '@/hooks/tripPlanner/types';

/**
 * Calculates a kid-friendly score for a trip based on various factors
 * @param trip - The trip plan to score
 * @param accessibilityNeeds - Accessibility requirements
 * @returns A score from 1-5
 */
export const calculateKidFriendlyScore = (
  trip: TripPlan,
  accessibilityNeeds?: AccessibilityNeeds
): number => {
  let score = 5; // Start with perfect score

  // Penalize long trips
  if (trip.totalDuration > 60) {
    score -= 1.5;
  } else if (trip.totalDuration > 45) {
    score -= 1;
  } else if (trip.totalDuration > 30) {
    score -= 0.5;
  }

  // Penalize excessive walking
  if (trip.totalWalkingTime > 20) {
    score -= 1;
  } else if (trip.totalWalkingTime > 15) {
    score -= 0.5;
  }

  // Penalize trips with many transfers
  const transferCount = trip.segments.filter((s) => s.type === 'transfer').length;
  score -= transferCount * 0.5;

  // Check accessibility requirements
  if (accessibilityNeeds) {
    const meetsAccessibility = trip.segments.every((segment) => {
      if (accessibilityNeeds.wheelchair && !segment.accessibility.wheelchairAccessible) {
        return false;
      }
      if (accessibilityNeeds.stroller && !segment.accessibility.strollerFriendly) {
        return false;
      }
      if (accessibilityNeeds.elevatorOnly && segment.accessibility.elevatorRequired) {
        // This is a special case - elevator required means stairs are NOT accessible
        // If elevatorOnly is true, we want routes that have elevators
        return true;
      }
      return true;
    });

    if (!meetsAccessibility) {
      score -= 2;
    }
  }

  // Ensure score is between 1 and 5
  return Math.max(1, Math.min(5, Math.round(score)));
};

/**
 * Determines the difficulty level of a trip
 */
export const calculateDifficulty = (trip: TripPlan): 'Easy' | 'Medium' | 'Hard' => {
  const factors = {
    duration: trip.totalDuration,
    walking: trip.totalWalkingTime,
    segments: trip.segments.length,
    transfers: trip.segments.filter((s) => s.type === 'transfer').length,
  };

  // Easy: Short trip, minimal walking, few segments
  if (factors.duration <= 30 && factors.walking <= 10 && factors.segments <= 3) {
    return 'Easy';
  }

  // Hard: Long trip, lots of walking, many segments/transfers
  if (factors.duration > 60 || factors.walking > 20 || factors.transfers > 2) {
    return 'Hard';
  }

  // Medium: Everything else
  return 'Medium';
};

/**
 * Checks if a segment meets accessibility requirements
 */
export const meetsAccessibilityRequirements = (
  segment: TripSegment,
  needs: AccessibilityNeeds
): boolean => {
  if (needs.wheelchair && !segment.accessibility.wheelchairAccessible) {
    return false;
  }

  if (needs.stroller && !segment.accessibility.strollerFriendly) {
    return false;
  }

  return true;
};

/**
 * Filters trip options based on accessibility needs
 */
export const filterByAccessibility = (
  trips: TripPlan[],
  needs: AccessibilityNeeds
): TripPlan[] => {
  return trips.filter((trip) =>
    trip.segments.every((segment) => meetsAccessibilityRequirements(segment, needs))
  );
};

/**
 * Sorts trips by kid-friendliness score (highest first)
 */
export const sortByKidFriendliness = (trips: TripPlan[]): TripPlan[] => {
  return [...trips].sort((a, b) => b.kidFriendlyRating - a.kidFriendlyRating);
};

/**
 * Sorts trips by total duration (shortest first)
 */
export const sortByDuration = (trips: TripPlan[]): TripPlan[] => {
  return [...trips].sort((a, b) => a.totalDuration - b.totalDuration);
};
