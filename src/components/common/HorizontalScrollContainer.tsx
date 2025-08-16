'use client'

import React, { useRef, useState, useEffect, ReactNode } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useDarkMode } from '@/src/hooks/useDarkMode';

interface HorizontalScrollContainerProps {
  children: ReactNode;
  title?: string | ReactNode;
  subtitle?: string;
  showViewAll?: boolean;
  onViewAll?: () => void;
  viewAllCount?: number;
  className?: string;
  itemSpacing?: 'sm' | 'md' | 'lg';
  showNavigation?: boolean;
  enableMouseDrag?: boolean;
}

export default function HorizontalScrollContainer({
  children,
  title,
  subtitle,
  showViewAll = false,
  onViewAll,
  viewAllCount,
  className = '',
  itemSpacing = 'md',
  showNavigation = true,
  enableMouseDrag = true,
}: HorizontalScrollContainerProps) {
  const { isDarkMode } = useDarkMode();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [dragDistance, setDragDistance] = useState(0);
  const rafIdRef = useRef<number | null>(null);

  // Spacing classes
  const spacingClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6'
  };

  // Check scroll position to show/hide navigation buttons
  const checkScrollPosition = () => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < maxScrollLeft - 1); // -1 for rounding issues
  };

  // Scroll functions
  const scrollTo = (direction: 'left' | 'right', event?: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    
    // Prevent event bubbling that might trigger scroll snap
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth * 0.8; // Scroll 80% of container width
    const targetScrollLeft = direction === 'left' 
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;
    
    container.scrollTo({
      left: targetScrollLeft,
      behavior: 'smooth'
    });
  };

  // Mouse drag functionality with smooth scrolling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!enableMouseDrag || !scrollContainerRef.current) return;
    
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
    setDragDistance(0); // Reset drag distance
    
    // Prevent text selection while dragging
    e.preventDefault();
    
    // Disable smooth scrolling during drag
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.scrollBehavior = 'auto';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.2; // Reduced multiplier for smoother feel
    
    // Track total drag distance
    setDragDistance(Math.abs(walk));
    
    // Cancel previous animation frame to prevent queue buildup
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    
    // Use single requestAnimationFrame for smooth scrolling
    rafIdRef.current = requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = scrollLeft - walk;
      }
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    
    // Cancel any pending animation frames
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    
    // Re-enable smooth scrolling
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.scrollBehavior = 'smooth';
    }
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    
    // Cancel any pending animation frames
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    
    // Re-enable smooth scrolling
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.scrollBehavior = 'smooth';
    }
  };

  // Touch events for mobile drag support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!enableMouseDrag || !scrollContainerRef.current) return;
    
    setIsDragging(true);
    setStartX(e.touches[0].pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
    setDragDistance(0); // Reset drag distance
    
    // Disable smooth scrolling during touch drag
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.scrollBehavior = 'auto';
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    
    const x = e.touches[0].pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.2; // Same smooth multiplier as mouse
    
    // Track total drag distance
    setDragDistance(Math.abs(walk));
    
    // Cancel previous animation frame to prevent queue buildup
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    
    // Use single requestAnimationFrame for smooth scrolling
    rafIdRef.current = requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = scrollLeft - walk;
      }
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    // Cancel any pending animation frames
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    
    // Re-enable smooth scrolling
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.scrollBehavior = 'smooth';
    }
  };

  // Check scroll position on mount and scroll events
  useEffect(() => {
    checkScrollPosition();
    
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
  }, [children]);

  // Resize observer to check scroll position when container size changes
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    
    const resizeObserver = new ResizeObserver(() => {
      checkScrollPosition();
    });
    
    resizeObserver.observe(scrollContainerRef.current);
    
    return () => resizeObserver.disconnect();
  }, []);

  // Cleanup animation frames on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`} style={{ contain: 'layout style paint' }}>
      {/* Header */}
      {(title || showViewAll) && (
        <div className="flex items-center justify-between mb-4">
          {title && (
            <div className="flex items-center gap-2">
              {typeof title === 'string' ? (
                <h2 className={`text-2xl font-semibold md:text-3xl ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-900'
                }`}>
                  {title}
                </h2>
              ) : (
                <div className="flex items-center gap-2">
                  {title}
                </div>
              )}
              {subtitle && (
                <span className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {subtitle}
                </span>
              )}
            </div>
          )}
          
          {showViewAll && onViewAll && (
            <button
              onClick={onViewAll}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
                isDarkMode
                  ? 'bg-gray-800/60 text-gray-300 hover:bg-purple-600/20 hover:text-white border border-gray-700/30'
                  : 'bg-white/60 text-gray-700 hover:bg-purple-600/20 hover:text-purple-700 border border-gray-200/30'
              } backdrop-blur-lg`}
            >
              <span>View All {viewAllCount ? `(${viewAllCount})` : ''}</span>
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Scrollable Container */}
      <div className="relative group">
        {/* Left Navigation Button */}
        {showNavigation && (
          <button
            onClick={(e) => scrollTo('left', e)}
            disabled={!canScrollLeft}
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-16 flex items-center justify-center transition-all duration-300 ${
              canScrollLeft
                ? isDarkMode
                  ? 'bg-slate-800/90 text-white shadow-lg'
                  : 'bg-white/90 text-gray-700 shadow-lg'
                : 'opacity-0 pointer-events-none'
            } backdrop-blur-sm rounded-r-lg border-r ${
              isDarkMode ? 'border-slate-600/30' : 'border-gray-200/30'
            }`}
            style={{ 
              opacity: canScrollLeft ? (isDragging ? 0.6 : 0.9) : 0,
              transform: `translateY(-50%) ${canScrollLeft ? 'translateX(0)' : 'translateX(-100%)'}`
            }}
            aria-label="Scroll left"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
        )}

        {/* Right Navigation Button */}
        {showNavigation && (
          <button
            onClick={(e) => scrollTo('right', e)}
            disabled={!canScrollRight}
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-16 flex items-center justify-center transition-all duration-300 ${
              canScrollRight
                ? isDarkMode
                  ? 'bg-slate-800/90 text-white shadow-lg'
                  : 'bg-white/90 text-gray-700 shadow-lg'
                : 'opacity-0 pointer-events-none'
            } backdrop-blur-sm rounded-l-lg border-l ${
              isDarkMode ? 'border-slate-600/30' : 'border-gray-200/30'
            }`}
            style={{ 
              opacity: canScrollRight ? (isDragging ? 0.6 : 0.9) : 0,
              transform: `translateY(-50%) ${canScrollRight ? 'translateX(0)' : 'translateX(100%)'}`
            }}
            aria-label="Scroll right"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        )}

        {/* Scroll Container */}
        <div
          ref={scrollContainerRef}
          className={`flex overflow-x-auto overflow-y-hidden scrollbar-hide pt-6 pb-2 px-1 ${spacingClasses[itemSpacing]} ${
            enableMouseDrag ? 'cursor-grab' : ''
          } ${isDragging ? 'cursor-grabbing select-none' : ''}`}
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          data-drag-distance={dragDistance}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onScroll={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
