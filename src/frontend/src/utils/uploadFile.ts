const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB ICP message limit
const TARGET_SIZE_BYTES = 1.8 * 1024 * 1024; // target after compression

/** Compress an image file using canvas API to stay under MAX_SIZE_BYTES. */
async function compressImage(
  file: File,
  onWarning?: (msg: string) => void,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      // Scale down if very large — cap longest side at 1920px
      const maxDim = 1920;
      if (width > maxDim || height > maxDim) {
        const scale = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      // Binary-search for the highest quality that fits under TARGET_SIZE_BYTES
      let lo = 0.3;
      let hi = 0.95;
      let best: Blob | null = null;

      const tryQuality = (q: number) =>
        new Promise<Blob>((res) =>
          canvas.toBlob((b) => res(b!), "image/jpeg", q),
        );

      (async () => {
        for (let i = 0; i < 8; i++) {
          const mid = (lo + hi) / 2;
          const blob = await tryQuality(mid);
          if (blob.size <= TARGET_SIZE_BYTES) {
            best = blob;
            lo = mid;
          } else {
            hi = mid;
          }
        }
        if (!best) best = await tryQuality(lo);

        if (best.size > MAX_SIZE_BYTES) {
          reject(
            new Error(
              `Image is too large (${(best.size / 1024 / 1024).toFixed(1)} MB) even after compression. Please use a smaller image (max 2 MB).`,
            ),
          );
          return;
        }

        onWarning?.(
          `Image compressed from ${(file.size / 1024 / 1024).toFixed(1)} MB to ${(best.size / 1024 / 1024).toFixed(1)} MB`,
        );
        const compressed = new File(
          [best],
          file.name.replace(/\.[^.]+$/, ".jpg"),
          {
            type: "image/jpeg",
            lastModified: Date.now(),
          },
        );
        resolve(compressed);
      })().catch(reject);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image for compression"));
    };
    img.src = objectUrl;
  });
}

/**
 * Upload a file, automatically compressing images that exceed the 2 MB ICP
 * message size limit. Returns the data URL and an optional compression warning.
 *
 * @param file      The file to upload
 * @param onWarning Optional callback called with a compression summary string
 */
export async function uploadFile(
  file: File,
  onWarning?: (msg: string) => void,
): Promise<{ url: string }> {
  let fileToUpload = file;

  if (file.type.startsWith("image/") && file.size > MAX_SIZE_BYTES) {
    onWarning?.(
      `Image is ${(file.size / 1024 / 1024).toFixed(1)} MB — compressing to stay under the 2 MB ICP limit…`,
    );
    fileToUpload = await compressImage(file, onWarning);
  } else if (file.size > MAX_SIZE_BYTES) {
    throw new Error(
      `File is ${(file.size / 1024 / 1024).toFixed(1)} MB which exceeds the 2 MB ICP canister message limit. Please use a smaller file.`,
    );
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ url: reader.result as string });
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(fileToUpload);
  });
}
