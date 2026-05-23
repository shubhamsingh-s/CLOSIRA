import { Platform, Alert } from 'react-native';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertOptions {
  title: string;
  message: string;
  buttons?: AlertButton[];
}

type AlertHandler = (options: AlertOptions) => void;

let globalAlertHandler: AlertHandler | null = null;

export const setAlertHandler = (handler: AlertHandler) => {
  globalAlertHandler = handler;
};

export const safeAlert = (
  title: string,
  message: string,
  buttons?: AlertButton[]
) => {
  // If we are on mobile, use the native Alert.alert
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  // If we have a custom global handler set (e.g. from the root App component), use it
  if (globalAlertHandler) {
    globalAlertHandler({ title, message, buttons });
    return;
  }

  // Fallback if the custom component isn't mounted yet
  console.log(`[ALERT] ${title}: ${message}`);
  if (buttons && buttons.length > 0) {
    // Find the default or non-cancel button and call its onPress
    const actionButton = buttons.find(b => b.style !== 'cancel') || buttons[0];
    if (actionButton.onPress) {
      actionButton.onPress();
    }
  }
};
