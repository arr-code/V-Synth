import { View, Text } from 'react-native'
import React from 'react'
import tw from 'twrnc';

export default function MainScreen({children}: any) {
  return (
    <View style={tw`bg-slate-200 h-full`}>
      {children}
    </View>
  )
}