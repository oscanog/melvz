const FULL_WEBP_QUALITY = 0.92;
const HEIC_INTERMEDIATE_QUALITY = 0.96;
const BLUR_SIZE = 32;

const HEIC_EXTENSIONS = new Set(["heic", "heif"]);
const RAW_EXTENSIONS = new Set([
  "3fr",
  "arw",
  "cr2",
  "cr3",
  "dcr",
  "dng",
  "erf",
  "k25",
  "kdc",
  "mrw",
  "nef",
  "nrw",
  "orf",
  "pef",
  "raf",
  "raw",
  "rw2",
  "sr2",
  "srf",
  "x3f",
]);

export interface PreparedProfileImageUpload {
  fullBlob: Blob;
  blurBlob: Blob;
  previewUrl: string;
}

interface DecodedImage {
  bitmap: ImageBitmap;
  release: () => void;
}

export async function prepareProfileImageUpload(
  file: File
): Promise<PreparedProfileImageUpload> {
  const extension = getExtension(file.name);
  const isWebp = file.type === "image/webp" || extension === "webp";

  const decoded = await decodeProfileImage(file, extension);
  try {
    const fullBlob = isWebp
      ? new Blob([file], { type: "image/webp" })
      : await imageBitmapToWebp(decoded.bitmap, FULL_WEBP_QUALITY);
    const blurBlob = await imageBitmapToWebp(decoded.bitmap, FULL_WEBP_QUALITY, {
      width: BLUR_SIZE,
      height: BLUR_SIZE,
      cover: true,
    });

    return {
      fullBlob,
      blurBlob,
      previewUrl: URL.createObjectURL(fullBlob),
    };
  } finally {
    decoded.release();
  }
}

function getExtension(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

async function decodeProfileImage(
  file: File,
  extension: string
): Promise<DecodedImage> {
  if (HEIC_EXTENSIONS.has(extension)) {
    const heic2any = (await import("heic2any")).default;
    const converted = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: HEIC_INTERMEDIATE_QUALITY,
    });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    return decodeBrowserImage(blob);
  }

  if (RAW_EXTENSIONS.has(extension)) {
    return decodeRawImage(file);
  }

  if (file.type.startsWith("image/") || extension === "webp") {
    return decodeBrowserImage(file);
  }

  throw new Error("Unsupported image file. Use JPG, PNG, WebP, HEIC, or common RAW photo files.");
}

async function decodeBrowserImage(blob: Blob): Promise<DecodedImage> {
  if ("createImageBitmap" in window) {
    const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
    return {
      bitmap,
      release: () => bitmap.close(),
    };
  }

  const url = URL.createObjectURL(blob);
  try {
    const image = await loadHtmlImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available for image conversion.");
    ctx.drawImage(image, 0, 0);
    const bitmap = await createImageBitmap(canvas);
    return {
      bitmap,
      release: () => bitmap.close(),
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function decodeRawImage(file: File): Promise<DecodedImage> {
  const LibRaw = (await import("libraw-wasm")).default;
  const raw = new LibRaw();
  await raw.open(new Uint8Array(await file.arrayBuffer()), {
    outputColor: 1,
    outputBps: 8,
    useCameraWb: true,
    noAutoBright: false,
  });

  const metadata = await raw.metadata(true);
  const rawImage = await raw.imageData();
  const { width, height, data } = normalizeRawImage(rawImage, metadata);
  const imageBytes = new Uint8ClampedArray(data.length);
  imageBytes.set(data);
  const imageData = new ImageData(imageBytes, width, height);
  const bitmap = await createImageBitmap(imageData);

  return {
    bitmap,
    release: () => bitmap.close(),
  };
}

function normalizeRawImage(
  rawImage: unknown,
  metadata: {
    width?: number;
    height?: number;
    raw_width?: number;
    raw_height?: number;
    iwidth?: number;
    iheight?: number;
    sizes?: {
      width?: number;
      height?: number;
      raw_width?: number;
      raw_height?: number;
      iwidth?: number;
      iheight?: number;
    };
  }
): { width: number; height: number; data: Uint8ClampedArray } {
  const candidate = rawImage as {
    width?: number;
    height?: number;
    data?: Uint8Array | Uint8ClampedArray;
    image?: Uint8Array | Uint8ClampedArray;
    pixels?: Uint8Array | Uint8ClampedArray;
  };
  const source =
    rawImage instanceof Uint8Array || rawImage instanceof Uint8ClampedArray
      ? rawImage
      : candidate.data ?? candidate.image ?? candidate.pixels;
  const width = Number(
    candidate.width ??
      metadata.width ??
      metadata.iwidth ??
      metadata.sizes?.width ??
      metadata.sizes?.iwidth ??
      metadata.raw_width ??
      metadata.sizes?.raw_width
  );
  const height = Number(
    candidate.height ??
      metadata.height ??
      metadata.iheight ??
      metadata.sizes?.height ??
      metadata.sizes?.iheight ??
      metadata.raw_height ??
      metadata.sizes?.raw_height
  );

  if (!source || !Number.isFinite(width) || !Number.isFinite(height)) {
    throw new Error("RAW file decoded, but image dimensions were not available.");
  }

  const pixels = width * height;
  if (source.length === pixels * 4) {
    return { width, height, data: new Uint8ClampedArray(source) };
  }

  if (source.length === pixels * 3) {
    const rgba = new Uint8ClampedArray(pixels * 4);
    for (let sourceIndex = 0, targetIndex = 0; sourceIndex < source.length; sourceIndex += 3, targetIndex += 4) {
      rgba[targetIndex] = source[sourceIndex];
      rgba[targetIndex + 1] = source[sourceIndex + 1];
      rgba[targetIndex + 2] = source[sourceIndex + 2];
      rgba[targetIndex + 3] = 255;
    }
    return { width, height, data: rgba };
  }

  throw new Error("RAW file decoded, but its pixel format is unsupported.");
}

function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image could not be decoded by this browser."));
    image.src = url;
  });
}

async function imageBitmapToWebp(
  bitmap: ImageBitmap,
  quality: number,
  options?: { width: number; height: number; cover: boolean }
): Promise<Blob> {
  const width = options?.width ?? bitmap.width;
  const height = options?.height ?? bitmap.height;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available for image conversion.");

  if (options?.cover) {
    const scale = Math.max(width / bitmap.width, height / bitmap.height);
    const sourceWidth = width / scale;
    const sourceHeight = height / scale;
    const sourceX = (bitmap.width - sourceWidth) / 2;
    const sourceY = Math.max(0, (bitmap.height - sourceHeight) / 3);
    ctx.drawImage(bitmap, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
  } else {
    ctx.drawImage(bitmap, 0, 0, width, height);
  }

  return canvasToBlob(canvas, "image/webp", quality);
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Browser could not export this image as WebP."));
          return;
        }
        resolve(blob);
      },
      type,
      quality
    );
  });
}
