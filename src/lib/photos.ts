import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { FriendlyError } from '@/lib/family';

// Claude works best with images up to about this size on the long edge,
// and smaller photos upload faster.
const MAX_EDGE = 1568;

/** Photos sent to Claude in one go (matches the photo-toys Edge Function). */
export const MAX_PHOTOS = 6;

export type PreparedPhoto = {
  /** Local file for showing the photo in the app. */
  uri: string;
  /** JPEG data to send to the server. */
  base64: string;
};

async function prepare(asset: ImagePicker.ImagePickerAsset): Promise<PreparedPhoto> {
  const context = ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width, asset.height) > MAX_EDGE) {
    context.resize(asset.width >= asset.height ? { width: MAX_EDGE } : { height: MAX_EDGE });
  }
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8, base64: true });
  if (!saved.base64) throw new FriendlyError('Couldn’t read one of those photos. Please try another.');
  return { uri: saved.uri, base64: saved.base64 };
}

/**
 * Takes one photo with the camera, or lets the parent choose up to `limit`
 * from their gallery, then shrinks each to a JPEG ready to send.
 * Returns an empty list if they cancel.
 */
export async function pickPhotos(
  source: 'camera' | 'library',
  limit: number,
): Promise<PreparedPhoto[]> {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new FriendlyError('Allow camera access in your phone’s settings to take a photo.');
    }
  }

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 1,
          allowsMultipleSelection: limit > 1,
          selectionLimit: limit,
        });
  if (result.canceled) return [];

  const prepared: PreparedPhoto[] = [];
  for (const asset of result.assets.slice(0, limit)) {
    prepared.push(await prepare(asset));
  }
  return prepared;
}
