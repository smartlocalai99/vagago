const paths = {
  home: 'M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5',
  calendar: 'M4 5h16v16H4zM8 2v5m8-5v5M4 10h16',
  building: 'M4 21V5l8-3 8 3v16M4 21h16M9 21v-4h6v4M8 8h2m4 0h2M8 12h2m4 0h2',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 9a8 8 0 0 1 16 0',
  back: 'M15 5l-7 7 7 7',
  chevron: 'M9 5l7 7-7 7',
  plus: 'M12 5v14M5 12h14',
  search: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Zm5-1.5L21 21',
  phone: 'M6 3l4 4-3 3c1 3 4 6 7 7l3-3 4 4-2 3C10 22 2 14 3 5l3-2Z',
  check: 'M5 12l4 4L19 6',
  pin: 'M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Zm0-9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  camera: 'M3 8h4l2-3h6l2 3h4v12H3zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14',
  star: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9L12 3Z',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10',
  bed: 'M3 18v3m18-3v3M3 11V6h18v5M2 13h20v5H2z',
  locate: 'M12 2v3m0 14v3M2 12h3m14 0h3M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm0-4a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  message: 'M4 4h16v12H8l-4 4V4Z',
  users: 'M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-7 11v-2a7 7 0 0 1 14 0v2M17 4a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5v2',
  cash: 'M2 6h20v12H2zM12 14.6a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2ZM6 9v.01M18 15v.01',
  share: 'M12 3v13M7 8l5-5 5 5M5 13v8h14v-8',
  lock: 'M5 10h14v11H5zM8 10V6a4 4 0 0 1 8 0v4M12 14v3',
  navigation: 'm3 11 18-8-8 18-2-8-8-2Z',
  close: 'M6 6l12 12M6 18 18 6',
  heart: 'M20.7 4.6a5.3 5.3 0 0 0-7.5 0L12 5.8l-1.2-1.2a5.3 5.3 0 0 0-7.5 7.5L12 21l8.7-8.9a5.3 5.3 0 0 0 0-7.5Z',
  image: 'M3 4h18v16H3zM8.5 10.8a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6ZM21 16l-5-5-9 9',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v4l3 2',
  shield: 'm12 2 8 3v7c0 5-8 10-8 10S4 17 4 12V5l8-3Zm-4 9 3 3 5-5',
  car: 'M5 17h14v-5l-2-5H7l-2 5v5ZM3 12h18M5 17v3m14-3v3',
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, size = 22, className = '' }: { name: IconName; size?: number; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}><path d={paths[name]} /></svg>;
}
