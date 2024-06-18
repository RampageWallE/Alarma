import React, { useState, useRef, useEffect } from 'react';
import { Button, View, Platform, FlatList, Text } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Importar AsyncStorage
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { scheduleNotification } from './notifications';
import { registerBackgroundTask } from './backgroundTask';

registerBackgroundTask();

export default function App() {
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);
  const [sound, setSound] = useState();
  const [alarms, setAlarms] = useState([]);

  const soundRef = useRef();

  useEffect(() => {
    loadAlarms();
  }, []);

  const loadAlarms = async () => {
    try {
      const storedAlarms = await AsyncStorage.getItem('@alarms');
      if (storedAlarms) {
        const parsedAlarms = JSON.parse(storedAlarms).map(alarm => ({
          ...alarm,
          date: alarm.date ? new Date(alarm.date) : null,
        }));
        console.log(parsedAlarms)
        setAlarms(parsedAlarms);
      }
    } catch (error) {
      console.error('Error loading alarms from AsyncStorage:', error);
    }
  };
  

  const saveAlarms = async (newAlarms) => {
    try {
      await AsyncStorage.setItem('@alarms', JSON.stringify(newAlarms));
      setAlarms(newAlarms);
      console.log('You have been updated the alarms: '+ newAlarms)
    } catch (error) {
      console.error('Error saving alarms to AsyncStorage:', error);
    }
  };

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShow(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const showDatePicker = () => {
    setShow(true);
  };

  const setAlarm = async () => {
    await scheduleNotification(date);
    const newAlarm = { id: Date.now(), date: new Date(date) }; // Convertir date a objeto Date si es necesario
    const updatedAlarms = [...alarms, newAlarm];
    saveAlarms(updatedAlarms);
    alert('Alarma configurada');
  };

  const removeAlarm = async (id) => {
    const updatedAlarms = alarms.filter(alarm => alarm.id !== id);
    saveAlarms(updatedAlarms);
  };

  const renderItem = ({ item }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
      <Text>{item.date.toLocaleTimeString()}</Text>
      <Button title="Eliminar" onPress={() => removeAlarm(item.id)} />
    </View>
  );

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
      <Button onPress={showDatePicker} title="Seleccionar hora de alarma" />
      {show && (
        <DateTimePicker
          value={date}
          mode="time"
          is24Hour={false}
          display="spinner"
          onChange={onChange}
        />
      )}
      <Button onPress={setAlarm} title="Configurar Alarma" />
      <FlatList
        data={alarms}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
      />
    </View>
  );
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});
