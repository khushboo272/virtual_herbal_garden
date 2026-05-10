import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';

export const NavbarLogo = () => {
  return (
    <Link to="/" className="flex items-center gap-2 no-underline">
      <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shrink-0">
        <Leaf className="w-5 h-5 md:w-6 md:h-6 text-white" />
      </div>
      <h1 className="text-lg md:text-xl text-green-800 font-semibold hidden min-[400px]:block">
        Virtual Herbal Garden
      </h1>
    </Link>
  );
};

