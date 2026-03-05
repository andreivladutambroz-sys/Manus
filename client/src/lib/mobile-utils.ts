/**
 * Mobile Optimization Utilities
 * Provides responsive design helpers and touch-friendly constants
 */

// Touch target sizes (minimum 44x44px for accessibility)
export const TOUCH_TARGET_SIZE = {
  SMALL: "h-10 px-3", // 40px height
  MEDIUM: "h-12 px-4", // 48px height
  LARGE: "h-14 px-6", // 56px height
};

// Responsive spacing helpers
export const RESPONSIVE_SPACING = {
  CONTAINER_PADDING: "px-4 sm:px-6 lg:px-8",
  SECTION_GAP: "gap-4 sm:gap-6 lg:gap-8",
  GRID_GAP: "gap-3 sm:gap-4 lg:gap-6",
};

// Responsive typography
export const RESPONSIVE_TEXT = {
  H1: "text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold",
  H2: "text-xl sm:text-2xl md:text-3xl font-bold",
  H3: "text-lg sm:text-xl md:text-2xl font-semibold",
  BODY: "text-sm sm:text-base md:text-lg",
  SMALL: "text-xs sm:text-sm",
};

// Responsive grid layouts
export const RESPONSIVE_GRID = {
  COLS_1_2: "grid-cols-1 sm:grid-cols-2",
  COLS_1_2_3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  COLS_1_2_3_4: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  COLS_2_3_4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  COLS_2_4: "grid-cols-2 md:grid-cols-4",
};

// Mobile breakpoints
export const BREAKPOINTS = {
  XS: 320,
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  "2XL": 1536,
};

// Check if device is mobile
export const isMobileDevice = (): boolean => {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

// Get viewport width
export const getViewportWidth = (): number => {
  if (typeof window === "undefined") return 0;
  return window.innerWidth;
};

// Check if viewport is mobile size
export const isMobileViewport = (): boolean => {
  return getViewportWidth() < BREAKPOINTS.MD;
};

// Get responsive column count based on viewport
export const getResponsiveColumns = (viewport: number): number => {
  if (viewport < BREAKPOINTS.SM) return 1;
  if (viewport < BREAKPOINTS.MD) return 2;
  if (viewport < BREAKPOINTS.LG) return 3;
  return 4;
};

// Responsive font size helper
export const getResponsiveFontSize = (
  mobile: string,
  tablet: string,
  desktop: string
): string => {
  return `text-${mobile} sm:text-${tablet} md:text-${desktop}`;
};

// Responsive padding helper
export const getResponsivePadding = (
  mobile: string,
  tablet: string,
  desktop: string
): string => {
  return `p-${mobile} sm:p-${tablet} md:p-${desktop}`;
};

// Safe area padding for mobile notch support
export const SAFE_AREA_PADDING = "safe-area-inset-left safe-area-inset-right";

// Mobile-friendly form input class
export const MOBILE_INPUT_CLASS = "h-12 text-base";

// Mobile-friendly button class
export const MOBILE_BUTTON_CLASS = "h-12 text-base font-medium";

// Mobile-friendly select class
export const MOBILE_SELECT_CLASS = "h-12 text-base";
