import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '../App';
import { LanguageContext } from '../App';
import { useThemeColors } from '../App';
import { makeStyles } from '../App';

const API_URL = 'http://10.74.3.247:3000/api'; // À adapter si besoin

export default function TicketsScreen() {
  const { token } = React.useContext(AuthContext);
  const langCtx = React.useContext(LanguageContext);
  const COLORS = useThemeColors();
  const styles = makeStyles(COLORS);

  let t = (k) => k;
  let contextError = false;
  if (langCtx && typeof langCtx.t === 'function') {
    t = langCtx.t;
  } else {
    contextError = true;
    console.error('LanguageContext.t is not a function:', langCtx);
  }
  const [tickets, setTickets] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const fetchTickets = React.useCallback(() => {
    if (!token) return;
    setLoading(true);
    setError('');
    fetch(`${API_URL}/tickets/my`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setTickets(data.tickets || []))
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false));
  }, [token]);

  React.useEffect(() => { fetchTickets(); window.refreshTickets = fetchTickets; return () => { window.refreshTickets = null; }; }, [fetchTickets]);

  if (contextError) return <Text style={{color:'red',textAlign:'center',marginTop:40}}>Erreur critique : contexte de langue corrompu. Veuillez relancer l’application.</Text>;
  if (!token) return <Text>{t('loginToSeeTickets')}</Text>;
  if (loading) return <Text>{t('loading')}...</Text>;
  if (error) return <Text style={{ color: 'red' }}>{error}</Text>;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{t('tickets')}</Text>
      <ScrollView contentContainerStyle={tickets.length === 0 ? { flex: 1, justifyContent: 'center', alignItems: 'center' } : {}}>
        {tickets.length === 0 ? (
          <View style={styles.emptyState}><MaterialIcons name="confirmation-number" size={64} color={COLORS.border} /><Text style={styles.emptyText}>{t('noTickets')}</Text></View>
        ) : tickets.map(ticket => (
          <TouchableOpacity key={ticket.id} style={styles.card} activeOpacity={0.9}>
            <Text style={{ fontWeight: 'bold', fontSize: 18 }}>{ticket.eventName}</Text>
            <Text>{t('date')} : {ticket.eventDate}</Text>
            <Text>{t('createdAt')} {new Date(ticket.createdAt).toLocaleString()}</Text>
            <Text>{t('ticketId')} : {ticket.id}</Text>
            {ticket.qrCode && <View style={styles.qrContainer}><Text>{t('qrCode')}</Text><Image source={{ uri: ticket.qrCode }} style={{ width: 120, height: 120, borderRadius: 8 }} /></View>}
            {ticket.pdfUrl && <TouchableOpacity style={styles.buttonSmall} onPress={() => Linking.openURL(`${API_URL.replace('/api','')}${ticket.pdfUrl}?token=${token}`)}><Text style={styles.buttonTextSmall}>{t('seePDF')}</Text></TouchableOpacity>}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
