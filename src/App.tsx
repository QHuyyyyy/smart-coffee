import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AdminHome } from './pages/admin/Home';
import { SupplierHome } from './pages/supplier/Home';
import { Recipes } from './pages/admin/Recipes';
import { RecipeDetail } from './pages/admin/RecipeDetail';
import { CoffeeShopPage } from './pages/admin/CoffeeShop';
import { SubscriptionPackagesPage } from './pages/admin/SubscriptionPackages';
import { SubscriptionsPage } from './pages/admin/Subscriptions';
import { AdminWithdrawalsPage } from './pages/admin/Withdrawals';
import { SupplierOrders } from './pages/supplier/Order';
import { AdminOrders } from './pages/admin/Order';
import { SupplierOrderDetail } from './pages/supplier/OrderDetail';
import { SupplierProducts } from './pages/supplier/Product';
import { SupplierProductDetail } from './pages/supplier/ProductDetail';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import './App.css';
import { SupplierProfile } from './pages/supplier/Profile';
import { Wallet } from './pages/supplier/Wallet';
import { Transaction } from './pages/admin/Transaction';
// import { useAuthStore } from './stores/auth.store';
import { AdminPostsPage } from './pages/admin/Posts';
import { AdminIngredientsPage } from './pages/admin/Ingredients';
import { AdminAccountsPage } from './pages/admin/Accounts';
import { AdminShopStaffPage } from './pages/admin/ShopStaff';
import { AdminSuppliersPage } from './pages/admin/Suppliers';
import { SystemSettingsPage } from './pages/admin/SystemSettings';

function App() {
    // const currentUser = useAuthStore((state) => state.currentUser);

    return (
        <Routes>
            {/* Public login page without dashboard layout */}
            <Route path="/" element={<LoginPage />} />

            {/* Public register page without dashboard layout */}
            <Route path="/register" element={<RegisterPage />} />

            {/* Forgot password flow */}
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Admin area */}
            <Route
                path="/admin/dashboard"
                element={(
                    <ProtectedRoute allowedRoles={["Admin"]}>
                        <Layout>
                            <AdminHome />
                        </Layout>
                    </ProtectedRoute>
                )}
            />

            <Route
                path="/admin/recipes"
                element={(
                    <ProtectedRoute allowedRoles={["Admin"]}>
                        <Layout>
                            <Recipes />
                        </Layout>
                    </ProtectedRoute>
                )}
            />

            <Route
                path="/admin/recipes/:id"
                element={(
                    <ProtectedRoute allowedRoles={["Admin"]}>
                        <Layout>
                            <RecipeDetail />
                        </Layout>
                    </ProtectedRoute>
                )}
            />

            <Route
                path="/admin/coffee-shop"
                element={(
                    <ProtectedRoute allowedRoles={["Admin"]}>
                        <Layout>
                            <CoffeeShopPage />
                        </Layout>
                    </ProtectedRoute>
                )}
            />

            <Route
                path="/admin/subscription-packages"
                element={(
                    <ProtectedRoute allowedRoles={["Admin"]}>
                        <Layout>
                            <SubscriptionPackagesPage />
                        </Layout>
                    </ProtectedRoute>
                )}
            />

            <Route
                path="/admin/subscriptions"
                element={(
                    <ProtectedRoute allowedRoles={["Admin"]}>
                        <Layout>
                            <SubscriptionsPage />
                        </Layout>
                    </ProtectedRoute>
                )}
            />

            <Route
                path="/admin/withdrawals"
                element={(
                    <ProtectedRoute allowedRoles={["Admin"]}>
                        <Layout>
                            <AdminWithdrawalsPage />
                        </Layout>
                    </ProtectedRoute>
                )}
            />

            <Route
                path="/admin/orders"
                element={(
                    <ProtectedRoute allowedRoles={["Admin"]}>
                        <Layout>
                            <AdminOrders />
                        </Layout>
                    </ProtectedRoute>
                )}
            />

            <Route
                path="/admin/posts"
                element={(
                    <ProtectedRoute allowedRoles={["Admin"]}>
                        <Layout>
                            <AdminPostsPage />
                        </Layout>
                    </ProtectedRoute>
                )}
            />

            <Route
                path="/admin/ingredients"
                element={(
                    <ProtectedRoute allowedRoles={["Admin"]}>
                        <Layout>
                            <AdminIngredientsPage />
                        </Layout>
                    </ProtectedRoute>
                )}
            />

            <Route
                path="/admin/accounts"
                element={(
                    <ProtectedRoute allowedRoles={["Admin"]}>
                        <Layout>
                            <AdminAccountsPage />
                        </Layout>
                    </ProtectedRoute>
                )}
            />

            <Route
                path="/admin/shop-staff"
                element={(
                    <ProtectedRoute allowedRoles={["Admin"]}>
                        <Layout>
                            <AdminShopStaffPage />
                        </Layout>
                    </ProtectedRoute>
                )}
            />

            <Route
                path="/admin/suppliers"
                element={(
                    <ProtectedRoute allowedRoles={["Admin"]}>
                        <Layout>
                            <AdminSuppliersPage />
                        </Layout>
                    </ProtectedRoute>
                )}
            />

            <Route
                path="/admin/system-settings"
                element={(
                    <ProtectedRoute allowedRoles={["Admin"]}>
                        <Layout>
                            <SystemSettingsPage />
                        </Layout>
                    </ProtectedRoute>
                )}
            />

            {/* Supplier area */}
            <Route
                path="/supplier/dashboard"
                element={(
                    <ProtectedRoute allowedRoles={["Supplier"]}>
                        <Layout>
                            <SupplierHome />
                        </Layout>
                    </ProtectedRoute>
                )}
            />

            <Route
                path="/supplier/orders"
                element={(
                    <ProtectedRoute allowedRoles={["Supplier"]}>
                        <Layout>
                            <SupplierOrders />
                        </Layout>
                    </ProtectedRoute>
                )}
            />

            <Route
                path="/wallet"
                element={(
                    <ProtectedRoute allowedRoles={["Supplier"]}>
                        <Layout>
                            <Wallet />
                        </Layout>
                    </ProtectedRoute>
                )}
            />
            <Route
                path="/transaction"
                element={(
                    <ProtectedRoute allowedRoles={["Admin"]}>
                        <Layout>
                            <Transaction />
                        </Layout>
                    </ProtectedRoute>
                )}
            />

            <Route
                path="/supplier/orders/:id"
                element={(
                    <ProtectedRoute allowedRoles={["Supplier"]}>
                        <Layout>
                            <SupplierOrderDetail />
                        </Layout>
                    </ProtectedRoute>
                )}
            />

            <Route
                path="/supplier/products"
                element={(
                    <ProtectedRoute allowedRoles={["Supplier"]}>
                        <Layout>
                            <SupplierProducts />
                        </Layout>
                    </ProtectedRoute>
                )}
            />

            <Route
                path="/supplier/products/:id"
                element={(
                    <ProtectedRoute allowedRoles={["Supplier"]}>
                        <Layout>
                            <SupplierProductDetail />
                        </Layout>
                    </ProtectedRoute>
                )}
            />

            <Route
                path="/supplier/profile"
                element={(
                    <ProtectedRoute allowedRoles={["Supplier"]}>
                        <Layout>
                            <SupplierProfile />
                        </Layout>
                    </ProtectedRoute>
                )}
            />
            {/* Public feedback page without sidebar/header layout */}
            <Route path="/feedback/:id" element={<FeedbackPage />} />
        </Routes>
    );
}

export default App;
