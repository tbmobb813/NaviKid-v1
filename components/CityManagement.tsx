import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import Colors from '@/constants/colors';
import { Plus } from 'lucide-react-native';
import { useRegionStore } from '@/stores/regionStore';
import { useRegionActions } from '@/hooks/useRegionActions';
import { RegionConfig } from '@/types/region';
import { RegionCard, SearchBar, InfoSection, AddEditRegionForm } from './cityManagement';

type CityManagementProps = {
  onBack: () => void;
};

export default function CityManagement({ onBack }: CityManagementProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingRegion, setEditingRegion] = useState<RegionConfig | null>(null);

  const {
    availableRegions,
    currentRegion,
    setRegion,
    addCustomRegion,
    updateRegionTransitData,
    searchRegions,
    getRegionsByCountry,
  } = useRegionStore();

  const { handleDeleteRegion, handleUpdateTransitData } = useRegionActions();

  const filteredRegions = searchQuery ? searchRegions(searchQuery) : availableRegions;
  const usRegions = getRegionsByCountry('United States');
  const internationalRegions = availableRegions.filter((r) => r.country !== 'United States');

  const handleSaveRegion = (region: RegionConfig) => {
    if (editingRegion) {
      updateRegionTransitData(region.id, region);
    } else {
      addCustomRegion(region);
    }
    setShowAddForm(false);
    setEditingRegion(null);
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingRegion(null);
  };

  if (showAddForm || editingRegion) {
    return (
      <AddEditRegionForm
        region={editingRegion}
        onSave={handleSaveRegion}
        onCancel={handleCancelForm}
      />
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>City Management</Text>
        <Pressable style={styles.addButton} onPress={() => setShowAddForm(true)}>
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add City</Text>
        </Pressable>
      </View>

      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>United States ({usRegions.length})</Text>
        {(searchQuery
          ? filteredRegions.filter((r) => r.country === 'United States')
          : usRegions
        ).map((region) => (
          <RegionCard
            key={region.id}
            region={region}
            isCurrentRegion={region.id === currentRegion.id}
            onSelect={() => setRegion(region.id)}
            onUpdateTransit={() => handleUpdateTransitData(region.id)}
            onEdit={() => setEditingRegion(region)}
            onDelete={() => handleDeleteRegion(region.id)}
          />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>International ({internationalRegions.length})</Text>
        {(searchQuery
          ? filteredRegions.filter((r) => r.country !== 'United States')
          : internationalRegions
        ).map((region) => (
          <RegionCard
            key={region.id}
            region={region}
            isCurrentRegion={region.id === currentRegion.id}
            onSelect={() => setRegion(region.id)}
            onUpdateTransit={() => handleUpdateTransitData(region.id)}
            onEdit={() => setEditingRegion(region)}
            onDelete={() => handleDeleteRegion(region.id)}
          />
        ))}
      </View>

      <InfoSection />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
});
