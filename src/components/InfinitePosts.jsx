import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import PropTypes from "prop-types";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Post from "./Post";
import Loader from "./Loader";

InfinitePostsLayout.propTypes = {
  linkUrl: PropTypes.string,
  apiQueryKey: PropTypes.string,
  forSaved: PropTypes.bool,
  enabled: PropTypes.bool,
};

export default function InfinitePostsLayout({ linkUrl, apiQueryKey, forSaved = false, enabled = true }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const sortBy = searchParams.get("sortBy") || "top";
  const duration = searchParams.get("duration") || "alltime";
  
  const { data, isFetching, hasNextPage, fetchNextPage, error } = useInfiniteQuery({
    queryKey: ["posts", apiQueryKey, sortBy, duration],
    queryFn: async ({ pageParam = 0 }) => {
      try {
        // ✅ Map linkUrl to correct backend endpoints
        const getApiEndpoint = (linkUrl) => {
          // Handle different feed types
          if (linkUrl === 'posts/all' || linkUrl === 'posts/home') {
            return '/api/posts/all';
          }
          
          // Thread posts - these work!
          if (linkUrl.startsWith('posts/thread/')) {
            const threadId = linkUrl.split('/')[2];
            return `/api/posts/thread/${threadId}`;
          }
          
          // User posts - endpoint exists but might be empty
          if (linkUrl.startsWith('posts/user/')) {
            const username = linkUrl.split('/')[2];
            return `/api/posts/user/${username}`;
          }
          
          // Saved posts - needs authentication
          if (linkUrl === 'posts/saved') {
            return '/api/posts/saved';
          }
          
          // Default fallback to all posts
          console.warn('🔥 Unknown linkUrl:', linkUrl, '- falling back to /api/posts/all');
          return '/api/posts/all';
        };

        const endpoint = getApiEndpoint(linkUrl);
        const url = `${endpoint}?limit=${20}&offset=${pageParam * 20}&sortby=${sortBy}&duration=${duration}`;
        
        console.log('📤 Fetching posts:', url);
        
        const response = await axios.get(url);
        console.log('📥 Posts received:', response.data?.length || 0);
        
        return response.data;
        
      } catch (error) {
        console.error('❌ Error fetching posts:', error.response?.status, error.response?.data);
        
        // Handle specific errors gracefully
        if (error.response?.status === 401) {
          console.log('🔐 Authentication required for:', linkUrl);
          // Return empty array for unauthorized requests instead of throwing
          if (linkUrl === 'posts/saved') {
            return [];
          }
        }
        
        if (error.response?.status === 404) {
          console.log('🔍 Endpoint not found:', linkUrl);
          return [];
        }
        
        // Re-throw other errors for react-query to handle
        throw error;
      }
    },
    enabled: enabled,
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length < 20) return undefined;
      return pages.length;
    },
    retry: (failureCount, error) => {
      // Don't retry on 401 (unauthorized) or 404 (not found)
      if (error?.response?.status === 401 || error?.response?.status === 404) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
  });

  useEffect(() => {
    const onScroll = (event) => {
      const { scrollTop, scrollHeight, clientHeight } = event.target.scrollingElement;
      if (scrollHeight - scrollTop <= clientHeight * 2 && hasNextPage && !isFetching) {
        fetchNextPage();
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [fetchNextPage, isFetching, hasNextPage]);

  function handleDurationChange(newDuration) {
    searchParams.set("duration", newDuration);
    setSearchParams(searchParams, { replace: true });
  }

  function handleSortByChange(newSortBy) {
    searchParams.set("sortBy", newSortBy);
    setSearchParams(searchParams, { replace: true });
  }

  // Handle error states
  if (error && error.response?.status === 401 && linkUrl === 'posts/saved') {
    return (
      <div className="flex w-full flex-col flex-1 p-2 space-y-3 rounded-lg m-0.5 bg-theme-cultured md:bg-white md:m-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <p className="p-5 bg-white rounded-xl border-2 md:text-base hover:shadow-sm border-theme-gray-blue">
            Please log in to view your saved posts.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      id="main-content"
      className="flex w-full flex-col flex-1 p-2 space-y-3 rounded-lg m-0.5 bg-theme-cultured md:bg-white md:m-3">
      {!forSaved && (
        <header className="flex justify-between items-center">
          <div className="flex items-center space-x-2 md:hidden">
            <span>Sort by</span>
            <select
              name="sort"
              id="sort"
              className="p-2 px-4 bg-white rounded-md md:bg-theme-cultured"
              onChange={(e) => handleSortByChange(e.target.value)}
              value={sortBy}>
              <option value="top">Top</option>
              <option value="hot">Hot</option>
              <option value="new">New</option>
            </select>
          </div>
          <div className="flex items-center space-x-2 md:hidden">
            <span>Of</span>
            <select
              name="duration"
              id="duration"
              className="p-2 px-4 bg-white rounded-md md:bg-theme-cultured"
              onChange={(e) => handleDurationChange(e.target.value)}
              value={duration}>
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
              <option value="alltime">All Time</option>
            </select>
          </div>
          <ul className="hidden space-x-2 list-none md:flex">
            <li
              className={`p-2 hover:bg-theme-gray-blue rounded-md px-4 text-lg cursor-pointer ${duration === "day" && "bg-theme-gray-blue"
                }`}
              onClick={() => handleDurationChange("day")}>
              Today
            </li>
            <li
              className={`p-2 hover:bg-theme-gray-blue rounded-md px-4 text-lg cursor-pointer ${duration === "week" && "bg-theme-gray-blue"
                }`}
              onClick={() => handleDurationChange("week")}>
              Week
            </li>
            <li
              className={`p-2 hover:bg-theme-gray-blue rounded-md px-4 text-lg cursor-pointer ${duration === "month" && "bg-theme-gray-blue"
                }`}
              onClick={() => handleDurationChange("month")}>
              Month
            </li>
            <li
              className={`p-2 hover:bg-theme-gray-blue rounded-md px-4 text-lg cursor-pointer ${duration === "alltime" && "bg-theme-gray-blue"
                }`}
              onClick={() => handleDurationChange("alltime")}>
              All
            </li>
          </ul>
          <ul className="hidden mr-5 space-x-5 list-none md:flex">
            <li
              className={`p-2 hover:bg-theme-gray-blue rounded-md px-4 text-lg cursor-pointer ${sortBy === "hot" && "bg-theme-gray-blue"
                }`}
              onClick={() => handleSortByChange("hot")}>
              Hot
            </li>
            <li
              className={`p-2 hover:bg-theme-gray-blue rounded-md px-4 text-lg cursor-pointer ${sortBy === "new" && "bg-theme-gray-blue"
                }`}
              onClick={() => handleSortByChange("new")}>
              New
            </li>
            <li
              className={`p-2 hover:bg-theme-gray-blue rounded-md px-4 text-lg cursor-pointer ${sortBy === "top" && "bg-theme-gray-blue"
                }`}
              onClick={() => handleSortByChange("top")}>
              Top
            </li>
          </ul>
        </header>
      )}
      {isFetching && <Loader forPosts={true} />}
      {data?.pages[0]?.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <p className="p-5 bg-white rounded-xl border-2 md:text-base hover:shadow-sm border-theme-gray-blue">
            No posts with this filter were found, <br className="md:hidden" />
            Be the first to add one!
          </p>
        </motion.div>
      ) : (
        <div className="flex flex-col space-y-2 md:space-y-3">
          {data?.pages.map((pageData, index) => (
            <ul className="flex flex-col space-y-2 md:space-y-3" key={index}>
              <AnimatePresence initial={index == 0}>
                {pageData?.map((post, postIndex) => (
                  <Post post={post} key={post.post_info.id} postIndex={postIndex} />
                ))}
              </AnimatePresence>
            </ul>
          ))}
        </div>
      )}
    </div>
  );
}