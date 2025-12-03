
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useRef } from 'react';
import { Send, Loader2, Wand2, ImagePlus, X, ImageIcon, Palette, Lightbulb, Sparkles, Settings2 } from 'lucide-react';
import { GenerationStatus, ImageData, SvgStyle, TraceSettings, TraceComplexity, TraceColors, TraceStrokeWeight, TraceLineCap, TraceLineFill } from '../types';

interface InputSectionProps {
  onGenerate: (prompt: string, image: ImageData | undefined, style: SvgStyle, traceSettings?: TraceSettings) => void;
  status: GenerationStatus;
}

const STYLES: SvgStyle[] = [
  'Vector Trace',
  'Flat', 
  'Material', 
  'Line Art', 
  'Low Poly',
  'Minimalist', 
  'Isometric', 
  'Blueprint',
  'Cyberpunk',
  'Gradient',
  'Pixel Art', 
  'Hand Drawn',
  'Pop Art',
  'Paper Cutout'
];

const STYLE_GUIDES: Record<SvgStyle, { description: string; examples: string[] }> = {
  'Vector Trace': {
    description: "Converts uploaded images into exact vector paths. Best used with an image attachment.",
    examples: ["Trace this logo exactly", "Convert sketch to vector", "Vectorize this icon"]
  },
  'Flat': {
    description: "Clean, modern 2D illustrations with solid colors and no gradients.",
    examples: ["Flat design rocket ship", "Minimalist forest landscape", "Modern coffee cup icon"]
  },
  'Material': {
    description: "Google's Material Design with subtle depth, shadows, and vibrant colors.",
    examples: ["Material design weather icon", "Floating action button", "Layered map marker"]
  },
  'Line Art': {
    description: "Elegant monoline illustrations using only strokes. Great for coloring books.",
    examples: ["Continuous line portrait", "Botanical flower illustration", "Geometric mountain range"]
  },
  'Minimalist': {
    description: "Stripped down to essential elements. Less is more.",
    examples: ["Minimalist corporate logo", "Single shape cat", "Abstract geometric composition"]
  },
  'Isometric': {
    description: "3D perspective without vanishing points. Perfect for technical diagrams.",
    examples: ["Isometric data center", "3D building block", "Isometric office room"]
  },
  'Blueprint': {
    description: "Technical architectural look with white lines on a blue background.",
    examples: ["Blueprint of an engine", "House floor plan", "Technical schematic of a robot"]
  },
  'Cyberpunk': {
    description: "Futuristic aesthetic with neon colors, dark backgrounds, and glitch effects.",
    examples: ["Cyberpunk city skyline", "Neon samurai helmet", "Glitch art triangle"]
  },
  'Low Poly': {
    description: "3D mesh style made of non-overlapping triangles.",
    examples: ["Low poly fox head", "Geometric mountain landscape", "Low poly heart 3d"]
  },
  'Pixel Art': {
    description: "Retro 8-bit or 16-bit aesthetic aligned to a grid.",
    examples: ["8-bit sword sprite", "Pixel art burger", "Retro game character"]
  },
  'Gradient': {
    description: "Modern designs focusing on smooth color transitions and fluidity.",
    examples: ["Holographic gradient sphere", "Fluid shape background", "Sunset gradient logo"]
  },
  'Hand Drawn': {
    description: "Organic lines and imperfect shapes for a sketch-like feel.",
    examples: ["Sketchy notebook doodle", "Hand drawn arrows set", "Pencil sketch of a dog"]
  },
  'Pop Art': {
    description: "Bold outlines and vibrant colors inspired by comic books and Warhol.",
    examples: ["Pop art banana", "Comic book explosion", "Retro woman portrait"]
  },
  'Paper Cutout': {
    description: "Layered effect mimicking paper craft with drop shadows.",
    examples: ["Paper cutout forest", "Layered topographic map", "Paper craft flower"]
  }
};

