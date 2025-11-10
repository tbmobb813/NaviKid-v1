/**
 * Mock Transit Feeds
 *
 * Static imports for mock transit data to enable web-compatible builds.
 * Web bundlers require static imports to properly resolve modules at compile time.
 */

import mtaSubway from './mta-subway.json';
import mtaBus from './mta-bus.json';

export type MockFeed = {
  routes?: any[];
  schedules?: any[];
  alerts?: any[];
};

/**
 * Map of mock feed IDs to their data
 * Usage: mockFeeds['mta-subway'] returns the mta-subway.json data
 */
export const mockFeeds: Record<string, MockFeed> = {
  'mta-subway': mtaSubway,
  'mta-bus': mtaBus,
};

/**
 * Get a mock feed by ID
 * @param id - The feed ID (e.g., 'mta-subway')
 * @returns The mock feed data or undefined if not found
 */
export function getMockFeed(id: string): MockFeed | undefined {
  return mockFeeds[id];
}

/**
 * Check if a feed ID exists in mock feeds
 * @param id - The feed ID to check
 * @returns True if the feed exists
 */
export function hasMockFeed(id: string): boolean {
  return id in mockFeeds;
}

/**
 * Get all available mock feed IDs
 * @returns Array of available feed IDs
 */
export function getAvailableMockFeeds(): string[] {
  return Object.keys(mockFeeds);
}
