import React, { useContext } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthContext, LanguageContext } from '../App';
import { useThemeColors } from '../App';

export default function HomeScreen({ navigation }) {
  const { colors } = useThemeColors();
  const { token } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const [username, setUsername] = React.useState('');
  const [events, setEvents] = React.useState([]);

  React.useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUsername(payload.username);
      } catch { }
    }
    fetch('http://10.74.3.247:3000/api/events')
      .then(res => res.json())
      .then(data => setEvents(data.events || []));
  }, [token]);

  const nextEvents = events.slice(0, 2);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: 20 }}>
      <Text style={{ fontSize: 26, fontWeight: 'bold', color: colors.primary, marginBottom: 10 }}>
        {t('Bienvenue')}{username ? `, ${username}` : ''} !
      </Text>
      <Text style={{ fontSize: 18, color: colors.text, marginBottom: 18 }}>
        {t('Voici vos prochains événements')}
      </Text>
      {nextEvents.length === 0 ? (
        <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1, marginTop: 40 }}>
          <MaterialIcons name="event-busy" size={64} color={colors.border} />
          <Text style={{ color: colors.border, fontSize: 18, marginTop: 12, textAlign: 'center' }}>
            {t('Aucun événement à venir.')}
          </Text>
        </View>
      ) :
        nextEvents.map(ev => (
          <View key={ev._id} style={{
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            shadowColor: colors.text,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 2
          }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18 }}>{ev.name}</Text>
            <Text>{t('date')} {ev.date}</Text>
          </View>
        ))}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 24 }}>
        <TouchableOpacity onPress={() => navigation.navigate('Events')}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 10,
            padding: 16,
            minWidth: 100,
            alignItems: 'center'
          }}
          accessibilityLabel={t('events')}>
          <MaterialIcons name="event" size={28} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: 'bold', marginTop: 6 }}>
            {t('events')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Tickets')}
          style={{
            backgroundColor: colors.secondary,
            borderRadius: 10,
            padding: 16,
            minWidth: 100,
            alignItems: 'center'
          }}
          accessibilityLabel={t('tickets')}>
          <MaterialIcons name="confirmation-number" size={28} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: 'bold', marginTop: 6 }}>
            {t('tickets')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
