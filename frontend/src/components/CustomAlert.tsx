import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Pressable } from 'react-native';
import { Theme } from '../theme/theme';
import { setAlertHandler, AlertOptions, AlertButton } from '../utils/alerts';

export const CustomAlert: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<AlertOptions>({
    title: '',
    message: '',
  });

  useEffect(() => {
    setAlertHandler((alertOpts) => {
      setOptions(alertOpts);
      setVisible(true);
    });
    return () => {
      setAlertHandler(() => {});
    };
  }, []);

  const handleButtonPress = (button: AlertButton) => {
    setVisible(false);
    if (button.onPress) {
      button.onPress();
    }
  };

  if (!visible) return null;

  const buttons = options.buttons && options.buttons.length > 0
    ? options.buttons
    : [{ text: 'OK' }];

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={() => setVisible(false)}
    >
      <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
        <Pressable style={styles.alertBox} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{options.title}</Text>
          <Text style={styles.message}>{options.message}</Text>
          
          <View style={[
            styles.buttonContainer,
            buttons.length > 2 ? styles.buttonContainerVertical : styles.buttonContainerHorizontal
          ]}>
            {buttons.map((btn, index) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';
              
              let buttonStyle: any = styles.button;
              let textStyle: any = styles.buttonText;
              
              if (isCancel) {
                buttonStyle = [styles.button, styles.buttonCancel];
                textStyle = [styles.buttonText, styles.buttonTextCancel];
              } else if (isDestructive) {
                buttonStyle = [styles.button, styles.buttonDestructive];
                textStyle = [styles.buttonText, styles.buttonTextDestructive];
              } else {
                buttonStyle = [styles.button, styles.buttonPrimary];
                textStyle = [styles.buttonText, styles.buttonTextPrimary];
              }

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    buttonStyle,
                    buttons.length <= 2 && index > 0 && { marginLeft: Theme.spacing.md },
                    buttons.length > 2 && index > 0 && { marginTop: Theme.spacing.sm },
                  ]}
                  onPress={() => handleButtonPress(btn)}
                  activeOpacity={0.8}
                >
                  <Text style={textStyle}>{btn.text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  alertBox: {
    backgroundColor: Theme.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: Theme.spacing.xl,
    width: '100%',
    maxWidth: 400,
    ...Theme.shadows.md,
  },
  title: {
    ...Theme.typography.titleMedium,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: Theme.spacing.sm,
  },
  message: {
    ...Theme.typography.bodyMedium,
    color: Theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: Theme.spacing.xl,
  },
  buttonContainer: {
    width: '100%',
  },
  buttonContainerHorizontal: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  buttonContainerVertical: {
    flexDirection: 'column',
  },
  button: {
    paddingVertical: Theme.spacing.md - 2,
    paddingHorizontal: Theme.spacing.xl,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  buttonPrimary: {
    backgroundColor: Theme.colors.primary,
    ...Theme.shadows.sm,
  },
  buttonCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
  },
  buttonDestructive: {
    backgroundColor: Theme.colors.danger,
    ...Theme.shadows.sm,
  },
  buttonText: {
    ...Theme.typography.caption,
    fontSize: 13,
    fontWeight: '700',
  },
  buttonTextPrimary: {
    color: '#FFFFFF',
  },
  buttonTextCancel: {
    color: Theme.colors.textSecondary,
  },
  buttonTextDestructive: {
    color: '#FFFFFF',
  },
});
