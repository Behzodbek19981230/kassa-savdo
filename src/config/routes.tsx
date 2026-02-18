import { ReactElement } from 'react';
import { LoginPage } from '../pages/LoginPage';
import { IndexPage } from '../pages/IndexPage';
import { OrderPage } from '../pages/OrderPage';
import { StatistikaPage } from '../pages/StatistikaPage';
import { DebtRepaymentPage } from '../pages/DebtRepaymentPage';
import { VozvratOrderPage } from '../pages/VozvratOrderPage';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { ROUTES } from '../constants';
import UpdateOrder from '@/pages/UpdateOrder';

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
        path: '/order/update/:id',
        element: (
            <ProtectedRoute>
                <Layout>
                    <UpdateOrder />
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
    {
        path: ROUTES.DEBT_REPAYMENT,
        element: (
            <ProtectedRoute>
                <Layout>
                    <DebtRepaymentPage />
                </Layout>
            </ProtectedRoute>
        ),
    },
    {
        path: ROUTES.VOZVRAT_ORDER,
        element: (
            <ProtectedRoute>
                <Layout>
                    <VozvratOrderPage />
                </Layout>
            </ProtectedRoute>
        ),
    },
    {
        path: '/tovar-qaytarish',
        element: (
            <ProtectedRoute>
                <Layout>
                    <VozvratOrderPage />
                </Layout>
            </ProtectedRoute>
        ),
    },
    {
        path: '/tovar-qaytarish/new',
        element: (
            <ProtectedRoute>
                <Layout>
                    <VozvratOrderPage />
                </Layout>
            </ProtectedRoute>
        ),
    },
    {
        path: '/tovar-qaytarish/:id',
        element: (
            <ProtectedRoute>
                <Layout>
                    <VozvratOrderPage />
                </Layout>
            </ProtectedRoute>
        ),
    },
    {
        path: '/tovar-qaytarish/show/:id',
        element: (
            <ProtectedRoute>
                <Layout>
                    <VozvratOrderPage />
                </Layout>
            </ProtectedRoute>
        ),
    },
    {
        path: '/tovar-qaytarish/update/:id',
        element: (
            <ProtectedRoute>
                <Layout>
                    <VozvratOrderPage />
                </Layout>
            </ProtectedRoute>
        ),
    },
];
