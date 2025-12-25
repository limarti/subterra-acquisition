export type AppMode = 'production' | 'debug' | 'web-preview';

export function getAppMode(): AppMode 
{
  // Check URL parameters first
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('web-preview') === 'true') 
  {
    return 'web-preview';
  }
  
  // Check Vite environment mode
  if (import.meta.env.MODE === 'development') 
  {
    return 'debug';
  }
  
  // Default to production
  return 'production';
}