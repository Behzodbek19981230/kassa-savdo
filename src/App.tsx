import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/Toaster';
import { publicRoutes, privateRoutes } from './config/routes';
import { ROUTES } from './constants';

export function App() {
	return (
		<>
			<BrowserRouter>
				<Routes>
					{publicRoutes.map((route) => (
						<Route key={route.path} path={route.path} element={route.element} />
					))}
					{privateRoutes.map((route) => (
						<Route key={route.path} path={route.path} element={route.element} />
					))}
					<Route path='*' element={<Navigate to={ROUTES.HOME} replace />} />
				</Routes>
			</BrowserRouter>
			<Toaster />
		</>
	);
}
