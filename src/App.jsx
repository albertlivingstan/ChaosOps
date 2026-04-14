import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from './lib/query-client';
import { AuthProvider } from './lib/AuthContext';
import { Toaster } from './components/ui/toaster';

// Layout
import AppLayout from './components/layout/AppLayout';
import SplashScreen from './components/SplashScreen';

// Pages
import Overview from './pages/Overview';
import Experiments from './pages/Experiments';
import Library from './pages/Library';
import Scheduler from './pages/Scheduler';
import Services from './pages/Services';
import Monitoring from './pages/Monitoring';
import InfraMap from './pages/InfraMap';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import Pipeline from './pages/Pipeline';
import Settings from './pages/Settings';
import WebAnalyzer from './pages/WebAnalyzer';
import MonitorHistory from './pages/MonitorHistory';
import PageNotFound from './lib/PageNotFound';

export default function App() {
    const [showSplash, setShowSplash] = useState(true);

    return (
        <QueryClientProvider client={queryClientInstance}>
            <AnimatePresence>
                {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
            </AnimatePresence>
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<AppLayout />}>
                            <Route index element={<Overview />} />
                            <Route path="experiments" element={<Experiments />} />
                            <Route path="library" element={<Library />} />
                            <Route path="scheduler" element={<Scheduler />} />
                            <Route path="services" element={<Services />} />
                            <Route path="monitoring" element={<Monitoring />} />
                            <Route path="web-analyzer" element={<WebAnalyzer />} />
                            <Route path="monitor-history" element={<MonitorHistory />} />
                            <Route path="infra-map" element={<InfraMap />} />
                            <Route path="alerts" element={<Alerts />} />
                            <Route path="reports" element={<Reports />} />
                            <Route path="pipeline" element={<Pipeline />} />
                            <Route path="settings" element={<Settings />} />
                            <Route path="*" element={<PageNotFound />} />
                        </Route>
                    </Routes>
                    <Toaster />
                </BrowserRouter>
            </AuthProvider>
        </QueryClientProvider>
    );
}