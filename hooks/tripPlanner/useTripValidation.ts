import { GroupSize, AccessibilityNeeds } from './types';

type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

type UseTripValidationReturn = {
  validateTripInputs: (fromLocation: string, toLocation: string) => ValidationResult;
  validateGroupSize: (groupSize: GroupSize) => ValidationResult;
  validateAccessibility: (needs: AccessibilityNeeds) => ValidationResult;
};

export const useTripValidation = (): UseTripValidationReturn => {
  const validateTripInputs = (fromLocation: string, toLocation: string): ValidationResult => {
    const errors: string[] = [];

    if (!fromLocation.trim()) {
      errors.push('Please enter a starting location');
    }

    if (!toLocation.trim()) {
      errors.push('Please enter a destination');
    }

    if (fromLocation.trim() === toLocation.trim()) {
      errors.push('Starting location and destination cannot be the same');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const validateGroupSize = (groupSize: GroupSize): ValidationResult => {
    const errors: string[] = [];

    if (groupSize.adults < 1) {
      errors.push('At least one adult is required');
    }

    if (groupSize.adults > 10) {
      errors.push('Maximum of 10 adults allowed');
    }

    if (groupSize.children < 0) {
      errors.push('Number of children cannot be negative');
    }

    if (groupSize.children > 20) {
      errors.push('Maximum of 20 children allowed');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const validateAccessibility = (needs: AccessibilityNeeds): ValidationResult => {
    // Accessibility needs are always valid as they are boolean toggles
    // This validation is here for potential future requirements
    return {
      isValid: true,
      errors: [],
    };
  };

  return {
    validateTripInputs,
    validateGroupSize,
    validateAccessibility,
  };
};
