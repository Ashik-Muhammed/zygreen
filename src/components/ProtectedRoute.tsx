import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, Button, Container, Heading, Text, VStack } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import React from 'react';

// Role types for type safety
type UserRole = 'admin' | 'student';

type ProtectedRouteProps = {
  /**
   * The minimum role required to access the route
   * If not provided, any authenticated user can access the route
   */
  requiredRole?: UserRole;
  /**
   * If true, only admins can access this route
   */
  adminOnly?: boolean;
  /**
   * Child elements to render if the user is authorized
   */
  children?: React.ReactNode;
};

// Role hierarchy - higher index means more privileges
const ROLE_HIERARCHY: UserRole[] = ['student', 'admin'];

/**
 * A protected route that checks if the user is authenticated and has the required role
 * If not authenticated, redirects to login
 * If authenticated but missing required role, shows unauthorized message
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  requiredRole, 
  adminOnly = false,
  children 
}) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user role from Firestore
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role as UserRole);
        } else {
          console.warn('User document not found in Firestore');
          setUserRole('student'); // Default role
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole('student'); // Default role on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [currentUser]);

  if (loading || isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="100vh">
        <Text>Loading...</Text>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // If no role requirements, render the protected content
  if (!requiredRole && !adminOnly) {
    return children ? <>{children}</> : <Outlet />;
  }

  // Check if user has required role if specified
  if (userRole) {
    const roleToCheck = adminOnly ? 'admin' : requiredRole;
    
    if (roleToCheck) {
      const requiredLevel = ROLE_HIERARCHY.indexOf(roleToCheck);
      const userLevel = ROLE_HIERARCHY.indexOf(userRole);

      if (userLevel < requiredLevel) {
        return (
          <Container maxW="container.md" py={10}>
            <VStack spacing={6} textAlign="center">
              <Heading as="h1" size="xl">Access Denied</Heading>
              <Text fontSize="lg">
                You don't have permission to access this page.
              </Text>
              <Text color="gray.600">
                Required role: {roleToCheck}
                <br />
                Your role: {userRole}
              </Text>
              <Button
                as="a"
                href="/"
                colorScheme="blue"
                variant="outline"
              >
                Back to Home
              </Button>
            </VStack>
          </Container>
        );
      }
    }
  }
  
  // If we have children, render them, otherwise render the outlet
  return children ? <>{children}</> : <Outlet />;
}

export default ProtectedRoute;
