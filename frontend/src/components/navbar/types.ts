export type NavVariant = 'public' | 'user' | 'expert' | 'admin';

export interface NavLink {
  label: string;
  route: string;
  icon?: any; // React component or icon
}

export interface NavbarProps {
  variant?: NavVariant;
}
