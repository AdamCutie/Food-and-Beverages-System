import React from 'react';
import { Toaster } from 'react-hot-toast';
import { Routes, Route } from 'react-router-dom';

// Import Pages
import MenuPage from './pages/Customer/MenuPage';
import AdminPage from './pages/Admin/AdminPage'; 
import KitchenPage from './pages/Kitchen/KitchenPage';
import ArchivePage from './pages/Kitchen/ArchivePage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import NotAuthorizedPage from './pages/Auth/NotAuthorizedPage'; // <-- 1. IMPORT

// Import Route Handlers
import ProtectedRoute from './components/routing/ProtectedRoute'; // <-- 2. IMPORT
import AuthRoute from './components/routing/AuthRoute';       // <-- 3. IMPORT

function App() {
  return (
    <> 
      <Toaster position="top-center" /> 
      <Routes>
        {/* === AUTH ROUTES === */}
        {/* These routes are for logged-out users. Logged-in users are redirected. */}
        <Route 
          path="/login" 
          element={
            <AuthRoute>
              <LoginPage />
            </AuthRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <AuthRoute>
              <RegisterPage />
            </AuthRoute>
          } 
        />
        <Route path="/not-authorized" element={<NotAuthorizedPage />} />

        {/* === PROTECTED ROUTES === */}

        {/* Customer Route (Default) */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <MenuPage />
            </ProtectedRoute>
          } 
        />

        {/* Admin Route */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminPage />
            </ProtectedRoute>
          } 
        />

        {/* Staff Routes */}
        <Route 
          path="/kitchen" 
          element={
            // Admin can also access kitchen
            <ProtectedRoute allowedRoles={['admin', 'waiter', 'cashier']}>
              <KitchenPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/kitchen/archive" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'waiter', 'cashier']}>
              <ArchivePage />
            </ProtectedRoute>
          } 
        />

        {/* You can add a 404 Not Found page here */}
        {/* <Route path="*" element={<NotFoundPage />} /> */}
      </Routes>
    </>
  );
}

export default App;