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
  
  // Optional: Add request interceptor for auth tokens
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Optional: Add response interceptor for error handling
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        // You might want to redirect to login here
        // window.location.href = '/login';
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

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <Error />,
    children: [
      {
        path: "/",
        element: <FeedLayout />,
        children: [
          {
            path: "/",
            element: <Navigate to="/all" />,
          },
          {
            path: "/:feedName",
            element: <Feed />,
          },
          {
            path: "/post/:postId",
            element: <FullPost />,
          },
        ],
      },
      {
        path: "/u/:username",
        element: <Profile />,
      },
      {
        path: "/t/:threadName",
        element: <SubThread />,
      },
      {
        path: "/saved",
        element: (
          <RequireAuth>
            <SavedPosts />
          </RequireAuth>
        ),
      },
      {
        path: "/inbox",
        element: (
          <RequireAuth>
            <Inbox />
          </RequireAuth>
        ),
      },
    ],
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
]);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 120000,
    },
  },
});

export function App() {
  useEffect(() => {
    console.log('🔧 Environment check:');
    console.log('- VITE_API_URL:', import.meta.env.VITE_API_URL);
    console.log('- PROD mode:', import.meta.env.PROD);
    console.log('- Axios baseURL:', axios.defaults.baseURL);
  }, []);
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