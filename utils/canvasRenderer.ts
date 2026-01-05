
import { AppState, ASPECT_RATIOS } from '../types';

export const renderToCanvas = async (state: AppState): Promise<string> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx || !state.imageSrc) {
    throw new Error('Canvas context or image missing');
  }

  // Load Image
  const img = new Image();
  img.src = state.imageSrc;
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  // Calculate Dimensions
  const MAX_DIMENSION = 2400;
  let width = MAX_DIMENSION;
  let height = MAX_DIMENSION;

  let effectiveRatio = 4/3; // default

  if (state.aspectRatio === 'auto') {
    effectiveRatio = img.width / img.height;
  } else {
    effectiveRatio = ASPECT_RATIOS[state.aspectRatio];
  }

  if (effectiveRatio >= 1) {
      // Landscape or Square
      width = MAX_DIMENSION;
      height = MAX_DIMENSION / effectiveRatio;
  } else {
      // Portrait
      height = MAX_DIMENSION;
      width = MAX_DIMENSION * effectiveRatio;
  }

  canvas.width = width;
  canvas.height = height;

  // 1. Draw Background
  if (state.bgType === 'solid') {
    ctx.fillStyle = state.bgColor;
    ctx.fillRect(0, 0, width, height);
  } else {
    // Create Gradient
    const angleRad = (state.gradientAngle - 90) * (Math.PI / 180);
    const length = Math.abs(width * Math.cos(angleRad)) + Math.abs(height * Math.sin(angleRad));
    
    const cx = width / 2;
    const cy = height / 2;
    const x1 = cx - (Math.cos(angleRad) * length) / 2;
    const y1 = cy - (Math.sin(angleRad) * length) / 2;
    const x2 = cx + (Math.cos(angleRad) * length) / 2;
    const y2 = cy + (Math.sin(angleRad) * length) / 2;

    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    grad.addColorStop(0, state.gradientStart);
    grad.addColorStop(1, state.gradientEnd);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  // 2. Draw High Quality Noise
  if (state.noiseOpacity > 0) {
    const pSize = 512;
    const noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = pSize;
    noiseCanvas.height = pSize;
    const nCtx = noiseCanvas.getContext('2d')!;
    const idata = nCtx.createImageData(pSize, pSize);
    const buffer32 = new Uint32Array(idata.data.buffer);
    
    for (let i = 0; i < buffer32.length; i++) {
        const val = Math.floor(Math.random() * 255);
        buffer32[i] = (255 << 24) | (val << 16) | (val << 8) | val;
    }
    nCtx.putImageData(idata, 0, 0);
    
    ctx.save();
    ctx.globalCompositeOperation = 'overlay'; 
    ctx.globalAlpha = state.noiseOpacity; 
    
    const noiseScale = 0.8 + (state.noiseRoughness * 1.2);
    
    ctx.scale(noiseScale, noiseScale);
    
    const pattern = ctx.createPattern(noiseCanvas, 'repeat');
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, width / noiseScale, height / noiseScale);
    }
    ctx.restore();
  }

  // 3. Draw Screenshot (Center & Scale)
  const minDim = Math.min(width, height);
  const paddingPx = (state.padding / 100) * (minDim * 0.4); // Padding up to 40% of min dimension
  const availableWidth = width - (paddingPx * 2);
  const availableHeight = height - (paddingPx * 2);

  const imgRatio = img.width / img.height;
  const containerRatio = availableWidth / availableHeight;

  let drawWidth, drawHeight;

  if (imgRatio > containerRatio) {
    drawWidth = availableWidth;
    drawHeight = availableWidth / imgRatio;
  } else {
    drawHeight = availableHeight;
    drawWidth = availableHeight * imgRatio;
  }

  const x = (width - drawWidth) / 2;
  const y = (height - drawHeight) / 2;

  // Optimized scaling for radius and shadow
  // Radius: 0-100 maps to 0% to 10% of the smallest dimension
  const r = (state.borderRadius / 100) * (minDim * 0.08); 
  
  // Shadow: Scale based on min dimension. 
  const shadowBlur = (state.shadow / 100) * (minDim * 0.15); // Max blur 15% of screen
  const shadowY = (state.shadow / 100) * (minDim * 0.06);   // Max offset 6% of screen

  // --- STYLE RENDERING ---

  // Stack Effect (Draw layers behind)
  if (state.frameStyle === 'stack') {
     const stackOffset = minDim * 0.02; // 2% offset
     ctx.save();
     
     // Layer 2
     ctx.globalAlpha = 0.4;
     ctx.fillStyle = 'rgba(255,255,255,0.4)';
     drawRoundedRect(ctx, x + (stackOffset * 2), y + (stackOffset * 2), drawWidth - (stackOffset * 4), drawHeight, r);
     ctx.fill();
     
     // Layer 1
     ctx.globalAlpha = 0.7;
     ctx.fillStyle = 'rgba(255,255,255,0.7)';
     drawRoundedRect(ctx, x + stackOffset, y + stackOffset, drawWidth - (stackOffset * 2), drawHeight, r);
     ctx.fill();
     
     ctx.restore();
  }

  // Shadow
  if (state.shadow > 0) {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = shadowBlur;
    ctx.shadowOffsetY = shadowY;
    
    // Draw a rect for shadow casting
    drawRoundedRect(ctx, x, y, drawWidth, drawHeight, r); 
    ctx.fillStyle = 'black'; 
    ctx.fill();
    ctx.restore();
  }

  // Main Image Clipping
  ctx.save();
  drawRoundedRect(ctx, x, y, drawWidth, drawHeight, r);
  ctx.clip();
  ctx.drawImage(img, x, y, drawWidth, drawHeight);
  ctx.restore();

  // Glass Overlay
  if (state.frameStyle === 'glass') {
      ctx.save();
      drawRoundedRect(ctx, x, y, drawWidth, drawHeight, r);
      ctx.lineWidth = minDim * 0.002; // Scale border width
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.stroke();
      
      // Inner highlight
      ctx.clip();
      const grad = ctx.createLinearGradient(x, y, x, y + drawHeight);
      grad.addColorStop(0, 'rgba(255,255,255,0.4)');
      grad.addColorStop(0.5, 'rgba(255,255,255,0)');
      grad.addColorStop(1, 'rgba(255,255,255,0.1)');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, drawWidth, drawHeight);
      ctx.restore();
  }

  return canvas.toDataURL('image/png');
};

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
