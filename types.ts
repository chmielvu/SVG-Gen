
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export enum GenerationStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface GeneratedSvg {
  id: string;
  content: string;
  prompt: string;
  timestamp: number;
}

export interface ApiError {
  message: string;
  details?: string;
  suggestion?: string;
}

export interface ImageData {
  data: string; // Base64 string
  mimeType: string;
  previewUrl: string;
}

export type SvgStyle = 
  | 'Flat' 
  | 'Material' 
  | 'Vector Trace'
  | 'Line Art' 
  | 'Minimalist' 
  | 'Isometric' 
  | 'Pixel Art' 
  | 'Gradient' 
  | 'Hand Drawn'
  | 'Blueprint'
  | 'Cyberpunk'
  | 'Low Poly'
  | 'Pop Art'
  | 'Paper Cutout';

export type TraceComplexity = 'Low' | 'Medium' | 'High';
export type TraceColors = 'Monochrome' | 'Limited' | 'Full';
export type TraceStrokeWeight = 'Thin' | 'Standard' | 'Thick';
export type TraceLineCap = 'Butt' | 'Round' | 'Square';
export type TraceLineFill = 'None' | 'Solid';

export interface TraceSettings {
  complexity: TraceComplexity;
  colors: TraceColors;
  strokeWeight: TraceStrokeWeight;
  lineCap: TraceLineCap;
  lineFill: TraceLineFill;
}
