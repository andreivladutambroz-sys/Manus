/**
 * Mobile Gesture Handlers
 * Provides touch gesture detection and handling for mobile interactions
 */

export interface SwipeDirection {
  direction: "left" | "right" | "up" | "down";
  distance: number;
  velocity: number;
}

export interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

/**
 * Detect swipe gestures
 */
export const useSwipeGesture = (
  onSwipe: (direction: SwipeDirection) => void,
  threshold = 50
) => {
  let startPoint: TouchPoint | null = null;

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    startPoint = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!startPoint) return;

    const endPoint: TouchPoint = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
      timestamp: Date.now(),
    };

    const deltaX = endPoint.x - startPoint.x;
    const deltaY = endPoint.y - startPoint.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const time = endPoint.timestamp - startPoint.timestamp;
    const velocity = distance / time;

    // Determine direction
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
      onSwipe({
        direction: deltaX > 0 ? "right" : "left",
        distance: Math.abs(deltaX),
        velocity,
      });
    } else if (Math.abs(deltaY) > threshold) {
      onSwipe({
        direction: deltaY > 0 ? "down" : "up",
        distance: Math.abs(deltaY),
        velocity,
      });
    }

    startPoint = null;
  };

  return { handleTouchStart, handleTouchEnd };
};

/**
 * Detect long press gesture
 */
export const useLongPressGesture = (
  onLongPress: () => void,
  duration = 500
) => {
  let pressTimer: NodeJS.Timeout | null = null;

  const handleTouchStart = () => {
    pressTimer = setTimeout(() => {
      onLongPress();
    }, duration);
  };

  const handleTouchEnd = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  };

  const handleTouchMove = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  };

  return { handleTouchStart, handleTouchEnd, handleTouchMove };
};

/**
 * Detect pinch zoom gesture
 */
export const usePinchGesture = (
  onPinch: (scale: number) => void
) => {
  let initialDistance = 0;

  const getDistance = (touches: any) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      initialDistance = getDistance(e.touches);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const currentDistance = getDistance(e.touches);
      if (initialDistance > 0) {
        const scale = currentDistance / initialDistance;
        onPinch(scale);
      }
    }
  };

  const handleTouchEnd = () => {
    initialDistance = 0;
  };

  return { handleTouchStart, handleTouchMove, handleTouchEnd };
};

/**
 * Detect double tap gesture
 */
export const useDoubleTapGesture = (
  onDoubleTap: () => void,
  delay = 300
) => {
  let lastTap = 0;

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap < delay) {
      onDoubleTap();
      lastTap = 0;
    } else {
      lastTap = now;
    }
  };

  return { handleTap };
};

/**
 * Haptic feedback for mobile
 */
export const triggerHapticFeedback = (type: "light" | "medium" | "heavy" = "light") => {
  if ("vibrate" in navigator) {
    const patterns: Record<string, number | number[]> = {
      light: 10,
      medium: 20,
      heavy: [30, 10, 30],
    };
    navigator.vibrate(patterns[type]);
  }
};

/**
 * Prevent default touch behaviors
 */
export const preventTouchScroll = (e: React.TouchEvent) => {
  if (e.touches.length > 1) {
    e.preventDefault();
  }
};

/**
 * Get safe area insets (for notched devices)
 */
export const getSafeAreaInsets = () => {
  const root = document.documentElement;
  return {
    top: parseInt(getComputedStyle(root).getPropertyValue("--safe-area-inset-top") || "0"),
    right: parseInt(getComputedStyle(root).getPropertyValue("--safe-area-inset-right") || "0"),
    bottom: parseInt(getComputedStyle(root).getPropertyValue("--safe-area-inset-bottom") || "0"),
    left: parseInt(getComputedStyle(root).getPropertyValue("--safe-area-inset-left") || "0"),
  };
};

/**
 * Check if device has notch
 */
export const hasNotch = () => {
  const insets = getSafeAreaInsets();
  return insets.top > 0 || insets.bottom > 0 || insets.left > 0 || insets.right > 0;
};

/**
 * Mobile keyboard detection
 */
export const useKeyboardDetection = (
  onKeyboardShow?: () => void,
  onKeyboardHide?: () => void
) => {
  const handleResize = () => {
    const isKeyboardVisible = window.innerHeight < window.screen.height * 0.75;
    if (isKeyboardVisible && onKeyboardShow) {
      onKeyboardShow();
    } else if (!isKeyboardVisible && onKeyboardHide) {
      onKeyboardHide();
    }
  };

  return { handleResize };
};

/**
 * Scroll to element smoothly
 */
export const smoothScrollToElement = (element: HTMLElement, offset = 0) => {
  const top = element.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({
    top,
    behavior: "smooth",
  });
};

/**
 * Detect if element is in viewport
 */
export const isElementInViewport = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth
  );
};

/**
 * Detect orientation change
 */
export const useOrientationChange = (
  onOrientationChange?: (orientation: "portrait" | "landscape") => void
) => {
  const handleOrientationChange = () => {
    const orientation = window.innerHeight > window.innerWidth ? "portrait" : "landscape";
    onOrientationChange?.(orientation);
  };

  return { handleOrientationChange };
};
