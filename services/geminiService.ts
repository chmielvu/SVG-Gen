
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI } from "@google/genai";
import { TraceSettings } from "../types";

// Initialize the client
// CRITICAL: We use process.env.API_KEY as per strict guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface ImagePart {
  inlineData: {
    data: string;
    mimeType: string;
  };
}

/**
 * Helper to determine the temperature based on style.
 * Precision tasks (Traces, Blueprints) need low temp.
 * Creative tasks (Abstract, Hand Drawn) need high temp.
 */
const getTemperatureForStyle = (style: string): number => {
  switch (style) {
    case 'Vector Trace':
    case 'Blueprint':
    case 'Pixel Art':
    case 'Isometric':
      return 0.15; // High precision
    case 'Flat':
    case 'Material':
    case 'Minimalist':
    case 'Low Poly':
      return 0.3; // Balanced
    case 'Hand Drawn':
    case 'Gradient':
    case 'Cyberpunk':
    case 'Pop Art':
      return 0.6; // Creative
    default:
      return 0.4;
  }
};

/**
 * Returns specific design rules for the requested style.
 */
const getStyleInstructions = (style: string, traceSettings?: TraceSettings): string => {
  const instructions: Record<string, string> = {
    'Vector Trace': 'Goal: PHOTOREALISTIC REPRODUCTION. Trace the input image exactly. Use as many paths and gradients as necessary to capture the full detail, lighting, and shading of the original image. Do not simplify or stylize unless asked.',
    'Flat': 'Goal: Clean, modern flat design. No gradients, drop shadows, or textures. Use solid colors and geometric precision.',
    'Material': 'Goal: Google Material Design. Use subtle depth, card-like layers, slight drop shadows (simulated with semi-transparent paths), and vibrant standard colors.',
    'Line Art': 'Goal: Monoline vector illustration. Use only strokes (stroke-width="2" or similar), no fill (or white fill). Focus on the outline and essential details.',
    'Blueprint': 'Goal: Technical architectural blueprint. Background color must be #0f4c81 (Classic Blue) or #0022AA. All lines should be white. Use dashed lines for hidden details. Add measurement markers if applicable.',
    'Cyberpunk': 'Goal: Futuristic, high-tech aesthetic. Use a dark background (#000 or #111). Neon colors: Cyan (#00f3ff), Magenta (#ff00ff), Lime Green. Use glitch effects (jagged paths) and glowing elements.',
    'Low Poly': 'Goal: Low Polygon Art. Construct the image entirely out of non-overlapping triangles. No curves. Use flat shading for each triangle to create a faceted 3D effect.',
    'Isometric': 'Goal: 30-degree isometric projection. Create a pseudo-3D look. maintain consistent parallel lines. clean geometric structures.',
    'Pixel Art': 'Goal: 8-bit or 16-bit retro style. Use small rect elements to simulate pixels. Keep all "pixels" aligned to a strict grid.',
    'Pop Art': 'Goal: Warhol/Lichtenstein style. Bold black outlines, high contrast, Ben-Day dots (simulated with pattern fills if possible, or simple dots), and vibrant primary colors.',
    'Paper Cutout': 'Goal: Layered paper craft effect. Use shapes with slightly offset semi-transparent black duplicates underneath to simulate drop shadows and depth between layers.'
  };

  let rule = instructions[style] || 'Goal: High quality vector art.';

  // Append Settings instructions if applicable (Shared by Vector Trace and Line Art)
  if ((style === 'Vector Trace' || style === 'Line Art') && traceSettings) {
    let settingsRefinement = `\n${style.toUpperCase()} SETTINGS:`;
    
    // --- Vector Trace Specific Settings ---
    if (style === 'Vector Trace') {
      // Complexity Rules
      switch (traceSettings.complexity) {
        case 'Low':
          settingsRefinement += "\n- SIMPLIFY PATHS: Use smooth Bezier curves with minimal nodes. Remove small details and noise. Abstract shapes into clean geometry.";
          break;
        case 'High':
          settingsRefinement += "\n- HIGH FIDELITY: Capture fine details, textures, and small elements. Use precise paths. Do not simplify.";
          break;
        case 'Medium':
        default:
          settingsRefinement += "\n- BALANCED DETAIL: Standard vectorization. Clean up noise but keep main features distinct.";
          break;
      }

      // Color Rules
      switch (traceSettings.colors) {
        case 'Monochrome':
          settingsRefinement += "\n- MONOCHROME: Use ONLY black and white (or foreground/background). No grayscale, no gradients.";
          break;
        case 'Limited':
          settingsRefinement += "\n- LIMITED PALETTE: Use a maximum of 16 distinct colors. Group similar shades (quantization). Solid fills only, minimize gradients.";
          break;
        case 'Full':
        default:
          settingsRefinement += "\n- FULL COLOR: Use full color spectrum. Use gradients and complex shading if necessary to match the original.";
          break;
      }
    }

    // --- Line Art Specific Settings ---
    if (style === 'Line Art') {
       if (traceSettings.lineFill === 'Solid') {
         settingsRefinement += "\n- FILL STYLE: Solid Fill. Fill closed shapes with the same color as the outline (or black). Do not use fill='none'. Create solid silhouettes or filled illustrations.";
       } else {
         settingsRefinement += "\n- FILL STYLE: No Fill (Stroke Only). Ensure `fill=\"none\"` for all paths. Rely entirely on strokes to define the image.";
       }
    }

    // --- Shared Settings (Stroke & Cap) ---
    // Stroke Weight Rules
    if (traceSettings.strokeWeight) {
      switch (traceSettings.strokeWeight) {
        case 'Thin':
          settingsRefinement += "\n- STROKE WEIGHT: Thin lines (0.5px - 1px) where strokes are used.";
          break;
        case 'Thick':
          settingsRefinement += "\n- STROKE WEIGHT: Thick, bold lines (3px - 5px) where strokes are used.";
          break;
        case 'Standard':
        default:
           settingsRefinement += "\n- STROKE WEIGHT: Standard line width (1px - 2px) where strokes are used.";
          break;
      }
    }

    // Line Cap Rules
    if (traceSettings.lineCap) {
        settingsRefinement += `\n- STROKE LINECAP: Ensure any stroked paths use 'stroke-linecap="${traceSettings.lineCap.toLowerCase()}"'.`;
    }
    
    rule += settingsRefinement;
  }

  return rule;
};

