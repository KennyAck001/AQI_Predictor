import { createContext, useContext, useState } from 'react';

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
  const [aqi, setAqi] = useState(null);
  return (
    <AlertContext.Provider value={{ aqi, setAqi }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  return useContext(AlertContext);
}
