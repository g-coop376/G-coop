import { Alert, PermissionsAndroid, Platform } from 'react-native';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import FileViewer from 'react-native-file-viewer';

function showShareDebugAlert(step: string, details: string) {
  if (Platform.OS !== 'android') {
    return;
  }

  Alert.alert('PDF Share Debug', `${step}\n${details}`);
}

async function ensureAndroidStoragePermission() {
  if (Platform.OS !== 'android') {
    return true;
  }

  const androidVersion = Number(Platform.Version);
  if (androidVersion >= 29) {
    showShareDebugAlert('Permission check', `Skipped on Android API ${androidVersion}`);
    return true;
  }

  const permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
  const alreadyGranted = await PermissionsAndroid.check(permission);
  showShareDebugAlert('Permission already granted', String(alreadyGranted));

  if (alreadyGranted) {
    return true;
  }

  const granted = await PermissionsAndroid.request(permission);
  showShareDebugAlert('Permission request result', granted);

  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

export async function shareFile(filePath: string, title: string) {
  try {
    showShareDebugAlert('Incoming path', filePath);

    const exists = await RNFS.exists(filePath);
    showShareDebugAlert('File exists before share', `${exists} @ ${filePath}`);

    if (!exists) {
      throw new Error(`Cannot share missing PDF: ${filePath}`);
    }

    const hasPermission = await ensureAndroidStoragePermission();
    if (!hasPermission) {
      showShareDebugAlert('Permission denied', 'WRITE_EXTERNAL_STORAGE denied on Android < 29');
    }

    const url = Platform.OS === 'android' ? `file://${filePath}` : filePath;
    showShareDebugAlert('Share URL', url);

    await Share.open({
      title,
      url,
      type: 'application/pdf',
      failOnCancel: false,
      showAppsToView: true,
    });
    showShareDebugAlert('Share.open success', filePath);
  } catch (error) {
    showShareDebugAlert(
      'Share.open error',
      error instanceof Error ? error.message : String(error),
    );

    // Fallback — open directly avec FileViewer
    try {
      const exists = await RNFS.exists(filePath);
      showShareDebugAlert('File exists before FileViewer', `${exists} @ ${filePath}`);

      if (!exists) {
        throw new Error(`Cannot open missing PDF: ${filePath}`);
      }

      await FileViewer.open(filePath, { showOpenWithDialog: true });
      showShareDebugAlert('FileViewer success', filePath);
    } catch (e) {
      showShareDebugAlert(
        'FileViewer error',
        e instanceof Error ? e.message : String(e),
      );
      console.error('shareFile error:', e);
    }
  }
}
