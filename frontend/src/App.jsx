import React from 'react';
import { Toaster } from 'react-hot-toast';
import { Routes, Route } from 'react-router-dom';

// Import Pages
import MenuPage from './pages/Customer/MenuPage';
import AdminPage from './pages/Admin/AdminPage';
import KitchenPage from './pages/Kitchen/KitchenPage';
import ArchivePage from './pages/Kitchen/ArchivePage';
import TableManager from './pages/Kitchen/TableManager';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import NotAuthorizedPage from './pages/Auth/NotAuthorizedPage';

import PaymentSuccess from './pages/Customer/PaymentSuccess.jsx';
import PaymentCancel from './pages/Customer/PaymentCancel.jsx';
import InventoryPage from './pages/Kitchen/InventoryPage.jsx';
import MyOrdersPage from './pages/Customer/MyOrdersPage';

// --- NEW: Import the POS Page ---
import PosPage from './pages/Kitchen/PosPage.jsx';

// Import Route Handlers
import ProtectedRoute from './components/routing/ProtectedRoute';
import AuthRoute from './components/routing/AuthRoute';

function App() {
  return (
    <>
      <Toaster 
        position="top-center" 
        toastOptions={{
          // Default duration for all toasts
          duration: 3000,
          // Specific durations
          success: {
            duration: 2000,
          },
          error: {
            duration: 4000, // <-- 4 seconds for errors
          },
        }}
      />
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
            <ProtectedRoute allowedRoles={['customer', 'F&B Admin', 'Kitchen Staffs', 'Cashier', 'Stock Controller']}>
              <MenuPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['F&B Admin']}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        {/* Kitchen Portal: Orders (Kitchen Staff & Admin only) */}
        <Route
          path="/kitchen"
          element={
            <ProtectedRoute allowedRoles={['F&B Admin', 'Kitchen Staffs']}>
              <KitchenPage />
            </ProtectedRoute>
          }
        />
        
        {/* POS: Walk-in (Cashier & Admin only) */}
        <Route
          path="/kitchen/pos"
          element={
            <ProtectedRoute allowedRoles={['F&B Admin', 'Cashier']}>
              <PosPage />
            </ProtectedRoute>
          }
        />

        {/* Tables: (Kitchen Staff & Admin only) */}
        <Route
          path="/kitchen/tables"
          element={
            <ProtectedRoute allowedRoles={['F&B Admin', 'Kitchen Staffs']}>
              <TableManager />
            </ProtectedRoute>
          }
        />

        {/* Inventory: (Stock Controller & Admin only) */}
        <Route
          path="/kitchen/inventory"
          element={
            <ProtectedRoute allowedRoles={['F&B Admin', 'Stock Controller']}>
              <InventoryPage />
            </ProtectedRoute>
          }
        />
        
        {/* Archive: (Kitchen Staff & Admin only) */}
        <Route
          path="/kitchen/archive"
          element={
            <ProtectedRoute allowedRoles={['F&B Admin', 'Kitchen Staffs']}>
              <ArchivePage />
            </ProtectedRoute>
          }
        />
        
        {/* My Orders: (Customer only) */}
          <Route
          path="/my-orders"
          element={
            <ProtectedRoute allowedRoles={['customer', 'F&B Admin', 'Kitchen Staffs', 'Cashier']}>
              <MyOrdersPage />
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