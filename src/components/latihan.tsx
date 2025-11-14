import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Text, View } from "react-native";
import ErrorBoundary from "./ErrorBoundary";


const AppTest = () => {
    const [user, setUser] = useState()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const controller = new AbortController();
        const fetchUser = async () => {
            try {
                const response = await fetch('https://jsonplaceholder.typicode.com/users', {
                    signal: controller.signal,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setUser(data);
            } catch (error: any) {
                if (error.name === 'AbortError') {
                    console.log('Fetch aborted');
                    return
                }
                setError(error.message);
                Alert.alert('Error', error.message);
            } finally {
                setLoading(false);
            }
        }

        fetchUser()
        return () => controller.abort();
    }, [])


    if (loading) return <ActivityIndicator size="large" color="#0000ff" />;
    if (error) return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Error: {error}</Text>
        </View>
    );


    return (
        <>
            <FlatList
                data={user}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => <Text>{item.name}</Text>}
            />
        </>
    )

}

export default function Latihan() {
    return (
        <ErrorBoundary>
            <AppTest />
        </ErrorBoundary>
    )
}