import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, Text, Alert, Image, PermissionsAndroid, Platform } from 'react-native';
import tw from 'twrnc';
import MainScreen from '../components/MainScreen';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCameraRetro, faRefresh } from '@fortawesome/free-solid-svg-icons';
import { Camera, useCameraDevice, useCameraPermission, useCameraFormat } from 'react-native-vision-camera';
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
// import {API_URL} from '@env'
import AsyncStorage from '@react-native-async-storage/async-storage';
import Tts from 'react-native-tts';

const HomeScreen = () => {
  const [host, setHost] = useState('');
  const [port, setPort] = useState('');
  const [modelLanguage, setModelLanguage] = useState('');
  const [voiceLanguage, setVoiceLanguage] = useState('');
  const [translatedText, setTranslatedText] = useState('');

  const { hasPermission, requestPermission } = useCameraPermission();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const cameraRef = useRef(null);
  const device = useCameraDevice('back'); // Assuming back camera
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [desc, setDesc] = useState('');
  const format = useCameraFormat(device, [
    { photoResolution: { width: 100, height: 100 } }
  ])

  const loadData = async () => {
    try {
      const storedData = await AsyncStorage.getItem('vsynth-config');
      if (storedData) {
        const data = JSON.parse(storedData);
        setHost(data.host);
        setPort(data.port);
        setModelLanguage(data.modelLanguage);
        setVoiceLanguage(data.voiceLanguage);
        console.log('Loaded data from local storage:', data);
      }
    } catch (error) {
      console.error('Error loading data from local storage:', error);
      Alert.alert('Error', 'Failed to load data');
    }
  };

  useLayoutEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Set the default language to Indonesian
    Tts.setDefaultLanguage('id-ID').catch(error => {
      console.error('Error setting default language:', error);
    });

    Tts.getInitStatus().then(() => {
      Tts.speak('Selamat Datang!');
    }).catch(err => {
      if (err.code === 'no_engine') {
        Tts.requestInstallEngine();
      } else {
        console.error('Error initializing TTS:', err);
      }
    });
  }, []);
  
  useEffect(() => {
    const checkPermission = async () => {
      const permission = await requestPermission();
      if (!permission) {
        Alert.alert('Permission Required', 'Please grant camera permission to use the camera.');
      }

      setIsCameraReady(true);
    };

    checkPermission();
  }, []);

  async function hasAndroidPermission() {
    const getCheckPermissionPromise = () => {
      if (typeof Platform.Version === 'number' && Platform.Version >= 33) {
        return Promise.all([
          PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES),
          PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO),
        ]).then(
          ([hasReadMediaImagesPermission, hasReadMediaVideoPermission]) =>
            hasReadMediaImagesPermission && hasReadMediaVideoPermission,
        );
      } else {
        return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
      }
    };
  
    const hasPermission = await getCheckPermissionPromise();
    if (hasPermission) {
      return true;
    }
    const getRequestPermissionPromise = () => {
      if (typeof Platform.Version === 'number' && Platform.Version >= 33) {
        return PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
        ]).then(
          (statuses) =>
            statuses[PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES] ===
              PermissionsAndroid.RESULTS.GRANTED &&
            statuses[PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO] ===
              PermissionsAndroid.RESULTS.GRANTED,
        );
      } else {
        return PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE).then((status) => status === PermissionsAndroid.RESULTS.GRANTED);
      }
    };
  
    return await getRequestPermissionPromise();
  }

  const translate = (text: string) => {
    const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${modelLanguage}|${voiceLanguage}`;
    console.log(`Original text: ${text}`);
    fetch(apiUrl)
    .then((res) => res.json())
    .then((data) => {
      const translation = data.responseData.translatedText;
        setTranslatedText(translation);
        console.log(`Translated text: ${translation}`);
        Tts.speak(translation);
      })
      .catch((error) => {
        console.error('Error translating text:', error);
        Alert.alert('Error', 'Failed to translate text');
      });
  };

  useEffect(() => {
    if (desc) {
      translate(desc);
    }
  }, [desc]);

  const takePhoto = async () => {
    console.log('Attempting to take photo...');
    if (cameraRef.current) {
      try {
        const data = await (cameraRef.current as Camera).takePhoto();
  
        if (Platform.OS === "android" && !(await hasAndroidPermission())) {
          return;
        }
  
        // Access path from captured photo data (optional)
        const photoPath = data.path; // You can use this for logging or other purposes
  
        // Save image to device gallery (using CameraRoll)
        await CameraRoll.save(photoPath, { type: 'photo' });
        console.log('Photo saved to device gallery:', photoPath);
  
        // Handle captured image data (blob)
        const response = await fetch(`file://${data.path}`);
  
        if (!response.ok) {
          throw new Error('Error fetching captured image data');
        }
  
        const blobData = await response.blob();
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === "string") {
              resolve(reader.result.split(',')[1]); // Extract base64 data
            } else {
              reject(new Error('Error converting image to base64'));
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(blobData);
        });
        
        // Use the base64 data for display or other purposes
        setCapturedPhoto(`data:image/${response.headers.get('Content-Type')};base64,${base64Data}`);
        console.log('Photo converted to base64:', capturedPhoto);

        // Upload photo to API
        console.log('Uploading photo to API...');
        const formData = new FormData();
        formData.append('file', base64Data);
        const responseData = await uploadPhotoToApi(formData);
        console.log('Photo upload successful:', responseData);
      } catch (error) {
        console.error('Error taking photo:', error);
      }
    }
  };
  
  const uploadPhotoToApi = async (photoData: FormData) => {
    try {
      const url = `http://${host}:${port}`
      console.log('Uploading photo to API:', url);
      const response = await fetch(`${url}/caption-base64`, { // Use the defined API_URL constant
        method: 'POST',
        body: photoData,
        headers: {
          'Content-Type': 'multipart/form-data', // Important for image uploads
        },
      });
  
      if (!response.ok) {
        throw new Error('Error posting photo to API');
      }
  
      const responseData = await response.json();
      console.log('Photo upload response:', responseData); // Handle response
      setDesc(responseData?.data!);
      return responseData; // Optionally return the response data for further processing
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error; // Re-throw the error for handling in the `takePhoto` function
    }
  };
  

  const reset = () => {
    console.log('Resetting camera...');
    setDesc('');
    setCameraActive(false);
    setCapturedPhoto(null);
  }

  if (!hasPermission) {
    return (
      <MainScreen>
        <View style={tw`flex-1 items-center justify-center p-5`}>
          <Text style={tw`text-3xl font-bold`}>Camera Access Denied</Text>
        </View>
      </MainScreen>
    );
  }

  if (!device) {
    return (
      <MainScreen>
        <View style={tw`flex-1 items-center justify-center p-5`}>
          <Text style={tw`text-3xl font-bold`}>No Camera Found</Text>
        </View>
      </MainScreen>
    );
  }

  if (!host || !port) {
    return (
      <MainScreen>
        <View style={tw`flex-1 items-center justify-center p-5`}>
          <Text style={tw`text-3xl font-bold`}>Please set host and port</Text>
        </View>
      </MainScreen>
    ) 
  }

  return (
    <MainScreen>
      {
        !cameraActive ? (
          <View style={tw`flex-1 items-center justify-center mt-4 p-5`}>
            <Text style={tw`text-3xl font-bold`}>V-Synth</Text>
          </View>
        ) : capturedPhoto ? (
          <View style={tw`h-4/5 items-center justify-center mt-4 p-5`}>
            <Image source={{ uri: capturedPhoto }} style={tw`w-full h-full rounded-lg`} />
            {
              desc && (
                <Text style={tw`font-bold`}>
                  Deskripsi: {translatedText || desc} 
                </Text>
              )
            }
          </View>
        ) : (
          <Camera
            ref={cameraRef}
            device={device}
            isActive={cameraActive} // Only render camera view when active
            photo={true}
            style={tw`h-4/5 p-5 mt-4`}
            format={format}
            photoQualityBalance="speed"
          />
        )
      }

      <View style={[tw`absolute bottom-0 w-full p-5`]} >
        <View style={tw`flex-row items-center justify-between`}>
          <TouchableOpacity style={tw`bg-green-500 p-3 rounded-full`} onPress={() => reset()}>
            <FontAwesomeIcon icon={faRefresh} size={24} color="white" />
          </TouchableOpacity>
          {
            !cameraActive ? (
              <TouchableOpacity style={tw`bg-blue-500 p-3 rounded-full`} onPress={() => setCameraActive(true)}>
                <FontAwesomeIcon icon={faCameraRetro} size={24} color="white" />
              </TouchableOpacity>
            ) : desc !== '' ? (
              <TouchableOpacity style={tw`bg-slate-500 p-3 rounded-full`}>
                <FontAwesomeIcon icon={faCameraRetro} size={24} color="white" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={tw`bg-red-500 p-3 rounded-full`} onPress={() => takePhoto()}>
                <FontAwesomeIcon icon={faCameraRetro} size={24} color="white" />
              </TouchableOpacity> 
            )
          }
        </View>
      </View>
    </MainScreen>
  );
};

export default HomeScreen;
