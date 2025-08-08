import { Navigate, useLocation } from "react-router-dom";
import AuthConsumer from "./AuthContext.jsx";
import PropTypes from "prop-types";

RequireAuth.propTypes = {
  children: PropTypes.node,
  redirectTo: PropTypes.string,
};

function RequireAuth({ children, redirectTo = "/login" }) {
  const { isAuthenticated, user, isLoading } = AuthConsumer();
  const location = useLocation();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 w-full">
        <div className="p-5 bg-white rounded-xl border-2 md:text-base hover:shadow-sm border-theme-gray-blue">
          Loading...
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    // Save the attempted location for redirect after login
    return <Navigate replace={true} to={redirectTo} state={{ from: location }} />;
  }

  return children;
}

export default RequireAuth;