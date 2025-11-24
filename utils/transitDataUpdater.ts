import { RegionConfig } from '@/types/region';
import { useRegionStore } from '@/stores/regionStore';
import { getMockFeed } from '@/config/mock-feeds';

export type TransitDataUpdateResult = {
  success: boolean;
  regionId: string;
  message: string;
  lastUpdated: Date;
};

export type TransitApiResponse = {
  routes?: any[];
  schedules?: any[];
  alerts?: any[];
  lastModified: string;
};

export class TransitDataUpdater {
  private static instance: TransitDataUpdater;
  private updateInProgress = new Set<string>();

  static getInstance(): TransitDataUpdater {
    if (!TransitDataUpdater.instance) {
      TransitDataUpdater.instance = new TransitDataUpdater();
    }
    return TransitDataUpdater.instance;
  }

  async updateRegionTransitData(regionId: string): Promise<TransitDataUpdateResult> {
    if (this.updateInProgress.has(regionId)) {
      return {
        success: false,
        regionId,
        message: 'Update already in progress for this region',
        lastUpdated: new Date(),
      };
    }

    this.updateInProgress.add(regionId);

    try {
      const { availableRegions, updateRegionTransitData } = useRegionStore.getState();
      const region = availableRegions.find((r) => r.id === regionId);

      if (!region) {
        throw new Error(`Region ${regionId} not found`);
      }

      console.log(`Updating transit data for ${region.name}...`);

      // Simulate API call to transit system
      const transitData = await this.fetchTransitData(region);

      // Update the region with new transit data
      const updatedRegion: Partial<RegionConfig> = {
        ...region,
        transitSystems: this.processTransitSystems(transitData, region),
        // Add timestamp for last update
        lastUpdated: new Date().toISOString(),
      };

      updateRegionTransitData(regionId, updatedRegion);

      return {
        success: true,
        regionId,
        message: `Successfully updated transit data for ${region.name}`,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error(`Failed to update transit data for ${regionId}:`, error);
      return {
        success: false,
        regionId,
        message: `Failed to update: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastUpdated: new Date(),
      };
    } finally {
      this.updateInProgress.delete(regionId);
    }
  }

  async updateAllRegions(): Promise<TransitDataUpdateResult[]> {
    const { availableRegions } = useRegionStore.getState();
    const results: TransitDataUpdateResult[] = [];

    // Update regions in batches to avoid overwhelming APIs
    const batchSize = 3;
    for (let i = 0; i < availableRegions.length; i += batchSize) {
      const batch = availableRegions.slice(i, i + batchSize);
      const batchPromises = batch.map((region) => this.updateRegionTransitData(region.id));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches
      if (i + batchSize < availableRegions.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  private async fetchTransitData(region: RegionConfig): Promise<TransitApiResponse> {
    // If a server-side transit adapter is configured, call it to get normalized JSON feeds.
    const adapterBase = process.env.TRANSIT_ADAPTER_URL;
    if (adapterBase) {
      const allRoutes: any[] = [];
      const allSchedules: any[] = [];
      const allAlerts: any[] = [];

      for (const system of region.transitSystems) {
        try {
          const url = `${adapterBase.replace(/\/$/, '')}/feeds/${region.id}/${system.id}.json`;
          // Use node-fetch if necessary
          const fetchFn = typeof fetch !== 'undefined' ? fetch : require('node-fetch');
          const res = await fetchFn(url);
          if (!res.ok) {
            console.warn(`Adapter fetch failed for ${system.id}: ${res.status}`);
            continue;
          }
          const json = await res.json();
          if (json.routes) allRoutes.push(...json.routes);
          if (json.schedules) allSchedules.push(...json.schedules);
          if (json.alerts) allAlerts.push(...json.alerts);
        } catch (err) {
          console.warn(`Failed to fetch from adapter for ${system.id}:`, err);
        }
      }

      return {
        routes: allRoutes.length ? allRoutes : this.generateMockRoutes(region),
        schedules: allSchedules.length ? allSchedules : this.generateMockSchedules(region),
        alerts: allAlerts.length ? allAlerts : this.generateMockAlerts(region),
        lastModified: new Date().toISOString(),
      };
    }

    // If region has transitSystems with feedUrl set, fetch those feeds and normalize.
    const allRoutes: any[] = [];
    const allSchedules: any[] = [];
    const allAlerts: any[] = [];

    for (const system of region.transitSystems) {
      try {
        if (!system.feedUrl) continue;

        // Mock feed loader: feedUrl starting with mock://<id> will load from config/mock-feeds/<id>.json
        if (system.feedUrl.startsWith('mock://')) {
          const id = system.feedUrl.replace('mock://', '');

          // Use static import mapping (web-compatible)
          const mock = getMockFeed(id);

          if (mock) {
            console.log(`Loading mock feed: ${id}`);
            if (mock.routes) allRoutes.push(...mock.routes);
            if (mock.schedules) allSchedules.push(...mock.schedules);
            if (mock.alerts) allAlerts.push(...mock.alerts);
          } else {
            console.warn(`Mock feed not found: ${id}. Available feeds: mta-subway, mta-bus`);
          }

          continue;
        }

        // If feedUrl looks like a JSON endpoint, fetch and try to normalize
        if (system.feedUrl.startsWith('http')) {
          try {
            // Determine API key precedence: system.apiKey -> env[system.apiKeyEnv] -> region.transitApiKey
            const resolvedKey =
              system.apiKey ||
              (system.apiKeyEnv ? process.env[system.apiKeyEnv] : undefined) ||
              region.transitApiKey;
            const keyHeader = system.apiKeyHeader || 'x-api-key';

            // Use global fetch (available in React Native and modern browsers)
            if (typeof fetch === 'undefined') {
              throw new Error('fetch is not available in this environment');
            }
            const headers: Record<string, string> | undefined = resolvedKey
              ? { [keyHeader]: resolvedKey }
              : undefined;

            const res = await fetch(system.feedUrl, { headers });

            // If response is JSON, parse and attempt to normalize
            const contentType =
              res.headers && res.headers.get ? res.headers.get('content-type') : null;
            if (contentType && contentType.includes('application/json')) {
              const json = await res.json();
              // Expect JSON to follow the simple mock shape { routes, schedules, alerts }
              if (json.routes) allRoutes.push(...json.routes);
              if (json.schedules) allSchedules.push(...json.schedules);
              if (json.alerts) allAlerts.push(...json.alerts);
              continue;
            }

            // If endpoint returns GTFS-RT protobuf, decode it
            if (
              contentType &&
              (contentType.includes('application/octet-stream') ||
                contentType.includes('application/x-protobuf') ||
                system.feedUrl.includes('gtfs'))
            ) {
              try {
                const buffer = await res.arrayBuffer();
                const GtfsRealtimeBindings = require('gtfs-realtime-bindings');
                const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
                  new Uint8Array(buffer),
                );

                console.log(`Decoded GTFS-RT feed for ${system.id}:`, {
                  entities: feed.entity?.length || 0,
                  timestamp: feed.header?.timestamp,
                });

                // Parse feed entities
                const parsedData = this.parseGtfsRealtimeFeed(feed, system.id);

                if (parsedData.routes.length > 0) allRoutes.push(...parsedData.routes);
                if (parsedData.schedules.length > 0) allSchedules.push(...parsedData.schedules);
                if (parsedData.alerts.length > 0) allAlerts.push(...parsedData.alerts);

                console.log(
                  `Parsed GTFS-RT data for ${system.id}:`,
                  `${parsedData.routes.length} routes, ${parsedData.schedules.length} schedules, ${parsedData.alerts.length} alerts`,
                );

                continue;
              } catch (protobufError) {
                console.warn(`Failed to decode GTFS-RT protobuf for ${system.id}:`, protobufError);
                // Fall through to try other methods or fail gracefully
              }
            }
          } catch (err) {
            console.warn(`Failed to fetch/parse feed for ${system.id}:`, err);
          }
        }
      } catch (e) {
        console.warn(`Error processing feed for system ${system.id}:`, e);
      }
    }

    // If we didn't get any real routes, fall back to the existing mock generator for coverage
    const routes = allRoutes.length ? allRoutes : this.generateMockRoutes(region);
    const schedules = allSchedules.length ? allSchedules : this.generateMockSchedules(region);
    const alerts = allAlerts.length ? allAlerts : this.generateMockAlerts(region);

    return {
      routes,
      schedules,
      alerts,
      lastModified: new Date().toISOString(),
    };
  }

  private processTransitSystems(transitData: TransitApiResponse, region: RegionConfig) {
    // Process the API response and update transit systems
    // In a real app, this would parse the actual API response format

    return region.transitSystems.map((system) => ({
      ...system,
      // Add real-time status
      status: Math.random() > 0.1 ? ('operational' as const) : ('delayed' as const),
      lastUpdated: new Date().toISOString(),
      // Add route updates if available
      routes: transitData.routes
        ? transitData.routes.filter((route: any) => route.systemId === system.id)
        : system.routes,
    }));
  }

  private generateMockRoutes(region: RegionConfig) {
    // Generate mock route data
    return region.transitSystems.flatMap((system) =>
      (system.routes || []).map((route) => ({
        id: `${system.id}-${route}`,
        name: route,
        systemId: system.id,
        status: Math.random() > 0.1 ? 'on-time' : 'delayed',
        nextArrival: Math.floor(Math.random() * 15) + 1, // 1-15 minutes
      })),
    );
  }

  private generateMockSchedules(region: RegionConfig) {
    // Generate mock schedule data
    return [
      {
        systemId: region.transitSystems[0]?.id,
        schedules: Array.from({ length: 10 }, (_, i) => ({
          time: new Date(Date.now() + (i + 1) * 5 * 60 * 1000).toISOString(),
          route: region.transitSystems[0]?.routes?.[0] || 'Route 1',
          destination: 'Downtown',
        })),
      },
    ];
  }

  private generateMockAlerts(region: RegionConfig) {
    // Generate mock alert data
    const alerts: any[] = [];

    if (Math.random() > 0.7) {
      alerts.push({
        id: `alert-${Date.now()}`,
        type: 'delay',
        message: `Minor delays on ${region.transitSystems[0]?.name} due to signal problems`,
        severity: 'low',
        affectedRoutes: region.transitSystems[0]?.routes?.slice(0, 2) || [],
      });
    }

    return alerts;
  }

  /**
   * Parse GTFS Realtime feed into normalized format
   * @param feed - Decoded GTFS-RT FeedMessage
   * @param systemId - Transit system ID
   * @returns Normalized transit data
   */
  private parseGtfsRealtimeFeed(
    feed: any,
    systemId: string,
  ): { routes: any[]; schedules: any[]; alerts: any[] } {
    const routes: any[] = [];
    const schedules: any[] = [];
    const alerts: any[] = [];

    if (!feed.entity || !Array.isArray(feed.entity)) {
      console.warn(`No entities found in GTFS-RT feed for ${systemId}`);
      return { routes, schedules, alerts };
    }

    for (const entity of feed.entity) {
      try {
        // Parse trip updates (real-time schedule data)
        if (entity.tripUpdate) {
          const tripUpdate = entity.tripUpdate;
          const trip = tripUpdate.trip;
          let maxDelay = 0; // Track max delay for this trip

          if (trip && tripUpdate.stopTimeUpdate) {
            for (const stopTimeUpdate of tripUpdate.stopTimeUpdate) {
              const arrival = stopTimeUpdate.arrival;
              const departure = stopTimeUpdate.departure;

              if (arrival || departure) {
                const timestamp = arrival?.time || departure?.time;
                const delay = arrival?.delay || departure?.delay || 0;

                // Track maximum delay for status determination
                if (Math.abs(delay) > Math.abs(maxDelay)) {
                  maxDelay = delay;
                }

                schedules.push({
                  systemId,
                  routeId: trip.routeId || 'unknown',
                  tripId: trip.tripId || entity.id,
                  stopId: stopTimeUpdate.stopId,
                  time: timestamp ? new Date(Number(timestamp) * 1000).toISOString() : undefined,
                  delay: delay,
                  scheduleRelationship: stopTimeUpdate.scheduleRelationship,
                });
              }
            }
          }

          // Add route info from trip update
          if (trip?.routeId) {
            routes.push({
              id: `${systemId}-${trip.routeId}`,
              name: trip.routeId,
              systemId,
              status: maxDelay && Math.abs(maxDelay) > 300 ? 'delayed' : 'on-time', // 5+ min delay
              tripId: trip.tripId,
            });
          }
        }

        // Parse vehicle positions (real-time location data)
        if (entity.vehicle) {
          const vehicle = entity.vehicle;
          const trip = vehicle.trip;

          if (trip?.routeId) {
            routes.push({
              id: `${systemId}-${trip.routeId}`,
              name: trip.routeId,
              systemId,
              status: vehicle.currentStatus === 'STOPPED_AT' ? 'stopped' : 'moving',
              position: vehicle.position
                ? {
                    latitude: vehicle.position.latitude,
                    longitude: vehicle.position.longitude,
                    bearing: vehicle.position.bearing,
                    speed: vehicle.position.speed,
                  }
                : undefined,
              vehicleId: vehicle.vehicle?.id,
              timestamp: vehicle.timestamp,
            });
          }
        }

        // Parse service alerts
        if (entity.alert) {
          const alert = entity.alert;

          alerts.push({
            id: entity.id,
            systemId,
            type: this.mapGtfsAlertCause(alert.cause),
            severity: this.mapGtfsAlertSeverity(alert.severityLevel),
            headerText: alert.headerText?.translation?.[0]?.text || 'Service Alert',
            descriptionText: alert.descriptionText?.translation?.[0]?.text || '',
            affectedRoutes:
              alert.informedEntity?.map((e: any) => e.routeId).filter((r: string) => r) || [],
            activePeriod: alert.activePeriod?.[0]
              ? {
                  start: alert.activePeriod[0].start,
                  end: alert.activePeriod[0].end,
                }
              : undefined,
          });
        }
      } catch (entityError) {
        console.warn(`Failed to parse GTFS-RT entity ${entity.id}:`, entityError);
        // Continue processing other entities
      }
    }

    return { routes, schedules, alerts };
  }

  /**
   * Map GTFS-RT alert cause to normalized type
   */
  private mapGtfsAlertCause(cause: number | undefined): string {
    // GTFS-RT Cause enum values
    const causes: Record<number, string> = {
      1: 'other',
      2: 'technical',
      3: 'strike',
      4: 'demonstration',
      5: 'accident',
      6: 'holiday',
      7: 'weather',
      8: 'maintenance',
      9: 'construction',
      10: 'police',
      11: 'medical',
    };
    return causes[cause || 1] || 'other';
  }

  /**
   * Map GTFS-RT severity level to normalized severity
   */
  private mapGtfsAlertSeverity(severity: number | undefined): string {
    // GTFS-RT SeverityLevel enum values
    const severities: Record<number, string> = {
      1: 'info',
      2: 'warning',
      3: 'severe',
      4: 'severe',
    };
    return severities[severity || 1] || 'info';
  }

  isUpdateInProgress(regionId: string): boolean {
    return this.updateInProgress.has(regionId);
  }

  getUpdateStatus(): { [regionId: string]: boolean } {
    const status: { [regionId: string]: boolean } = {};
    this.updateInProgress.forEach((regionId) => {
      status[regionId] = true;
    });
    return status;
  }
}

// Export singleton instance
export const transitDataUpdater = TransitDataUpdater.getInstance();
