import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '../App';
import { LanguageContext } from '../App';
import { useThemeColors } from '../App';
import { makeStyles } from '../App';

const API_URL = 'http://10.74.3.247:3000/api';

export default function AdminScreen() {
  const { token } = React.useContext(AuthContext);
  const { t } = React.useContext(LanguageContext);
  const COLORS = useThemeColors();
  const styles = makeStyles(COLORS);

  const [events, setEvents] = React.useState([]);
  const [name, setName] = React.useState('');
  const [date, setDate] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [deleteAnim, setDeleteAnim] = React.useState({});
  const [createAnim, setCreateAnim] = React.useState(false);
  const createScale = React.useRef(new Animated.Value(1)).current;
  const [confirmDeleteId, setConfirmDeleteId] = React.useState(null);
  const [editTicketId, setEditTicketId] = React.useState(null);
  const [editEvent, setEditEvent] = React.useState('');
  // Ajout affichage et édition des tickets pour l'admin
  const [tickets, setTickets] = React.useState([]);
  const [editTicketEvent, setEditTicketEvent] = React.useState('');

  const fetchEvents = React.useCallback(() => {
    setLoading(true);
    setError('');
    fetch(`${API_URL}/events`)
      .then(res => res.json())
      .then(data => setEvents(data.events || []))
      .catch(() => setError(t('errorNetwork')))
      .finally(() => setLoading(false));
  }, [t]);

  React.useEffect(() => { fetchEvents(); }, [fetchEvents]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      fetchEvents();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  const handleCreate = async () => {
    setError(''); setSuccess('');
    if (!name || !date || !price) { setError(t('Tous les champs sont obligatoires')); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name, date, price: parseFloat(price) })
      });
      const data = await res.json();
      if (!res.ok) setError(data.message || t('errorNetwork'));
      else {
        setSuccess(t('Événement créé !'));
        setCreateAnim(true);
        Animated.sequence([
          Animated.timing(createScale, { toValue: 1.12, duration: 120, useNativeDriver: true }),
          Animated.spring(createScale, { toValue: 1, friction: 3, useNativeDriver: true })
        ]).start(() => setCreateAnim(false));
        setName(''); setDate(''); setPrice('');
        fetchEvents();
        setTimeout(() => setSuccess(''), 1200);
      }
    } catch { setError(t('errorNetwork')); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    setConfirmDeleteId(null);
    setError(''); setSuccess('');
    setDeleteAnim((prev) => ({ ...prev, [id]: true }));
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/events/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) setError(data.message || t('errorNetwork'));
      else {
        setSuccess(t('Événement supprimé !'));
        setTimeout(() => setSuccess(''), 1200);
        fetchEvents();
      }
    } catch { setError(t('errorNetwork')); }
    setLoading(false);
    setTimeout(() => setDeleteAnim((prev) => ({ ...prev, [id]: false })), 600);
  };

  const fetchTickets = React.useCallback(() => {
    fetch(`${API_URL}/tickets/my`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setTickets(data.tickets || []));
  }, [token]);

  React.useEffect(() => { if (token) fetchTickets(); }, [token, fetchTickets]);

  const handleEditTicket = async (ticketId) => {
    setError(''); setSuccess('');
    setEditTicketId(ticketId);
  };

  const handleSaveEdit = async () => {
    if (!editEvent) { setError('Champ événement requis'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/tickets/${editTicketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ event: editEvent })
      });
      const data = await res.json();
      if (!res.ok) setError(data.message || t('errorNetwork'));
      else {
        setSuccess('Ticket modifié !');
        setEditTicketId(null);
        setEditEvent('');
        fetchEvents();
        setTimeout(() => setSuccess(''), 1200);
      }
    } catch { setError(t('errorNetwork')); }
    setLoading(false);
  };

  const handleEditTicketAdmin = (ticketId, currentEvent) => {
    setEditTicketId(ticketId);
    setEditTicketEvent(currentEvent);
  };

  const handleSaveEditTicketAdmin = async () => {
    if (!editTicketEvent) { setError('Champ événement requis'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/tickets/${editTicketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ event: editTicketEvent })
      });
      const data = await res.json();
      if (!res.ok) setError(data.message || t('errorNetwork'));
      else {
        setSuccess('Ticket modifié !');
        setEditTicketId(null);
        setEditTicketEvent('');
        fetchTickets();
        setTimeout(() => setSuccess(''), 1200);
      }
    } catch { setError(t('errorNetwork')); }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{t('admin')}</Text>
      <Text style={styles.label}>{t('createEvent')}</Text>
      <View style={{ position: 'relative' }}>
        <MaterialIcons name="event" size={20} color={COLORS.primary} style={{ position: 'absolute', left: 16, top: 18, zIndex: 1 }} />
        <TextInput
          placeholder={t('name')}
          value={name}
          onChangeText={setName}
          style={[styles.input, { paddingLeft: 44 }, error && styles.inputError]}
          autoCapitalize="sentences"
          autoCorrect={false}
          returnKeyType="next"
          accessibilityLabel={t('name')}
        />
      </View>
      <View style={{ position: 'relative' }}>
        <MaterialIcons name="date-range" size={20} color={COLORS.primary} style={{ position: 'absolute', left: 16, top: 18, zIndex: 1 }} />
        <TextInput
          placeholder={t('date')}
          value={date}
          onChangeText={setDate}
          style={[styles.input, { paddingLeft: 44 }, error && styles.inputError]}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          accessibilityLabel={t('date')}
        />
      </View>
      <View style={{ position: 'relative' }}>
        <MaterialIcons name="euro" size={20} color={COLORS.primary} style={{ position: 'absolute', left: 16, top: 18, zIndex: 1 }} />
        <TextInput
          placeholder={t('Prix')}
          value={price}
          onChangeText={setPrice}
          style={[styles.input, { paddingLeft: 44 }, error && styles.inputError]}
          keyboardType="numeric"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          accessibilityLabel={t('Prix')}
        />
      </View>
      {error ? <Text style={{ color: COLORS.error, marginBottom: 8 }}>{error}</Text> : null}
      {success ? <Text style={{ color: COLORS.success, marginBottom: 8 }}>{success}</Text> : null}
      <Animated.View style={{ transform: [{ scale: createScale }] }}>
        <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={loading} activeOpacity={0.8} accessibilityLabel={t('create')}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('create')}</Text>}
        </TouchableOpacity>
      </Animated.View>
      <Text style={styles.adminListTitle}>{t('eventList')}</Text>
      {loading && <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 16 }} />}
      <ScrollView contentContainerStyle={events.length === 0 ? { flex: 1, justifyContent: 'center', alignItems: 'center' } : {}}>
        {events.length === 0 ? (
          <View style={styles.emptyState}><MaterialIcons name="event-busy" size={64} color={COLORS.border} /><Text style={styles.emptyText}>{t('noEventFound')}</Text></View>
        ) : events.map(ev => (
          <Animated.View
            key={ev._id}
            style={{
              opacity: deleteAnim[ev._id] ? 0.5 : 1,
              transform: [{ scale: deleteAnim[ev._id] ? 0.95 : 1 }],
              marginBottom: 16
            }}
          >
            <View style={styles.card}>
              <Text style={{ fontWeight: 'bold', fontSize: 18 }}>{ev.name}</Text>
              <Text>{t('date')} : {ev.date}</Text>
              <Text>{t('Prix')} : {ev.price} €</Text>
              <TouchableOpacity
                style={styles.buttonSmall}
                onPress={() => setConfirmDeleteId(ev._id)}
                accessibilityLabel={t('delete')}
                activeOpacity={0.8}
                disabled={loading}
              >
                <MaterialIcons name="delete" size={18} color="#fff" />
                <Text style={styles.buttonTextSmall}>{t('delete')}</Text>
              </TouchableOpacity>
              {/* Bouton modifier ticket (admin) */}
              <TouchableOpacity
                style={[styles.buttonSmall, { backgroundColor: COLORS.secondary, marginLeft: 8 }]}
                onPress={() => handleEditTicket(ev._id)}
                accessibilityLabel={t('Modifier ticket')}
                activeOpacity={0.8}
                disabled={loading}
              >
                <MaterialIcons name="edit" size={18} color="#fff" />
                <Text style={styles.buttonTextSmall}>{t('Modifier')}</Text>
              </TouchableOpacity>
              {/* Formulaire d'édition inline */}
              {editTicketId === ev._id && (
                <View style={{ marginTop: 12 }}>
                  <TextInput
                    placeholder="Nouvel ID d'événement"
                    value={editEvent}
                    onChangeText={setEditEvent}
                    style={styles.input}
                  />
                  <TouchableOpacity style={styles.button} onPress={handleSaveEdit} disabled={loading}>
                    <Text style={styles.buttonText}>Enregistrer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.buttonSecondary} onPress={() => setEditTicketId(null)}>
                    <Text style={styles.buttonTextSecondary}>Annuler</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </Animated.View>
        ))}
      </ScrollView>
      {/* Section gestion des tickets pour l'admin */}
      <Text style={styles.adminListTitle}>Tickets</Text>
      <ScrollView contentContainerStyle={tickets.length === 0 ? { flex: 1, justifyContent: 'center', alignItems: 'center' } : {}}>
        {tickets.length === 0 ? (
          <View style={styles.emptyState}><MaterialIcons name="confirmation-number" size={64} color={COLORS.border} /><Text style={styles.emptyText}>Aucun ticket</Text></View>
        ) : tickets.map(ticket => (
          <View key={ticket.id} style={styles.card}>
            <Text style={{ fontWeight: 'bold', fontSize: 18 }}>Ticket ID : {ticket.id}</Text>
            <Text>Événement : {ticket.eventName}</Text>
            <Text>Date : {ticket.eventDate}</Text>
            <Text>Créé le : {new Date(ticket.createdAt).toLocaleString()}</Text>
            <TouchableOpacity
              style={[styles.buttonSmall, { backgroundColor: COLORS.secondary, marginTop: 8 }]}
              onPress={() => handleEditTicketAdmin(ticket.id, ticket.eventName)}
              accessibilityLabel={t('Modifier ticket')}
              activeOpacity={0.8}
              disabled={loading}
            >
              <MaterialIcons name="edit" size={18} color="#fff" />
              <Text style={styles.buttonTextSmall}>{t('Modifier')}</Text>
            </TouchableOpacity>
            {editTicketId === ticket.id && (
              <View style={{ marginTop: 12 }}>
                <TextInput
                  placeholder="Nouvel ID d'événement"
                  value={editTicketEvent}
                  onChangeText={setEditTicketEvent}
                  style={styles.input}
                />
                <TouchableOpacity style={styles.button} onPress={handleSaveEditTicketAdmin} disabled={loading}>
                  <Text style={styles.buttonText}>Enregistrer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.buttonSecondary} onPress={() => setEditTicketId(null)}>
                  <Text style={styles.buttonTextSecondary}>Annuler</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
