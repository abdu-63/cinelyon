import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { PatheLogo, UgcLogo, InstitutLumiereLogo } from './CinemaLogos';
import { COLORS } from '../../lib/constants';

interface CinemaBrandProps {
  brandName: string;
}

export function CinemaBrand({ brandName }: CinemaBrandProps) {
  const renderLogo = () => {
    switch (brandName) {
      case 'Pathé':
        return <PatheLogo width={50} height={38} />;
      case 'UGC':
        return <UgcLogo width={50} height={33} />;
      case 'Institut Lumière':
        return <InstitutLumiereLogo width={30} height={30} />;
      case 'Lumière':
        return <Image source={require('../../../assets/logo-cinema/lumiere.webp')} style={styles.logo} contentFit="contain" />;
      case 'CGR':
        return <Image source={require('../../../assets/logo-cinema/CGR.webp')} style={styles.logo} contentFit="contain" />;
      case 'Ciné Meyzieu':
        return <Image source={require('../../../assets/logo-cinema/cine-meyzieu.webp')} style={styles.logo} contentFit="contain" />;
      case 'Ciné Toboggan':
        return <Image source={require('../../../assets/logo-cinema/cine-toboggan.png')} style={styles.logo} contentFit="contain" />;
      case 'Cinéma Saint-Denis':
        return <Image source={require('../../../assets/logo-cinema/cinema-st-denis.png')} style={styles.logo} contentFit="contain" />;
      case 'Comoedia':
        return <Image source={require('../../../assets/logo-cinema/comoedia.webp')} style={styles.logo} contentFit="contain" />;
      case 'Cinéma Les Amphis':
        return <Image source={require('../../../assets/logo-cinema/les-amphis.webp')} style={styles.logo} contentFit="contain" />;
      case 'Gérard-Philipe':
        return <Image source={require('../../../assets/logo-cinema/Gerard-Philipe.webp')} style={styles.logo} contentFit="contain" />;
      default:
        return null;
    }
  };

  const logo = renderLogo();

  return (
    <View style={styles.container}>
      {logo}
      <Text style={[styles.brandText, logo && styles.brandTextWithLogo]}>{brandName}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingLeft: 4,
  },
  logo: {
    width: 40,
    height: 40,
  },
  brandText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  brandTextWithLogo: {
    marginLeft: 8,
  },
});
