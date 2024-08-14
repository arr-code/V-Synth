import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import tw from 'twrnc';
import MainScreen from '../components/MainScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

export default function Settingcreen() {
  const [host, setHost] = useState('');
  const [port, setPort] = useState('');
  const [modelLanguage, setModelLanguage] = useState('');
  const [voiceLanguage, setVoiceLanguage] = useState('');

  const handleSubmit = async () => {
    if (!host || !port || !modelLanguage || !voiceLanguage) {
      Alert.alert('Error', 'Please fill out all fields');
      return;
    }

    const data = {
      host,
      port,
      modelLanguage,
      voiceLanguage,
    };

    try {
      await AsyncStorage.setItem('vsynth-config', JSON.stringify(data));
      Alert.alert('Success', 'Data saved successfully');
    } catch (error) {
      console.error('Error saving data to local storage:', error);
      Alert.alert('Error', 'Failed to save data');
    }

    // Reset fields after submission
    // setHost('');
    // setPort('');
    // setModelLanguage('');
    // setVoiceLanguage('');
  };

  const checkConnection = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(`http://${host}:${port}/`, { method: 'GET', signal: controller.signal });
      if (response.status === 200) {
        Alert.alert('Success', 'Connection successful');
      } else {
        Alert.alert('Error', 'Failed to connect');
      }
    } catch (error) {
      console.error('Error checking connection:', error);
      Alert.alert('Error', 'Failed to connect');
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const loadData = async () => {
    try {
      const storedData = await AsyncStorage.getItem('vsynth-config');
      if (storedData) {
        const data = JSON.parse(storedData);
        setHost(data.host);
        setPort(data.port);
        setModelLanguage(data.modelLanguage);
        setVoiceLanguage(data.voiceLanguage);
      }
    } catch (error) {
      console.error('Error loading data from local storage:', error);
      Alert.alert('Error', 'Failed to load data');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <MainScreen>
      <View style={tw`flex-1 p-5 justify-center`}>
        <Text style={tw`text-3xl font-bold text-center mb-5`}>Input Data</Text>

        <Text style={tw`text-lg mb-2`}>Host</Text>
        <TextInput
          style={tw`border p-2 mb-4 rounded`}
          placeholder="Enter host"
          value={host}
          onChangeText={setHost}
        />

        <Text style={tw`text-lg mb-2`}>Port</Text>
        <TextInput
          style={tw`border p-2 mb-4 rounded`}
          placeholder="Enter port"
          value={port}
          onChangeText={setPort}
          keyboardType="numeric"
        />

        <Text style={tw`text-lg mb-2`}>Model Language</Text>
        <View style={tw`border p-2 mb-4 rounded`}>
          <Picker
            selectedValue={modelLanguage}
            onValueChange={(itemValue) => setModelLanguage(itemValue)}
          >
            <Picker.Item label="Select Model Language" value="" />
            <Picker.Item label="Indonesian" value="ID" />
            <Picker.Item label="English" value="EN" />
          </Picker>
        </View>

        <Text style={tw`text-lg mb-2`}>Voice Language</Text>
        <View style={tw`border p-2 mb-4 rounded`}>
          <Picker
            selectedValue={voiceLanguage}
            onValueChange={(itemValue) => setVoiceLanguage(itemValue)}
          >
            <Picker.Item label="Select Voice Language" value="" />
            <Picker.Item label="Indonesian" value="ID" />
            <Picker.Item label="English" value="EN" />
          </Picker>
        </View>

        <TouchableOpacity
          style={tw`bg-blue-500 p-3 rounded-full mt-5`}
          onPress={handleSubmit}
        >
          <Text style={tw`text-white text-center text-lg`}>Submit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={tw`bg-green-500 p-3 rounded-full mt-5`}
          onPress={checkConnection}
        >
          <Text style={tw`text-white text-center text-lg`}>Check Connection</Text>
        </TouchableOpacity>
      </View>
    </MainScreen>
  );
}