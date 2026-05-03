import { Route, Routes } from 'react-router-dom';
import { AppProviders } from './app/AppProviders.jsx';
import { APP_ROUTES } from './app/routes.js';
import { AdminPage } from './features/admin/AdminPage.jsx';
import { CustomerApp } from './features/customer/CustomerApp.jsx';
import { TotemPage } from './features/totem/TotemPage.jsx';

function App() {
  return (
    <AppProviders>
      <Routes>
        <Route path={APP_ROUTES.customer} element={<CustomerApp />} />
        <Route path={APP_ROUTES.admin} element={<AdminPage />} />
        <Route path={APP_ROUTES.totem} element={<TotemPage />} />
      </Routes>
    </AppProviders>
  );
}

export default App;
