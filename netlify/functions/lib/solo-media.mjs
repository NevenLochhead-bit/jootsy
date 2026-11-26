import {soundType, videoType, IMAGE_LIMIT, SOUND_LIMIT, VIDEO_LIMIT} from './media.mjs';

export const MODEL_LIMIT = 4_000_000;
export function inspectGLB(input) {
  const data = Buffer.from(input);
  if (data.length < 20 || data.length > MODEL_LIMIT || data.readUInt32LE(0) !== 0x46546c67 ||
      data.readUInt32LE(4) !== 2 || data.readUInt32LE(8) !== data.length) return false;
  let position = 12, document, binaryBytes = 0;
  try {
    while (position < data.length) {
      if (position + 8 > data.length) return false;
      const length = data.readUInt32LE(position), type = data.readUInt32LE(position + 4);
      if (length % 4 || position + 8 + length > data.length) return false;
      if (position === 12 && type !== 0x4e4f534a) return false;
      if (type === 0x4e4f534a) {
        if (document) return false;
        document = JSON.parse(data.subarray(position + 8, position + 8 + length).toString('utf8').trim());
      } else if (type === 0x004e4942) {
        if (binaryBytes) return false;
        binaryBytes = length;
      }
      position += 8 + length;
    }
    if (document?.asset?.version !== '2.0' || !Array.isArray(document.meshes) || !document.meshes.length) return false;
    for (const buffer of document.buffers || []) {
      if (buffer.uri && !buffer.uri.startsWith('data:')) return false;
      if (!buffer.uri && (!Number.isSafeInteger(buffer.byteLength) || buffer.byteLength < 1 || buffer.byteLength > binaryBytes)) return false;
    }
    for (const image of document.images || []) if (image.uri && !image.uri.startsWith('data:')) return false;
    return true;
  } catch {return false;}
}

export function inspectSoloMedia(kind, bytes) {
  const data = Buffer.from(bytes);
  if (kind === 'image' && data.length <= IMAGE_LIMIT && data[0] === 255 && data[1] === 216 && data[2] === 255) {
    return {contentType: 'image/jpeg', extension: 'jpg'};
  }
  if (kind === 'audio' && data.length <= SOUND_LIMIT) return soundType(data);
  if (kind === 'video' && data.length <= VIDEO_LIMIT) return videoType(data);
  if (kind === 'model' && inspectGLB(data)) return {contentType: 'model/gltf-binary', extension: 'glb'};
  return null;
}

export const MEDIA_HELP = {
  image: 'Choose an image under 1.5 MB after resizing.',
  audio: 'Choose an MP3 or M4A under 2 MB.',
  video: 'Choose an MP4 under 4 MB.',
  model: 'Choose a self-contained GLB 2.0 model under 4 MB, with its textures embedded.'
};
