"use client";

import React from 'react';

interface BrandLogoProps {
  className?: string;
  withGlow?: boolean;
}

export const BrandLogo = ({ className = "w-10 h-10", withGlow = true }: BrandLogoProps) => {
  return (
    <div className={`relative ${className} group cursor-pointer transition-transform duration-500 hover:scale-110 active:scale-95 flex items-center justify-center`}>
      {/* Ambient Glow behind the logo */}
      {withGlow && (
        <div className="absolute inset-0 bg-purple-600/20 blur-xl rounded-full group-hover:bg-purple-600/40 transition-all duration-700 animate-pulse" />
      )}
      
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <img 
          src="/images/loreweaver-logo.png" 
          alt="Loreweaver" 
          className="w-full h-full object-contain filter brightness-110 contrast-[1.1] drop-shadow-[0_0_15px_rgba(76,29,149,0.3)] group-hover:brightness-125 transition-all duration-500"
        />
      </div>
    </div>
  );
};
