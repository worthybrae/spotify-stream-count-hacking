// router.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import HomePage from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import MainLayout from './components/layout/MainLayout';
import RouteTracker from './components/utils/RouteTracker';

// Route tracker component for use inside MainLayout
const LayoutWithAnalytics = () => {
  return (
    <>
      <RouteTracker />
      <MainLayout />
    </>
  );
};

// Define all application routes here with client-side approach
const router = createBrowserRouter([
  {
    path: '/',
    element: <LayoutWithAnalytics />,
    children: [
      {
        index: true,
        element: <HomePage />
      },
      {
        path: '/about',
        element: <AboutPage />
      }
    ]
  }
]);

// Router component to use in App.tsx
export function AppRouter() {
  return <RouterProvider router={router} />;
}