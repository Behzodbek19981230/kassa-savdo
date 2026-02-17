import { ReactElement } from 'react';
import { LoginPage } from '../pages/LoginPage';
import { IndexPage } from '../pages/IndexPage';
import { OrderPage } from '../pages/OrderPage';
import { StatistikaPage } from '../pages/StatistikaPage';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { ROUTES } from '../constants';

export interface RouteConfig {
    path: string;
    element: ReactElement;
    isPublic?: boolean;
}

export const publicRoutes: RouteConfig[] = [
    {
        path: ROUTES.LOGIN,
        element: <LoginPage />,
        isPublic: true,
    },
];

export const privateRoutes: RouteConfig[] = [
    {
        path: ROUTES.HOME,
        element: (
            <ProtectedRoute>
                <Layout>
                    <IndexPage />
                </Layout>
            </ProtectedRoute>
        ),
    },
    {
        path: ROUTES.ORDER,
        element: (
            <ProtectedRoute>
                <Layout>
                    <OrderPage />
                </Layout>
            </ProtectedRoute>
        ),
    },
    {
        path: '/order/:id',
        element: (
            <ProtectedRoute>
                <Layout>
                    <OrderPage />
                </Layout>
            </ProtectedRoute>
        ),
    },
    {
        path: '/order/show/:id',
        element: (
            <ProtectedRoute>
                <Layout>
                    <OrderPage />
                </Layout>
            </ProtectedRoute>
        ),
    },
    {
        path: ROUTES.STATISTICS,
        element: (
            <ProtectedRoute>
                <Layout>
                    <StatistikaPage />
                </Layout>
            </ProtectedRoute>
        ),
    },
];
