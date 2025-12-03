
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { InputSection } from './components/InputSection';
import { SvgPreview } from './components/SvgPreview';
import { generateSvgFromPrompt } from './services/geminiService';
import { GeneratedSvg, GenerationStatus, ApiError, ImageData, SvgStyle, TraceSettings } from './types';
import { AlertCircle, Lightbulb } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [currentSvg, setCurrentSvg] = useState<GeneratedSvg | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  const handleGenerate = async (prompt: string, image?: ImageData, style: SvgStyle = 'Flat', traceSettings?: TraceSettings) => {
    setStatus(GenerationStatus.LOADING);
    setError(null);
    setCurrentSvg(null);

    try {
      // Prepare image part if it exists
      const imagePart = image ? {
        inlineData: {
          data: image.data,
          mimeType: image.mimeType
        }
      } : undefined;

      const svgContent = await generateSvgFromPrompt(prompt, imagePart, style, traceSettings);
      
      const newSvg: GeneratedSvg = {
        id: crypto.randomUUID(),
        content: svgContent,
        prompt: prompt || (image ? "Image to SVG Conversion" : "Generated SVG"),
        timestamp: Date.now()
      };
      
      setCurrentSvg(newSvg);
      setStatus(GenerationStatus.SUCCESS);
    } catch (err: any) {
      setStatus(GenerationStatus.ERROR);
      setError({
        message: err.message || "Generation Failed",
        details: err.details || err.toString() || "An unexpected error occurred while contacting Gemini.",
        suggestion: err.suggestion
      });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30 pt-8">      
      <main className="pb-20">
        <InputSection onGenerate={handleGenerate} status={status} />
        
        {status === GenerationStatus.ERROR && error && (
          <div className="max-w-2xl mx-auto mt-8 px-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-start gap-4 text-red-200 shadow-lg shadow-red-900/10">
              <div className="p-2 bg-red-500/20 rounded-lg shrink-0 mt-1">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1 w-full">
                <h4 className="font-bold text-lg text-red-400 mb-1">{error.message}</h4>
                <p className="text-sm text-red-300/80 leading-relaxed mb-3 font-mono bg-red-950/30 p-2 rounded border border-red-500/10 break-words">
                  {error.details}
                </p>
                
                {error.suggestion && (
                  <div className="flex items-start gap-2 bg-amber-500/5 rounded-lg p-2.5 border border-amber-500/10">
                    <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-amber-200/80">
                      <strong className="text-amber-400 font-medium">Tip:</strong> {error.suggestion}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {status === GenerationStatus.SUCCESS && currentSvg && (
          <SvgPreview 
            data={currentSvg} 
          />
        )}
        
        {/* Empty State / Placeholder */}
        {status === GenerationStatus.IDLE && (
          <div className="max-w-2xl mx-auto mt-16 text-center px-4 opacity-50 pointer-events-none select-none">
             <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-zinc-900/50 border border-white/5 mb-4">
                <svg className="w-12 h-12 text-zinc-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                   <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                   <circle cx="8.5" cy="8.5" r="1.5" />
                   <polyline points="21 15 16 10 5 21" />
                </svg>
             </div>
             <p className="text-zinc-600 text-sm">Generated artwork will appear here</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
