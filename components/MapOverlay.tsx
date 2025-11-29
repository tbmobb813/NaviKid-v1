import { strings } from '@/constants/strings';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import FloatingMenu from '@/components/FloatingMenu';

interface MapOverlayProps {
  mapImplementation: string;
  onRecenter: () => void;
  onHelp: () => void;
  onToggleAccessibility: () => void;
}

export default function MapOverlay({ mapImplementation, onRecenter, onHelp, onToggleAccessibility }: MapOverlayProps) {
  const router = useRouter();

  return (
    <>
      <View
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          zIndex: 1200,
          backgroundColor: 'rgba(0,0,0,0.6)',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 6,
        }}
        pointerEvents="none"
      >
        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
          {`${strings.mapOverlay.map}${mapImplementation}`}
        </Text>
        {__DEV__ ? (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/dev/native-debug')}
            style={{
              marginTop: 6,
              pointerEvents: 'auto',
              backgroundColor: 'rgba(255,255,255,0.08)',
              paddingHorizontal: 6,
              paddingVertical: 4,
              borderRadius: 4,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 11 }}>{strings.mapOverlay.debug}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={{ position: 'absolute', bottom: 240, right: 24, zIndex: 10 }}>
        <FloatingMenu
          onRecenter={onRecenter}
          onHelp={onHelp}
          onToggleAccessibility={onToggleAccessibility}
        />
      </View>
    </>
  );
}
