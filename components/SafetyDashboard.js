import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Alert } from 'react-native';
import Colors from '@/constants/colors';
import { Shield, Camera, MapPin, Phone, MessageCircle, Clock, CheckCircle, AlertTriangle, Users, Settings, ArrowRight } from 'lucide-react-native';
import { useParentalStore } from '@/stores/parentalStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useSafeZoneMonitor } from '@/hooks/useSafeZoneMonitor';
import PhotoCheckInButton from './PhotoCheckInButton';
import { SafeZoneIndicator } from './SafeZoneIndicator';
const SafetyDashboard = ({ currentLocation, currentPlace, onNavigateToSettings }) => {
    const { settings, checkInRequests, safeZones } = useParentalStore();
    const { photoCheckIns } = useNavigationStore();
    const { getCurrentSafeZoneStatus } = useSafeZoneMonitor();
    const currentZoneStatus = getCurrentSafeZoneStatus ? getCurrentSafeZoneStatus() : null;
    const [showQuickActions, setShowQuickActions] = useState(true);
    // Calculate safety stats
    const recentCheckIns = photoCheckIns.slice(0, 3);
    const activeSafeZones = safeZones.filter(zone => zone.isActive).length;
    const pendingCheckInRequests = checkInRequests.filter(req => req.status === 'pending').length;
    const emergencyContacts = settings.emergencyContacts.length;
    const handleEmergencyCall = () => {
        Alert.alert("Emergency Help", "Choose how you'd like to get help:", [
            { text: "Cancel", style: "cancel" },
            { text: "Call 911", style: "destructive", onPress: () => logger.info("Emergency call") },
            { text: "Call Parent", onPress: () => logger.info("Parent call") }
        ]);
    };
    const handleQuickCheckIn = () => {
        Alert.alert("Quick Check-in", "Let your family know you're okay?", [
            { text: "Not now", style: "cancel" },
                { text: "I&apos;m OK!", onPress: () => logger.info("Quick check-in sent") }
        ]);
    };
    const SafetyStatCard = ({ icon, title, value, subtitle, color = Colors.primary, onPress }) => (_jsxs(Pressable, { style: [styles.statCard, onPress && styles.pressableCard], onPress: onPress, children: [_jsx(View, { style: [styles.statIcon, { backgroundColor: `${color}20` }], children: React.cloneElement(icon, {
                    size: 20,
                    color
                }) }), _jsxs(View, { style: styles.statContent, children: [_jsx(Text, { style: styles.statValue, children: value }), _jsx(Text, { style: styles.statTitle, children: title }), _jsx(Text, { style: styles.statSubtitle, children: subtitle })] }), onPress && _jsx(ArrowRight, { size: 16, color: Colors.textLight })] }));
    const QuickActionButton = ({ icon, title, onPress, color = Colors.primary }) => (_jsxs(Pressable, { style: [styles.quickActionButton, { backgroundColor: color }], onPress: onPress, children: [React.cloneElement(icon, {
                size: 20,
                color: '#FFFFFF'
            }), _jsx(Text, { style: styles.quickActionText, children: title })] }));
    return (_jsxs(View, { style: styles.container, children: [_jsxs(View, { style: styles.header, children: [_jsxs(View, { style: styles.headerLeft, children: [_jsx(Shield, { size: 24, color: Colors.primary }), _jsx(Text, { style: styles.headerTitle, children: "Safety Dashboard" })] }), onNavigateToSettings && (_jsx(Pressable, { style: styles.settingsButton, onPress: onNavigateToSettings, children: _jsx(Settings, { size: 20, color: Colors.textLight }) }))] }), _jsxs(ScrollView, { style: styles.content, showsVerticalScrollIndicator: false, children: [_jsxs(View, { style: styles.section, children: [_jsx(Text, { style: styles.sectionTitle, children: "Current Status" }), _jsx(SafeZoneIndicator, {}), currentZoneStatus && (() => {
                                const isInSafeZone = currentZoneStatus.inside && currentZoneStatus.inside.length > 0;
                                const zoneName = isInSafeZone ? currentZoneStatus.inside[0].name : undefined;
                                return (_jsxs(View, { style: [
                                        styles.statusCard,
                                        { backgroundColor: isInSafeZone ? '#E8F5E8' : '#FFF3E0' }
                                    ], children: [_jsx(View, { style: [
