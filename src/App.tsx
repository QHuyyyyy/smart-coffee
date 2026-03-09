import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AdminHome } from './pages/admin/Home';
import { SupplierHome } from './pages/supplier/Home';
import { Recipes } from './pages/admin/Recipes';
import { RecipeDetail } from './pages/admin/RecipeDetail';
import { CoffeeShopPage } from './pages/admin/CoffeeShop';
import { SupplierOrders } from './pages/supplier/Order';
import { SupplierOrderDetail } from './pages/supplier/OrderDetail';
import { SupplierProducts } from './pages/supplier/Product';
import { SupplierProductDetail } from './pages/supplier/ProductDetail';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import './App.css';

function App() {
    return (
        <Routes>
            {/* Public login page without dashboard layout */}
            <Route path="/" element={<LoginPage />} />

            {/* Public register page without dashboard layout */}
            <Route path="/register" element={<RegisterPage />} />

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


            {/* Public feedback page without sidebar/header layout */}
            <Route path="/feedback/:id" element={<FeedbackPage />} />
        </Routes>
    );
}

export default App;
