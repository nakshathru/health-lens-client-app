import { StyleSheet, Button } from 'react-native';
import {randomUUID} from 'expo-crypto';
import EditScreenInfo from '../../components/EditScreenInfo';
import { Text, View } from '../../components/Themed';
import {useState} from 'react';
import { Audio } from 'expo-av';
import { Recording } from 'expo-av/build/Audio';
import {uploadAsync} from 'expo-file-system';
import Toast from 'react-native-root-toast';
import { RootSiblingParent } from 'react-native-root-siblings';

const API_ENDPOINT='https://y9pz5kubn2.execute-api.us-east-1.amazonaws.com'

export default function TabOneScreen() {

  const [recording, setRecording] = useState<Recording>();
  const [patientId, setPatientId] = useState('');
async function startRecording() {
  try {
    Toast.show('Recording Started.', {
      duration: Toast.durations.SHORT,
      animation: true,
      position: Toast.positions.BOTTOM
    });
    console.log('Requesting permissions..');
    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
    setPatientId(randomUUID())
    console.log('Starting recording..');
    
    const { recording } = await Audio.Recording.createAsync( Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    setRecording(recording);
    console.log('Recording started');
  } catch (err) {
    console.error('Failed to start recording', err);
  }
}

async function stopRecording() {
  Toast.show('Recording Stopped.', {
    duration: Toast.durations.SHORT,
    animation: true,
    position: Toast.positions.BOTTOM
  });
  console.log('Stopping recording..');
  setRecording(undefined);
  await recording?.stopAndUnloadAsync();
  await Audio.setAudioModeAsync(
    {
      allowsRecordingIOS: false,
    }
  );
  const uri = recording?.getURI();
  
  console.log('Recording stopped and stored at', uri);

  console.log('Patient ID', patientId);
  
  await uploadAudioToTranscribe(uri!)
}


const getSignedUrl = async () =>{
  const response = await fetch(`${API_ENDPOINT}/signed-url?filename=${patientId}.m4a`, {
    method: 'GET'
});
  return response.json()

}

const uploadAudioToTranscribe = async (file?: string)=>{
  try{
    console.log('inside upload, file location', file);
    const {signedUrl} = await getSignedUrl();
    if(signedUrl){
      const formData:any = new FormData();
      formData.append('file', {
          uri: file,
          type: 'audio/x-wav',
          name: 'speech2text'
      });
      const uploadResult = await uploadAsync(
        signedUrl,
        file!,
        {
          httpMethod: 'PUT',
          headers: {
            'Content-Type': 'audio/mp4', // Update with your file type
          },
        }
      );

      console.log('file uploaded successfully');
      Toast.show('Session Uploaded.', {
        duration: Toast.durations.SHORT,
        animation: true,
        position: Toast.positions.BOTTOM
      });
      
    }
  }
  catch(error){
    console.error(error, 'error occured');
    
  }
}

  return (
    <RootSiblingParent>

    <View style={styles.container}>
      <Text style={styles.title}>HealthLens Session</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />

      <Button
        title={recording ? 'Stop Recording' : 'Start Recording'}
        onPress={recording ? stopRecording : startRecording}
      />



      {/* <EditScreenInfo path="app/(tabs)/index.tsx" /> */}
    </View>
    </RootSiblingParent>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
