import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import type { UserRole } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { OrderWorkflowNotificationsProvider } from './context/OrderWorkflowNotificationsContext';
import { canUseGoogleAuth, getGoogleClientId } from './lib/googleAuth';
import { getDefaultRouteForRole } from './lib/roleRoutes';
import { Toaster } from '@/components/ui/toaster';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Products = lazy(() => import('./pages/Products'));
const Services = lazy(() => import('./pages/Services'));
const PublicSellerProfile = lazy(() => import('./pages/PublicSellerProfile'));
const PublicMechanicProfile = lazy(() => import('./pages/PublicMechanicProfile'));
const ChangePassword = lazy(() => import('./pages/ChangePassword'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const NotFound = lazy(() => import('./pages/NotFound'));

const SellerDashboard = lazy(() => import('./pages/seller/Dashboard'));
const SellerProducts = lazy(() => import('./pages/seller/Products'));
const SellerOrders = lazy(() => import('./pages/seller/Orders'));
const SellerShippingDelivery = lazy(() => import('./pages/seller/ShippingDelivery'));
const SellerReturnsClaims = lazy(() => import('./pages/seller/ReturnsClaims'));
const SellerFinanceStatus = lazy(() => import('./pages/seller/FinanceStatus'));
const SellerNotificationCenter = lazy(() => import('./pages/seller/NotificationCenter'));
const SellerBuyerMessageCenter = lazy(() => import('./pages/seller/BuyerMessageCenter'));
const SellerSupportHelpCenter = lazy(() => import('./pages/seller/SupportHelpCenter'));
const SellerSettings = lazy(() => import('./pages/seller/Settings'));
const SellerReviews = lazy(() => import('./pages/seller/Reviews'));
const SellerProfile = lazy(() => import('./pages/seller/Profile'));
const SellerAIChat = lazy(() => import('./pages/seller/AIChat'));
const SellerNotifications = lazy(() => import('./pages/seller/Notifications'));

const MechanicDashboard = lazy(() => import('./pages/mechanic/Dashboard'));
const MechanicProducts = lazy(() => import('./pages/mechanic/Products'));
const MechanicOrders = lazy(() => import('./pages/mechanic/Orders'));
const MechanicReviews = lazy(() => import('./pages/mechanic/Reviews'));
const MechanicProfile = lazy(() => import('./pages/mechanic/Profile'));
const MechanicAIChat = lazy(() => import('./pages/mechanic/AIChat'));
const MechanicServices = lazy(() => import('./pages/mechanic/Services'));
const MechanicNotifications = lazy(() => import('./pages/mechanic/Notifications'));
const MechanicShippingDelivery = lazy(() => import('./pages/mechanic/ShippingDelivery'));
const MechanicReturnsClaims = lazy(() => import('./pages/mechanic/ReturnsClaims'));
const MechanicFinanceStatus = lazy(() => import('./pages/mechanic/FinanceStatus'));
const MechanicSupportHelpCenter = lazy(() => import('./pages/mechanic/SupportHelpCenter'));
const MechanicSettings = lazy(() => import('./pages/mechanic/Settings'));

const DeliveryAgentDashboard = lazy(() => import('./pages/delivery-agent/Dashboard'));
const DeliveryAssignedPage = lazy(() => import('./pages/delivery-agent/Assigned'));
const DeliveryCompletedPage = lazy(() => import('./pages/delivery-agent/Completed'));
const DeliveryNotificationsPage = lazy(() => import('./pages/delivery-agent/Notifications'));
const DeliveryAgentProfilePage = lazy(() => import('./pages/delivery-agent/Profile'));
const DeliverySupportHelpCenterPage = lazy(() => import('./pages/delivery-agent/SupportHelpCenter'));
const DeliverySettingsPage = lazy(() => import('./pages/delivery-agent/Settings'));

const AdminLayout = lazy(() => import('./components/AdminLayout').then((m) => ({ default: m.AdminLayout })));
const SellerLayout = lazy(() => import('./components/SellerLayout').then((m) => ({ default: m.SellerLayout })));
const MechanicLayout = lazy(() => import('./components/MechanicLayout').then((m) => ({ default: m.MechanicLayout })));
const DeliveryAgentLayout = lazy(() => import('./components/DeliveryAgentLayout').then((m) => ({ default: m.DeliveryAgentLayout })));

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminAnalytics = lazy(() => import('./pages/admin/Analytics'));
const AdminUsersManagement = lazy(() => import('./pages/admin/UsersManagement'));
const AdminProductsManagement = lazy(() => import('./pages/admin/ProductsManagement'));
const AdminServicesManagement = lazy(() => import('./pages/admin/ServicesManagement'));
const AdminOrdersManagement = lazy(() => import('./pages/admin/OrdersManagement'));
const AdminRatingsManagement = lazy(() => import('./pages/admin/RatingsManagement'));
const AdminReports = lazy(() => import('./pages/admin/Reports'));
const AdminNotifications = lazy(() => import('./pages/admin/Notifications'));
const AdminInfoToUsers = lazy(() => import('./pages/admin/InfoToUsers'));
const AdminContactManagement = lazy(() => import('./pages/admin/ContactManagement'));
const AdminSettingsPage = lazy(() => import('./pages/admin/SettingsPage'));
const AdminNotFound = lazy(() => import('./pages/admin/NotFound'));

const GOOGLE_CLIENT_ID = getGoogleClientId();

interface RouteProps {
  children: React.ReactNode;
}

interface RoleRouteProps {
  children: React.ReactNode;
  roles: UserRole[];
}

const PublicRoute: React.FC<RouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <RouteLoader />;
  if (user) return <Navigate to={getDefaultRouteForRole(user.role)} />;

  return <>{children}</>;
};

export const RoleRoute: React.FC<RoleRouteProps> = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) return <RouteLoader />;
  if (!user) return <Navigate to="/login" />;
  if (!roles.includes(user.role)) return <Navigate to={getDefaultRouteForRole(user.role)} />;

  return <>{children}</>;
};

