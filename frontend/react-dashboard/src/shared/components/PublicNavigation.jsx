import { NavLink } from 'react-router-dom';
import './PublicNavigation.css';

export default function PublicNavigation() {
  return (
    <nav className="public-navigation" aria-label="Primary navigation">
      <NavLink to="/" end>Home</NavLink>
      <NavLink to="/register" end>Register</NavLink>
      <NavLink to="/login" end>Login</NavLink>
      <NavLink to="/platform-admin/login">Super Admin</NavLink>
    </nav>
  );
}
