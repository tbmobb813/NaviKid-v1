import React from 'react';

// Mock components for MapLibre GL components
type MockChildrenProps = { children?: React.ReactNode; [key: string]: unknown };

const MockShapeSource = ({ children, ...props }: MockChildrenProps) => (
  <div data-testid="mock-shape-source" {...(props as any)}>
    {children}
  </div>
);

const MockLineLayer = (props: Record<string, unknown>) => (
  <div data-testid="mock-line-layer" {...(props as any)} />
);

const MockCircleLayer = (props: Record<string, unknown>) => (
  <div data-testid="mock-circle-layer" {...(props as any)} />
);

// Main MapLibre Map component mock
const MockMapLibreMap = ({ children, ...props }: MockChildrenProps) => (
  <div data-testid="mock-maplibre-map" {...(props as any)}>
    {children}
  </div>
);

// MapLibreGL object with all the required components
export const MapLibreGL = {
  ShapeSource: MockShapeSource,
  LineLayer: MockLineLayer,
  CircleLayer: MockCircleLayer,
};

export const isMapLibreAvailable = () => true;
// also export a boolean for backwards compatibility
export const isMapLibreAvailableBoolean = true;

// Attach properties to the main component for compatibility
MockMapLibreMap.ShapeSource = MockShapeSource;
MockMapLibreMap.LineLayer = MockLineLayer;
MockMapLibreMap.CircleLayer = MockCircleLayer;
MockMapLibreMap.MapLibreGL = MapLibreGL;
MockMapLibreMap.isMapLibreAvailable = isMapLibreAvailable;

export default MockMapLibreMap;
