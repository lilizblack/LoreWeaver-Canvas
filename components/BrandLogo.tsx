"use client";

import React from 'react';

interface BrandLogoProps {
  className?: string;
  withGlow?: boolean;
}

export const BrandLogo = ({ className = "w-10 h-10", withGlow = true }: BrandLogoProps) => {
  return (
    <div className={`relative ${className} group cursor-pointer transition-all duration-500 hover:scale-110 active:scale-95 flex items-center justify-center`}>
      {/* Dynamic Ambient Glow */}
      {withGlow && (
        <>
          <div className="absolute inset-0 bg-[#4B0082]/30 blur-2xl rounded-full group-hover:bg-[#4B0082]/50 transition-all duration-700 animate-pulse" />
          <div className="absolute inset-2 bg-indigo-500/10 blur-lg rounded-full group-hover:bg-indigo-500/20 transition-all duration-500" />
        </>
      )}
      
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <img 
          src="/images/loreweaver-logo.png" 
          alt="Loreweaver" 
          className="w-full h-full object-contain filter brightness-[1.15] contrast-[1.05] drop-shadow-[0_0_20px_rgba(75,0,130,0.5)] group-hover:brightness-125 transition-all duration-500"
        />
      </div>
    </div>
  );
};
