import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AdminShell } from './components/AdminShell'
import { AppShell } from './components/AppShell'
import { RequireAdmin, RequireAuth, RequireStaff } from './components/Guards'
import { ManagerShell } from './components/ManagerShell'
import { Home } from './pages/Home'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { VerifyPage } from './pages/VerifyPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { DashboardPage } from './pages/user/DashboardPage'
import { ShopPage } from './pages/user/ShopPage'
import { CartPage } from './pages/user/CartPage'
import { OrdersPage } from './pages/user/OrdersPage'
import { ProfilePage } from './pages/user/ProfilePage'
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage'
import { AdminProductsPage } from './pages/admin/AdminProductsPage'
import { AdminCustomersPage } from './pages/admin/AdminCustomersPage'
import { AdminWebsitePage } from './pages/admin/AdminWebsitePage'
import { AdminAuditPage } from './pages/admin/AdminAuditPage'
import { ManagerDashboardPage } from './pages/manager/ManagerDashboardPage'
import { ManagerOrdersPage } from './pages/manager/ManagerOrdersPage'
import { ManagerCustomersPage } from './pages/manager/ManagerCustomersPage'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/verify" element={<VerifyPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/account" element={<Navigate to="/app/account" replace />} />

      <Route path="/app" element={<RequireAuth><AppShell /></RequireAuth>}>
        <Route index element={<DashboardPage />} />
        <Route path="shop" element={<ShopPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="account" element={<ProfilePage />} />
      </Route>

      <Route path="/admin" element={<RequireAdmin><AdminShell /></RequireAdmin>}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="customers" element={<AdminCustomersPage />} />
        <Route path="website" element={<AdminWebsitePage />} />
        <Route path="audit" element={<AdminAuditPage />} />
      </Route>

      <Route path="/manager" element={<RequireStaff><ManagerShell /></RequireStaff>}>
        <Route index element={<ManagerDashboardPage />} />
        <Route path="orders" element={<ManagerOrdersPage />} />
        <Route path="customers" element={<ManagerCustomersPage />} />
      </Route>

      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
