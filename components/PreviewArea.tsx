import React, { useRef, useEffect, useState } from 'react';
import { AppState, ASPECT_RATIOS } from '../types';
import { Upload, Plus, Loader2 } from 'lucide-react';
import { translations } from '../utils/translations';

interface PreviewAreaProps {
  state: AppState;
  onUpload: (file: File) => void;
  t: typeof translations['en'];
  isProcessing?: boolean;
}

const PreviewArea: React.FC<PreviewAreaProps> = ({ state, onUpload, t, isProcessing = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);
  const [dimensions, setDimensions] = useState({ width: 2400, height: 1800 });
  const [imgLoadTrigger, setImgLoadTrigger] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Background Styles
  const backgroundStyle: React.CSSProperties = state.bgType === 'solid' 
    ? { backgroundColor: state.bgColor }
    : { backgroundImage: `linear-gradient(${state.gradientAngle}deg, ${state.gradientStart}, ${state.gradientEnd})` };

  const ratioVal = state.aspectRatio === 'auto' && state.imageSrc ? undefined : ASPECT_RATIOS[state.aspectRatio];

  // Dynamic Noise SVG
  const baseFreq = 2.0 - (state.noiseRoughness * 1.5);
  const noiseSvg = `
    <svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'>
      <filter id='noiseFilter'>
        <feTurbulence type='fractalNoise' baseFrequency='${baseFreq}' numOctaves='3' stitchTiles='stitch'/>
        <feColorMatrix type="saturate" values="0"/>
      </filter>
      <rect width='100%' height='100%' filter='url(#noiseFilter)' opacity='${state.noiseOpacity}'/>
    </svg>
  `;
  const noiseBg = `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(noiseSvg)}")`;

  // Scale logic
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateScale = () => {
      const container = containerRef.current!;
      const parent = container.parentElement!;
      // Reduced margin to close the gap between sidebar and content
      const margin = 32; 
      
      const availableW = parent.clientWidth - margin;
      const availableH = parent.clientHeight - margin;
      
      // Calculate Normalized Dimensions
      // We fix the largest dimension to 2400px to avoid extreme scaling issues on portrait vs landscape
      const MAX_DIMENSION = 2400;
      let baseW = MAX_DIMENSION;
      let baseH = MAX_DIMENSION;
      
      let effectiveRatio = ratioVal;

      // Handle Auto Ratio
      if (state.aspectRatio === 'auto') {
         const img = container.querySelector('img');
         if (img && img.naturalWidth && img.naturalHeight) {
             effectiveRatio = img.naturalWidth / img.naturalHeight;
         } else {
             effectiveRatio = 4/3; // Default fallback
         }
      }

      if (effectiveRatio) {
        if (effectiveRatio >= 1) {
            // Landscape or Square
            baseW = MAX_DIMENSION;
            baseH = MAX_DIMENSION / effectiveRatio;
        } else {
            // Portrait
            baseH = MAX_DIMENSION;
            baseW = MAX_DIMENSION * effectiveRatio;
        }
      }

      const scaleW = availableW / baseW;
      const scaleH = availableH / baseH;
      
      // Allow scale to go higher (up to 0.95) to fill screens better, but ensure padding
      const newFitScale = Math.min(scaleW, scaleH, 0.95); 
      
      setFitScale(newFitScale);
      setDimensions({ width: baseW, height: baseH });
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current?.parentElement) {
      observer.observe(containerRef.current.parentElement);
    }
    
    return () => observer.disconnect();
  }, [state.aspectRatio, ratioVal, state.imageSrc, imgLoadTrigger]); 

  // Frame Style CSS Logic
  const getFrameStyleCSS = (): React.CSSProperties => {
      // CSS display logic should align visually with canvas logic roughly
      const minDim = Math.min(dimensions.width, dimensions.height);
      const baseShadow = `0px ${state.shadow * 0.1}px ${state.shadow * 0.25}px rgba(0,0,0,0.4)`;
      // Visual Radius for CSS preview (approximate to Canvas calculation)
      // Canvas uses 8% of minDim. 
      const radius = `${(state.borderRadius / 100) * (minDim * 0.08)}px`;
      
      switch (state.frameStyle) {
          case 'glass':
              return {
                  borderRadius: radius,
                  boxShadow: baseShadow,
                  border: '1px solid rgba(255,255,255,0.4)',
                  position: 'relative'
              };
           case 'stack':
              return {
                  borderRadius: radius,
                  boxShadow: `
                      ${baseShadow},
                      ${minDim * 0.015}px ${minDim * 0.015}px 0px -4px rgba(255,255,255,0.4),
                      ${minDim * 0.03}px ${minDim * 0.03}px 0px -8px rgba(255,255,255,0.2)
                  `
              };
          default:
              return {
                  borderRadius: radius,
                  boxShadow: baseShadow
              };
      }
  };

  const frameStyleCSS = getFrameStyleCSS();

  return (
    <div 
      className="flex-1 relative overflow-hidden w-full h-full group"
      onDrop={(e) => { e.preventDefault(); if(e.dataTransfer.files?.[0]) onUpload(e.dataTransfer.files[0]); }}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* Grid Pattern with subtle movement */}
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none" 
           style={{ 
             backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
             backgroundSize: '24px 24px',
           }}>
      </div>

      <div 
        ref={containerRef}
        style={{
          width: dimensions.width,
          height: dimensions.height,
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) scale(${fitScale})`,
          transition: 'width 0.4s cubic-bezier(0.2, 0, 0.2, 1), height 0.4s cubic-bezier(0.2, 0, 0.2, 1), transform 0.4s cubic-bezier(0.2, 0, 0.2, 1)',
          ...backgroundStyle
        }}
        className="shadow-2xl overflow-hidden will-change-transform ring-1 ring-white/10 flex items-center justify-center transition-colors duration-500"
      >
        <div 
            className="absolute inset-0 pointer-events-none z-10 mix-blend-overlay"
            style={{ backgroundImage: noiseBg }}
        />

        {/* Content Area */}
        <div 
          className="relative z-20 w-full h-full flex items-center justify-center transition-all duration-300"
          style={{ padding: `${state.padding/2}%` }}
        >
          {state.imageSrc ? (
            <div className={`relative flex justify-center items-center transition-opacity duration-300 ${isProcessing ? 'opacity-50 blur-sm' : 'opacity-100'}`}>
                <img 
                src={state.imageSrc} 
                alt="Preview"
                className="max-w-full max-h-full transition-all duration-300"
                style={frameStyleCSS}
                onLoad={() => setImgLoadTrigger(prev => prev + 1)}
                />
                
                {/* Glass Inner Shine */}
                {state.frameStyle === 'glass' && (
                    <div 
                      className="absolute inset-0 pointer-events-none rounded-[inherit]" 
                      style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.1) 100%)', borderRadius: frameStyleCSS.borderRadius }}
                    />
                )}
            </div>
          ) : (
             <div 
                onClick={() => fileInputRef.current?.click()}
                className="group/upload relative border border-dashed border-white/20 bg-white/5 rounded-[40px] w-4/5 max-w-2xl aspect-[4/3] flex flex-col items-center justify-center text-white/50 cursor-pointer hover:bg-white/10 hover:border-white/40 hover:text-white transition-all backdrop-blur-md shadow-lg p-6 lg:p-12"
            >
              <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-gradient-to-tr from-white/10 to-transparent shadow-inner border border-white/10 flex items-center justify-center mb-4 lg:mb-6 transition-all group-hover/upload:scale-110 group-hover/upload:rotate-3">
                 <Plus className="w-6 h-6 lg:w-8 lg:h-8 opacity-70" />
              </div>
              <p className="font-semibold text-xl lg:text-2xl mb-2 tracking-tight text-center">{t.uploadPromptTitle}</p>
              <p className="text-xs lg:text-sm font-medium opacity-50 text-center">{t.uploadPromptDesc}</p>
            </div>
          )}
          
          {/* Processing Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-50">
               <Loader2 className="w-10 h-10 text-white animate-spin drop-shadow-md" />
               <p className="mt-2 text-white font-medium drop-shadow-md text-sm">Processing...</p>
            </div>
          )}
        </div>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
      />
    </div>
  );
};

export default PreviewArea;