import React from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native';
import { MapPin, Shield, Heart } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { AccessibilityNeeds, GroupSize } from '@/types/trip';

type TripPlannerFormProps = {
  fromLocation: string;
  toLocation: string;
  groupSize: GroupSize;
  accessibilityNeeds: AccessibilityNeeds;
  isPlanning: boolean;
  onFromLocationChange: (value: string) => void;
  onToLocationChange: (value: string) => void;
  onGroupSizeChange: (groupSize: GroupSize) => void;
  onAccessibilityNeedsChange: (needs: AccessibilityNeeds) => void;
  onPlanTrip: () => void;
};

export const TripPlannerForm: React.FC<TripPlannerFormProps> = ({
  fromLocation,
  toLocation,
  groupSize,
  accessibilityNeeds,
  isPlanning,
  onFromLocationChange,
  onToLocationChange,
  onGroupSizeChange,
  onAccessibilityNeedsChange,
  onPlanTrip,
}) => {
  return (
    <View style={styles.planningForm}>
      {/* Location Inputs */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>From (Starting Point)</Text>
        <TextInput
          style={styles.input}
          value={fromLocation}
          onChangeText={onFromLocationChange}
          placeholder="Enter starting location..."
          placeholderTextColor={Colors.textLight}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>To (Destination)</Text>
        <TextInput
          style={styles.input}
          value={toLocation}
          onChangeText={onToLocationChange}
          placeholder="Enter destination..."
          placeholderTextColor={Colors.textLight}
        />
      </View>

      {/* Group Size */}
      <View style={styles.groupSizeContainer}>
        <Text style={styles.inputLabel}>Group Size</Text>
        <View style={styles.groupSizeControls}>
          <View style={styles.groupItem}>
            <Text style={styles.groupLabel}>Adults:</Text>
            <View style={styles.counterContainer}>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() =>
                  onGroupSizeChange({ ...groupSize, adults: Math.max(1, groupSize.adults - 1) })
                }
              >
                <Text style={styles.counterButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.counterValue}>{groupSize.adults}</Text>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => onGroupSizeChange({ ...groupSize, adults: groupSize.adults + 1 })}
              >
                <Text style={styles.counterButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.groupItem}>
            <Text style={styles.groupLabel}>Children:</Text>
            <View style={styles.counterContainer}>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() =>
                  onGroupSizeChange({
                    ...groupSize,
                    children: Math.max(0, groupSize.children - 1),
                  })
                }
              >
                <Text style={styles.counterButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.counterValue}>{groupSize.children}</Text>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() =>
                  onGroupSizeChange({ ...groupSize, children: groupSize.children + 1 })
                }
              >
                <Text style={styles.counterButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Accessibility Options */}
      <View style={styles.accessibilityOptions}>
        <Text style={styles.inputLabel}>Accessibility Needs</Text>
        <TouchableOpacity
          style={[
            styles.accessibilityOption,
            accessibilityNeeds.wheelchair && styles.accessibilityOptionActive,
          ]}
          onPress={() =>
            onAccessibilityNeedsChange({
              ...accessibilityNeeds,
              wheelchair: !accessibilityNeeds.wheelchair,
            })
          }
        >
          <Shield size={16} color={accessibilityNeeds.wheelchair ? '#FFFFFF' : Colors.primary} />
          <Text
            style={[
              styles.accessibilityOptionText,
              accessibilityNeeds.wheelchair && styles.accessibilityOptionTextActive,
            ]}
          >
            Wheelchair Access
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.accessibilityOption,
            accessibilityNeeds.stroller && styles.accessibilityOptionActive,
          ]}
          onPress={() =>
            onAccessibilityNeedsChange({
              ...accessibilityNeeds,
              stroller: !accessibilityNeeds.stroller,
            })
          }
        >
          <Heart size={16} color={accessibilityNeeds.stroller ? '#FFFFFF' : Colors.primary} />
          <Text
            style={[
              styles.accessibilityOptionText,
              accessibilityNeeds.stroller && styles.accessibilityOptionTextActive,
            ]}
          >
            Stroller Friendly
          </Text>
        </TouchableOpacity>
      </View>

      {/* Plan Button */}
      <TouchableOpacity style={styles.planButton} onPress={onPlanTrip} disabled={isPlanning}>
        <MapPin size={20} color="#FFFFFF" />
        <Text style={styles.planButtonText}>
          {isPlanning ? 'Planning Your Trip...' : 'Plan My Trip!'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  planningForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: '#FAFAFA',
  },
  groupSizeContainer: {
    marginBottom: 16,
  },
  groupSizeControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  groupItem: {
    flex: 1,
  },
  groupLabel: {
    fontSize: 13,
    color: Colors.textLight,
    marginBottom: 8,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  counterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  counterValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  accessibilityOptions: {
    marginBottom: 16,
  },
  accessibilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  accessibilityOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  accessibilityOptionText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 10,
  },
  accessibilityOptionTextActive: {
    color: '#FFFFFF',
  },
  planButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  planButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
