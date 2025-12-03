import React from 'react';
import { useParentalStore } from '@/stores/parentalStore';
import { useSafeZoneForm } from '@/hooks/useSafeZoneForm';
import { SafeZoneForm, SafeZoneList } from '@/components/safeZoneManagement';

type SafeZoneManagementProps = {
  onBack: () => void;
};

const SafeZoneManagement: React.FC<SafeZoneManagementProps> = ({ onBack }) => {
  const { safeZones } = useParentalStore();
  const {
    showAddForm,
    editingZone,
    formData,
    openAddForm,
    resetForm,
    handleSave,
    handleEdit,
    handleDelete,
    handleToggleActive,
    getCurrentLocation,
    updateFormField,
    toggleNotification,
  } = useSafeZoneForm();

  if (showAddForm) {
    return (
      <SafeZoneForm
        formData={formData}
        isEditing={!!editingZone}
        onFieldChange={updateFormField}
        onToggleNotification={toggleNotification}
        onGetCurrentLocation={getCurrentLocation}
        onSave={handleSave}
        onCancel={resetForm}
      />
    );
  }

  return (
    <SafeZoneList
      safeZones={safeZones}
      onBack={onBack}
      onAddNew={openAddForm}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onToggleActive={handleToggleActive}
    />
  );
};

export default SafeZoneManagement;
