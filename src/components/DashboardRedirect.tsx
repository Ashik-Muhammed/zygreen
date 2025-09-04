import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

type UserRole = 'admin' | 'student';

const DashboardRedirect = () => {
  const { currentUser } = useAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) {
    return null; // Or a loading spinner
  }

  // Redirect based on user role
  return userRole === 'admin' 
    ? <Navigate to="/admin/dashboard" replace /> 
    : <Navigate to="/student/dashboard" replace />;
};

export default DashboardRedirect;
