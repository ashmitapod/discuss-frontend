import { useQuery, useQueryClient } from "@tanstack/react-query";
import PropTypes from "prop-types";
import { createContext, useContext, useState, useEffect } from "react";
import authApi from "./api/authApi"; // Import the configured axios instance

const AuthContext = createContext();

AuthProvider.propTypes = {
  children: PropTypes.any,
};

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const localData = JSON.parse(localStorage.getItem("user") || "null");
  const hasToken = !!localStorage.getItem("token");
  
  const [isAuthenticated, setIsAuthenticated] = useState(!!localData && hasToken);
  const [user, setUser] = useState(localData || {});
  const [isLoading, setIsLoading] = useState(hasToken); // Only load if we have a token

  // Listen for unauthorized events from axios interceptor
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const { refetch } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      try {
        const token = localStorage.getItem("token");
        
        if (!token) {
          throw new Error("No token found");
        }
        
        // Use the configured authApi instead of axios directly
        const res = await authApi.get("/user");
        
        localStorage.setItem("user", JSON.stringify(res.data));
        setUser(res.data);
        setIsAuthenticated(true);
        return res.data;
      } catch (error) {
        // Handle auth errors
        if (error.response?.status === 401 || error.message === "No token found") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser({});
          setIsAuthenticated(false);
        }
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    retry: false,
    enabled: hasToken, // Only run if token exists
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
  });

  function login(userInfo) {
    if (!userInfo) {
      console.error("Login called with no user info");
      return;
    }

    if (userInfo.token) {
      localStorage.setItem("token", userInfo.token);
    }
    
    localStorage.setItem("user", JSON.stringify(userInfo));
    setUser(userInfo);
    setIsAuthenticated(true);
    setIsLoading(false);
    
    // Invalidate queries to refresh data
    queryClient.invalidateQueries(["user"]);
  }

  async function logout() {
    const token = localStorage.getItem("token");
    
    try {
      if (token) {
        await authApi.get("/user/logout");
      }
    } catch (error) {
      console.log("Logout API call failed, but proceeding with local cleanup");
    } finally {
      // Always clean up local state
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser({});
      setIsAuthenticated(false);
      setIsLoading(false);
      queryClient.clear();
      
      // Redirect to public page
      window.location.href = "/all";
    }
  }

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        login, 
        logout, 
        user,
        isLoading,
        refetch 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default function AuthConsumer() {
  return useContext(AuthContext);
}