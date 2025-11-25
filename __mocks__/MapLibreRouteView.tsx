import React from 'react';

// Simple mock implementation that renders a div with props for testing
const MapLibreRouteView = (props: any) => {
  return (
    <div data-testid={(testID as string) || 'mock-maplibre-route-view'} {...rest}>
      {origin && <div data-testid="origin-marker" data-coords={JSON.stringify(origin)} />}
      {destination && (
        <div data-testid="destination-marker" data-coords={JSON.stringify(destination)} />
      )}
      {showTransitStations && <div data-testid="mock-shapesource-stations" />}
      {showTransitStations && <div data-testid="mock-circlelayer-stations-layer" />}
      {origin && destination && <div data-testid="mock-shapesource-route" />}
      {origin && destination && <div data-testid="mock-linelayer-route-line" />}
    </div>
  );
};

export default MapLibreRouteView;
