import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, Button, TextInput, Image, Linking, ScrollView, TouchableOpacity, ActivityIndicator, Animated, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Pour compatibilité Expo Go et tests sur appareil physique, l'URL doit être accessible sur le réseau local
const API_URL = 'http://192.168.1.65:3000/api'; // <-- Mets ici l'IP et le port de ton backend Node/Express

// CONTEXTE AUTH
const AuthContext = React.createContext();

function AuthProvider({ children }) {
  const [token, setToken] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    AsyncStorage.getItem('token').then(t => {
      setToken(t);
      setLoading(false);
    });
  }, []);

  const login = async (token) => {
    await AsyncStorage.setItem('token', token);
    setToken(token);
  };
  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// CONTEXTE THEME
const ThemeContext = React.createContext();

const lightColors = {
  primary: '#1976D2',
  secondary: '#64B5F6',
  background: '#F5F7FA',
  card: '#FFFFFF',
  border: '#E0E0E0',
  text: '#222',
  error: '#D32F2F',
  success: '#388E3C',
};
const darkColors = {
  primary: '#90CAF9',
  secondary: '#1976D2',
  background: '#181A20',
  card: '#23262F',
  border: '#333',
  text: '#fff',
  error: '#FF6B6B',
  success: '#4CAF50',
};

function ThemeProvider({ children }) {
  const [theme, setTheme] = React.useState('light');
  const COLORS = theme === 'dark' ? darkColors : lightColors;
  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, COLORS }}>
      {children}
    </ThemeContext.Provider>
  );
}

function useThemeColors() {
  return React.useContext(ThemeContext).COLORS;
}

// Écrans de base
function LoginScreen({ navigation }) {
  const { login } = React.useContext(AuthContext);
  const { t, lang, setLang } = React.useContext(LanguageContext);
  const COLORS = useThemeColors();
  const styles = makeStyles(COLORS);

  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Erreur de connexion');
      } else if (data.token) {
        await login(data.token);
        navigation.replace('MainTabs');
      } else {
        setError('Réponse inattendue du serveur');
      }
    } catch (e) {
      setError('Erreur réseau ou serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{t('login')}</Text>
      <TextInput
        placeholder={t('username') + '...'}
        value={username}
        onChangeText={setUsername}
        style={[styles.input, error && styles.inputError]}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="next"
        leftIcon={<MaterialIcons name="person" size={20} color={COLORS.primary} />}
      />
      <View style={{ position: 'relative' }}>
        <TextInput
          placeholder={t('password') + '...'}
          value={password}
          onChangeText={setPassword}
          style={[styles.input, error && styles.inputError]}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
        />
        {/* Bouton d'affichage du mot de passe à ajouter si besoin */}
      </View>
      {error ? <Banner type="error" message={error} visible={!!error} accessibilityLabel={error} /> : null}
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading} activeOpacity={0.8} accessibilityLabel={t('loginBtn')}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('loginBtn')}</Text>}
      </TouchableOpacity>
      <TouchableOpacity style={styles.buttonSecondary} onPress={() => navigation.replace('Register')} disabled={loading} activeOpacity={0.8}>
        <Text style={styles.buttonTextSecondary}>{t('toRegister')}</Text>
      </TouchableOpacity>
      {/* Sélecteur de langue */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16 }}>
        <Text style={{ marginRight: 8 }}>{t('language')}:</Text>
        <Text style={{ color: lang === 'fr' ? COLORS.primary : COLORS.text, fontWeight: lang === 'fr' ? 'bold' : 'normal', marginRight: 8 }} onPress={() => setLang('fr')}>{t('french')}</Text>
        <Text style={{ color: lang === 'en' ? COLORS.primary : COLORS.text, fontWeight: lang === 'en' ? 'bold' : 'normal' }} onPress={() => setLang('en')}>{t('english')}</Text>
      </View>
    </SafeAreaView>
  );
}

