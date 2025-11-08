import { NavigationContainer} from '@react-navigation/native'
import AppNavigator from './AppNavigator'
import ButtomTabsNavigator from './ButtomTabsNavigator'

export default function RootNavigator() {
    return (
        <>
            <NavigationContainer>
                <ButtomTabsNavigator/>
            </NavigationContainer>
        </>
    )
}