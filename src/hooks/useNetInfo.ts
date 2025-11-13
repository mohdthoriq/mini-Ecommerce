import NetInfo from '@react-native-community/netinfo';
import React, { useEffect } from 'react';

export const useNetInfo = () => {
    const [isOnline, setIsOnline] = React.useState(false)
    const [connectionType, setConnectionType] =React.useState('unknown')

    useEffect(() => {
        const ussubscribe = NetInfo.addEventListener(state => {
            const reachable = state.isConnected && state.isInternetReachable
            setIsOnline(reachable!)
            setConnectionType(state.type)
        })

        return () => ussubscribe()
    }, [])

    return { isOnline, connectionType }
}