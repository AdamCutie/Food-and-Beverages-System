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
import NotAuthorizedPage from './pages/Auth/NotAuthorizedPage';

import PaymentSuccess from './pages/Customer/PaymentSuccess.jsx';
import PaymentCancel from './pages/Customer/PaymentCancel.jsx';

import InventoryPage from './pages/Kitchen/InventoryPage.jsx';

// --- NEW: Import the POS Page ---
import PosPage from './pages/Kitchen/PosPage.jsx';

// Import Route Handlers
import ProtectedRoute from './components/routing/ProtectedRoute';
import AuthRoute from './components/routing/AuthRoute';

function App() {
  return (
    <>
      <Toaster position="top-center" />
      <Routes>
        {/* === AUTH ROUTES === */}
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
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <MenuPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kitchen"
          element={
            <ProtectedRoute allowedRoles={['admin', 'waiter', 'cashier']}>
              <KitchenPage />
            </ProtectedRoute>
          }
        />
        
        {/* --- NEW: Add the POS Page Route --- */}
        <Route
          path="/kitchen/pos"
          element={
            <ProtectedRoute allowedRoles={['admin', 'waiter', 'cashier']}>
              <PosPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/kitchen/inventory"
          element={
            <ProtectedRoute allowedRoles={['admin', 'waiter', 'cashier']}>
              <InventoryPage />
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

        {/* Public PayMongo Redirect Pages (no protection) */}
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-cancel" element={<PaymentCancel />} />

        {/* Optional 404 */}
        {/* <Route path="*" element={<NotFoundPage />} /> */}
      </Routes>
    </>
  );
}

export default App;