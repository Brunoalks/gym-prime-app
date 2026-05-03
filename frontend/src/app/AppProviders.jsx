import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

export function AppProviders({ children }) {
  return (
    <BrowserRouter>
      <Toaster position="top-center" toastOptions={{ className: 'font-bold' }} />
      {children}
    </BrowserRouter>
  );
}
