import { strings } from '@/constants/strings';
import { View, Text, TouchableOpacity } from 'react-native';

const RouteInfoPanel = ({ route, unifiedRoute }: any) => {
  if (!route && !unifiedRoute) {
    return (
      <View style={{ padding: 8 }}>
        <Text style={{ fontWeight: '600', color: '#4F8EF7' }}>{strings.routeInfoPanel.noRouteSelected}</Text>
        <Text style={{ color: '#666', marginTop: 6 }}>
          {strings.routeInfoPanel.setOriginAndDestination}
        </Text>
      </View>
    );
  }

  const summary = route?.properties?.summary ?? unifiedRoute?.properties?.summary ?? null;

  return (
    <View style={{ padding: 8 }}>
      <Text style={{ fontWeight: '700', fontSize: 16, color: '#0f172a' }}>
        {route?.name ?? unifiedRoute?.name ?? strings.routeInfoPanel.selectedRoute}
      </Text>
      {summary && (
        <Text style={{ color: '#374151', marginTop: 6 }}>{`${strings.routeInfoPanel.distance}${ 
          Math.round(((summary.distance ?? 0) / 1000) * 10) / 10
        }${strings.routeInfoPanel.kmDuration}${Math.round((summary.duration ?? 0) / 60)}${strings.routeInfoPanel.min}`}</Text>
      )}
    </View>
  );
};

const SafetyPanel = ({ children }: any) => (
  <View style={{ padding: 8, backgroundColor: '#FEF3F2', borderRadius: 8, marginVertical: 8 }}>
    <Text style={{ fontWeight: '700', color: '#B91C1C' }}>{strings.safetyPanel.safetyTips}</Text>
    <Text style={{ color: '#7F1D1D', marginTop: 6 }}>
      {strings.safetyPanel.tips}
    </Text>
    {children}
  </View>
);

const FunFactCard = ({ fact }: any) => (
  <View style={{ padding: 8, backgroundColor: '#EEF2FF', borderRadius: 8, marginVertical: 8 }}>
    <Text style={{ fontWeight: '700', color: '#3730A3' }}>{strings.funFactCard.funFact}</Text>
    <Text style={{ color: '#3730A3', marginTop: 6 }}>
      {fact ?? strings.funFactCard.defaultFact}
    </Text>
  </View>
);

const ParentControlsTab = ({ onOpenSettings }: any) => (
  <View style={{ padding: 8 }}>
    <Text style={{ fontWeight: '700' }}>{strings.parentControlsTab.parentControls}</Text>
    <TouchableOpacity onPress={onOpenSettings} style={{ marginTop: 8 }}>
      <View
        style={{
          padding: 10,
          backgroundColor: '#fff',
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#E6E6E6',
        }}
      >
        <Text>{strings.parentControlsTab.settings}</Text>
      </View>
    </TouchableOpacity>
  </View>
);

export default function BottomSheetContent() {
  return (
    <View style={{ padding: 16 }}>
      <RouteInfoPanel />
      <SafetyPanel />
      <FunFactCard />
      <ParentControlsTab />
      {/* Test content for visibility */}
      <Text style={{ textAlign: 'center', color: '#4F8EF7', marginTop: 16 }}>
        {strings.bottomSheetContent.bottomSheetIsVisible}
      </Text>
    </View>
  );
}
