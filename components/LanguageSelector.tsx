import { Globe, Check } from 'lucide-react-native';
import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Modal,
  FlatList,
  SafeAreaView,
  Platform,
  useWindowDimensions 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useI18n, Language } from '@/hooks/use-i18n';

export function LanguageSelector() {
  const { t, language, changeLanguage, languages } = useI18n();
  const [modalVisible, setModalVisible] = useState(false);
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 768;

  const currentLanguage = languages.find(l => l.code === language);

  return (
    <>
      <TouchableOpacity 
        style={[
          styles.button,
          isSmallScreen && styles.buttonSmall
        ]}
        onPress={() => setModalVisible(true)}
      >
        <View style={[
          styles.buttonIcon,
          isSmallScreen && styles.buttonIconSmall
        ]}>
          <Globe color="#10b981" size={isSmallScreen ? 16 : 18} />
        </View>
        <Text style={[
          styles.buttonText,
          isSmallScreen && styles.buttonTextSmall
        ]}>{currentLanguage?.nativeName}</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.6)']}
            style={StyleSheet.absoluteFillObject}
          />
          
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {Platform.OS !== 'web' ? (
                <BlurView intensity={40} style={styles.modalBlur}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{t('settings.language')}</Text>
                    <TouchableOpacity 
                      style={styles.closeButton}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.closeButtonText}>{t('common.ok')}</Text>
                    </TouchableOpacity>
                  </View>

                  <FlatList
                    data={languages}
                    keyExtractor={(item) => item.code}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 32 }}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.languageItem,
                          item.code === language && styles.selectedLanguage,
                        ]}
                        onPress={() => {
                          changeLanguage(item.code as Language);
                          setModalVisible(false);
                        }}
                      >
                        <View style={styles.languageInfo}>
                          <Text style={styles.languageName}>{item.nativeName}</Text>
                          <Text style={styles.languageCode}>{item.name}</Text>
                        </View>
                        {item.code === language && (
                          <View style={styles.checkmarkContainer}>
                            <Check color="#10b981" size={20} />
                          </View>
                        )}
                      </TouchableOpacity>
                    )}
                  />
                </BlurView>
              ) : (
                <View style={styles.modalBlurWeb}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{t('settings.language')}</Text>
                    <TouchableOpacity 
                      style={styles.closeButton}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.closeButtonText}>{t('common.ok')}</Text>
                    </TouchableOpacity>
                  </View>

                  <FlatList
                    data={languages}
                    keyExtractor={(item) => item.code}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 32 }}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.languageItem,
                          item.code === language && styles.selectedLanguage,
                        ]}
                        onPress={() => {
                          changeLanguage(item.code as Language);
                          setModalVisible(false);
                        }}
                      >
                        <View style={styles.languageInfo}>
                          <Text style={styles.languageName}>{item.nativeName}</Text>
                          <Text style={styles.languageCode}>{item.name}</Text>
                        </View>
                        {item.code === language && (
                          <View style={styles.checkmarkContainer}>
                            <Check color="#10b981" size={20} />
                          </View>
                        )}
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    minHeight: 44,
  },
  buttonSmall: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    minHeight: 36,
  },
  buttonIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonIconSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
  },
  buttonTextSmall: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '92%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalBlur: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalBlurWeb: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedLanguage: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  languageCode: {
    fontSize: 14,
    color: '#6b7280',
  },
  checkmarkContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
});