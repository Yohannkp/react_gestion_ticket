import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '../App';
import { LanguageContext } from '../App';
import { useThemeColors } from '../App';
import { makeStyles } from '../App';

const API_URL = 'http://10.74.3.247:3000/api';

export default function EventsScreen() {
  const { token } = React.useContext(AuthContext);
  const { t } = React.useContext(LanguageContext);
  const COLORS = useThemeColors();
  const styles = makeStyles(COLORS);

  const [events, setEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [purchasedEventIds, setPurchasedEventIds] = React.useState(new Set());
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    if (!token) { setIsAdmin(false); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setIsAdmin(payload.username === 'admin');
    } catch { setIsAdmin(false); }
  }, [token]);

  const fetchEvents = React.useCallback(() => {
    setLoading(true);
    setError('');
    fetch(`${API_URL}/events`)
      .then(res => res.json())
      .then(data => setEvents(data.events || []))
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false));
  }, []);

  const fetchTickets = React.useCallback(() => {
    if (!token) return;
    fetch(`${API_URL}/tickets/my`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const ids = new Set((data.tickets || []).map(t => t.event && (t.event._id || t.event)));
        setPurchasedEventIds(ids);
      })
      .catch(() => setPurchasedEventIds(new Set()));
  }, [token]);

  React.useEffect(() => { fetchEvents(); }, [fetchEvents]);
  React.useEffect(() => { if (token && !isAdmin) fetchTickets(); }, [token, isAdmin, fetchTickets]);

  const filteredEvents = events.filter(ev =>
    ev.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Text>{t('loading')}...</Text>;
  if (error) return <Text style={{ color: 'red' }}>{error}</Text>;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{t('events')}</Text>
      <TextInput
        placeholder={t('searchEvent') + '...'}
        value={search}
        onChangeText={setSearch}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      <TouchableOpacity style={[styles.button, { marginBottom: 12 }]} onPress={() => { fetchEvents(); if (token && !isAdmin) fetchTickets(); }} accessibilityLabel={t('Rafraîchir la liste')}>
        <MaterialIcons name="refresh" size={22} color="#fff" />
        <Text style={styles.buttonText}>{t('Rafraîchir')}</Text>
      </TouchableOpacity>
      <ScrollView contentContainerStyle={filteredEvents.length === 0 ? { flex: 1, justifyContent: 'center', alignItems: 'center' } : {}}>
        {filteredEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="event" size={64} color={COLORS.border} />
            <Text style={styles.emptyText}>{t('noEventFound')}</Text>
          </View>
        ) : filteredEvents.map(ev => {
          const purchased = purchasedEventIds.has(ev._id);
          return (
            <TouchableOpacity
              key={ev._id}
              style={[styles.card, purchased && { borderColor: COLORS.success, borderWidth: 2, backgroundColor: COLORS.background }]}
              activeOpacity={0.9}
              accessibilityLabel={purchased ? t('Ticket déjà acheté') : undefined}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 18, flex: 1 }}>{ev.name}</Text>
                {purchased && <MaterialIcons name="check-circle" size={22} color={COLORS.success} style={{ marginLeft: 6 }} accessibilityLabel={t('Ticket déjà acheté')} />}
              </View>
              <Text>{t('date')} : {ev.date}</Text>
              <Text>{t('Prix')} : {ev.price} €</Text>
              {/* Ajoute ici le bouton d'achat si besoin */}
              {token && !isAdmin && !purchased && (
                <Text style={{ color: COLORS.primary, marginTop: 8 }}>{t('Acheter')}</Text>
              )}
              {token && !isAdmin && purchased && (
                <Text style={{ color: COLORS.success, fontWeight: 'bold', marginTop: 8 }}>{t('Ticket déjà acheté')}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
