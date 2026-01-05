import React, { useState, useRef } from 'react';
import ControlPanel from './components/ControlPanel';
import PreviewArea from './components/PreviewArea';
import { AppState, DEFAULT_STATE } from './types';
import { renderToCanvas } from './utils/canvasRenderer';
import { trimTransparentPixels } from './utils/imageUtils';
import { translations, Lang } from './utils/translations';
import { Download, Sparkles, Loader2, RefreshCw, Command, Globe } from 'lucide-react';

function App() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [isExporting, setIsExporting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lang, setLang] = useState<Lang>('en');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = translations[lang];

  const handleStateChange = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const handleUpload = (file: File) => {
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      if (e.target?.result) {
        let imgSrc = e.target!.result as string;
        
        // Auto-trim transparent borders (fixes Mac screenshots with empty padding)
        try {
          // Give UI a chance to update processing state
          await new Promise(r => setTimeout(r, 50)); 
          imgSrc = await trimTransparentPixels(imgSrc);
        } catch (error) {
          console.error("Failed to trim image transparency", error);
        }

        setState(prev => ({
          ...prev,
          imageSrc: imgSrc,
          imageName: file.name.split('.')[0]
        }));
        setIsProcessing(false);
      }
    };
    reader.onerror = () => setIsProcessing(false);
    reader.readAsDataURL(file);
  };

  const handleDownload = async () => {
    if (!state.imageSrc) return;
    setIsExporting(true);
    try {
      await new Promise(r => setTimeout(r, 100));
      const dataUrl = await renderToCanvas(state);
      const link = document.createElement('a');
      link.download = `${state.imageName}-nicepic.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed", err);
      alert("Failed to export image. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'zh' : 'en');
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden relative selection:bg-pink-500/30">
      
      {/* Glass Header */}
      <header className="shrink-0 h-16 flex items-center justify-between px-4 lg:px-6 z-50 mt-4 mx-4 lg:mx-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-3">
           {/* Logo Icon */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-white/90">
            Nice<span className="text-white/40 font-light">Pic</span>
          </span>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          <a 
            href="https://x.com/Lessnoise365" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hidden md:block text-xs font-medium text-white/40 hover:text-white transition-colors mr-2"
          >
            {t.socialLink}
          </a>

          <button
             onClick={toggleLang}
             className="w-8 h-8 lg:w-10 lg:h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all border border-transparent hover:border-white/10 text-[10px] lg:text-xs font-bold tracking-wide"
             title={lang === 'en' ? "Switch to Chinese" : "Switch to English"}
          >
             {lang === 'en' ? 'CN' : 'EN'}
          </button>

          <button 
             onClick={handleDownload}
             disabled={!state.imageSrc || isExporting || isProcessing}
             className={`flex items-center gap-2 px-3 lg:px-5 py-2 rounded-full font-medium text-xs lg:text-sm transition-all duration-300 border ${
               !state.imageSrc || isProcessing
                ? 'bg-white/5 text-white/40 border-white/5 cursor-not-allowed'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] active:scale-95'
             }`}
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span className="hidden sm:inline">{isExporting ? t.saving : t.export}</span>
          </button>
        </div>
      </header>

      {/* Main Layout - Glass Panels */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative p-4 lg:p-6 gap-4 lg:gap-6">
        
        {/* Sidebar Panel - Scrollable on mobile, fixed width on desktop */}
        <div className="lg:w-80 shrink-0 lg:h-full max-h-[30vh] lg:max-h-none overflow-y-auto custom-scrollbar rounded-3xl shadow-2xl bg-black/20 backdrop-blur-2xl border border-white/10 ring-1 ring-white/5 order-2 lg:order-1">
           <ControlPanel state={state} onChange={handleStateChange} onUpload={handleUpload} t={t} />
        </div>
        
        {/* Preview Panel */}
        <main className="flex-1 relative flex flex-col rounded-3xl overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl order-1 lg:order-2 min-h-0">
          <PreviewArea 
            state={state} 
            onUpload={handleUpload} 
            t={t}
            isProcessing={isProcessing}
          />
          
          {/* Floating Action Bar */}
          <div className="absolute bottom-6 lg:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/40 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-full px-2 py-2 z-40 transition-all hover:bg-black/60 hover:scale-105">
             
             {/* Change Image Button */}
             <button 
               onClick={() => fileInputRef.current?.click()}
               className="flex items-center gap-2 text-white/70 hover:text-white px-4 lg:px-5 py-2 rounded-full transition-all group whitespace-nowrap"
             >
               {isProcessing ? (
                 <Loader2 className="w-4 h-4 animate-spin" />
               ) : (
                 <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
               )}
               <span className="text-xs lg:text-sm font-medium">{isProcessing ? "Processing..." : t.changeImage}</span>
             </button>
          </div>
        </main>
      </div>

      <input 
           ref={fileInputRef}
           type="file" 
           accept="image/*"
           className="hidden" 
           onChange={(e) => {
             if (e.target.files?.[0]) handleUpload(e.target.files[0]);
             e.target.value = ''; 
           }}
      />
    </div>
  );
}

export default App;