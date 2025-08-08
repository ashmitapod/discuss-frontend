import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import AuthConsumer from "../../components/AuthContext";
import InfinitePostsLayout from "../../components/InfinitePosts";

export default function SavedPosts() {
  const { isAuthenticated, user } = AuthConsumer();
  const navigate = useNavigate();
  
  // Check authentication on component mount
  const { error: authError } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await axios.get('/api/user');
      return response.data;
    },
    retry: false,
    enabled: isAuthenticated, // Only run if we think we're authenticated
  });

  useEffect(() => {
    document.title = "Discuss | saved";
    return () => {
      document.title = "Discuss";
    };
  }, []);

  useEffect(() => {
    // Redirect if not authenticated or auth check failed
    if (!isAuthenticated || authError?.response?.status === 401) {
      navigate('/login');
    }
  }, [isAuthenticated, authError, navigate]);

  // Show loading or redirect message while checking auth
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center p-8 w-full">
        <div className="p-5 bg-white rounded-xl border-2 md:text-base hover:shadow-sm border-theme-gray-blue">
          Redirecting to login...
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center p-2 w-full">
      <InfinitePostsLayout 
        apiQueryKey="saved" 
        linkUrl="posts/saved" 
        forSaved={true}
        enabled={isAuthenticated} // Only fetch if authenticated
      />
    </div>
  );
}