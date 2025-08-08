import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AuthConsumer from "../../components/AuthContext";
import InfinitePostsLayout from "../../components/InfinitePosts";

export function Feed() {
  const { isAuthenticated } = AuthConsumer();
  const navigate = useNavigate();
  const { feedName } = useParams();

  // Redirect to login if trying to access home feed without authentication
  useEffect(() => {
    if (feedName === "home" && !isAuthenticated) {
      navigate("/login");
    }
  }, [feedName, isAuthenticated, navigate]);

  useEffect(() => {
    document.title = `Discuss | ${feedName || 'all'}`;
  }, [feedName]);

  // Don't render if redirecting
  if (feedName === "home" && !isAuthenticated) {
    return (
      <div className="flex items-center justify-center p-8 w-full">
        <div className="p-5 bg-white rounded-xl border-2 md:text-base hover:shadow-sm border-theme-gray-blue">
          Redirecting to login...
        </div>
      </div>
    );
  }

  return (
    <InfinitePostsLayout 
      linkUrl={`posts/${feedName || "all"}`} 
      apiQueryKey={feedName || "all"} 
    />
  );
}

export default Feed;