function RegisterScreen({ navigation }) {
  const { t } = React.useContext(LanguageContext);
  const COLORS = useThemeColors();
  const styles = makeStyles(COLORS);

  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [success, setSuccess] = React.useState('');
  // Ajout animation bouton
  const [registerAnim, setRegisterAnim] = React.useState(false);
  const registerScale = React.useRef(new Animated.Value(1)).current;

  const handleRegister = async () => {
    setError('');
    setSuccess('');
    if (!username || !password || !confirmPassword) {
      setError(t('Tous les champs sont obligatoires'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('Les mots de passe ne correspondent pas'));
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }), // Suppression de l'email
      });
      const data = await response.json();
      if (!response.ok) { setError(data.message || t('errorNetwork')); }
      else { setSuccess(t('Inscription réussie !')); setUsername(''); setPassword(''); setConfirmPassword(''); setTimeout(() => navigation.replace('Login'), 1200); }
    } catch (e) {
      setError(t('errorNetwork'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{t('register')}</Text>
      <View style={{ position: 'relative' }}>
        <MaterialIcons name="person" size={20} color={COLORS.primary} style={{ position: 'absolute', left: 16, top: 18, zIndex: 1 }} />
        <TextInput
          placeholder={t('username') + '...'}
          value={username}
          onChangeText={setUsername}
          style={[styles.input, { paddingLeft: 44 }, error && styles.inputError]}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
          accessibilityLabel={t('username')}
        />
      </View>
      <View style={{ position: 'relative' }}>
        <MaterialIcons name="lock" size={20} color={COLORS.primary} style={{ position: 'absolute', left: 16, top: 18, zIndex: 1 }} />
        <TextInput
          placeholder={t('password') + '...'}
          value={password}
          onChangeText={setPassword}
          style={[styles.input, { paddingLeft: 44 }, error && styles.inputError]}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
          accessibilityLabel={t('password')}
        />
        <TouchableOpacity
          style={{ position: 'absolute', right: 16, top: 16, zIndex: 2 }}
          onPress={() => setShowPassword(v => !v)}
          accessibilityLabel={showPassword ? t('Masquer le mot de passe') : t('Afficher le mot de passe')}
        >
          <MaterialIcons name={showPassword ? 'visibility-off' : 'visibility'} size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      <View style={{ position: 'relative' }}>
        <MaterialIcons name="lock-outline" size={20} color={COLORS.primary} style={{ position: 'absolute', left: 16, top: 18, zIndex: 1 }} />
        <TextInput
          placeholder={t('confirmPassword') + '...'}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={[styles.input, { paddingLeft: 44 }, error && styles.inputError]}
          secureTextEntry={!showConfirm}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          accessibilityLabel={t('confirmPassword')}
        />
        <TouchableOpacity
          style={{ position: 'absolute', right: 16, top: 16, zIndex: 2 }}
          onPress={() => setShowConfirm(v => !v)}
          accessibilityLabel={showConfirm ? t('Masquer le mot de passe') : t('Afficher le mot de passe')}
        >
          <MaterialIcons name={showConfirm ? 'visibility-off' : 'visibility'} size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      {error ? <Banner type="error" message={error} visible={!!error} accessibilityLabel={error} /> : null}
      {success ? <Banner type="success" message={success} visible={!!success} accessibilityLabel={success} /> : null}
      <Animated.View style={{ transform: [{ scale: registerScale }] }}>
        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading} activeOpacity={0.8} accessibilityLabel={t('registerBtn')}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('registerBtn')}</Text>}
        </TouchableOpacity>
      </Animated.View>
      <TouchableOpacity style={styles.buttonSecondary} onPress={() => navigation.replace('Login')} disabled={loading} activeOpacity={0.8} accessibilityLabel={t('toLogin')}>
        <Text style={styles.buttonTextSecondary}>{t('toLogin')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function EventsScreen() {
  const { token } = React.useContext(AuthContext);
  const { t } = React.useContext(LanguageContext);
  const COLORS = useThemeColors();
  const styles = makeStyles(COLORS);

  const [events, setEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [purchasedEventIds, setPurchasedEventIds] = React.useState(new Set());

  // Décoder le token pour savoir si l'utilisateur est admin
  const [isAdmin, setIsAdmin] = React.useState(false);
  React.useEffect(() => {
    if (!token) { setIsAdmin(false); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setIsAdmin(payload.username === 'admin');
    } catch { setIsAdmin(false); }
  }, [token]);

  // Fetch events
  const fetchEvents = React.useCallback(() => {
    setLoading(true);
    setError('');
    fetch(`${API_URL}/events`)
      .then(res => res.json())
      .then(data => setEvents(data.events || []))
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false));
  }, []);

  // Fetch user's tickets to know which events are purchased
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

  // Filtrage des événements selon la recherche
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
              {token && !isAdmin && !purchased && (
                <BuyTicketButton eventId={ev._id} />
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

function TicketsScreen() {
  const { token } = React.useContext(AuthContext);
  const langCtx = React.useContext(LanguageContext);
  const COLORS = useThemeColors();
  const styles = makeStyles(COLORS);

  console.log('[TicketsScreen] LanguageContext:', langCtx);
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

function AdminScreen() {
  const { token } = React.useContext(AuthContext);
  const { t } = React.useContext(LanguageContext);
  const COLORS = useThemeColors();
  const styles = makeStyles(COLORS);

  const [events, setEvents] = React.useState([]);
  const [name, setName] = React.useState('');
  const [date, setDate] = React.useState('');
  const [price, setPrice] = React.useState(''); // Ajout du prix
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [deleteAnim, setDeleteAnim] = React.useState({});
  const [createAnim, setCreateAnim] = React.useState(false);
  const createScale = React.useRef(new Animated.Value(1)).current;
  const [confirmDeleteId, setConfirmDeleteId] = React.useState(null);
  const [isDatePickerVisible, setDatePickerVisible] = React.useState(false);

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

  // Rafraîchissement automatique de la liste des événements toutes les 5 secondes
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
        body: JSON.stringify({ name, date, price: parseFloat(price) }) // Ajout du prix
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

  const handleConfirmDate = (dateObj) => {
    setDate(dateObj.toISOString().slice(0, 10)); // Format YYYY-MM-DD
    setDatePickerVisible(false);
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
      {error ? <Banner type="error" message={error} visible={!!error} accessibilityLabel={error} /> : null}
      {success ? <Banner type="success" message={success} visible={!!success} accessibilityLabel={success} /> : null}
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
              <ConfirmModal visible={confirmDeleteId === ev._id} message={t('Confirmer la suppression de cet événement ?')} onConfirm={() => handleDelete(ev._id)} onCancel={() => setConfirmDeleteId(null)} />
            </View>
          </Animated.View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileScreen() {
  const { token, logout } = React.useContext(AuthContext);
  const { t } = React.useContext(LanguageContext);
  const COLORS = useThemeColors();
  const styles = makeStyles(COLORS);

  const [username, setUsername] = React.useState('');
  const [oldPassword, setOldPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [showOld, setShowOld] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  // Ajout animation bouton
  const [changeAnim, setChangeAnim] = React.useState(false);
  const changeScale = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUsername(payload.username);
      // Suppression de la récupération de l'email
    } catch {}
  }, [token]);

  const handleChangePassword = async () => {
    setError(''); setMessage('');
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError(t('Tous les champs sont obligatoires'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('Les mots de passe ne correspondent pas'));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      let data;
      try {
        data = await res.json();
      } catch (e) {
        setError('Réponse du serveur invalide');
        setLoading(false);
        return;
      }
      if (!res.ok) {
        alert((data && data.message) ? data.message : t('errorNetwork'));
        setError('');
      } else {
        setMessage(t('Mot de passe modifié !'));
        setChangeAnim(true);
        Animated.sequence([
          Animated.timing(changeScale, { toValue: 1.12, duration: 120, useNativeDriver: true }),
          Animated.spring(changeScale, { toValue: 1, friction: 3, useNativeDriver: true })
        ]).start(() => setChangeAnim(false));
        setOldPassword(''); setNewPassword(''); setConfirmPassword('');
        setTimeout(() => setMessage(''), 1200);
      }
    } catch (e) {
      setError(e.message || t('errorNetwork'));
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{t('Profil utilisateur')}</Text>
      <Text style={{ marginBottom: 12 }}>
        <Text style={styles.label}>{t('username')}:</Text> <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>{username}</Text>
      </Text>
      <Text style={styles.label}>{t('Changer le mot de passe')}</Text>
      <View style={{ position: 'relative' }}>
        <TextInput
          placeholder={t('Ancien mot de passe')}
          value={oldPassword}
          onChangeText={setOldPassword}
          style={[styles.input, error && styles.inputError]}
          secureTextEntry={!showOld}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
          accessibilityLabel={t('Ancien mot de passe')}
        />
        <TouchableOpacity style={{ position: 'absolute', right: 16, top: 18 }} onPress={() => setShowOld(v => !v)}>
          <MaterialIcons name={showOld ? 'visibility-off' : 'visibility'} size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      <View style={{ position: 'relative' }}>
        <TextInput
          placeholder={t('Nouveau mot de passe')}
          value={newPassword}
          onChangeText={setNewPassword}
          style={[styles.input, error && styles.inputError]}
          secureTextEntry={!showNew}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
          accessibilityLabel={t('Nouveau mot de passe')}
        />
        <TouchableOpacity style={{ position: 'absolute', right: 16, top: 18 }} onPress={() => setShowNew(v => !v)}>
          <MaterialIcons name={showNew ? 'visibility-off' : 'visibility'} size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      <View style={{ position: 'relative' }}>
        <TextInput
          placeholder={t('Confirmer le nouveau mot de passe')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={[styles.input, error && styles.inputError]}
          secureTextEntry={!showConfirm}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          accessibilityLabel={t('Confirmer le nouveau mot de passe')}
        />
        <TouchableOpacity style={{ position: 'absolute', right: 16, top: 18 }} onPress={() => setShowConfirm(v => !v)}>
          <MaterialIcons name={showConfirm ? 'visibility-off' : 'visibility'} size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      {error ? <Banner type="error" message={error} visible={!!error} accessibilityLabel={error} /> : null}
      {message ? <Banner type="success" message={message} visible={!!message} accessibilityLabel={message} /> : null}
      <Animated.View style={{ transform: [{ scale: changeScale }] }}>
        <TouchableOpacity style={styles.button} onPress={handleChangePassword} disabled={loading} activeOpacity={0.8} accessibilityLabel={t('Changer le mot de passe')}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('Changer le mot de passe')}</Text>}
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const Tab = createBottomTabNavigator();
function LogoutScreen() {
  const { logout } = React.useContext(AuthContext);
  const { t } = React.useContext(LanguageContext);
  const navigation = require('@react-navigation/native').useNavigation();
  React.useEffect(() => {
    logout();
    navigation.replace('Login');
  }, []);
  return (
    <View><Text>{t('logout')}</Text></View>
  );
}
function ThemeToggleIcon() {
  const { theme, toggleTheme } = React.useContext(ThemeContext);
  const COLORS = useThemeColors();
  return (
    <MaterialIcons
      name="brightness-6"
      size={28}
      color={COLORS.primary}
      style={{ marginLeft: 16 }}
      onPress={toggleTheme}
      accessibilityLabel={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
    />
  );
}
function MainTabs() {
  const { token } = React.useContext(AuthContext);
  const { lang } = React.useContext(LanguageContext);
  const [isAdmin, setIsAdmin] = React.useState(false);
  React.useEffect(() => {
    // Décoder le token pour vérifier si l'utilisateur est admin
    if (!token) { setIsAdmin(false); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setIsAdmin(payload.username === 'admin');
    } catch { setIsAdmin(false); }
  }, [token]);
  return (
    <Tab.Navigator
      key={lang}
      screenOptions={({ route }) => ({
        headerShown: true,
        headerLeft: () => <ThemeToggleIcon />, // Ajout de l'icône de thème en haut à gauche
        tabBarIcon: ({ color, size }) => {
          let iconName = 'home';
          if (route.name === 'Home') iconName = 'home';
          if (route.name === 'Events') iconName = 'event';
          if (route.name === 'Tickets') iconName = 'confirmation-number';
          if (route.name === 'Admin') iconName = 'admin-panel-settings';
          if (route.name === 'Déconnexion') iconName = 'logout';
          if (route.name === 'Profil') iconName = 'person';
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarShowLabel: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Events" component={EventsScreen} />
      {!isAdmin && <Tab.Screen name="Tickets" component={TicketsScreen} />}
      <Tab.Screen name="Profil" component={ProfileScreen} />
      {isAdmin && <Tab.Screen name="Admin" component={AdminScreen} />}
      <Tab.Screen name="Déconnexion" component={LogoutScreen} options={{ tabBarIcon: ({ color, size }) => <MaterialIcons name="logout" size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}

const Stack = createNativeStackNavigator();
// Ajout du contexte de langue et des traductions
const translations = {
  fr: {
    login: "Connexion",
    register: "Inscription",
    username: "Nom d'utilisateur",
    password: "Mot de passe",
    confirmPassword: "Confirmer le mot de passe",
    loginBtn: "Se connecter",
    registerBtn: "S'inscrire",
    toRegister: "Créer un compte",
    toLogin: "Se connecter",
    events: "Liste des événements",
    searchEvent: "Rechercher un événement...",
    buyTicket: "Acheter un ticket",
    tickets: "Mes tickets",
    noTickets: "Aucun ticket.",
    ticketId: "Ticket ID",
    createdAt: "Créé le :",
    date: "Date :",
    admin: "Admin - Gestion des événements",
    createEvent: "Créer un événement",
    name: "Nom",
    create: "Créer",
    delete: "Supprimer",
    eventList: "Liste des événements",
    noEventFound: "Aucun événement trouvé.",
    logout: "Déconnexion...",
    errorNetwork: "Erreur réseau ou serveur",
    loading: "Chargement...",
    seePDF: "Voir PDF",
    qrCode: "QR Code :",
    language: "Langue",
    french: "Français",
    english: "Anglais",
    'Tous les champs sont obligatoires': 'Tous les champs sont obligatoires',
    'Les mots de passe ne correspondent pas': 'Les mots de passe ne correspondent pas',
    'Mot de passe modifié !': 'Mot de passe modifié !',
    'Changer le mot de passe': 'Changer le mot de passe',
    'Ancien mot de passe': 'Ancien mot de passe',
    'Nouveau mot de passe': 'Nouveau mot de passe',
    'Confirmer le nouveau mot de passe': 'Confirmer le nouveau mot de passe',
    'Profil utilisateur': 'Profil utilisateur',
    'Veuillez vous connecter pour voir vos tickets.': 'Veuillez relancer l’application.',
    loginToSeeTickets: 'Veuillez vous connecter pour voir vos tickets.',
    'Ticket déjà acheté': 'Ticket déjà acheté',
  },
  en: {
    login: "Login",
    register: "Register",
    username: "Username",
    password: "Password",
    confirmPassword: "Confirm password",
    loginBtn: "Login",
    registerBtn: "Register",
    toRegister: "Create account",
    toLogin: "Login",
    events: "Events list",
    searchEvent: "Search event...",
    buyTicket: "Buy ticket",
    tickets: "My tickets",
    noTickets: "No ticket.",
    ticketId: "Ticket ID",
    createdAt: "Created at:",
    date: "Date:",
    admin: "Admin - Event management",
    createEvent: "Create event",
    name: "Name",
    create: "Create",
    delete: "Delete",
    eventList: "Events list",
    noEventFound: "No event found.",
    logout: "Logging out...",
    errorNetwork: "Network or server error",
    loading: "Loading...",
    seePDF: "View PDF",
    qrCode: "QR Code:",
    language: "Language",
    french: "French",
    english: "English",
    'Tous les champs sont obligatoires': 'All fields are required',
    'Les mots de passe ne correspondent pas': 'Passwords do not match',
    'Mot de passe modifié !': 'Password changed!',
    'Changer le mot de passe': 'Change password',
    'Ancien mot de passe': 'Old password',
    'Nouveau mot de passe': 'New password',
    'Confirmer le nouveau mot de passe': 'Confirm new password',
    'Profil utilisateur': 'User profile',
    'Veuillez vous connecter pour voir vos tickets.': 'Please log in to view your tickets.',
    loginToSeeTickets: 'Please log in to view your tickets.',
    'Ticket déjà acheté': 'Ticket already purchased',
  }
};

const LanguageContext = React.createContext();

function LanguageProvider({ children }) {
  const [lang, setLang] = React.useState('fr');
  const t = React.useCallback((key) => translations[lang][key] || key, [lang]);
  React.useEffect(() => {
    console.log('[LanguageProvider] Lang:', lang, 't:', typeof t);
  }, [lang, t]);
  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

function makeStyles(COLORS) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
      padding: 16,
    },
    card: {
      backgroundColor: COLORS.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      shadowColor: COLORS.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    title: {
      fontSize: 26,
      fontWeight: 'bold',
      color: COLORS.primary,
      textAlign: 'center',
      marginBottom: 20,
      letterSpacing: 1,
    },
    label: {
      fontWeight: 'bold',
      marginBottom: 4,
      color: COLORS.text,
    },
    input: {
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 10,
      padding: 14,
      backgroundColor: COLORS.card,
      marginBottom: 14,
      fontSize: 16,
      color: COLORS.text,
    },
    button: {
      backgroundColor: COLORS.primary,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
      marginBottom: 10,
      shadowColor: COLORS.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 2,
      flexDirection: 'row',
      justifyContent: 'center',
    },
    buttonSecondary: {
      backgroundColor: COLORS.card,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
      marginBottom: 10,
      borderWidth: 1,
      borderColor: COLORS.primary,
    },
    buttonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
      letterSpacing: 0.5,
    },
    buttonTextSecondary: {
      color: COLORS.primary,
      fontWeight: 'bold',
      fontSize: 16,
      letterSpacing: 0.5,
    },
    buttonSmall: {
      backgroundColor: COLORS.secondary,
      borderRadius: 8,
      paddingVertical: 6,
      paddingHorizontal: 16,
      alignItems: 'center',
      marginTop: 8,
      alignSelf: 'flex-start',
    },
    buttonTextSmall: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 14,
    },
    error: {
      color: COLORS.error,
      marginBottom: 8,
      textAlign: 'center',
    },
    success: {
      color: COLORS.success,
      marginBottom: 8,
      textAlign: 'center',
    },
    qrContainer: {
      alignItems: 'center',
      marginVertical: 8,
    },
    adminListTitle: {
      marginTop: 24,
      fontWeight: 'bold',
      fontSize: 18,
      color: COLORS.text,
    },
    errorBanner: {
      backgroundColor: COLORS.error,
      borderRadius: 8,
      padding: 8,
      marginBottom: 12,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      marginTop: 40,
    },
    emptyText: {
      color: COLORS.border,
      fontSize: 18,
      marginTop: 12,
      textAlign: 'center',
    },
    inputError: {
      borderColor: COLORS.error,
    },
  });
}

// Harmonisation du header/navigation
function AppHeader({ title, showBack, onBack, rightIcon, onRightIconPress, theme }) {
  const COLORS = useThemeColors();
  return (
    <View style={{
      backgroundColor: COLORS.header,
      paddingTop: Platform.OS === 'ios' ? 54 : 32,
      paddingBottom: 16,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    }}>
      {showBack ? (
        <TouchableOpacity onPress={onBack} accessibilityLabel="Retour" style={{ marginRight: 8 }}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.headerText} />
        </TouchableOpacity>
      ) : <View style={{ width: 32 }} />}
      <Text style={{ color: COLORS.headerText, fontWeight: 'bold', fontSize: 20, flex: 1, textAlign: 'center' }} accessibilityRole="header">{title}</Text>
      {rightIcon ? (
        <TouchableOpacity onPress={onRightIconPress} accessibilityLabel="Changer le thème" style={{ marginLeft: 8 }}>
          <MaterialIcons name={rightIcon} size={24} color={COLORS.headerText} />
        </TouchableOpacity>
      ) : <View style={{ width: 32 }} />}
    </View>
  );
}

// 1. Onboarding/Tutoriel
function OnboardingScreen({ navigation }) {
  const { t } = React.useContext(LanguageContext);
  const COLORS = useThemeColors();
  const slides = [
    { key: 'slide1', title: t('Bienvenue !'), text: t('Découvrez et achetez vos tickets en toute simplicité.'), icon: 'event' },
    { key: 'slide2', title: t('Sécurité'), text: t('Vos achats sont sécurisés et vos tickets accessibles à tout moment.'), icon: 'confirmation-number' },
    { key: 'slide3', title: t('Notifications'), text: t('Recevez des rappels pour vos événements.'), icon: 'notifications-active' },
  ];
  const [index, setIndex] = React.useState(0);
  const handleNext = async () => {
    if (index < slides.length - 1) setIndex(i => i + 1);
    else {
      await AsyncStorage.setItem('onboardingDone', '1');
      navigation.replace('Login');
    }
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <MaterialIcons name={slides[index].icon} size={80} color={COLORS.primary} style={{ marginBottom: 24 }} />
      <Text style={{ fontSize: 28, fontWeight: 'bold', color: COLORS.primary, marginBottom: 12 }}>{slides[index].title}</Text>
      <Text style={{ fontSize: 18, color: COLORS.text, textAlign: 'center', marginBottom: 32 }}>{slides[index].text}</Text>
      <TouchableOpacity style={{ backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 14, paddingHorizontal: 32 }} onPress={handleNext} accessibilityLabel={t('Suivant')}>
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>{index < slides.length - 1 ? t('Suivant') : t('Commencer')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// 2. Accueil personnalisé (Dashboard)
function HomeScreen({ navigation }) {
  const { token } = React.useContext(AuthContext);
  const { t } = React.useContext(LanguageContext);
  const COLORS = useThemeColors();
  const [username, setUsername] = React.useState('');
  const [events, setEvents] = React.useState([]);
  React.useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUsername(payload.username);
      } catch {}
    }
    fetch(`${API_URL}/events`).then(res => res.json()).then(data => setEvents(data.events || []));
  }, [token]);
  const nextEvents = events.slice(0, 2);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background, padding: 20 }}>
      <Text style={{ fontSize: 26, fontWeight: 'bold', color: COLORS.primary, marginBottom: 10 }}>{t('Bienvenue')}{username ? `, ${username}` : ''} !</Text>
      <Text style={{ fontSize: 18, color: COLORS.text, marginBottom: 18 }}>{t('Voici vos prochains événements')}</Text>
      {nextEvents.length === 0 ? <EmptyState message={t('Aucun événement à venir.')} icon="event-busy" /> :
        nextEvents.map(ev => (
          <View key={ev._id} style={{ backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: COLORS.text, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18 }}>{ev.name}</Text>
            <Text>{t('date')} {ev.date}</Text>
          </View>
        ))}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 24 }}>
        <TouchableOpacity onPress={() => navigation.navigate('Events')} style={{ backgroundColor: COLORS.primary, borderRadius: 10, padding: 16, minWidth: 100, alignItems: 'center' }} accessibilityLabel={t('events')}>
          <MaterialIcons name="event" size={28} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: 'bold', marginTop: 6 }}>{t('events')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Tickets')} style={{ backgroundColor: COLORS.secondary, borderRadius: 10, padding: 16, minWidth: 100, alignItems: 'center' }} accessibilityLabel={t('tickets')}>
          <MaterialIcons name="confirmation-number" size={28} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: 'bold', marginTop: 6 }}>{t('tickets')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// 3. Modale de confirmation générique
function ConfirmModal({ visible, message, onConfirm, onCancel }) {
  if (!visible) return null;
  return (
    <View style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.55)', // overlay plus foncé
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 99999, // très haut pour être au-dessus de tout
      elevation: 50, // pour Android
      width: '100%',
      height: '100%',
    }}>
      <View style={{
        backgroundColor: '#fff',
        borderRadius: 22,
        paddingVertical: 36,
        paddingHorizontal: 28,
        minWidth: 300,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.22,
        shadowRadius: 18,
        elevation: 50,
      }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 22, textAlign: 'center', color: '#222' }}>{message}</Text>
        <View style={{ flexDirection: 'row', marginTop: 8 }}>
          <TouchableOpacity onPress={onCancel} style={{ backgroundColor: '#eee', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 22, marginRight: 16, minWidth: 100, alignItems: 'center' }} accessibilityLabel="Annuler">
            <Text style={{ color: '#333', fontWeight: 'bold', fontSize: 16 }}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onConfirm} style={{ backgroundColor: '#1976D2', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 22, minWidth: 100, alignItems: 'center' }} accessibilityLabel="Confirmer">
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Confirmer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// 4. Ajout des transitions animées à la navigation
import { TransitionPresets } from '@react-navigation/stack';