const RouteLoader: React.FC = () => (
  <div className="loading-screen">
    <div className="spinner"></div>
    <p>Loading...</p>
  </div>
);

const AppContent = (): JSX.Element => {
  return (
    <AuthProvider>
      <CartProvider>
        <OrderWorkflowNotificationsProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <div className="app">
              <Suspense fallback={<RouteLoader />}>
                <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/products" element={<Products />} />
                <Route path="/services" element={<Services />} />
                <Route path="/seller/:id" element={<PublicSellerProfile />} />
                <Route path="/mechanic/:id" element={<PublicMechanicProfile />} />
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
                <Route path="/change-password" element={<RoleRoute roles={['seller', 'mechanic', 'delivery_agent', 'admin']}><ChangePassword /></RoleRoute>} />

                <Route path="/seller/dashboard" element={<RoleRoute roles={['seller']}><SellerLayout><SellerDashboard /></SellerLayout></RoleRoute>} />
                <Route path="/seller/products" element={<RoleRoute roles={['seller']}><SellerLayout><SellerProducts /></SellerLayout></RoleRoute>} />
                <Route path="/seller/orders" element={<RoleRoute roles={['seller']}><SellerLayout><SellerOrders /></SellerLayout></RoleRoute>} />
                <Route path="/seller/shipping-delivery" element={<RoleRoute roles={['seller']}><SellerLayout><SellerShippingDelivery /></SellerLayout></RoleRoute>} />
                <Route path="/seller/returns-claims" element={<RoleRoute roles={['seller']}><SellerLayout><SellerReturnsClaims /></SellerLayout></RoleRoute>} />
                <Route path="/seller/finance-status" element={<RoleRoute roles={['seller']}><SellerLayout><SellerFinanceStatus /></SellerLayout></RoleRoute>} />
                <Route path="/seller/notification" element={<RoleRoute roles={['seller']}><SellerLayout><SellerNotificationCenter /></SellerLayout></RoleRoute>} />
                <Route path="/seller/buyer-message-center" element={<RoleRoute roles={['seller']}><SellerLayout><SellerBuyerMessageCenter /></SellerLayout></RoleRoute>} />
                <Route path="/seller/support-help-center" element={<RoleRoute roles={['seller']}><SellerLayout><SellerSupportHelpCenter /></SellerLayout></RoleRoute>} />
                <Route path="/seller/settings" element={<RoleRoute roles={['seller']}><SellerLayout><SellerSettings /></SellerLayout></RoleRoute>} />
                <Route path="/seller/reviews" element={<RoleRoute roles={['seller']}><SellerLayout><SellerReviews /></SellerLayout></RoleRoute>} />
                <Route path="/seller/profile" element={<RoleRoute roles={['seller']}><SellerLayout><SellerProfile /></SellerLayout></RoleRoute>} />
                <Route path="/seller/ai-chat" element={<RoleRoute roles={['seller']}><SellerLayout><SellerAIChat /></SellerLayout></RoleRoute>} />
                <Route path="/seller/chat" element={<RoleRoute roles={['seller']}><SellerLayout><ChatPage /></SellerLayout></RoleRoute>} />
                <Route path="/seller/notifications" element={<RoleRoute roles={['seller']}><SellerLayout><SellerNotifications /></SellerLayout></RoleRoute>} />

                <Route path="/mechanic/dashboard" element={<RoleRoute roles={['mechanic']}><MechanicLayout><MechanicDashboard /></MechanicLayout></RoleRoute>} />
                <Route path="/mechanic/services" element={<RoleRoute roles={['mechanic']}><MechanicLayout><MechanicServices /></MechanicLayout></RoleRoute>} />
                <Route path="/mechanic/products" element={<RoleRoute roles={['mechanic']}><MechanicLayout><MechanicProducts /></MechanicLayout></RoleRoute>} />
                <Route path="/mechanic/orders" element={<RoleRoute roles={['mechanic']}><MechanicLayout><MechanicOrders /></MechanicLayout></RoleRoute>} />
                <Route path="/mechanic/shipping-delivery" element={<RoleRoute roles={['mechanic']}><MechanicLayout><MechanicShippingDelivery /></MechanicLayout></RoleRoute>} />
                <Route path="/mechanic/returns-claims" element={<RoleRoute roles={['mechanic']}><MechanicLayout><MechanicReturnsClaims /></MechanicLayout></RoleRoute>} />
                <Route path="/mechanic/finance-status" element={<RoleRoute roles={['mechanic']}><MechanicLayout><MechanicFinanceStatus /></MechanicLayout></RoleRoute>} />
                <Route path="/mechanic/notification" element={<RoleRoute roles={['mechanic']}><MechanicLayout><MechanicNotifications /></MechanicLayout></RoleRoute>} />
                <Route path="/mechanic/buyer-message-center" element={<RoleRoute roles={['mechanic']}><MechanicLayout><ChatPage /></MechanicLayout></RoleRoute>} />
                <Route path="/mechanic/support-help-center" element={<RoleRoute roles={['mechanic']}><MechanicLayout><MechanicSupportHelpCenter /></MechanicLayout></RoleRoute>} />
                <Route path="/mechanic/settings" element={<RoleRoute roles={['mechanic']}><MechanicLayout><MechanicSettings /></MechanicLayout></RoleRoute>} />
                <Route path="/mechanic/reviews" element={<RoleRoute roles={['mechanic']}><MechanicLayout><MechanicReviews /></MechanicLayout></RoleRoute>} />
                <Route path="/mechanic/profile" element={<RoleRoute roles={['mechanic']}><MechanicLayout><MechanicProfile /></MechanicLayout></RoleRoute>} />
                <Route path="/mechanic/ai-chat" element={<RoleRoute roles={['mechanic']}><MechanicLayout><MechanicAIChat /></MechanicLayout></RoleRoute>} />
                <Route path="/mechanic/chat" element={<RoleRoute roles={['mechanic']}><MechanicLayout><ChatPage /></MechanicLayout></RoleRoute>} />
                <Route path="/mechanic/notifications" element={<RoleRoute roles={['mechanic']}><MechanicLayout><MechanicNotifications /></MechanicLayout></RoleRoute>} />

                <Route path="/delivery-agent" element={<RoleRoute roles={['delivery_agent']}><Navigate to="/delivery/dashboard" replace /></RoleRoute>} />
                <Route path="/delivery/dashboard" element={<RoleRoute roles={['delivery_agent']}><DeliveryAgentLayout><DeliveryAgentDashboard /></DeliveryAgentLayout></RoleRoute>} />
                <Route path="/delivery/assigned" element={<RoleRoute roles={['delivery_agent']}><DeliveryAgentLayout><DeliveryAssignedPage /></DeliveryAgentLayout></RoleRoute>} />
                <Route path="/delivery/completed" element={<RoleRoute roles={['delivery_agent']}><DeliveryAgentLayout><DeliveryCompletedPage /></DeliveryAgentLayout></RoleRoute>} />
                <Route path="/delivery/notifications" element={<RoleRoute roles={['delivery_agent']}><DeliveryAgentLayout><DeliveryNotificationsPage /></DeliveryAgentLayout></RoleRoute>} />
                <Route path="/delivery/profile" element={<RoleRoute roles={['delivery_agent']}><DeliveryAgentLayout><DeliveryAgentProfilePage /></DeliveryAgentLayout></RoleRoute>} />
                <Route path="/delivery/support-help-center" element={<RoleRoute roles={['delivery_agent']}><DeliveryAgentLayout><DeliverySupportHelpCenterPage /></DeliveryAgentLayout></RoleRoute>} />
                <Route path="/delivery/settings" element={<RoleRoute roles={['delivery_agent']}><DeliveryAgentLayout><DeliverySettingsPage /></DeliveryAgentLayout></RoleRoute>} />
                <Route path="/delivery-agent/dashboard" element={<RoleRoute roles={['delivery_agent']}><Navigate to="/delivery/dashboard" replace /></RoleRoute>} />

                <Route path="/admin" element={<RoleRoute roles={['admin']}><AdminLayout><AdminDashboard /></AdminLayout></RoleRoute>} />
                <Route path="/admin/analytics" element={<RoleRoute roles={['admin']}><AdminLayout><AdminAnalytics /></AdminLayout></RoleRoute>} />
                <Route path="/admin/users" element={<RoleRoute roles={['admin']}><AdminLayout><AdminUsersManagement /></AdminLayout></RoleRoute>} />
                <Route path="/admin/products" element={<RoleRoute roles={['admin']}><AdminLayout><AdminProductsManagement /></AdminLayout></RoleRoute>} />
                <Route path="/admin/services" element={<RoleRoute roles={['admin']}><AdminLayout><AdminServicesManagement /></AdminLayout></RoleRoute>} />
                <Route path="/admin/orders" element={<RoleRoute roles={['admin']}><AdminLayout><AdminOrdersManagement /></AdminLayout></RoleRoute>} />
                <Route path="/admin/ratings" element={<RoleRoute roles={['admin']}><AdminLayout><AdminRatingsManagement /></AdminLayout></RoleRoute>} />
                <Route path="/admin/reports" element={<RoleRoute roles={['admin']}><AdminLayout><AdminReports /></AdminLayout></RoleRoute>} />
                <Route path="/admin/notifications" element={<RoleRoute roles={['admin']}><AdminLayout><AdminNotifications /></AdminLayout></RoleRoute>} />
                <Route path="/admin/info-to-users" element={<RoleRoute roles={['admin']}><AdminLayout><AdminInfoToUsers /></AdminLayout></RoleRoute>} />
                <Route path="/admin/contacts" element={<RoleRoute roles={['admin']}><AdminLayout><AdminContactManagement /></AdminLayout></RoleRoute>} />
                <Route path="/admin/visitor-messages" element={<RoleRoute roles={['admin']}><AdminLayout><AdminContactManagement /></AdminLayout></RoleRoute>} />
                <Route path="/admin/settings" element={<RoleRoute roles={['admin']}><AdminLayout><AdminSettingsPage /></AdminLayout></RoleRoute>} />
                <Route path="/admin/*" element={<RoleRoute roles={['admin']}><AdminLayout><AdminNotFound /></AdminLayout></RoleRoute>} />
                <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <Toaster />
            </div>
          </Router>
        </OrderWorkflowNotificationsProvider>
      </CartProvider>
    </AuthProvider>
  );
};

const App = (): JSX.Element => {
  if (canUseGoogleAuth()) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AppContent />
      </GoogleOAuthProvider>
    );
  }

  return <AppContent />;
};

export default App;
