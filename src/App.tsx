import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Recipes } from './pages/Recipes';
import { RecipeDetail } from './pages/RecipeDetail';
import { CoffeeShopPage } from './pages/CoffeeShop';
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

            {/* Admin dashboard area with sidebar/header */}
            <Route
                path="/dashboard"
                element={(
                    <ProtectedRoute allowedRoles={["Supplier", "Admin"]}>
                        <Layout>
                            <Home />
                        </Layout>
                    </ProtectedRoute>
                )}
            />

            <Route
                path="/recipes"
                element={(
                    <ProtectedRoute allowedRoles={["Supplier", "Admin"]}>
                        <Layout>
                            <Recipes />
                        </Layout>
                    </ProtectedRoute>
                )}
            />

            <Route
                path="/recipes/:id"
                element={(
                    <ProtectedRoute allowedRoles={["Supplier", "Admin"]}>
                        <Layout>
                            <RecipeDetail />
                        </Layout>
                    </ProtectedRoute>
                )}
            />

            <Route
                path="/coffee-shop"
                element={(
                    <ProtectedRoute allowedRoles={["Supplier", "Admin"]}>
                        <Layout>
                            <CoffeeShopPage />
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
