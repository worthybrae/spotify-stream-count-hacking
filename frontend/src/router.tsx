import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import HomePage from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { ApiPage } from './pages/ApiPage';
import MainLayout from './components/layout/MainLayout';

// Define all application routes here
const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
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
      }
    ]
  }
]);

// Router component to use in App.tsx
export function AppRouter() {
  return <RouterProvider router={router} />;
}