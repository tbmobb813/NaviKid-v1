// Global styles for the Kid-Friendly Map app
// Shared styles to be imported into components for consistency

import { StyleSheet } from 'react-native';
import Colors from '@/constants/colors';

const globalStyles = StyleSheet.create({
  // ===== CARD STYLES =====
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },

  cardNoPadding: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginBottom: 12,
  },

  cardLarge: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },

  // ===== SECTION STYLES =====
  section: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  // ===== ICON CONTAINER STYLES =====
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  iconContainerLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  // ===== TEXT STYLES =====
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },

  titleLarge: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 14,
    color: Colors.textLight,
  },

  subtitleSmall: {
    fontSize: 12,
    color: Colors.textLight,
  },

  emptyText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },

  // ===== PRESSABLE/LINK ITEM STYLES =====
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },

  linkItemPressed: {
    opacity: 0.8,
    backgroundColor: '#EAEAEA',
  },

  linkTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },

  // ===== SETTING/PREFERENCE ITEM STYLES =====
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },

  settingContent: {
    flex: 1,
  },

  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },

  settingDescription: {
    fontSize: 14,
    color: Colors.textLight,
  },

  // ===== MODAL STYLES =====
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },

  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },

  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },

  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },

  modalButtonPrimary: {
    backgroundColor: Colors.primary,
  },

  modalButtonSecondary: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  modalButtonTextPrimary: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  modalButtonTextSecondary: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },

  // ===== CONTENT ITEM STYLES (for lists) =====
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  contentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },

  contentItemContent: {
    flex: 1,
  },

  // ===== LOCATION STYLES =====
  locationPin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  locationText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },

  // ===== ALERT/NOTIFICATION STYLES =====
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },

  alertContent: {
    flex: 1,
  },

  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },

  alertSubtitle: {
    fontSize: 12,
    color: Colors.textLight,
  },

  // ===== SHADOW STYLES =====
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  shadowMedium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },

  // ===== PRESSED STATE =====
  pressed: {
    opacity: 0.8,
    backgroundColor: '#EAEAEA',
  },

  // ===== CONTAINER STYLES =====
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  contentContainer: {
    padding: 16,
  },
});

export default globalStyles;
