import { useState } from 'react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ColorPicker = () => {
  const [color, setColor] = useState('#3b82f6');
  
  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  };

  const rgb = hexToRgb(color);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  return (
    <Header>
      <ToolWrapper toolId="color-picker" title="Color Picker" description="Pick and convert colors between formats" category="Generators">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-16 h-16 rounded-lg cursor-pointer border-0" />
            <div style={{ backgroundColor: color }} className="flex-1 h-16 rounded-xl border border-border/50" />
          </div>
          <div><Label>HEX</Label><div className="flex gap-2"><Input value={color} onChange={e => setColor(e.target.value)} /><CopyButton text={color} /></div></div>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-accent/30 text-center"><p className="text-xs text-muted-foreground">RGB</p><p className="text-sm font-mono font-bold text-foreground">{rgb.r}, {rgb.g}, {rgb.b}</p></div>
            <div className="p-3 rounded-xl bg-accent/30 text-center"><p className="text-xs text-muted-foreground">HSL</p><p className="text-sm font-mono font-bold text-foreground">{hsl.h}°, {hsl.s}%, {hsl.l}%</p></div>
            <div className="p-3 rounded-xl bg-accent/30 text-center"><p className="text-xs text-muted-foreground">CSS</p><p className="text-sm font-mono font-bold text-foreground">rgb({rgb.r},{rgb.g},{rgb.b})</p></div>
          </div>
        </div>
      </ToolWrapper>
    </Header>
  );
};
export default ColorPicker;
