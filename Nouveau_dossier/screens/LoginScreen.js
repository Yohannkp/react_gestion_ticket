import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '../App';
import { LanguageContext } from '../App';
import { useThemeColors } from '../App';
import { makeStyles } from '../App';

const API_URL = 'http://10.74.3.247:3000/api';

export default function LoginScreen({ navigation }) {
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
      </View>
      {error ? <Text style={{ color: COLORS.error, marginBottom: 8 }}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading} activeOpacity={0.8} accessibilityLabel={t('loginBtn')}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('loginBtn')}</Text>}
      </TouchableOpacity>
      <TouchableOpacity style={styles.buttonSecondary} onPress={() => navigation.replace('Register')} disabled={loading} activeOpacity={0.8}>
        <Text style={styles.buttonTextSecondary}>{t('toRegister')}</Text>
      </TouchableOpacity>
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16 }}>
        <Text style={{ marginRight: 8 }}>{t('language')}:</Text>
        <Text style={{ color: lang === 'fr' ? COLORS.primary : COLORS.text, fontWeight: lang === 'fr' ? 'bold' : 'normal', marginRight: 8 }} onPress={() => setLang('fr')}>{t('french')}</Text>
        <Text style={{ color: lang === 'en' ? COLORS.primary : COLORS.text, fontWeight: lang === 'en' ? 'bold' : 'normal' }} onPress={() => setLang('en')}>{t('english')}</Text>
      </View>
    </SafeAreaView>
  );
}
