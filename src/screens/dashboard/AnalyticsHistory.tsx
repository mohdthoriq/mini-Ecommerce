// screens/AnalyticsHistoryScreen.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

// Simpan data analytics global (bisa diganti dengan AsyncStorage/Context)
let analyticsHistory: Array<{
    id: string;
    timestamp: string;
    currentRoute: string;
    previousRoute?: string;
    type: 'navigation';
}> = [];

// Fungsi untuk menambah data analytics
export const addAnalyticsEvent = (currentRoute: string, previousRoute?: string) => {
    const newEvent = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        currentRoute,
        previousRoute,
        type: 'navigation' as const,
    };

    analyticsHistory.unshift(newEvent); // Tambah di awal array

    // Simpan maksimal 100 events
    if (analyticsHistory.length > 100) {
        analyticsHistory = analyticsHistory.slice(0, 100);
    }

    return newEvent;
};

// Fungsi untuk mendapatkan analytics history
export const getAnalyticsHistory = () => {
    return [...analyticsHistory]; // Return copy
};

const AnalyticsHistoryScreen = () => {
    const navigation = useNavigation();
    const [history, setHistory] = useState(analyticsHistory);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = () => {
        setRefreshing(true);
        setHistory([...analyticsHistory]);
        setRefreshing(false);
    };

    // Auto refresh ketika screen focus
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            setHistory([...analyticsHistory]);
        });

        return unsubscribe;
    }, [navigation]);

    const clearHistory = () => {
        analyticsHistory = [];
        setHistory([]);
    };

    const getRouteIcon = (routeName: string) => {
        const icons: { [key: string]: string } = {
            Home: 'house',
            ProductDetail: 'box',
            CheckoutModal: 'credit-card',
            Categories: 'grid',
            Profile: 'user',
            Settings: 'gear',
            Login: 'right-to-bracket',
            Popular: 'fire',
            New: 'star',
            Discount: 'tag',
            Analytics: 'chart-line',
            AnalyticsHistory: 'chart-simple',
            History: 'clock-rotate-left',
            Favorites: 'heart',
        };
        return icons[routeName] || 'map';
    };

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollViewContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#2e7d32']}
                    />
                }
            >
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>📊 Analytics History</Text>
                <TouchableOpacity
                    style={styles.clearButton}
                    onPress={clearHistory}
                >
                    <FontAwesome6 name="trash" size={16} color="#ffffff" iconStyle='solid' />
                </TouchableOpacity>
            </View>

            {/* Stats Summary */}
            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{history.length}</Text>
                    <Text style={styles.statLabel}>Total Events</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                        {new Set(history.map(item => item.currentRoute)).size}
                    </Text>
                    <Text style={styles.statLabel}>Unique Screens</Text>
                </View>
            </View>

            {/* History List */}

                {history.length === 0 ? (
                    <View style={styles.emptyState}>
                        <FontAwesome6 name="chart-line" size={48} color="#ccc" iconStyle='solid' />
                        <Text style={styles.emptyText}>No analytics data yet</Text>
                        <Text style={styles.emptySubtext}>
                            Navigate through the app to see analytics events
                        </Text>
                    </View>
                ) : (
                    history.map((event) => (
                        <View key={event.id} style={styles.eventItem}>
                            <View style={styles.eventIcon}>
                                <FontAwesome6
                                    name={getRouteIcon(event.currentRoute) as any}
                                    size={16}
                                    color="#ec6a43ff"
                                    iconStyle='solid'
                                />
                            </View>

                            <View style={styles.eventContent}>
                                <Text style={styles.eventRoute}>{event.currentRoute}</Text>

                                {event.previousRoute && (
                                    <Text style={styles.eventPrevious}>
                                        From: {event.previousRoute}
                                    </Text>
                                )}

                                <Text style={styles.eventTime}>{event.timestamp}</Text>
                            </View>

                            <View style={styles.eventType}>
                                <Text style={styles.eventTypeText}>{event.type}</Text>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#9bf89bff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#2e7d32',
        padding: 20,
        paddingTop: 20,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
    },
     scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        flexGrow: 1,
    },
    clearButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 8,
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        padding: 20,
        margin: 16,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2e7d32',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    listContainer: {
        flex: 1,
        padding: 16,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 18,
        color: '#666',
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        lineHeight: 20,
    },
    eventItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    eventIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#e8f5e9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    eventContent: {
        flex: 1,
    },
    eventRoute: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2e7d32',
        marginBottom: 4,
    },
    eventPrevious: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    eventTime: {
        fontSize: 11,
        color: '#999',
    },
    eventType: {
        backgroundColor: '#f0f7f0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    eventTypeText: {
        fontSize: 10,
        color: '#4caf50',
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
});

export default AnalyticsHistoryScreen;