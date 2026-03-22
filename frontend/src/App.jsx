import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import Login from './pages/Login.jsx';
import OrderTickets from './pages/OrderTickets.jsx';
import ScannerLogin from './pages/ScannerLogin.jsx';
import TicketList from './pages/TicketList.jsx';
import TicketCreate from './pages/TicketCreate.jsx';
import TicketDetail from './pages/TicketDetail.jsx';
import TicketEdit from './pages/TicketEdit.jsx';
import Scanner from './pages/Scanner.jsx';
import { useAuth } from './context/AuthContext.jsx';

function HomeRedirect() {
  const { role } = useAuth();
  return <Navigate to={role === 'scanner' ? '/scanner' : '/tickets'} replace />;
}

const SELLER_PORTAL_ROLES = ['seller', 'admin'];

function NotFoundRedirect() {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={role === 'scanner' ? '/scanner' : '/tickets'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/order" element={<OrderTickets />} />
      <Route path="/scanner-login" element={<ScannerLogin />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout>
              <HomeRedirect />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/tickets"
        element={
          <PrivateRoute allowedRoles={SELLER_PORTAL_ROLES}>
            <Layout>
              <TicketList />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/tickets/new"
        element={
          <PrivateRoute allowedRoles={SELLER_PORTAL_ROLES}>
            <Layout>
              <TicketCreate />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/tickets/detail/:code/edit"
        element={
          <PrivateRoute allowedRoles={SELLER_PORTAL_ROLES}>
            <Layout>
              <TicketEdit />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/tickets/detail/:code"
        element={
          <PrivateRoute allowedRoles={SELLER_PORTAL_ROLES}>
            <Layout>
              <TicketDetail />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/scanner"
        element={
          <PrivateRoute allowedRoles={['scanner']}>
            <Layout>
              <Scanner />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route path="*" element={<NotFoundRedirect />} />
    </Routes>
  );
}
