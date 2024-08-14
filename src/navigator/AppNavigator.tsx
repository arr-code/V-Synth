import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import HomeScreen from '../screens/HomeScreen';
import SettingScreen from '../screens/SettingScreen';
import InformationScreen from '../screens/InformationScreen';
import { NavigationContainer } from '@react-navigation/native';

const Tab = createMaterialTopTabNavigator();

function AppNavigator() {
  return (
    <NavigationContainer>
        <Tab.Navigator 
            initialRouteName='Setting'
            style={{
                height: 'auto'
            }}
            screenOptions={{
                swipeEnabled: false
            }}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Config" component={SettingScreen} />
            <Tab.Screen name="Info" component={InformationScreen} />
        </Tab.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator