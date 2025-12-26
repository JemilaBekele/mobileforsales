// hooks/useAuth.ts
import { useSelector } from 'react-redux';

export function useAuth() {
  const { isAuthenticated, token, user } = useSelector((state: any) => state.auth);
  
  return {
    isAuthenticated, // Now this exists in the state
    token,
    user
  };
}