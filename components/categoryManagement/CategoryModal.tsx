import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
} from 'react-native';
import { Check, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import CategoryButton from '../CategoryButton';

type CategoryModalProps = {
  visible: boolean;
  isEditing: boolean;
  categoryName: string;
  selectedIcon: string;
  selectedColor: string;
  userMode: 'parent' | 'child';
  availableIcons: string[];
  availableColors: string[];
  onClose: () => void;
  onSave: () => void;
  onNameChange: (text: string) => void;
  onIconSelect: (icon: string) => void;
  onColorSelect: (color: string) => void;
};

export const CategoryModal: React.FC<CategoryModalProps> = ({
  visible,
  isEditing,
  categoryName,
  selectedIcon,
  selectedColor,
  userMode,
  availableIcons,
  availableColors,
  onClose,
  onSave,
  onNameChange,
  onIconSelect,
  onColorSelect,
}) => (
  <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
    <View style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <Pressable onPress={onClose} style={styles.modalButton}>
          <X size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.modalTitle}>{isEditing ? 'Edit Category' : 'Create Category'}</Text>
        <Pressable onPress={onSave} style={styles.modalButton}>
          <Check size={24} color={Colors.primary} />
        </Pressable>
      </View>

      <ScrollView style={styles.modalContent}>
        <View style={styles.previewContainer}>
          <Text style={styles.sectionTitle}>Preview</Text>
          <CategoryButton
            customCategory={{
              id: 'preview',
              name: categoryName || 'Category Name',
              icon: selectedIcon,
              color: selectedColor,
              isDefault: false,
              createdBy: userMode,
              isApproved: true,
              createdAt: Date.now(),
            }}
            onPress={() => {}}
            size="medium"
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Category Name</Text>
          <TextInput
            style={styles.textInput}
            value={categoryName}
            onChangeText={onNameChange}
            placeholder="Enter category name"
            maxLength={20}
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Choose Icon</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconScroll}>
            {availableIcons.map((icon) => (
              <Pressable
                key={icon}
                style={[styles.iconOption, selectedIcon === icon && styles.selectedIconOption]}
                onPress={() => onIconSelect(icon)}
              >
                <CategoryButton
                  customCategory={{
                    id: 'temp',
                    name: '',
                    icon,
                    color: selectedColor,
                    isDefault: false,
                    createdBy: userMode,
                    isApproved: true,
                    createdAt: Date.now(),
                  }}
                  onPress={() => onIconSelect(icon)}
                  size="small"
                />
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Choose Color</Text>
          <View style={styles.colorGrid}>
            {availableColors.map((color) => (
              <Pressable
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  selectedColor === color && styles.selectedColorOption,
                ]}
                onPress={() => onColorSelect(color)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
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
  modalButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  inputSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.card,
  },
  iconScroll: {
    marginTop: 8,
  },
  iconOption: {
    marginRight: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedIconOption: {
    borderColor: Colors.primary,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  selectedColorOption: {
    borderColor: Colors.text,
  },
});
