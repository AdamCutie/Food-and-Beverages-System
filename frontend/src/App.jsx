import React from 'react';
import { Toaster } from 'react-hot-toast';
import { Routes, Route } from 'react-router-dom';
import Snowfall from 'react-snowfall';

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
import PosPage from './pages/Kitchen/PosPage.jsx';
import ItemDetailsPage from './pages/Customer/ItemDetailsPage.jsx';

// Import Route Handlers
import GlobalRateLimitHandler from './components/GlobalRateLimitHandler'; 
import ProtectedRoute from './components/routing/ProtectedRoute';
import AuthRoute from './components/routing/AuthRoute';

function App() {
  // --- SEASONAL LOGIC ---
  // JavaScript months are 0-indexed (0 = Jan, 11 = Dec)
  const currentMonth = new Date().getMonth();
  const isDecember = currentMonth === 11; 
  
  // TIP: To test this if it's NOT December right now, uncomment the line below:
  // const isDecember = true; 

  return (
    <>
      {/* ✅ CONDITIONAL RENDERING:
        The Snowfall component only exists in the DOM if isDecember is true.
      */}
      {isDecember && (
        <Snowfall 
            color="#82C3D9"
            snowflakeCount={150}
            style={{
            position: 'fixed',
            width: '100vw',
            height: '100vh',
            zIndex: 50,
            pointerEvents: 'none',
            top: 0,
            left: 0,
          }}
        />
      )}

      <Toaster 
        position="top-center" 
        toastOptions={{
          duration: 3000,
          success: { duration: 2000 },
          error: { duration: 4000 },
        }}
      />
      
      {/* ✅ WRAPPER: Protects all routes from Rate Limiting */}
      <GlobalRateLimitHandler>
        <Routes>
          {/* === AUTH ROUTES (Only for guests) === */}
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

          {/* === PUBLIC ROUTES (Available to everyone) === */}
        {/* ✅ CHANGED: MenuPage is now public (Guest Mode) */}
          <Route path="/" element={<MenuPage />} />
          <Route path="/item/:id" element={<ItemDetailsPage />} />
          
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-cancel" element={<PaymentCancel />} />

          {/* === PROTECTED ROUTES (Login Required) === */}
          
          {/* Customer Protected Pages */}
          <Route
            path="/my-orders"
            element={
              <ProtectedRoute allowedRoles={['customer', 'F&B Admin', 'Kitchen Staffs', 'Cashier']}>
                <MyOrdersPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Dashboard */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['F&B Admin']}>
                <AdminPage />
              </ProtectedRoute>
            }
          />

          {/* Kitchen Portal: Orders */}
          <Route
            path="/kitchen"
            element={
              <ProtectedRoute allowedRoles={['F&B Admin', 'Kitchen Staffs']}>
                <KitchenPage />
              </ProtectedRoute>
            }
          />
          
          {/* POS: Walk-in */}
          <Route
            path="/kitchen/pos"
            element={
              <ProtectedRoute allowedRoles={['F&B Admin', 'Cashier']}>
                <PosPage />
              </ProtectedRoute>
            }
          />

          {/* Tables */}
          <Route
            path="/kitchen/tables"
            element={
              <ProtectedRoute allowedRoles={['F&B Admin', 'Kitchen Staffs']}>
                <TableManager />
              </ProtectedRoute>
            }
          />

          {/* Inventory */}
          <Route
            path="/kitchen/inventory"
            element={
              <ProtectedRoute allowedRoles={['F&B Admin', 'Stock Controller']}>
                <InventoryPage />
              </ProtectedRoute>
            }
          />
          
          {/* Archive */}
          <Route
            path="/kitchen/archive"
            element={
              <ProtectedRoute allowedRoles={['F&B Admin', 'Kitchen Staffs']}>
                <ArchivePage />
              </ProtectedRoute>
            }
          />

        </Routes>
      </GlobalRateLimitHandler>
    </>
  );
}

export default App;