import React from 'react';
import { Toaster } from 'react-hot-toast';
import { Routes, Route } from 'react-router-dom';
import MenuPage from './pages/Customer/MenuPage';
import AdminPage from './pages/Admin/AdminPage'; 
import KitchenPage from './pages/Kitchen/KitchenPage';
import ArchivePage from './pages/Kitchen/ArchivePage';


function App() {
  return (
    <> 
      <Toaster position="top-center" /> 
      <Routes>
        <Route path="/" element={<MenuPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/kitchen" element={<KitchenPage />} />
        <Route path="/kitchen/archive" element={<ArchivePage />} />
      </Routes>
    </>
  );
}

export default App;