import React, { useRef } from 'react';
import { AppState, AspectRatio } from '../types';
import { 
  Monitor, Smartphone, Square, Image as ImageIcon, 
  Maximize2, Upload, Layout, Palette, Zap, Command
} from 'lucide-react';
import { translations } from '../utils/translations';

interface ControlPanelProps {
  state: AppState;
  onChange: (updates: Partial<AppState>) => void;
  onUpload: (file: File) => void;
  t: typeof translations['en'];
}

const ControlPanel: React.FC<ControlPanelProps> = ({ state, onChange, onUpload, t }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const gradients = [
    ['#ff0080', '#7928ca'], 
    ['#7928ca', '#4c1d95'], 
    ['#fbc2eb', '#a6c1ee'], 
    ['#18181b', '#27272a'], 

    ['#ff4d4d', '#f9cb28'], 
    ['#2dd4bf', '#ec4899'], 
    ['#4facfe', '#00f2fe'], 
    ['#a8edea', '#fed6e3'], 

    ['#bdc3c7', '#2c3e50'], 
    ['#000000', '#434343'], 
    ['#00c6fb', '#005bea'], 
    ['#30cfd0', '#330867'], 

    ['#667eea', '#764ba2'], 
    ['#fdfbfb', '#ebedee'], 
    ['#f6d365', '#fda085'], 
    ['#fa709a', '#fee140'], 

    ['#d4fc79', '#96e6a1'], 
    ['#84fab0', '#8fd3f4'], 
    ['#cfd9df', '#e2ebf0'], 
    ['#e0c3fc', '#8ec5fc'], 
  ];

  const solidColors = [
    '#ffffff', '#e4e4e7', '#a1a1aa', '#18181b', 
    '#ef4444', '#f97316', '#f59e0b', '#fbbf24', 
    '#84cc16', '#22c55e', '#10b981', '#14b8a6', 
    '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', 
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
  ];

  return (
    <div className="w-full h-full flex flex-col select-none">
      {/* Header */}
      <div className="p-4 lg:p-6 pb-2">
        <h1 className="font-semibold text-sm text-white/50 flex items-center gap-2 mb-4 lg:mb-6 uppercase tracking-wider">
          <Command className="w-3 h-3" />
          {t.settings}
        </h1>
        
        <button 
           onClick={() => fileInputRef.current?.click()}
           className="group w-full relative overflow-hidden rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white shadow-lg transition-all py-3.5 active:scale-[0.98]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          <div className="flex items-center justify-center gap-2 text-sm font-medium">
            <Upload className="w-4 h-4 opacity-70 group-hover:opacity-100" />
            {state.imageSrc ? t.replaceImage : t.uploadImage}
          </div>
        </button>
        <input 
           ref={fileInputRef}
           type="file" 
           accept="image/*"
           className="hidden" 
           onChange={(e) => {
             if (e.target.files?.[0]) onUpload(e.target.files[0]);
             e.target.value = ''; 
           }}
        />
      </div>

      <div className="flex-1 p-4 lg:p-6 space-y-8">
        
        {/* Dimensions */}
        <section>
          <SectionLabel icon={<Layout className="w-3.5 h-3.5" />} label={t.ratio} />
          <div className="grid grid-cols-3 gap-2">
            {(['16:9', '4:3', '1:1', '3:4', '9:16', 'auto'] as AspectRatio[]).map((ratio) => (
              <button
                key={ratio}
                onClick={() => onChange({ aspectRatio: ratio })}
                className={`relative flex flex-col items-center justify-center py-3 rounded-xl border transition-all duration-300 ${
                  state.aspectRatio === ratio
                    ? 'bg-white/20 border-white/30 text-white shadow-[0_4px_12px_rgba(0,0,0,0.1)]'
                    : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10 hover:text-white/80'
                }`}
              >
                <div className={`${state.aspectRatio === ratio ? 'text-white' : 'opacity-70'}`}>
                  {getIconForRatio(ratio)}
                </div>
                <span className="text-[10px] mt-1.5 font-medium">{ratio}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Image Appearance */}
        <section className="space-y-6">
          <SectionLabel icon={<Maximize2 className="w-3.5 h-3.5" />} label={t.adjustments} />
          
          <div className="space-y-6 px-1">
            <ControlSlider 
                label={t.padding}
                value={state.padding} 
                max={80} 
                onChange={(v) => onChange({ padding: v })} 
            />
            <ControlSlider 
                label={t.rounding} 
                value={state.borderRadius} 
                max={100} 
                onChange={(v) => onChange({ borderRadius: v })} 
            />
            <ControlSlider 
                label={t.shadow} 
                value={state.shadow} 
                max={100} 
                onChange={(v) => onChange({ shadow: v })} 
            />
          </div>
        </section>

        {/* Background */}
        <section>
          <div className="flex items-center justify-between mb-4">
             <SectionLabel icon={<Palette className="w-3.5 h-3.5" />} label={t.background} className="mb-0" />
             
             {/* Toggle Switch */}
             <div className="flex bg-black/30 p-1 rounded-lg border border-white/10">
              <button
                onClick={() => onChange({ bgType: 'gradient' })}
                className={`px-3 py-1 rounded-[6px] text-[10px] font-semibold transition-all ${
                    state.bgType === 'gradient' 
                    ? 'bg-white/20 text-white shadow-sm' 
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {t.gradient}
              </button>
              <button
                onClick={() => onChange({ bgType: 'solid' })}
                className={`px-3 py-1 rounded-[6px] text-[10px] font-semibold transition-all ${
                    state.bgType === 'solid' 
                    ? 'bg-white/20 text-white shadow-sm' 
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {t.solid}
              </button>
            </div>
          </div>

          {state.bgType === 'gradient' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-6 gap-2">
                {gradients.map(([start, end], idx) => (
                  <button
                    key={idx}
                    onClick={() => onChange({ gradientStart: start, gradientEnd: end })}
                    className={`w-full aspect-square rounded-full shadow-md relative transition-all hover:scale-110 border border-white/10 ${
                      state.gradientStart === start && state.gradientEnd === end 
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-black/50 scale-110' 
                        : 'opacity-80 hover:opacity-100'
                    }`}
                    style={{ background: `linear-gradient(135deg, ${start}, ${end})` }}
                  >
                  </button>
                ))}
              </div>
               <ControlSlider 
                label={t.angle} 
                value={state.gradientAngle} 
                max={360} 
                onChange={(v) => onChange({ gradientAngle: v })} 
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-6 gap-2 mb-4">
                {solidColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => onChange({ bgColor: color })}
                    className={`w-full aspect-square rounded-full shadow-md relative transition-all hover:scale-110 border border-white/10 ${
                      state.bgColor === color 
                         ? 'ring-2 ring-white ring-offset-2 ring-offset-black/50 scale-110' 
                         : 'opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: color }}
                  >
                     {state.bgColor === color && color === '#ffffff' && (
                       <div className="absolute inset-0 border border-black/10 rounded-full"></div>
                     )}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
                 <div className="w-6 h-6 rounded-lg border border-white/10 shadow-sm" style={{backgroundColor: state.bgColor}} />
                 <input 
                   type="text" 
                   value={state.bgColor}
                   onChange={(e) => onChange({ bgColor: e.target.value })}
                   className="bg-transparent text-xs font-mono text-white/80 w-full focus:outline-none uppercase"
                 />
                 <input 
                   type="color" 
                   value={state.bgColor}
                   onChange={(e) => onChange({ bgColor: e.target.value })}
                   className="w-6 h-6 bg-transparent rounded cursor-pointer border-none opacity-0 absolute right-8"
                 />
              </div>
            </>
          )}

          <div className="mt-8 pt-6 border-t border-white/10 space-y-6 pb-6 lg:pb-0">
             <ControlSlider 
                label={t.noiseOpacity} 
                value={state.noiseOpacity * 100} 
                max={50} 
                icon={<Zap className="w-3.5 h-3.5" />}
                onChange={(v) => onChange({ noiseOpacity: v / 100 })} 
              />
              <ControlSlider 
                label={t.grainSize} 
                value={state.noiseRoughness * 100} 
                max={100} 
                onChange={(v) => onChange({ noiseRoughness: v / 100 })} 
              />
          </div>
        </section>
      </div>
    </div>
  );
};

const SectionLabel = ({ icon, label, className = "mb-4" }: { icon: React.ReactNode, label: string, className?: string }) => (
  <div className={`flex items-center gap-2 text-[11px] font-bold text-white/40 uppercase tracking-widest ${className}`}>
    {icon}
    {label}
  </div>
);

const ControlSlider = ({ label, value, max, min = 0, onChange, icon }: any) => (
  <div className="space-y-3 group">
    <div className="flex justify-between text-xs">
      <span className="text-white/70 font-medium transition-colors flex items-center gap-1.5">
        {icon} {label}
      </span>
      <span className="text-white/50 font-mono text-[10px] bg-white/5 px-2 py-0.5 rounded-md border border-white/5">{Math.round(value)}{label.includes('Angle') || label.includes('角度') ? '°' : ''}</span>
    </div>
    
    <div className="relative h-6 w-full flex items-center cursor-pointer">
       {/* Track */}
       <div className="absolute w-full h-1.5 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
           <div 
            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" 
            style={{ width: `${(value / max) * 100}%` }} 
           />
       </div>
       
       {/* Thumb Input */}
       <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />

       {/* Visible Thumb */}
       <div 
            className="absolute h-4 w-4 bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.3)] pointer-events-none transition-transform group-hover:scale-125"
            style={{ left: `calc(${(value / max) * 100}% - 8px)` }}
        />
    </div>
  </div>
);

const getIconForRatio = (ratio: AspectRatio) => {
  switch (ratio) {
    case '16:9': return <Monitor className="w-4 h-4" />;
    case '9:16': return <Smartphone className="w-4 h-4" />;
    case '4:3': return <Monitor className="w-4 h-4 scale-90" />;
    case '3:4': return <Smartphone className="w-4 h-4 scale-90" />;
    case '1:1': return <Square className="w-4 h-4" />;
    case 'auto': return <ImageIcon className="w-4 h-4" />;
    default: return <Square className="w-4 h-4" />;
  }
};

export default ControlPanel;