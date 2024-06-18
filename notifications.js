

import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

let soundObject;
let isPlaying = false; // Variable global para controlar la reproducción de audio

async function playSong() {
  if (isPlaying) {
    console.log('Audio already playing');
    return;
  }

  isPlaying = true; // Marcar como audio en reproducción
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('./assets/sound.mp3'),
      { isLooping: true }
    );
    soundObject = sound;
    await soundObject.playAsync();
    soundObject.setOnPlaybackStatusUpdate(status => {
      if (!status.isPlaying) {
        isPlaying = false; // Marcar como audio detenido
      }
    });
  } catch (error) {
    console.error('You have an error reproducing a song:', error);
    isPlaying = false;
  }
}

async function stopSong() {
  if (soundObject) {
    try {
      await soundObject.stopAsync();
      await soundObject.unloadAsync();
      soundObject = null; // Asegurarse de liberar el objeto de sonido
      isPlaying = false; // Marcar como audio detenido
    } catch (error) {
      console.error('You have an error stopping the song:', error);
    }
  }
}

export async function scheduleNotification(date) {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    alert('Permission to access notifications was denied');
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Alarma',
      body: 'Es hora de tu medicina',
      launchImageName: 'FotoPiero.jpg',
      sticky: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: {
      date: date,
    },
  });
}

Notifications.addNotificationReceivedListener(async notification => {
  await playSong();
});

Notifications.addNotificationResponseReceivedListener(async notification => {
  await stopSong();
});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});
