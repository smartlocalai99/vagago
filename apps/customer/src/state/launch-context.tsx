import { createContext, use } from 'react';

// False while the launch animation still covers the app, so first-screen entrances wait for it.
export const LaunchContext = createContext(true);
export const useLaunched = () => use(LaunchContext);
