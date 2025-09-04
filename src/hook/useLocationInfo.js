import { useState, useEffect } from 'react';

const useLocationInfo = () => {
  const [locations, setLocations] = useState('');
  const [country, setCountry] = useState('');

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`);
          const data = await response.json();
          setLocations(data.city || 'Unknown');
          setCountry(data.countryName || 'Unknown');
        } catch (error) {
          console.error('Error fetching location:', error);
          setLocations('Unknown');
          setCountry('Unknown');
        }
      }, (error) => {
        console.error('Error getting location:', error);
        setLocations('Unknown');
        setCountry('Unknown');
      });
    } else {
      setLocations('Geolocation not supported');
      setCountry('Geolocation not supported');
    }
  }, []);

  return { locations, country };
};

export default useLocationInfo; 