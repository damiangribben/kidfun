import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { FriendlyError } from '@/lib/family';

// Claude works best with images up to about this size on the long edge,
// and smaller photos upload faster.
const MAX_EDGE = 1568;

export type PreparedPhoto = {
  /** Local file for showing the photo in the app. */
  uri: string;
  /** JPEG data to send to the server. */
  base64: string;
};

/**
 * Lets the parent take or choose a photo, then shrinks it to a JPEG ready to send.
 * Returns null if they cancel.
 */
export async function pickPhoto(source: 'camera' | 'library'): Promise<PreparedPhoto | null> {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new FriendlyError('Allow camera access in your phone’s settings to take a photo.');
    }
  }

  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled) return null;

  const asset = result.assets[0];
  const context = ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width, asset.height) > MAX_EDGE) {
    context.resize(asset.width >= asset.height ? { width: MAX_EDGE } : { height: MAX_EDGE });
  }
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8, base64: true });
  if (!saved.base64) throw new FriendlyError('Couldn’t read that photo. Please try another.');

  return { uri: saved.uri, base64: saved.base64 };
}
