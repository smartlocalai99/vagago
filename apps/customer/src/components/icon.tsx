import Svg, { Circle, Path, Polyline } from 'react-native-svg';
import { colors } from '@/theme';

export type IconName = 'arrow' | 'back' | 'heart' | 'leaf' | 'sun' | 'moon' | 'mountain' | 'compass' | 'calendar' | 'users' | 'search' | 'close' | 'check' | 'pin' | 'plus' | 'minus' | 'sliders' | 'home' | 'coffee' | 'chevron' | 'user' | 'suitcase' | 'sort' | 'bed' | 'info' | 'lock' | 'tag' | 'flame' | 'play' | 'pause' | 'shield' | 'credit-card' | 'mail' | 'phone' | 'ticket' | 'navigation' | 'car';
export function Icon({ name, size = 22, color = colors.pine, filled = false }: { name: IconName; size?: number; color?: string; filled?: boolean }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {name === 'arrow' && <><Path d="M4 12h15M13 5l7 7-7 7" /></>}
    {name === 'back' && <Path d="M20 12H4m7-7-7 7 7 7" />}
    {name === 'heart' && <Path d="M20.7 4.6a5.3 5.3 0 0 0-7.5 0L12 5.8l-1.2-1.2a5.3 5.3 0 0 0-7.5 7.5L12 21l8.7-8.9a5.3 5.3 0 0 0 0-7.5Z" fill={filled ? color : 'none'} />}
    {name === 'leaf' && <><Path d="M20 3C11 2 3 7 5 14c2 7 12 7 15-11Z" /><Path d="M3 22 16 8M8 16v-5m5 0h4" /></>}
    {name === 'sun' && <><Circle cx="12" cy="12" r="4" /><Path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>}
    {name === 'moon' && <Path d="M21 13a9 9 0 1 1-10-10 7 7 0 0 0 10 10Z" />}
    {name === 'mountain' && <><Path d="m2 20 7-15 5 10 3-7 5 12H2Z" /><Path d="m6 11 3 2 2-3" /></>}
    {name === 'compass' && <><Circle cx="12" cy="12" r="9" /><Path d="m16 8-3 5-5 3 3-5 5-3Z" fill={filled ? color : 'none'} /></>}
    {name === 'calendar' && <><Path d="M4 5h16v16H4zM8 2v6m8-6v6M4 11h16" /><Path d="M8 15h2m4 0h2m-8 3h2" /></>}
    {name === 'users' && <><Circle cx="9" cy="7" r="3" /><Path d="M2 21v-3a7 7 0 0 1 14 0v3M17 4a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5v2" /></>}
    {name === 'search' && <><Circle cx="10.5" cy="10.5" r="6.5" /><Path d="m16 16 5 5" /></>}
    {name === 'close' && <Path d="m6 6 12 12M6 18 18 6" />}
    {name === 'check' && <Path d="m5 12 4 4L19 6" />}
    {name === 'pin' && <><Path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><Circle cx="12" cy="10" r="2.5" /></>}
    {name === 'plus' && <Path d="M5 12h14M12 5v14" />}
    {name === 'minus' && <Path d="M5 12h14" />}
    {name === 'sliders' && <><Path d="M4 7h16M4 17h16" /><Circle cx="9" cy="7" r="3" fill={colors.mist} /><Circle cx="16" cy="17" r="3" fill={colors.mist} /></>}
    {name === 'home' && <><Path d="m3 10 9-8 9 8M5 9v13h14V9M9 22v-8h6v8" /></>}
    {name === 'coffee' && <><Path d="M3 8h13v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8ZM16 9h2a3 3 0 0 1 0 6h-2M6 2v2m4-2v2m4-2v2" /></>}
    {name === 'chevron' && <Polyline points="9 5 16 12 9 19" />}
    {name === 'user' && <><Circle cx="12" cy="8" r="4" /><Path d="M4 22v-2a8 8 0 0 1 16 0v2" /></>}
    {name === 'suitcase' && <><Path d="M3 7h18v14H3zM8 7V3h8v4M8 7v14m8-14v14" /></>}
    {name === 'sort' && <Path d="M8 3v18m-4-4 4 4 4-4M17 21V3m-4 4 4-4 4 4" />}
    {name === 'bed' && <><Path d="M3 18v4m18-4v4M3 10V5h18v5M2 12h20v6H2zM6 8h4m4 0h4" /></>}
    {name === 'info' && <><Circle cx="12" cy="12" r="9" /><Path d="M12 11v6m0-10v.2" /></>}
    {name === 'lock' && <><Path d="M5 10h14v11H5zM8 10V6a4 4 0 0 1 8 0v4M12 14v3" /></>}
    {name === 'tag' && <><Path d="M3 3h8l10 10-8 8L3 11V3Z" /><Circle cx="7.5" cy="7.5" r="1" /></>}
    {name === 'flame' && <Path d="M12 2c2 6 7 7 7 13a7 7 0 1 1-14 0c0-3 2-5 4-7 0 3 1 4 2 4 2-2 2-6 1-10Z" />}
    {name === 'play' && <Path d="m8 4 12 8-12 8V4Z" fill={filled ? color : 'none'} />}
    {name === 'pause' && <Path d="M8 5v14M16 5v14" />}
    {name === 'shield' && <Path d="m12 2 8 3v7c0 5-8 10-8 10S4 17 4 12V5l8-3Zm-4 9 3 3 5-5" />}
    {name === 'credit-card' && <><Path d="M3 4h18v16H3zM3 9h18M6 15h4" /></>}
    {name === 'mail' && <Path d="M3 5h18v14H3zM3 5l9 8 9-8" />}
    {name === 'phone' && <Path d="m6 3 4 4-3 3c1 3 4 6 7 7l3-3 4 4-2 3C10 22 2 14 3 5l3-2Z" />}
    {name === 'navigation' && <Path d="m3 11 18-8-8 18-2-8-8-2Z" fill={filled ? color : 'none'} />}
    {name === 'car' && <><Path d="M5 17h14v-5l-2-5H7l-2 5v5ZM3 12h18M5 17v3m14-3v3" /><Circle cx="8" cy="14.5" r="0.8" /><Circle cx="16" cy="14.5" r="0.8" /></>}
    {name === 'ticket' && <><Path d="M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4V6Z" /><Path d="M15 7v2m0 2v2m0 2v2" /></>}
  </Svg>;
}
