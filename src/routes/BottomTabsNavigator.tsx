import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Home from "../screens/dashboard/Home";
import Profile from "../screens/dashboard/Profile";
import Icon from "@react-native-vector-icons/fontawesome6";
import ProductListScreen from "../screens/dashboard/ProductListScreen";
import { View, Text, StyleSheet } from "react-native";

const Tabs = createBottomTabNavigator();

export default function BottomTabsNavigator() {
    return (
        <Tabs.Navigator 
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#ffffff',
                tabBarInactiveTintColor: '#4caf50',
                tabBarShowLabel: true,
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    height: 60,
                    borderTopWidth: 0,
                    paddingTop: 10,
                    paddingBottom: 10,
                    shadowColor: '#000',
                },
            }}
        >
            <Tabs.Screen 
                name="Home" 
                component={Home}
                options={{
                    tabBarIcon: ({focused}) => (
                        <View style={styles.tabWrapper}>
                            <View style={[
                                styles.tabBackground,
                                focused && styles.tabBackgroundActive
                            ]}>
                                <View style={[
                                    styles.tabIconContainer,
                                    focused && styles.tabIconContainerActive
                                ]}>
                                    <Icon 
                                        name='house' 
                                        size={focused ? 22 : 18} 
                                        iconStyle="solid"
                                        color={focused ? '#ffffff' : '#4caf50'}
                                    />
                                </View>
                            </View>
                        </View>
                    ),
                }}
            />
            
            <Tabs.Screen 
                name="Product" 
                component={ProductListScreen}
                options={{
                    tabBarIcon: ({focused}) => (
                        <View style={styles.tabWrapper}>
                            <View style={[
                                styles.tabBackground,
                                focused && styles.tabBackgroundActive
                            ]}>
                                <View style={[
                                    styles.tabIconContainer,
                                    focused && styles.tabIconContainerActive
                                ]}>
                                    <Icon 
                                        name='cart-shopping' 
                                        size={focused ? 22 : 18} 
                                        iconStyle="solid" 
                                        color={focused ? '#ffffff' : '#4caf50'}
                                    />
                                </View>
                            </View>
                        </View>
                    ),
                }}
            />

            <Tabs.Screen 
                name="Profile" 
                component={Profile}
                options={{
                    tabBarIcon: ({focused}) => (
                        <View style={styles.tabWrapper}>
                            <View style={[
                                styles.tabBackground,
                                focused && styles.tabBackgroundActive
                            ]}>
                                <View style={[
                                    styles.tabIconContainer,
                                    focused && styles.tabIconContainerActive
                                ]}>
                                    <Icon 
                                        name='user' 
                                        size={focused ? 22 : 18} 
                                        iconStyle="solid"
                                        color={focused ? '#ffffff' : '#4caf50'}
                                    />
                                </View>
                            </View>
                        </View>
                    ),
                }}
            />
        </Tabs.Navigator>
    );
}

const styles = StyleSheet.create({
    tabWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 85,
    },
    tabBackground: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
        marginBottom: 4,
    },
    tabBackgroundActive: {
        backgroundColor: '#f0f7f0',
        shadowColor: '#2e7d32',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    tabIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    tabIconContainerActive: {
        backgroundColor: '#4caf50',
        transform: [{ translateY: -12 }],
        shadowColor: '#2e7d32',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 8,
    },
});