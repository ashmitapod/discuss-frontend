import { useEffect } from "react";
import InfinitePostsLayout from "../../components/InfinitePosts";


export default function SavedPosts() {
  useEffect(() => {
    document.title = "Discuss | saved";
    return () => {
      document.title = "Discuss";
    };
  })
  return (
    <div className="flex items-center p-2 w-full">
      <InfinitePostsLayout apiQueryKey="saved" linkUrl={`posts/saved`} forSaved={true} />
    </div>
  );
}
