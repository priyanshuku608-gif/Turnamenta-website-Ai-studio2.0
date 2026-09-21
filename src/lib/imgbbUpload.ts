/**
 * ImgBB Image Upload Utility
 * Uploads an image to ImgBB using the admin-configured API key
 * API: POST https://api.imgbb.com/1/upload?key={imgbbApiKey}
 */

export async function uploadToImgbb(file: File, apiKey: string): Promise<string> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Please configure the ImgBB API Key in Admin Settings before uploading images.');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Selected file must be an image (PNG, JPG, WEBP, GIF, etc.).');
  }

  if (file.size > 32 * 1024 * 1024) {
    throw new Error('Image file is too large (max 32MB supported by ImgBB).');
  }

  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey.trim())}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errMsg = `ImgBB upload failed with HTTP ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson?.error?.message) {
        errMsg = errJson.error.message;
      }
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }

  const data = await response.json();
  if (!data?.success || !data?.data?.url) {
    throw new Error(data?.error?.message || 'Failed to get uploaded image URL from ImgBB.');
  }

  return data.data.url;
}
