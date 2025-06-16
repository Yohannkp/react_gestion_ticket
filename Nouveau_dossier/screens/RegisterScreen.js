import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LanguageContext } from '../App';
import { useThemeColors } from '../App';
import { makeStyles } from '../App';

const API_URL = 'http://10.74.3.247:3000/api';

export default function RegisterScreen({ navigation }) {
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
        body: JSON.stringify({ username, password }),
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
      {error ? <Text style={{ color: COLORS.error, marginBottom: 8 }}>{error}</Text> : null}
      {success ? <Text style={{ color: COLORS.success, marginBottom: 8 }}>{success}</Text> : null}
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
