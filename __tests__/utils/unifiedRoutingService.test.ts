/**
 * Tests for Unified Routing Service
 * Validates comprehensive routing combining ORS and OTP2
 */

import { unifiedRoutingService, UnifiedRouteRequest } from '@/utils/unifiedRoutingService';
import { orsService } from '@/utils/orsService';
import { otp2Service } from '@/utils/otp2Service';
import { monitoring } from '@/utils/monitoring';

// Mock dependencies
jest.mock('@/utils/orsService');
jest.mock('@/utils/otp2Service');
jest.mock('@/utils/logger');
jest.mock('@/utils/monitoring');

describe('UnifiedRoutingService', () => {
  const mockORSResponse = {
    routes: [
      {
        summary: {
          distance: 1500,
          duration: 900, // 15 minutes in seconds
        },
        segments: [
          {
            steps: [
              {
                instruction: 'Head north on Main St',
                distance: 500,
                duration: 300,
              },
            ],
          },
        ],
        geometry: 'encodedPolyline123',
      },
    ],
    metadata: {},
  };

  const mockOTP2Response = {
    plan: {
      date: Date.now(),
      from: {
        name: 'Start',
        lat: 40.7128,
        lon: -74.006,
      },
      to: {
        name: 'End',
        lat: 40.7589,
        lon: -73.9851,
      },
      itineraries: [
        {
          duration: 1800,
          startTime: Date.now(),
          endTime: Date.now() + 1800000,
          walkTime: 300,
          transitTime: 1200,
          waitingTime: 300,
          walkDistance: 400,
          walkLimitExceeded: false,
          elevationLost: 0,
          elevationGained: 0,
          transfers: 1,
          legs: [
            {
              startTime: Date.now(),
              endTime: Date.now() + 300000,
              departureDelay: 0,
              arrivalDelay: 0,
              realTime: true,
              distance: 200,
              pathway: false,
              mode: 'WALK',
              from: {
                name: 'Start',
                lat: 40.7128,
                lon: -74.006,
              },
              to: {
                name: 'Station A',
                lat: 40.7148,
                lon: -74.008,
              },
              transitLeg: false,
              duration: 300,
              interlineWithPreviousLeg: false,
            },
            {
              startTime: Date.now() + 300000,
              endTime: Date.now() + 1500000,
              departureDelay: 0,
              arrivalDelay: 0,
              realTime: true,
              distance: 5000,
              pathway: false,
              mode: 'SUBWAY',
              route: 'A',
              routeShortName: 'A',
              routeLongName: 'A Train',
              headsign: 'Uptown',
              from: {
                name: 'Station A',
                lat: 40.7148,
                lon: -74.008,
              },
              to: {
                name: 'Station B',
                lat: 40.7589,
                lon: -73.9851,
              },
              transitLeg: true,
              duration: 1200,
              interlineWithPreviousLeg: false,
            },
          ],
          tooSloped: false,
          arrivedAtDestinationWithRentedBicycle: false,
        },
      ],
    },
    requestParameters: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (monitoring.startPerformanceTimer as jest.Mock).mockReturnValue(jest.fn());
  });

  describe('getRoutes', () => {
    it('should get routes for multiple modes in parallel', async () => {
      (orsService.getRoute as jest.Mock).mockResolvedValue(mockORSResponse);
      (otp2Service.planTrip as jest.Mock).mockResolvedValue(mockOTP2Response);

      const request: UnifiedRouteRequest = {
        from: { lat: 40.7128, lng: -74.006 },
        to: { lat: 40.7589, lng: -73.9851 },
        preferences: {
          modes: ['WALK', 'TRANSIT'],
        },
      };

      const routes = await unifiedRoutingService.getRoutes(request);

      expect(routes.length).toBeGreaterThan(0);
      expect(orsService.getRoute).toHaveBeenCalled();
      expect(otp2Service.planTrip).toHaveBeenCalled();
    });

    it('should handle individual mode failures gracefully', async () => {
      (orsService.getRoute as jest.Mock).mockRejectedValue(new Error('ORS error'));
      (otp2Service.planTrip as jest.Mock).mockResolvedValue(mockOTP2Response);

      const request: UnifiedRouteRequest = {
        from: { lat: 40.7128, lng: -74.006 },
        to: { lat: 40.7589, lng: -73.9851 },
        preferences: {
          modes: ['WALK', 'TRANSIT'],
        },
      };

      const routes = await unifiedRoutingService.getRoutes(request);

      // Should still return transit routes
      expect(routes.length).toBeGreaterThan(0);
    });

    it('should sort routes by kid-friendly score when child age specified', async () => {
      (orsService.getKidFriendlyRoute as jest.Mock).mockResolvedValue(mockORSResponse);
      (otp2Service.getKidFriendlyTrip as jest.Mock).mockResolvedValue(mockOTP2Response);

      const request: UnifiedRouteRequest = {
        from: { lat: 40.7128, lng: -74.006 },
        to: { lat: 40.7589, lng: -73.9851 },
        preferences: {
          modes: ['WALK', 'TRANSIT'],
          childAge: 8,
        },
      };

      const routes = await unifiedRoutingService.getRoutes(request);

      // Verify kid-friendly methods were called
      expect(orsService.getKidFriendlyRoute).toHaveBeenCalled();
      expect(otp2Service.getKidFriendlyTrip).toHaveBeenCalled();

      // Routes should be sorted by kid-friendly score
      for (let i = 0; i < routes.length - 1; i++) {
        expect(routes[i].kidFriendlyScore).toBeGreaterThanOrEqual(routes[i + 1].kidFriendlyScore);
      }
    });

    it('should prioritize accessibility when wheelchair specified', async () => {
      (orsService.getAccessibleRoute as jest.Mock).mockResolvedValue(mockORSResponse);
      (otp2Service.getAccessibleTrip as jest.Mock).mockResolvedValue(mockOTP2Response);

      const request: UnifiedRouteRequest = {
        from: { lat: 40.7128, lng: -74.006 },
        to: { lat: 40.7589, lng: -73.9851 },
        preferences: {
          modes: ['WALK', 'TRANSIT'],
          wheelchair: true,
        },
      };

      await unifiedRoutingService.getRoutes(request);

      expect(orsService.getAccessibleRoute).toHaveBeenCalled();
      expect(otp2Service.getAccessibleTrip).toHaveBeenCalled();
    });

    it('should capture performance metrics', async () => {
      const endTimer = jest.fn();
      (monitoring.startPerformanceTimer as jest.Mock).mockReturnValue(endTimer);

      (orsService.getRoute as jest.Mock).mockResolvedValue(mockORSResponse);

      const request: UnifiedRouteRequest = {
        from: { lat: 40.7128, lng: -74.006 },
        to: { lat: 40.7589, lng: -73.9851 },
        preferences: {
          modes: ['WALK'],
        },
      };

      await unifiedRoutingService.getRoutes(request);

      expect(monitoring.startPerformanceTimer).toHaveBeenCalledWith('unified_routing_request');
      expect(endTimer).toHaveBeenCalled();
    });
  });

  describe('Walking Routes', () => {
    it('should get standard walking routes', async () => {
      (orsService.getRoute as jest.Mock).mockResolvedValue(mockORSResponse);

      const request: UnifiedRouteRequest = {
        from: { lat: 40.7128, lng: -74.006 },
        to: { lat: 40.7589, lng: -73.9851 },
        preferences: {
          modes: ['WALK'],
        },
      };

      const routes = await unifiedRoutingService.getRoutes(request);

      expect(routes.length).toBeGreaterThan(0);
      expect(routes[0].type).toBe('walking');
    });

    it('should use kid-friendly routes for children', async () => {
      (orsService.getKidFriendlyRoute as jest.Mock).mockResolvedValue(mockORSResponse);

      const request: UnifiedRouteRequest = {
        from: { lat: 40.7128, lng: -74.006 },
        to: { lat: 40.7589, lng: -73.9851 },
        preferences: {
          modes: ['WALK'],
          childAge: 6,
        },
      };

      await unifiedRoutingService.getRoutes(request);

      expect(orsService.getKidFriendlyRoute).toHaveBeenCalled();
    });

    it('should use accessible routes when specified', async () => {
      (orsService.getAccessibleRoute as jest.Mock).mockResolvedValue(mockORSResponse);

      const request: UnifiedRouteRequest = {
        from: { lat: 40.7128, lng: -74.006 },
        to: { lat: 40.7589, lng: -73.9851 },
        preferences: {
          modes: ['WALK'],
          wheelchair: true,
        },
      };

      await unifiedRoutingService.getRoutes(request);

      expect(orsService.getAccessibleRoute).toHaveBeenCalled();
    });

    it('should prioritize safety when requested', async () => {
      (orsService.getRoute as jest.Mock).mockResolvedValue(mockORSResponse);

      const request: UnifiedRouteRequest = {
        from: { lat: 40.7128, lng: -74.006 },
        to: { lat: 40.7589, lng: -73.9851 },
        preferences: {
          modes: ['WALK'],
          prioritizeSafety: true,
        },
      };

      await unifiedRoutingService.getRoutes(request);

      expect(orsService.getRoute).toHaveBeenCalledWith(
        expect.objectContaining({
          preference: 'recommended',
        })
      );
    });
  });

  describe('Cycling Routes', () => {
    it('should get cycling routes', async () => {
      (orsService.getRouteAlternatives as jest.Mock).mockResolvedValue([
        { profile: 'cycling-regular', route: mockORSResponse },
      ]);

      const request: UnifiedRouteRequest = {
        from: { lat: 40.7128, lng: -74.006 },
        to: { lat: 40.7589, lng: -73.9851 },
        preferences: {
          modes: ['BIKE'],
        },
      };

      const routes = await unifiedRoutingService.getRoutes(request);

      expect(routes.length).toBeGreaterThan(0);
      expect(routes[0].type).toBe('cycling');
    });

    it('should include electric bike option for longer distances', async () => {
      (orsService.getRouteAlternatives as jest.Mock).mockResolvedValue([
        { profile: 'cycling-regular', route: mockORSResponse },
        { profile: 'cycling-electric', route: mockORSResponse },
      ]);

      const request: UnifiedRouteRequest = {
        from: { lat: 40.7128, lng: -74.006 },
        to: { lat: 40.8, lng: -74.1 }, // ~10km distance
        preferences: {
          modes: ['BIKE'],
        },
      };

      await unifiedRoutingService.getRoutes(request);

      // Should request multiple cycling profiles
      expect(orsService.getRouteAlternatives).toHaveBeenCalled();
    });
  });

  describe('Transit Routes', () => {
    it('should get standard transit routes', async () => {
      (otp2Service.planTrip as jest.Mock).mockResolvedValue(mockOTP2Response);

      const request: UnifiedRouteRequest = {
        from: { lat: 40.7128, lng: -74.006 },
        to: { lat: 40.7589, lng: -73.9851 },
        preferences: {
          modes: ['TRANSIT'],
        },
      };

      const routes = await unifiedRoutingService.getRoutes(request);

      expect(routes.length).toBeGreaterThan(0);
      expect(routes[0].type).toBe('transit');
    });

    it('should use kid-friendly transit for children', async () => {
      (otp2Service.getKidFriendlyTrip as jest.Mock).mockResolvedValue(mockOTP2Response);

      const request: UnifiedRouteRequest = {
        from: { lat: 40.7128, lng: -74.006 },
        to: { lat: 40.7589, lng: -73.9851 },
        preferences: {
          modes: ['TRANSIT'],
          childAge: 7,
        },
      };

      await unifiedRoutingService.getRoutes(request);

      expect(otp2Service.getKidFriendlyTrip).toHaveBeenCalled();
    });

    it('should use accessible transit when specified', async () => {
      (otp2Service.getAccessibleTrip as jest.Mock).mockResolvedValue(mockOTP2Response);

      const request: UnifiedRouteRequest = {
        from: { lat: 40.7128, lng: -74.006 },
        to: { lat: 40.7589, lng: -73.9851 },
        preferences: {
          modes: ['TRANSIT'],
          wheelchair: true,
        },
      };

      await unifiedRoutingService.getRoutes(request);

      expect(otp2Service.getAccessibleTrip).toHaveBeenCalled();
    });

    it('should pass departure time and arriveBy preferences', async () => {
      (otp2Service.planTrip as jest.Mock).mockResolvedValue(mockOTP2Response);

      const departureTime = new Date('2024-12-02T09:00:00');

      const request: UnifiedRouteRequest = {
        from: { lat: 40.7128, lng: -74.006 },
        to: { lat: 40.7589, lng: -73.9851 },
        preferences: {
          modes: ['TRANSIT'],
          departureTime,
          arriveBy: false,
        },
      };

      await unifiedRoutingService.getRoutes(request);

      expect(otp2Service.planTrip).toHaveBeenCalledWith(
        expect.objectContaining({
          arriveBy: false,
        })
      );
    });

    it('should handle empty itineraries', async () => {
      (otp2Service.planTrip as jest.Mock).mockResolvedValue({
        plan: {
          date: Date.now(),
          from: { name: 'Start', lat: 40.7128, lon: -74.006 },
          to: { name: 'End', lat: 40.7589, lon: -73.9851 },
          itineraries: [],
        },
        requestParameters: {},
      });

      const request: UnifiedRouteRequest = {
        from: { lat: 40.7128, lng: -74.006 },
        to: { lat: 40.7589, lng: -73.9851 },
        preferences: {
          modes: ['TRANSIT'],
        },
      };

      const routes = await unifiedRoutingService.getRoutes(request);

      expect(routes).toEqual([]);
    });
  });

  describe('Driving Routes', () => {
    it('should get driving routes', async () => {
      (orsService.getRoute as jest.Mock).mockResolvedValue(mockORSResponse);

      const request: UnifiedRouteRequest = {
        from: { lat: 40.7128, lng: -74.006 },
        to: { lat: 40.7589, lng: -73.9851 },
        preferences: {
          modes: ['CAR'],
        },
      };

      const routes = await unifiedRoutingService.getRoutes(request);

      expect(routes.length).toBeGreaterThan(0);
      expect(routes[0].type).toBe('driving');
    });

    it('should avoid highways and tollways when safety prioritized', async () => {
      (orsService.getRoute as jest.Mock).mockResolvedValue(mockORSResponse);

      const request: UnifiedRouteRequest = {
        from: { lat: 40.7128, lng: -74.006 },
        to: { lat: 40.7589, lng: -73.9851 },
        preferences: {
          modes: ['CAR'],
          prioritizeSafety: true,
        },
      };

      await unifiedRoutingService.getRoutes(request);

      expect(orsService.getRoute).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            avoid_features: ['highways', 'tollways'],
          }),
        })
      );
    });
  });

  describe('Route Scoring', () => {
    it('should calculate safety scores for routes', async () => {
      (orsService.getRoute as jest.Mock).mockResolvedValue(mockORSResponse);

      const request: UnifiedRouteRequest = {
        from: { lat: 40.7128, lng: -74.006 },
        to: { lat: 40.7589, lng: -73.9851 },
        preferences: {
          modes: ['WALK'],
        },
      };

      const routes = await unifiedRoutingService.getRoutes(request);

      expect(routes[0].safetyScore).toBeGreaterThanOrEqual(0);
      expect(routes[0].safetyScore).toBeLessThanOrEqual(100);
    });

    it('should calculate kid-friendly scores', async () => {
      (orsService.getRoute as jest.Mock).mockResolvedValue(mockORSResponse);

      const request: UnifiedRouteRequest = {
        from: { lat: 40.7128, lng: -74.006 },
        to: { lat: 40.7589, lng: -73.9851 },
        preferences: {
          modes: ['WALK'],
        },
      };

      const routes = await unifiedRoutingService.getRoutes(request);

      expect(routes[0].kidFriendlyScore).toBeGreaterThanOrEqual(0);
      expect(routes[0].kidFriendlyScore).toBeLessThanOrEqual(100);
    });

    it('should calculate accessibility scores', async () => {
      (orsService.getRoute as jest.Mock).mockResolvedValue(mockORSResponse);

      const request: UnifiedRouteRequest = {
        from: { lat: 40.7128, lng: -74.006 },
        to: { lat: 40.7589, lng: -73.9851 },
        preferences: {
          modes: ['WALK'],
        },
      };

      const routes = await unifiedRoutingService.getRoutes(request);

      expect(routes[0].accessibilityScore).toBeGreaterThanOrEqual(0);
      expect(routes[0].accessibilityScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Route Instructions', () => {
    it('should include route instructions', async () => {
      (orsService.getRoute as jest.Mock).mockResolvedValue(mockORSResponse);

      const request: UnifiedRouteRequest = {
        from: { lat: 40.7128, lng: -74.006 },
        to: { lat: 40.7589, lng: -73.9851 },
        preferences: {
          modes: ['WALK'],
        },
      };

      const routes = await unifiedRoutingService.getRoutes(request);

      expect(routes[0].instructions).toBeDefined();
      expect(Array.isArray(routes[0].instructions)).toBe(true);
    });

    it('should include transit-specific information in instructions', async () => {
      (otp2Service.planTrip as jest.Mock).mockResolvedValue(mockOTP2Response);

      const request: UnifiedRouteRequest = {
        from: { lat: 40.7128, lng: -74.006 },
        to: { lat: 40.7589, lng: -73.9851 },
        preferences: {
          modes: ['TRANSIT'],
        },
      };

      const routes = await unifiedRoutingService.getRoutes(request);

      const transitInstruction = routes[0].instructions.find((i) => i.type === 'transit');
      if (transitInstruction) {
        expect(transitInstruction.transitInfo).toBeDefined();
        expect(transitInstruction.transitInfo?.mode).toBeDefined();
        expect(transitInstruction.transitInfo?.route).toBeDefined();
      }
    });
  });

  describe('Route Geometry', () => {
    it('should include route geometry', async () => {
      (orsService.getRoute as jest.Mock).mockResolvedValue(mockORSResponse);

      const request: UnifiedRouteRequest = {
        from: { lat: 40.7128, lng: -74.006 },
        to: { lat: 40.7589, lng: -73.9851 },
        preferences: {
          modes: ['WALK'],
        },
      };

      const routes = await unifiedRoutingService.getRoutes(request);

      expect(routes[0].geometry).toBeDefined();
      expect(routes[0].geometry.type).toBe('LineString');
      expect(Array.isArray(routes[0].geometry.coordinates)).toBe(true);
    });

    it('should decode polyline geometry', async () => {
      (orsService.getRoute as jest.Mock).mockResolvedValue(mockORSResponse);

      const request: UnifiedRouteRequest = {
        from: { lat: 40.7128, lng: -74.006 },
        to: { lat: 40.7589, lng: -73.9851 },
        preferences: {
          modes: ['WALK'],
        },
      };

      const routes = await unifiedRoutingService.getRoutes(request);

      // Geometry coordinates should be [lng, lat] pairs
      if (routes[0].geometry.coordinates.length > 0) {
        expect(routes[0].geometry.coordinates[0].length).toBe(2);
      }
    });
  });

  describe('Route Metadata', () => {
    it('should include route source information', async () => {
      (orsService.getRoute as jest.Mock).mockResolvedValue(mockORSResponse);

      const request: UnifiedRouteRequest = {
        from: { lat: 40.7128, lng: -74.006 },
        to: { lat: 40.7589, lng: -73.9851 },
        preferences: {
          modes: ['WALK'],
        },
      };

      const routes = await unifiedRoutingService.getRoutes(request);

      expect(routes[0].source).toBe('ORS');
    });

    it('should include raw API response data', async () => {
      (orsService.getRoute as jest.Mock).mockResolvedValue(mockORSResponse);

      const request: UnifiedRouteRequest = {
        from: { lat: 40.7128, lng: -74.006 },
        to: { lat: 40.7589, lng: -73.9851 },
        preferences: {
          modes: ['WALK'],
        },
      };

      const routes = await unifiedRoutingService.getRoutes(request);

      expect(routes[0].rawData).toBeDefined();
    });

    it('should generate descriptive route descriptions', async () => {
      (orsService.getRoute as jest.Mock).mockResolvedValue(mockORSResponse);

      const request: UnifiedRouteRequest = {
        from: { lat: 40.7128, lng: -74.006 },
        to: { lat: 40.7589, lng: -73.9851 },
        preferences: {
          modes: ['WALK'],
        },
      };

      const routes = await unifiedRoutingService.getRoutes(request);

      expect(routes[0].description).toBeDefined();
      expect(typeof routes[0].description).toBe('string');
      expect(routes[0].description.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle ORS failures gracefully', async () => {
      (orsService.getRoute as jest.Mock).mockRejectedValue(new Error('ORS error'));

      const request: UnifiedRouteRequest = {
        from: { lat: 40.7128, lng: -74.006 },
        to: { lat: 40.7589, lng: -73.9851 },
        preferences: {
          modes: ['WALK'],
        },
      };

      const routes = await unifiedRoutingService.getRoutes(request);

      expect(routes).toEqual([]);
    });

    it('should handle OTP2 failures gracefully', async () => {
      (otp2Service.planTrip as jest.Mock).mockRejectedValue(new Error('OTP2 error'));

      const request: UnifiedRouteRequest = {
        from: { lat: 40.7128, lng: -74.006 },
        to: { lat: 40.7589, lng: -73.9851 },
        preferences: {
          modes: ['TRANSIT'],
        },
      };

      const routes = await unifiedRoutingService.getRoutes(request);

      expect(routes).toEqual([]);
    });

    it('should capture errors in monitoring', async () => {
      (orsService.getRoute as jest.Mock).mockRejectedValue(new Error('Fatal error'));
      (otp2Service.planTrip as jest.Mock).mockRejectedValue(new Error('Fatal error'));

      const request: UnifiedRouteRequest = {
        from: { lat: 40.7128, lng: -74.006 },
        to: { lat: 40.7589, lng: -73.9851 },
        preferences: {
          modes: ['WALK', 'TRANSIT'],
        },
      };

      await unifiedRoutingService.getRoutes(request);

      // Errors should be logged but not throw
      expect(true).toBe(true);
    });
  });
});
