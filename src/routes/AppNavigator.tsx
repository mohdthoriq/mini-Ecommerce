import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

import Home from '../screens/dashboard/Home';
import Profile from '../screens/dashboard/Profile';


export default function AppNavigator() {
    return (
        <>
            <Stack.Navigator>
                <Stack.Screen name="Home" component={Home} />
                <Stack.Screen name="Profile" component={Profile} />
            </Stack.Navigator>
        </>
    )
}