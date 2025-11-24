import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
// (View, Text already imported below)
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TouchableOpacity } from 'react-native';
import BottomSheetContent from '@/components/BottomSheetContent';

// FAB bullet/burger menu: single main FAB that toggles small action buttons above it
import MapOverlay from '@/components/MapOverlay';
import { strings } from '@/constants/strings';
// Removed local BottomSheet placeholder to avoid naming conflict

const AnimatedConfetti = () => (
  <View
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 20,
      backgroundColor: 'transparent',
      zIndex: 100,
    }}
  >
    <Text>AnimatedConfetti</Text>
  </View>
);
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  Platform,
  Modal,
  ActivityIndicator,
  UIManager,
} from 'react-native';
// Import bottom-sheet at runtime to avoid type resolution issues in some environments
let BottomSheet: any = null;
let BottomSheetView: any = null;
let BottomSheetHandle: any = null;
let BottomSheetModalProvider: any = ({ children }: any) => children;

(async () => {
  try {
    // Use dynamic import to avoid triggering @typescript-eslint/no-var-requires
    const _bs = await import('@gorhom/bottom-sheet');
    const mod = (_bs as any)?.default ?? _bs;
    BottomSheet = mod ?? BottomSheet;
    BottomSheetView = (_bs as any)?.BottomSheetView ?? BottomSheetView;
    BottomSheetHandle = (_bs as any)?.BottomSheetHandle ?? BottomSheetHandle;
    BottomSheetModalProvider = (_bs as any)?.BottomSheetModalProvider ?? BottomSheetModalProvider;
  } catch (e) {
    // If module isn't present at runtime (e.g. tests), fallback to no-op components
    BottomSheet = ({ children }: any) => <>{children}</>;
  }
})();
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import MapWithInfoPanel from '@/components/MapWithInfoPanel';
import { useNavigationStore } from '@/stores/enhancedNavigationStore';
import { Route } from '@/types/navigation';
import { Navigation, MapPin, Search, X, Settings, AlertCircle, Zap } from 'lucide-react-native';
import useLocation from '@/hooks/useLocation';
import { findStationById, findNearestStations } from '@/config/transit/nyc-stations';
import MapView from '@/components/MapView';
import { isMapLibreAvailable } from '@/components/MapLibreMap';
import { useRouteORS } from '@/hooks/useRouteORS';
import Config from '@/utils/config';
import { logger } from '@/utils/logger';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function MapScreen() {
  const router = useRouter();
  const { location, loading: locationLoading } = useLocation();
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [showStationModal, setShowStationModal] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const mapLibreCameraRef = React.useRef<any>(null);
  const {
    origin,
    destination,
    availableRoutes,
    unifiedRoutes,
    selectedRoute,
    selectedUnifiedRoute,
    selectedTravelMode,
    isLoadingRoutes,
    routingError,
    useAdvancedRouting,
    routingPreferences,
    setOrigin,
    findRoutes,
    selectRoute,
    selectUnifiedRoute,
    setTravelMode,
  } = useNavigationStore();

  useEffect(() => {
    // Update origin when location changes, especially when moving from default to real location
    if (location && (!origin || origin.id === 'current-location')) {
      logger.info('Updating origin to current location', {
        latitude: location.latitude,
        longitude: location.longitude
      });
      setOrigin({
        id: 'current-location',
        name: 'Current Location',
        address: 'Your current position',
        category: 'other',
        coordinates: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
      });
    }
  }, [location?.latitude, location?.longitude]);

  useEffect(() => {
    // Find routes when both origin and destination are set
    if (origin && destination) {
      findRoutes();
    }
  }, [origin, destination]);

  const handleRouteSelect = (route: Route) => {
    selectRoute(route);

    // Also select corresponding unified route if available
    const matchingUnifiedRoute = unifiedRoutes.find((ur) => ur.id === route.id);
    if (matchingUnifiedRoute) {
      selectUnifiedRoute(matchingUnifiedRoute);
    }

    router.push(`/(tabs)/transit` as any);
  };

  const handleAdvancedRouteSelect = (unifiedRoute: any) => {
    selectUnifiedRoute(unifiedRoute);
    router.push(`/(tabs)/transit` as any);
    router.push('/(tabs)/transit');
  };

  const handleSearchPress = () => {
    router.push('/(tabs)/search' as any);
  };

  const handlePreferencesPress = () => {
    setShowPreferences(true);
  };

  const handleRetryRouting = () => {
    findRoutes();
  };

  const handleStationPress = (stationId: string) => {
    setSelectedStationId(stationId);
    setShowStationModal(true);
  };

  const handleCloseStationModal = () => {
    setShowStationModal(false);
    setSelectedStationId(null);
  };

  const selectedStation = selectedStationId ? findStationById(selectedStationId) : null;

  const mapLibreSupported = useMemo(() => {
    try {
      // call the runtime function to check availability without forcing require at import time
      if (!isMapLibreAvailable()) {
        return false;
      }
    } catch {
      return false;
    }

    if (Platform.OS === 'web') {
      return false;
    }

    const managerNames = ['MapLibreGLMapView', 'RCTMGLMapView'];
    return managerNames.some((name) => {
      try {
        return Boolean((UIManager as any)?.getViewManagerConfig?.(name));
      } catch {
        return false;
      }
    });
  }, []);

  useEffect(() => {
    if (!mapLibreSupported) {
      logger.warn('MapLibre not detected, using fallback OpenStreetMap', {
        recommendation: 'Run a development build with MapLibre for better performance',
        platform: Platform.OS
      });
    }
  }, [mapLibreSupported]);

  // Priority: MapLibre > Interactive Map (OpenStreetMap)
  const mapImplementation = useMemo(() => {
    return mapLibreSupported ? 'maplibre' : 'interactive';
  }, [mapLibreSupported]);

  // ...existing code...
  // Snap points for bottom sheet
  const bottomSheetSnapPoints = ['25%', '60%'];

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
          {/* AnimatedConfetti overlays everything */}
          <AnimatedConfetti />
          <MapView
            origin={origin}
            destination={destination}
            selectedUnifiedRoute={selectedUnifiedRoute}
            onStationPress={handleStationPress}
            mapLibreCameraRef={mapLibreCameraRef}
          />
          <MapOverlay
            mapImplementation={mapImplementation}
            onRecenter={() => {
              // Recenter map to origin (user location)
              if (origin?.coordinates && mapLibreCameraRef?.current?.setCamera) {
                try {
                  mapLibreCameraRef.current.setCamera({
                    centerCoordinate: [origin.coordinates.longitude, origin.coordinates.latitude],
                    zoomLevel: 15,
                    animationDuration: 800,
                  });
                } catch (e) {
                  // Defensive: some test harnesses or fallback map implementations
                  // may not expose setCamera; ignore failures silently.
                  logger.debug('Map recenter failed', { error: e });
                }
              }
            }}
            onHelp={() => {
              // Show help modal or info
              alert(strings.mapOverlay.help);
            }}
            onToggleAccessibility={() => {
              // Toggle accessibility mode in navigation store
              setShowPreferences((prev) => !prev);
            }}
          />
          {/* Interactive BottomSheet from @gorhom/bottom-sheet */}
          <BottomSheet
            index={0}
            snapPoints={bottomSheetSnapPoints}
            backgroundStyle={{
              backgroundColor: '#fff',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: -2 },
              elevation: 8,
            }}
            handleIndicatorStyle={{
              backgroundColor: '#4F8EF7',
              width: 40,
              height: 6,
              borderRadius: 3,
              alignSelf: 'center',
              marginVertical: 8,
            }}
          >
            <BottomSheetView>
              <BottomSheetContent />
            </BottomSheetView>
          </BottomSheet>
        </View>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  // ...existing code...
  // ...existing code...
  gpsStatusBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    borderRadius: 4,
  },
  mapImplementationText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '600',
  },
  mapContainer: {
    height: Platform.select({
      web: Math.min(screenHeight * 0.55, 540),
      default: screenHeight * 0.45,
    }),
    minHeight: 360,
    width: '100%',
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  scrollableContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 32,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  routesContainer: {
    gap: 12,
  },
  locationBar: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  locationPins: {
    alignItems: 'center',
    marginRight: 16,
  },
  locationPin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  originPin: {
    backgroundColor: Colors.primary,
  },
  destinationPin: {
    backgroundColor: Colors.secondary,
  },
  locationConnector: {
    width: 2,
    height: 24,
    backgroundColor: Colors.border,
  },
  locationTexts: {
    flex: 1,
  },
  locationButton: {
    paddingVertical: 8,
    justifyContent: 'center',
  },
  locationText: {
    fontSize: 16,
    color: Colors.text,
  },
  placeholderText: {
    color: Colors.textLight,
  },
  searchIcon: {
    position: 'absolute',
    right: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    minHeight: 200,
  },
  emptyStateText: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
  },
  searchButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  travelModeContainer: {
    flex: 1,
    marginRight: 12,
  },
  preferencesButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.primary + '15',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text,
    marginTop: 12,
    fontWeight: '600',
  },
  loadingSubtext: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 4,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: Colors.error + '10',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    marginVertical: 8,
  },
  retryButton: {
    backgroundColor: Colors.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  routesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  advancedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  advancedBadgeText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600',
  },
  insightsContainer: {
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 4,
    lineHeight: 20,
  },
});
