import React from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native';
import { Search, Filter, Accessibility } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { StationType } from '@/types/station';

type StationFiltersProps = {
  searchQuery: string;
  selectedType: StationType | 'all';
  accessibilityOnly: boolean;
  onSearchChange: (query: string) => void;
  onTypeChange: (type: StationType | 'all') => void;
  onAccessibilityToggle: () => void;
};

export const StationFilters: React.FC<StationFiltersProps> = ({
  searchQuery,
  selectedType,
  accessibilityOnly,
  onSearchChange,
  onTypeChange,
  onAccessibilityToggle,
}) => {
  return (
    <View style={styles.filtersContainer}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.textLight} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Search stations..."
          placeholderTextColor={Colors.textLight}
        />
      </View>

      {/* Type Filters */}
      <View style={styles.typeFiltersContainer}>
        <View style={styles.filterHeader}>
          <Filter size={16} color={Colors.text} />
          <Text style={styles.filterLabel}>Type:</Text>
        </View>
        <View style={styles.typeButtons}>
          <TouchableOpacity
            style={[styles.typeButton, selectedType === 'all' && styles.typeButtonActive]}
            onPress={() => onTypeChange('all')}
          >
            <Text
              style={[styles.typeButtonText, selectedType === 'all' && styles.typeButtonTextActive]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeButton, selectedType === 'subway' && styles.typeButtonActive]}
            onPress={() => onTypeChange('subway')}
          >
            <Text
              style={[
                styles.typeButtonText,
                selectedType === 'subway' && styles.typeButtonTextActive,
              ]}
            >
              Subway
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeButton, selectedType === 'bus' && styles.typeButtonActive]}
            onPress={() => onTypeChange('bus')}
          >
            <Text
              style={[styles.typeButtonText, selectedType === 'bus' && styles.typeButtonTextActive]}
            >
              Bus
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Accessibility Toggle */}
      <TouchableOpacity
        style={[styles.accessibilityToggle, accessibilityOnly && styles.accessibilityToggleActive]}
        onPress={onAccessibilityToggle}
      >
        <Accessibility size={20} color={accessibilityOnly ? '#FFFFFF' : Colors.primary} />
        <Text
          style={[
            styles.accessibilityToggleText,
            accessibilityOnly && styles.accessibilityToggleTextActive,
          ]}
        >
          Wheelchair Accessible Only
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: Colors.text,
  },
  typeFiltersContainer: {
    marginBottom: 16,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  accessibilityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 10,
  },
  accessibilityToggleActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  accessibilityToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  accessibilityToggleTextActive: {
    color: '#FFFFFF',
  },
});
