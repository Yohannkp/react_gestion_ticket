import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '../App';
import { LanguageContext } from '../App';
import { useThemeColors } from '../App';
import { makeStyles } from '../App';

export default function ProfileScreen() {
  const { token } = React.useContext(AuthContext);
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
  const [changeAnim, setChangeAnim] = React.useState(false);
  const changeScale = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUsername(payload.username);
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
      const res = await fetch('http://10.74.3.247:3000/api/auth/change-password', {
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
      {error ? <Text style={{ color: COLORS.error, marginBottom: 8 }}>{error}</Text> : null}
      {message ? <Text style={{ color: COLORS.success, marginBottom: 8 }}>{message}</Text> : null}
      <Animated.View style={{ transform: [{ scale: changeScale }] }}>
        <TouchableOpacity style={styles.button} onPress={handleChangePassword} disabled={loading} activeOpacity={0.8} accessibilityLabel={t('Changer le mot de passe')}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('Changer le mot de passe')}</Text>}
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}
