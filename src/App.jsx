import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Suspense, lazy } from "react";
import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";
import axios from 'axios';
import AppLayout from "./components/AppLayout.jsx";
import { AuthProvider } from "./components/AuthContext.jsx";
import Error from "./components/Error.jsx";
import FeedLayout from "./components/FeedLayout.jsx";
import Loader from "./components/Loader.jsx";
import RequireAuth from "./components/PrivateRoute.jsx";
import Login from "./pages/login/Login.jsx";
import Register from "./pages/register/Register.jsx";

// Configure axios defaults
const configureAxios = () => {
  // Set API URL based on environment
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  console.log('🔧 API URL configured:', apiUrl);
  
  axios.defaults.baseURL = apiUrl;
  axios.defaults.withCredentials = true;
  
  // ✅ Improved request interceptor for auth tokens
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log('📤 Request:', config.method?.toUpperCase(), config.url);
      return config;
    },
    (error) => {
      console.error('❌ Request error:', error);
      return Promise.reject(error);
    }
  );
  
  // ✅ Improved response interceptor with better error handling
  axios.interceptors.response.use(
    (response) => {
      console.log('📥 Response:', response.status, response.config.url);
      return response;
    },
    (error) => {
      const status = error.response?.status;
      const url = error.config?.url;
      
      console.error(`❌ API Error [${status}]:`, url, error.response?.data);
      
      if (status === 401) {
        console.log('🔐 Unauthorized - removing token');
        localStorage.removeItem('token');
        // Don't automatically redirect here - let components handle it
        // This prevents React Router Error #300
      }
      
      if (status === 400) {
        console.error('🔥 Bad Request - check endpoint:', url);
      }
      
      if (status === 404) {
        console.error('🔍 Not Found - endpoint might not exist:', url);
      }
      
      return Promise.reject(error);
    }
  );
};

// Configure axios when the module loads
configureAxios();

const Feed = lazy(() => import("./pages/feed/Feed.jsx"));
const Profile = lazy(() => import("./pages/profile/Profile.jsx"));
const FullPost = lazy(() => import("./pages/fullPost/FullPost.jsx"));
const Inbox = lazy(() => import("./pages/inbox/Inbox.jsx"));
const SavedPosts = lazy(() => import("./pages/saved/SavedPosts.jsx"));
const SubThread = lazy(() => import("./pages/thread/SubThread.jsx"));

// ✅ Router with better error handling
const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <Error />,
    children: [
      {
        path: "/",
        element: <FeedLayout />,
        errorElement: <Error />, // Add error boundary for feed layout
        children: [
          {
            path: "/",
            element: <Navigate to="/all" />,
          },
          {
            path: "/:feedName",
            element: <Feed />,
            errorElement: <Error />,
          },
          {
            path: "/post/:postId",
            element: <FullPost />,
            errorElement: <Error />,
          },
        ],
      },
      {
        path: "/u/:username",
        element: <Profile />,
        errorElement: <Error />,
      },
      {
        path: "/t/:threadName",
        element: <SubThread />,
        errorElement: <Error />,
      },
      {
        path: "/saved",
        element: (
          <RequireAuth>
            <SavedPosts />
          </RequireAuth>
        ),
        errorElement: <Error />,
      },
      {
        path: "/inbox",
        element: (
          <RequireAuth>
            <Inbox />
          </RequireAuth>
        ),
        errorElement: <Error />,
      },
    ],
  },
  {
    path: "/login",
    element: <Login />,
    errorElement: <Error />,
  },
  {
    path: "/register",
    element: <Register />,
    errorElement: <Error />,
  },
]);

// ✅ Improved QueryClient with better error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 120000,
      retry: (failureCount, error) => {
        // Don't retry on 401 (unauthorized) or 404 (not found)
        if (error?.response?.status === 401 || error?.response?.status === 404) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false, // Don't retry mutations
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      <AuthProvider>
        <Suspense fallback={<Loader />}>
          <RouterProvider router={router} fallbackElement={<Loader />} />
        </Suspense>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;