// 5. Ajout HomeScreen et Onboarding dans la navigation
function AppContent() {
  const [onboardingDone, setOnboardingDone] = React.useState(null);
  const { token } = React.useContext(AuthContext); // Ajouté pour accès au token
  React.useEffect(() => {
    AsyncStorage.getItem('onboardingDone').then(val => setOnboardingDone(val === '1'));
  }, []);
  // Ajout du listener pour la réception des notifications push
  React.useEffect(() => {
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      // Affiche une alerte simple lors de la réception d'une notification
      alert(notification.request.content.title + '\n' + notification.request.content.body);
    });
    // Nettoyage du listener à la destruction du composant
    return () => {
      notificationListener.remove();
    };
  }, []);

  React.useEffect(() => {
    async function registerForPushNotificationsAsync() {
      let expoPushToken;
      if (Constants.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          alert('Permission pour les notifications refusée !');
          return;
        }
        expoPushToken = (await Notifications.getExpoPushTokenAsync()).data;
        console.log('Expo Push Token:', expoPushToken);
        // Envoi du token push au backend si connecté
        if (token && expoPushToken) {
          try {
            await fetch(`${API_URL}/auth/push-token`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ pushToken: expoPushToken })
            });
            console.log('Push token envoyé au backend');
          } catch (e) {
            console.warn('Erreur lors de l\'envoi du push token au backend', e);
          }
        }
      }
    }
    registerForPushNotificationsAsync();
  }, [token]);
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName={onboardingDone === false ? 'Onboarding' : 'Login'}
        screenOptions={{
          ...TransitionPresets.SlideFromRightIOS,
          headerShown: false,
        }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

// --- Dans BuyTicketButton, avant d’acheter, afficher une alerte de confirmation au lieu de ConfirmModal
function BuyTicketButton({ eventId }) {
  const { token } = React.useContext(AuthContext);
  const { t } = React.useContext(LanguageContext);
  const COLORS = useThemeColors();
  const styles = makeStyles(COLORS);
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState('');
  const scale = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (success) {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.15, duration: 120, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true })
      ]).start();
    }
  }, [success]);

  const handleBuy = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_URL}/tickets/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ eventId })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || t('errorNetwork'));
        setSuccess(false);
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 1200);
        if (typeof window !== 'undefined' && window.refreshTickets) window.refreshTickets();
      }
    } catch {
      setError(t('errorNetwork'));
      setSuccess(false);
    }
    setLoading(false);
  };

  const confirmBuy = () => {
    if (typeof window !== 'undefined' && window.confirm) {
      // Web fallback
      if (window.confirm(t("Confirmer l'achat de ce ticket ?"))) handleBuy();
    } else {
      // React Native Alert
      Alert.alert(
        t('Confirmation'),
        t("Confirmer l'achat de ce ticket ?"),
        [
          { text: t('Annuler'), style: 'cancel' },
          { text: t('Confirmer'), onPress: handleBuy }
        ]
      );
    }
  };

  return (
    <View style={{ marginTop: 8, alignSelf: 'flex-start', minWidth: 120 }}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          style={[styles.buttonSmall, success && { backgroundColor: COLORS.success }, error && { backgroundColor: COLORS.error }]}
          onPress={confirmBuy}
          disabled={loading || success}
          accessibilityLabel={t('buyTicket')}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : success ? (
            <MaterialIcons name="check-circle" size={18} color="#fff" />
          ) : (
            <Text style={styles.buttonTextSmall}>{t('buyTicket')}</Text>
          )}
        </TouchableOpacity>
      </Animated.View>
      {error ? <Banner type="error" message={error} visible={!!error} accessibilityLabel={error} /> : null}
      {success ? <Banner type="success" message={t('Ticket acheté !')} visible={!!success} accessibilityLabel={t('Ticket acheté !')} /> : null}
    </View>
  );
}

// Composant d'état vide réutilisable
function EmptyState({ message, icon = 'info' }) {
  const COLORS = useThemeColors();
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1, marginTop: 40 }}>
      <MaterialIcons name={icon} size={64} color={COLORS.border} />
      <Text style={{ color: COLORS.border, fontSize: 18, marginTop: 12, textAlign: 'center' }}>{message}</Text>
    </View>
  );
}

// Composant Banner réutilisable pour feedback (succès/erreur)
function Banner({ type = 'error', message, visible, accessibilityLabel }) {
  if (!visible || !message) return null;
  const COLORS = useThemeColors();
  const backgroundColor = type === 'success' ? COLORS.success : COLORS.error;
  return (
    <View style={{ backgroundColor, borderRadius: 8, padding: 10, marginBottom: 12 }} accessibilityLiveRegion="polite" accessibilityLabel={accessibilityLabel || message}>
      <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>{message}</Text>
    </View>
  );
}