/**
 * Generates an SVG string based on the user's prompt and optional image.
 * Uses 'gemini-3-pro' as requested for generation.
 */
export const generateSvgFromPrompt = async (
  prompt: string, 
  imagePart?: ImagePart,
  style: string = 'Flat',
  traceSettings?: TraceSettings
): Promise<string> => {
  try {
    const styleRules = getStyleInstructions(style, traceSettings);
    
    // Base System Prompt
    const systemPrompt = `
      You are a world-class expert in Scalable Vector Graphics (SVG) design and coding. 
      Your task is to generate a high-quality, visually stunning, and detailed SVG based on the user's request.
      
      STYLE PROTOCOL: "${style}"
      ${styleRules}

      TECHNICAL GUIDELINES:
      1.  **Output Format**: Return ONLY the raw SVG code. No markdown, no code blocks, no text explanations.
      2.  **Responsiveness**: Always include a \`viewBox\` attribute (e.g., "0 0 512 512"). Do not hardcode \`width\` and \`height\` attributes on the root svg tag, or set them to '100%'.
      3.  **Optimization**: 
          - Use \`<path>\` elements primarily for complex shapes.
          - Optimize coordinates (max 2 decimal places) to keep code concise.
          - Group related elements with \`<g>\`.
      4.  **Self-Contained**: No external image references (\`<image href="...">\`). Everything must be drawn with vectors.
      5.  **Quality**: Ensure paths are closed where appropriate. Avoid intersecting self-overlapping paths that cause rendering artifacts.
    `;

    let userPrompt = '';

    if (imagePart) {
      // Multimodal Prompt
      userPrompt = `
      Reference Image provided. 
      Task: Convert this image into an SVG following the "${style}" style.
      
      Specific details from user: "${prompt || 'Convert to SVG'}"
      
      ${style === 'Vector Trace' 
        ? 'CRITICAL: Trace the image according to the TRACE CONFIGURATION in system instructions.' 
        : 'Interpret the image content but strictly apply the requested artistic style.'}
      `;
    } else {
      // Text-only Prompt
      userPrompt = `
      Create an SVG artwork of: "${prompt}".
      Style: ${style}
      `;
    }

    const contents = imagePart 
      ? { parts: [imagePart, { text: userPrompt }] }
      : userPrompt;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: getTemperatureForStyle(style),
        topP: 0.95,
        topK: 40,
      },
    });

    const rawText = response.text || '';
    
    // Robust cleanup to extract just the SVG part
    const svgMatch = rawText.match(/<svg[\s\S]*?<\/svg>/i);
    
    if (svgMatch && svgMatch[0]) {
      return svgMatch[0];
    } 
    
    // If no SVG tag found, check for code blocks or just text, but warn if it looks invalid
    const cleaned = rawText.replace(/```xml/g, '').replace(/```svg/g, '').replace(/```/g, '').trim();
    if (cleaned.includes('<svg') && cleaned.includes('</svg>')) {
        return cleaned;
    }
    
    // If we reach here, we failed to find SVG
    const noSvgError: any = new Error("Generation Format Error");
    noSvgError.details = "The model generated a response but no valid SVG code was found.";
    noSvgError.suggestion = "Try simplifying your prompt or selecting the 'Flat' style which is more consistent.";
    throw noSvgError;

  } catch (error: any) {
    // If it's already our structured error, rethrow it
    if (error.suggestion) throw error;

    console.error("Gemini API Error:", error);
    
    const customError: any = new Error("Generation Failed");
    customError.originalError = error;
    
    const errorMsg = (error.message || "").toLowerCase();

    if (errorMsg.includes("safety") || errorMsg.includes("blocked")) {
        customError.message = "Content Flagged";
        customError.details = "The request triggered the AI's safety filters.";
        customError.suggestion = "Try rephrasing your prompt to be more abstract or removing sensitive keywords.";
    } else if (errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("exhausted")) {
        customError.message = "System Overloaded";
        customError.details = "API quota exceeded or system is currently busy.";
        customError.suggestion = "Please wait a minute before trying again.";
    } else if (errorMsg.includes("400") || errorMsg.includes("invalid argument")) {
        customError.message = "Invalid Request";
        customError.details = "The model rejected the input, possibly due to image format or size.";
        customError.suggestion = "Try using a smaller image (under 4MB) or a standard format like JPG/PNG.";
    } else if (errorMsg.includes("apikey") || errorMsg.includes("403")) {
        customError.message = "Authentication Error";
        customError.details = "There is an issue with the API key.";
        customError.suggestion = "Please check your environment configuration.";
    } else {
        customError.message = "Connection Error";
        customError.details = error.message || "An unexpected error occurred.";
        customError.suggestion = "Check your internet connection or try again later.";
    }
    
    throw customError;
  }
};
