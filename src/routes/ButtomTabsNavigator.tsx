import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Home from "../screens/dashboard/Home";
import Profile from "../screens/dashboard/Profile";
import Icon from "@react-native-vector-icons/fontawesome6";
import ProductListScreen from "../screens/dashboard/ProductListScreen";


export default function ButtomTabsNavigator() {
    const Tabs = createBottomTabNavigator();

    return (
        <>
           <Tabs.Navigator screenOptions={{
                headerShown : false,
                tabBarActiveTintColor : 'green',
                tabBarShowLabel : true,
                tabBarStyle : {
                    backgroundColor : 'black',
                    height : 60
                }
                }}>
                <Tabs.Screen 
                    name="Home" 
                    component={Home}
                    options={{
                        tabBarIcon: ({color, size, focused}) => <Icon name='house' size={16} iconStyle="solid" color={color}/>
                    }}
                    />
                
                <Tabs.Screen 
                    name="Product" 
                    component={ProductListScreen}
                    options={{
                        tabBarIcon: ({color, size, focused}) => <Icon name='cart-shopping' size={16} iconStyle="solid" color={color}/>
                    }}
                    />

                <Tabs.Screen 
                    name="Profile" 
                    component={Profile}
                    options={{
                        tabBarIcon: ({color, size, focused}) => <Icon name='user' size={16} iconStyle="solid" color={color}/>
                    }}
                    />
           </Tabs.Navigator>
        </>
    )
}