import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Recipes } from './pages/Recipes';
import { LoginPage } from './pages/LoginPage';
import { FeedbackPage } from './pages/FeedbackPage';
import './App.css';

function App() {
    return (
        <Routes>
            {/* Public login page without dashboard layout */}
            <Route path="/" element={<LoginPage />} />

            {/* Admin dashboard area with sidebar/header */}
            <Route
                path="/dashboard"
                element={(
                    <Layout>
                        <Home />
                    </Layout>
                )}
            />

            <Route
                path="/recipes"
                element={(
                    <Layout>
                        <Recipes />
                    </Layout>
                )}
            />

            {/* Public feedback page without sidebar/header layout */}
            <Route path="/feedback/:id" element={<FeedbackPage />} />
        </Routes>
    );
}

export default App;
