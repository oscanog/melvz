declare module "libraw-wasm" {
  export interface LibRawMetadata {
    width?: number;
    height?: number;
    raw_width?: number;
    raw_height?: number;
    iwidth?: number;
    iheight?: number;
    sizes?: {
      width?: number;
      height?: number;
      iwidth?: number;
      iheight?: number;
      raw_width?: number;
      raw_height?: number;
    };
  }

  export interface LibRawImageData {
    width?: number;
    height?: number;
    data?: Uint8Array | Uint8ClampedArray;
    image?: Uint8Array | Uint8ClampedArray;
    pixels?: Uint8Array | Uint8ClampedArray;
  }

  export default class LibRaw {
    open(bytes: Uint8Array, settings?: Record<string, unknown>): Promise<void>;
    metadata(fullOutput?: boolean): Promise<LibRawMetadata>;
    imageData(): Promise<LibRawImageData | Uint8Array | Uint8ClampedArray>;
  }
}