export const InputSection: React.FC<InputSectionProps> = ({ onGenerate, status }) => {
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<SvgStyle>('Flat');
  const [traceSettings, setTraceSettings] = useState<TraceSettings>({ 
    complexity: 'Medium', 
    colors: 'Limited',
    strokeWeight: 'Standard',
    lineCap: 'Round',
    lineFill: 'None'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || selectedImage) && status !== GenerationStatus.LOADING) {
      onGenerate(input.trim(), selectedImage || undefined, selectedStyle, (selectedStyle === 'Vector Trace' || selectedStyle === 'Line Art') ? traceSettings : undefined);
    }
  }, [input, selectedImage, selectedStyle, traceSettings, status, onGenerate]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      
      setSelectedImage({
        data: base64Data,
        mimeType: file.type,
        previewUrl: result
      });
      
      if (selectedStyle === 'Flat') {
          setSelectedStyle('Vector Trace');
      }
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (selectedStyle === 'Vector Trace') {
        setSelectedStyle('Flat');
    }
  };

  const isLoading = status === GenerationStatus.LOADING;
  const hasContent = input.trim().length > 0 || selectedImage !== null;
  const styleGuide = STYLE_GUIDES[selectedStyle];

  const toggleComplexity = (level: TraceComplexity) => setTraceSettings(prev => ({ ...prev, complexity: level }));
  const toggleColors = (mode: TraceColors) => setTraceSettings(prev => ({ ...prev, colors: mode }));
  const toggleStrokeWeight = (weight: TraceStrokeWeight) => setTraceSettings(prev => ({ ...prev, strokeWeight: weight }));
  const toggleLineCap = (cap: TraceLineCap) => setTraceSettings(prev => ({ ...prev, lineCap: cap }));
  const toggleLineFill = (fill: TraceLineFill) => setTraceSettings(prev => ({ ...prev, lineFill: fill }));

  const showSettings = selectedStyle === 'Vector Trace' || selectedStyle === 'Line Art';
  const isVectorTrace = selectedStyle === 'Vector Trace';
  const isLineArt = selectedStyle === 'Line Art';

  return (
    <div className="w-full max-w-2xl mx-auto mt-12 px-4">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400 mb-3">
          What do you want to create?
        </h2>
        <p className="text-zinc-400 text-lg">
          Describe an object or upload an image to convert it into vector art.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative group z-10">
        
        {/* Style Selector */}
        <div className="relative z-20 flex items-center gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide mask-fade-right">
          <div className="flex items-center gap-1.5 px-2 text-zinc-500 text-xs font-semibold uppercase tracking-wider flex-shrink-0">
            <Palette className="w-3 h-3" />
            Style
          </div>
          {STYLES.map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => setSelectedStyle(style)}
              className={`
                whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200 flex-shrink-0
                ${selectedStyle === style
                  ? 'bg-white text-zinc-950 border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]' 
                  : 'bg-zinc-900/50 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-zinc-200 hover:bg-zinc-800'}
              `}
            >
              {style}
            </button>
          ))}
        </div>

        {/* Dynamic Settings Toolbar (Vector Trace & Line Art) */}
        {showSettings && (
          <div className="relative z-20 mb-3 mx-1 animate-in slide-in-from-top-2 fade-in duration-300">
             <div className="flex flex-wrap items-center gap-x-6 gap-y-2 bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-lg">
                <div className="flex items-center gap-2 text-zinc-400">
                   <Settings2 className="w-4 h-4 text-indigo-400" />
                   <span className="text-xs font-bold uppercase tracking-wider">
                     {isVectorTrace ? 'Trace Options' : 'Line Art Options'}
                   </span>
                </div>
                
                {/* Complexity Control (Vector Trace Only) */}
                {isVectorTrace && (
                  <div className="flex items-center gap-2">
                     <span className="text-xs text-zinc-500 font-medium">Detail:</span>
                     <div className="flex bg-zinc-800/50 rounded-lg p-0.5 border border-white/5">
                        {(['Low', 'Medium', 'High'] as TraceComplexity[]).map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => toggleComplexity(level)}
                            className={`
                              px-2 py-1 text-[10px] font-medium rounded-md transition-all
                              ${traceSettings.complexity === level 
                                ? 'bg-zinc-700 text-white shadow-sm' 
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}
                            `}
                          >
                            {level}
                          </button>
                        ))}
                     </div>
                  </div>
                )}

                {/* Color Control (Vector Trace Only) */}
                {isVectorTrace && (
                  <div className="flex items-center gap-2">
                     <span className="text-xs text-zinc-500 font-medium">Colors:</span>
                     <div className="flex bg-zinc-800/50 rounded-lg p-0.5 border border-white/5">
                        {(['Monochrome', 'Limited', 'Full'] as TraceColors[]).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => toggleColors(mode)}
                            className={`
                              px-2 py-1 text-[10px] font-medium rounded-md transition-all
                              ${traceSettings.colors === mode 
                                ? 'bg-zinc-700 text-white shadow-sm' 
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}
                            `}
                          >
                            {mode}
                          </button>
                        ))}
                     </div>
                  </div>
                )}
                
                {/* Fill Control (Line Art Only) */}
                {isLineArt && (
                  <div className="flex items-center gap-2">
                     <span className="text-xs text-zinc-500 font-medium">Fill:</span>
                     <div className="flex bg-zinc-800/50 rounded-lg p-0.5 border border-white/5">
                        {(['None', 'Solid'] as TraceLineFill[]).map((fill) => (
                          <button
                            key={fill}
                            type="button"
                            onClick={() => toggleLineFill(fill)}
                            className={`
                              px-2 py-1 text-[10px] font-medium rounded-md transition-all
                              ${traceSettings.lineFill === fill 
                                ? 'bg-zinc-700 text-white shadow-sm' 
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}
                            `}
                          >
                            {fill}
                          </button>
                        ))}
                     </div>
                  </div>
                )}

                {/* Stroke Weight Control (Shared) */}
                <div className="flex items-center gap-2">
                   <span className="text-xs text-zinc-500 font-medium">Stroke:</span>
                   <div className="flex bg-zinc-800/50 rounded-lg p-0.5 border border-white/5">
                      {(['Thin', 'Standard', 'Thick'] as TraceStrokeWeight[]).map((weight) => (
                        <button
                          key={weight}
                          type="button"
                          onClick={() => toggleStrokeWeight(weight)}
                          className={`
                            px-2 py-1 text-[10px] font-medium rounded-md transition-all
                            ${traceSettings.strokeWeight === weight 
                              ? 'bg-zinc-700 text-white shadow-sm' 
                              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}
                          `}
                        >
                          {weight}
                        </button>
                      ))}
                   </div>
                </div>

                {/* Line Cap Control (Shared) */}
                <div className="flex items-center gap-2">
                   <span className="text-xs text-zinc-500 font-medium">Caps:</span>
                   <div className="flex bg-zinc-800/50 rounded-lg p-0.5 border border-white/5">
                      {(['Butt', 'Round', 'Square'] as TraceLineCap[]).map((cap) => (
                        <button
                          key={cap}
                          type="button"
                          onClick={() => toggleLineCap(cap)}
                          className={`
                            px-2 py-1 text-[10px] font-medium rounded-md transition-all
                            ${traceSettings.lineCap === cap 
                              ? 'bg-zinc-700 text-white shadow-sm' 
                              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}
                          `}
                        >
                          {cap}
                        </button>
                      ))}
                   </div>
                </div>

             </div>
          </div>
        )}

        {/* Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur-lg pointer-events-none"></div>
        
        {/* Main Input Area */}
        <div className="relative bg-zinc-900 rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col z-20">
          
          {/* Image Preview Area */}
          {selectedImage && (
            <div className="p-3 border-b border-white/5 bg-zinc-900/50 flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 relative">
                  <img src={selectedImage.previewUrl} alt="Upload preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-zinc-300 font-medium">Image attached</span>
                  <span className="text-[10px] text-zinc-500">Will be converted to {selectedStyle} SVG</span>
                </div>
              </div>
              <button 
                type="button"
                onClick={clearImage}
                className="p-1.5 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-center p-2">
            <div className="pl-3 pr-2 text-zinc-500">
               {selectedImage ? <ImageIcon className="w-5 h-5 text-indigo-400" /> : <Wand2 className="w-5 h-5" />}
            </div>
            
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={selectedImage ? "Add instructions (e.g. 'Remove background')..." : `Describe your ${selectedStyle.toLowerCase()} vector art...`}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-zinc-500 px-2 py-3 text-lg"
              disabled={isLoading}
            />

            {/* Hidden File Input */}
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />

            <div className="flex items-center gap-2 pr-1">
              {!selectedImage && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Upload image to convert"
                >
                  <ImagePlus className="w-5 h-5" />
                </button>
              )}

              <button
                type="submit"
                disabled={!hasContent || isLoading}
                className={`
                  flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200
                  ${!hasContent || isLoading 
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                    : 'bg-white text-zinc-950 hover:bg-zinc-200 active:scale-95 shadow-lg shadow-white/10'}
                `}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="hidden sm:inline">Crafting...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Generate</span>
                    <Send className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
      
      {/* Dynamic Style Guide & Suggestions */}
      {!selectedImage && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 px-2">
          
          <div className="flex items-start gap-3 mb-4 p-4 bg-zinc-900/40 border border-white/5 rounded-xl backdrop-blur-sm">
            <div className="p-2 bg-indigo-500/10 rounded-lg flex-shrink-0">
               <Lightbulb className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-200 mb-1 flex items-center gap-2">
                {selectedStyle} Style
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {styleGuide.description}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
             <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-600 pl-1 flex items-center gap-1">
               <Sparkles className="w-3 h-3" /> Try these prompts
             </span>
             <div className="flex flex-wrap gap-2">
              {styleGuide.examples.map((example) => (
                <button
                  key={example}
                  onClick={() => setInput(example)}
                  disabled={isLoading}
                  className="text-left px-3 py-2 text-sm text-zinc-400 bg-zinc-900/60 border border-white/5 rounded-lg hover:bg-zinc-800 hover:text-zinc-200 hover:border-white/10 transition-all active:scale-[0.98]"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
