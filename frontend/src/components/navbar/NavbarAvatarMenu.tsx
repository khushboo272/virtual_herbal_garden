import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../app/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../../app/components/ui/avatar';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const NavbarAvatarMenu = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const initials = user.displayName?.charAt(0).toUpperCase() || 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-green-500 transition-all hover:opacity-80">
          <Avatar className="w-8 h-8 md:w-9 md:h-9 border border-green-200">
            <AvatarImage src={user.avatarUrl || ''} alt={user.displayName} />
            <AvatarFallback className="bg-green-100 text-green-700 font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 mt-1">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-gray-900">{user.displayName}</p>
            <p className="text-xs leading-none text-gray-500">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer">
          <User className="mr-2 h-4 w-4 text-gray-500" />
          <span>Dashboard</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4 text-gray-500" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-700 cursor-pointer focus:bg-red-50">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

