import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import HomePage from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { ApiPage } from './pages/ApiPage';
import DocsPage from './pages/DocsPage';
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

// Define all application routes here
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
      },
      {
        path: '/api',
        element: <ApiPage />
      },
      {
        path: '/docs',
        element: <DocsPage />
      }
    ]
  }
]);

// Router component to use in App.tsx
export function AppRouter() {
  return <RouterProvider router={router} />;
}