import { NavigationContainer} from '@react-navigation/native'
import AppNavigator from './AppNavigator'
import ButtomTabsNavigator from './BottomTabsNavigator'
import TopTabsNavigator from './TopTabsNavigator'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import DrawerNavigator from './DrawerNavigator'

export default function RootNavigator() {
    return (
        <>
        <SafeAreaProvider>
            <NavigationContainer>
                <DrawerNavigator/>
                {/* <TopTabsNavigator/> */}
                {/* <ButtomTabsNavigator/> */}
            </NavigationContainer>
        </SafeAreaProvider>
        </>
    )
}