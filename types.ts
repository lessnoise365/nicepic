
export type AspectRatio = '16:9' | '9:16' | '4:3' | '3:4' | '1:1' | 'auto';
export type FrameStyle = 'default' | 'glass' | 'stack';

export interface GradientStop {
  color: string;
  position: number;
}

export interface AppState {
  // Image
  imageSrc: string | null;
  imageName: string;
  
  // Canvas
  aspectRatio: AspectRatio;
  padding: number; // 0 to 100
  borderRadius: number; // 0 to 100
  shadow: number; // 0 to 100
  frameStyle: FrameStyle;
  
  // Background
  bgType: 'solid' | 'gradient';
  bgColor: string;
  gradientStart: string;
  gradientEnd: string;
  gradientAngle: number;
  noiseOpacity: number; // 0 to 1 (Intensity)
  noiseRoughness: number; // 0 to 1 (Texture size/coarseness)
}

export const ASPECT_RATIOS: { [key in AspectRatio]: number } = {
  '16:9': 16 / 9,
  '9:16': 9 / 16,
  '4:3': 4 / 3,
  '3:4': 3 / 4,
  '1:1': 1,
  'auto': 0, // Special case
};

export const DEFAULT_STATE: AppState = {
  imageSrc: null,
  imageName: 'mockup',
  aspectRatio: 'auto',
  padding: 10,
  borderRadius: 10,
  shadow: 0,
  frameStyle: 'default',
  bgType: 'gradient',
  bgColor: '#18181b',
  gradientStart: '#bdc3c7', // Silver
  gradientEnd: '#2c3e50',   // Dark Blue
  gradientAngle: 135,
  noiseOpacity: 0.1,
  noiseRoughness: 0.4,
};
