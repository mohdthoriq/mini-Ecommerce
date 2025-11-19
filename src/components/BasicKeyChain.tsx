import React from 'react';
import { Alert, Button, Text, View } from 'react-native';
import * as keychain from 'react-native-keychain';



export default function BasicKeychain() {


    const [token, setToken] = React.useState('')


    const saveToken = async () => {
        try {
            const result = await keychain.setGenericPassword('token', 'app-user-token',{ service: '@app:auth'})
            if (result) Alert.alert('Success', 'Token saved')
            } catch (error: any) {
            Alert.alert('Error', error.message)
        }
    }

    const loadToken = async () => {
        try {
            const credential = await keychain.getGenericPassword({ service: '@app:auth' })
            if (credential) {
                setToken(credential.password)
                Alert.alert('Success', 'Token loaded')
            } else {
                Alert.alert('Error', 'No token found')
            }
        } catch (error: any) {
            Alert.alert('Error', error.message)
        }
    }

    const removeToken = async () => {
        try {
            const result = await keychain.resetGenericPassword({ service: '@app:auth' })
            if (result) {
                setToken('')
                Alert.alert('Success', 'Token removed')
            }
        } catch (error : any) {
            Alert.alert('Error', error.message)
        }
    }


    return (
        <>
            <View>
                <Text>BasicKeychain</Text>
                <Text>Token: {token ? token : 'None'}</Text>
                <Button title='Save Token' onPress={saveToken} />
                <Button title='load Token' onPress={loadToken} /> 
                <Button title='remove Token' onPress={removeToken} /> 

            </View>
        </>
    )
}