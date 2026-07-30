// Client-side downscale before upload. Uses createImageBitmap with
// imageOrientation:'from-image' so iOS photos land upright (EXIF applied).

const MAX_DIM = 2000;
const JPEG_QUALITY = 0.85;

/**
 * @param {File} file
 * @returns {Promise<Blob>} downscaled blob (jpeg, or png/webp preserved)
 */
export async function downscaleImage(file) {
	const keepType = file.type === 'image/png' || file.type === 'image/webp' ? file.type : 'image/jpeg';

	let bitmap;
	try {
		bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
	} catch {
		// Fallback: no orientation handling, but still works.
		bitmap = await createImageBitmap(file);
	}

	const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
	const w = Math.round(bitmap.width * scale);
	const h = Math.round(bitmap.height * scale);

	const canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext('2d');
	ctx.drawImage(bitmap, 0, 0, w, h);
	bitmap.close?.();

	return await new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
			keepType,
			keepType === 'image/jpeg' ? JPEG_QUALITY : undefined
		);
	});
}
