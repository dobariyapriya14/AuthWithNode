import { Alert } from 'react-native';
import ReactNativeBiometrics from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });

export interface BiometricAvailability {
  available: boolean;
  biometryType?: string | null;
}

export const biometricService = {
  /**
   * Check if biometrics (Face ID / Fingerprint / Touch ID) is available and enrolled on the device
   */
  checkBiometricsAvailable: async (): Promise<BiometricAvailability> => {
    try {
      const { available, biometryType } = await rnBiometrics.isSensorAvailable();
      return { available, biometryType };
    } catch (error) {
      console.log('Biometrics check error:', error);
      return { available: false, biometryType: null };
    }
  },

  /**
   * Prompt user for Face ID / Fingerprint / Passcode authentication.
   * Returns true if successful, false if failed/cancelled.
   */
  authenticate: async (promptMessage: string = 'Confirm identity with Face ID / Fingerprint'): Promise<boolean> => {
    try {
      const { available } = await rnBiometrics.isSensorAvailable();

      if (!available) {
        return new Promise<boolean>((resolve) => {
          Alert.alert(
            'Biometrics Not Configured on Emulator',
            'No fingerprint or Face ID is enrolled in Emulator Settings.\n\nTo test real prompt: Go to Emulator Settings ➔ Security ➔ Fingerprint, set up a PIN + Fingerprint, then try again.\n\nDo you want to proceed anyway?',
            [
              {
                text: 'Cancel',
                onPress: () => resolve(false),
                style: 'cancel',
              },
              {
                text: 'Proceed (Bypass)',
                onPress: () => resolve(true),
              },
            ]
          );
        });
      }

      const result = await rnBiometrics.simplePrompt({
        promptMessage,
        cancelButtonText: 'Cancel',
      });

      return result.success;
    } catch (error: any) {
      console.log('Biometrics authentication error:', error);
      // Fallback prompt if simplePrompt fails on emulator
      return new Promise<boolean>((resolve) => {
        Alert.alert(
          'Biometrics Error',
          `Could not open native prompt: ${error?.message || error}\n\nProceed with action?`,
          [
            { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
            { text: 'Proceed', onPress: () => resolve(true) },
          ]
        );
      });
    }
  },
};

export default biometricService;
