import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Cadastro } from './pages/Cadastro';
import { AdminSetup } from './pages/AdminSetup';
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminStore } from './pages/admin/Store';
import { AdminProducts } from './pages/admin/Products';
import { AdminCustomers } from './pages/admin/Customers';
import { AdminDelivery } from './pages/admin/Delivery';
import { PublicMenu } from './pages/PublicMenu';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { CustomerProfile } from './pages/customer/Profile';
import { CustomerOrders } from './pages/customer/Orders';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/:storeSlug" element={<PublicMenu />} />
          <Route path="/:storeSlug/carrinho" element={<Cart />} />
          
          {/* Protected routes */}
          <Route
            path="/:storeSlug/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          
          {/* Admin routes */}
          <Route
            path="/admin/setup"
            element={
              <ProtectedRoute>
                <AdminSetup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/loja"
            element={
              <ProtectedRoute requireAdmin>
                <AdminStore />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/cardapio"
            element={
              <ProtectedRoute requireAdmin>
                <AdminProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/clientes"
            element={
              <ProtectedRoute requireAdmin>
                <AdminCustomers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/entregas"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDelivery />
              </ProtectedRoute>
            }
          />
          
          {/* Customer routes */}
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <CustomerProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil/pedidos"
            element={
              <ProtectedRoute>
                <CustomerOrders />
              </ProtectedRoute>
            }
          />
          
          {/* Home route - redirects based on auth state */}
          <Route path="/" element={<Home />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
