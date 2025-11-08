import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, Image } from "react-native"

const Profile = () => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>My Profile</Text>
                    <View style={styles.placeholder} />
                </View>

                {/* Profile Section */}
                <View style={styles.profileSection}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>JS</Text>
                        </View>
                        <View style={styles.verifiedBadge}>
                            <Text style={styles.verifiedText}>✓</Text>
                        </View>
                    </View>
                    
                    <Text style={styles.userName}>John Smith</Text>
                    <Text style={styles.userEmail}>john.smith@example.com</Text>
                    
                    <View style={styles.memberSince}>
                        <Text style={styles.memberSinceText}>Member since March 2024</Text>
                    </View>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>15</Text>
                        <Text style={styles.statLabel}>Orders</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>8</Text>
                        <Text style={styles.statLabel}>Reviews</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>3</Text>
                        <Text style={styles.statLabel}>Badges</Text>
                    </View>
                </View>

                {/* Profile Menu */}
                <View style={styles.menuSection}>
                    <Text style={styles.menuTitle}>Account Settings</Text>
                    
                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuItemText}>📱 Personal Information</Text>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuItemText}>🛒 Order History</Text>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuItemText}>💳 Payment Methods</Text>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuItemText}>📍 Shipping Address</Text>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuItemText}>🔔 Notifications</Text>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>
                </View>

                {/* Achievements Section */}
                <View style={styles.achievementsSection}>
                    <Text style={styles.achievementsTitle}>My Achievements</Text>
                    <View style={styles.achievementsGrid}>
                        <View style={styles.achievementBadge}>
                            <Text style={styles.achievementIcon}>🛍️</Text>
                            <Text style={styles.achievementName}>First Purchase</Text>
                            <Text style={styles.achievementDesc}>Made first order</Text>
                        </View>
                        <View style={styles.achievementBadge}>
                            <Text style={styles.achievementIcon}>📱</Text>
                            <Text style={styles.achievementName}>Tech Lover</Text>
                            <Text style={styles.achievementDesc}>Bought 5+ electronics</Text>
                        </View>
                        <View style={styles.achievementBadge}>
                            <Text style={styles.achievementIcon}>👕</Text>
                            <Text style={styles.achievementName}>Fashionista</Text>
                            <Text style={styles.achievementDesc}>10+ clothing items</Text>
                        </View>
                    </View>
                    
                    <View style={styles.achievementsGrid}>
                        <View style={styles.achievementBadge}>
                            <Text style={styles.achievementIcon}>⭐</Text>
                            <Text style={styles.achievementName}>Reviewer</Text>
                            <Text style={styles.achievementDesc}>5+ product reviews</Text>
                        </View>
                        <View style={styles.achievementBadge}>
                            <Text style={styles.achievementIcon}>🌱</Text>
                            <Text style={styles.achievementName}>Eco Warrior</Text>
                            <Text style={styles.achievementDesc}>Sustainable shopper</Text>
                        </View>
                        <View style={styles.achievementBadge}>
                            <Text style={styles.achievementIcon}>🎯</Text>
                            <Text style={styles.achievementName}>Loyal Customer</Text>
                            <Text style={styles.achievementDesc}>1 year with us</Text>
                        </View>
                    </View>
                </View>

                {/* Recent Activity */}
                <View style={styles.activitySection}>
                    <Text style={styles.activityTitle}>Recent Activity</Text>
                    <View style={styles.activityList}>
                        <View style={styles.activityItem}>
                            <Text style={styles.activityIcon}>📦</Text>
                            <View style={styles.activityContent}>
                                <Text style={styles.activityText}>Order #12345 delivered</Text>
                                <Text style={styles.activityTime}>2 days ago</Text>
                            </View>
                        </View>
                        <View style={styles.activityItem}>
                            <Text style={styles.activityIcon}>⭐</Text>
                            <View style={styles.activityContent}>
                                <Text style={styles.activityText}>You reviewed EcoPhone X</Text>
                                <Text style={styles.activityTime}>1 week ago</Text>
                            </View>
                        </View>
                        <View style={styles.activityItem}>
                            <Text style={styles.activityIcon}>👕</Text>
                            <View style={styles.activityContent}>
                                <Text style={styles.activityText}>Added Organic Tee to wishlist</Text>
                                <Text style={styles.activityTime}>2 weeks ago</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.editButton}>
                        <Text style={styles.editButtonText}>Edit Profile</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.logoutButton}>
                        <Text style={styles.logoutButtonText}>Log Out</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f0f7f0',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#d4e8d4',
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        color: '#4caf50',
        fontSize: 16,
        fontWeight: '600',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2e7d32',
    },
    placeholder: {
        width: 60,
    },
    profileSection: {
        alignItems: 'center',
        paddingVertical: 30,
        paddingHorizontal: 20,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 15,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#4caf50',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#ffffff',
        shadowColor: '#2e7d32',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4.65,
        elevation: 7,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#4caf50',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#ffffff',
    },
    verifiedText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2e7d32',
        marginBottom: 5,
    },
    userEmail: {
        fontSize: 16,
        color: '#4caf50',
        marginBottom: 15,
        opacity: 0.8,
    },
    memberSince: {
        backgroundColor: '#e8f5e8',
        paddingHorizontal: 15,
        paddingVertical: 6,
        borderRadius: 15,
    },
    memberSinceText: {
        fontSize: 12,
        color: '#388e3c',
        fontWeight: '500',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    statCard: {
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 15,
        borderRadius: 12,
        minWidth: 80,
        shadowColor: '#2e7d32',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2e7d32',
    },
    statLabel: {
        fontSize: 11,
        color: '#4caf50',
        marginTop: 4,
        textAlign: 'center',
    },
    menuSection: {
        backgroundColor: '#ffffff',
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 15,
        paddingVertical: 10,
        shadowColor: '#2e7d32',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2.22,
        elevation: 3,
    },
    menuTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2e7d32',
        marginHorizontal: 20,
        marginVertical: 15,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    menuItemText: {
        fontSize: 16,
        color: '#388e3c',
        fontWeight: '500',
    },
    menuArrow: {
        fontSize: 20,
        color: '#4caf50',
    },
    achievementsSection: {
        backgroundColor: '#ffffff',
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 15,
        padding: 20,
        shadowColor: '#2e7d32',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2.22,
        elevation: 3,
    },
    achievementsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2e7d32',
        marginBottom: 15,
    },
    achievementsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    achievementBadge: {
        alignItems: 'center',
        padding: 10,
        flex: 1,
        marginHorizontal: 5,
    },
    achievementIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    achievementName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#2e7d32',
        textAlign: 'center',
        marginBottom: 4,
    },
    achievementDesc: {
        fontSize: 10,
        color: '#4caf50',
        textAlign: 'center',
        lineHeight: 12,
    },
    activitySection: {
        backgroundColor: '#ffffff',
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 15,
        padding: 20,
        shadowColor: '#2e7d32',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2.22,
        elevation: 3,
    },
    activityTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2e7d32',
        marginBottom: 15,
    },
    activityList: {
        // Styles for activity list
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    activityIcon: {
        fontSize: 20,
        marginRight: 12,
        width: 30,
    },
    activityContent: {
        flex: 1,
    },
    activityText: {
        fontSize: 14,
        color: '#388e3c',
        fontWeight: '500',
        marginBottom: 2,
    },
    activityTime: {
        fontSize: 12,
        color: '#4caf50',
        opacity: 0.7,
    },
    actionButtons: {
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    editButton: {
        backgroundColor: '#4caf50',
        paddingVertical: 15,
        borderRadius: 25,
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#4caf50',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 7,
    },
    editButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    logoutButton: {
        backgroundColor: '#ff6b6b',
        paddingVertical: 14,
        borderRadius: 25,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#ff6b6b',
    },
    logoutButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default Profile