import React from 'react';
import { Toaster } from 'react-hot-toast';
import { Routes, Route } from 'react-router-dom';
import MenuPage from './pages/Customer/MenuPage';
import AdminPage from './pages/Admin/AdminPage'; 
import KitchenPage from './pages/Kitchen/KitchenPage';


function App() {
  return (
    <> 
      <Toaster position="top-center" /> 
      <Routes>
        <Route path="/" element={<MenuPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/kitchen" element={<KitchenPage />} />
      </Routes>
    </>
  );
}

export default App;