import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

// Define the authGuard function
export const authGuard: CanActivateFn = () => {
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  const userRole = localStorage.getItem('role'); // Assuming role is stored in localStorage

  const router = inject(Router);

  if (isLoggedIn === 'true') {
    if (userRole === 'admin') {
      return true; // Allow admin to access admin routes
    } else if (userRole === 'user') {
      router.navigate(['/agent-dashboard']); // Redirect users to agent dashboard
      return false;
    } else {
      router.navigate(['/login']); // Redirect if no valid role found
      return false;
    }
  } else {
    router.navigate(['/login']); // Redirect if not logged in
    return false;
  }
};
