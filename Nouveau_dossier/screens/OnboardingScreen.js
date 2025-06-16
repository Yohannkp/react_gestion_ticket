import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageContext } from '../App';
import { useThemeColors } from '../App';

export default function OnboardingScreen({ navigation }) {
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
