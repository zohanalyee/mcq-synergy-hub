import { createRoot } from 'react-dom/client'
import { useState } from 'react'
import App from './App.tsx'
import SplashScreen from './components/SplashScreen.tsx'
import './index.css'

const Root = () => {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <App />
    </>
  );
};

createRoot(document.getElementById("root")!).render(<Root />);
