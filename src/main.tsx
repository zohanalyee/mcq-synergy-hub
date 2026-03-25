import { createRoot } from 'react-dom/client'
import { useState } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.tsx'
import SplashScreen from './components/SplashScreen.tsx'
import './index.css'

const Root = () => {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <HelmetProvider>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <App />
    </HelmetProvider>
  );
};

createRoot(document.getElementById("root")!).render(<Root />);
