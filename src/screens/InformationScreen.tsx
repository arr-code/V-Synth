import { View, Text } from 'react-native'
import React from 'react'
import tw from 'twrnc';
import MainScreen from '../components/MainScreen';

export default function InformationScreen() {
  return (
    <MainScreen>
      <View style={tw`flex-1 items-center justify-center p-5`}>
        <Text style={tw`text-3xl font-bold`}>Information Screen</Text>
      </View>
    </MainScreen>
  )
}