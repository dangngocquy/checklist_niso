import { useState, useEffect } from 'react';

function Darkmode() {
    const [isDarkMode, setIsDarkMode] = useState(false);
    useEffect(() => {
        const currentMode = localStorage.getItem('darkMode');
        if (currentMode) {
          document.documentElement.classList.toggle('dark', JSON.parse(currentMode));
          setIsDarkMode(JSON.parse(currentMode));
        }
      }, []);
    
      const toggleDarkMode = () => {
        const newMode = !isDarkMode;
        document.documentElement.classList.toggle('dark', newMode);
        setIsDarkMode(newMode);
        localStorage.setItem('darkMode', JSON.stringify(newMode));
      };
    return{
        toggleDarkMode,
        isDarkMode
    }
}

export default Darkmode