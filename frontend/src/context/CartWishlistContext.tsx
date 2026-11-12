import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useAuth } from './AuthContext';
import {
  cartWishlistApi,
  type CartItemResponse,
  type WishlistItemResponse,
} from '../services/cartWishlistApi';
import type { Course } from '../types/course';
import { flyItemToCart } from '../utils/cartAnimation';

export interface CartNotificationData {
  visible: boolean;
  course: Course;
  message?: string;
}

interface CartWishlistContextType {
  cartItems: CartItemResponse[];
  cartCount: number;
  totalAmount: number;
  wishlistItems: WishlistItemResponse[];
  wishlistCount: number;
  isCartOpen: boolean;
  isWishlistOpen: boolean;
  isLoading: boolean;
  cartNotification: CartNotificationData | null;
  isCartBouncing: boolean;
  openCart: () => void;
  closeCart: () => void;
  openWishlist: () => void;
  closeWishlist: () => void;
  showCartNotification: (course: Course, message?: string) => void;
  hideCartNotification: () => void;
  triggerCartBounce: () => void;
  addToCart: (
    course: Course,
    eventOrCoords?: React.MouseEvent | { x: number; y: number },
  ) => Promise<{ success: boolean; message: string }>;
  removeFromCart: (courseId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleWishlist: (
    course: Course,
  ) => Promise<{ success: boolean; isWishlisted: boolean; message: string }>;
  moveToWishlist: (course: Course) => Promise<void>;
  moveToCart: (course: Course) => Promise<void>;
  isInCart: (courseId: string) => boolean;
  isInWishlist: (courseId: string) => boolean;
  refreshCart: () => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

const CartWishlistContext = createContext<CartWishlistContextType | undefined>(
  undefined,
);

const GUEST_CART_KEY = 'purr_guest_cart';
const GUEST_WISHLIST_KEY = 'purr_guest_wishlist';

// Helper to load guest data from localStorage
const loadGuestCart = (): CartItemResponse[] => {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const loadGuestWishlist = (): WishlistItemResponse[] => {
  try {
    const raw = localStorage.getItem(GUEST_WISHLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const CartWishlistProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();

  const [cartItems, setCartItems] = useState<CartItemResponse[]>(() =>
    loadGuestCart(),
  );
  const [wishlistItems, setWishlistItems] = useState<WishlistItemResponse[]>(
    () => loadGuestWishlist(),
  );
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cartNotification, setCartNotification] =
    useState<CartNotificationData | null>(null);
  const [isCartBouncing, setIsCartBouncing] = useState(false);
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const bounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerCartBounce = useCallback(() => {
    setIsCartBouncing(true);
    if (bounceTimerRef.current) clearTimeout(bounceTimerRef.current);
    bounceTimerRef.current = setTimeout(() => {
      setIsCartBouncing(false);
    }, 700);
  }, []);

  const hideCartNotification = useCallback(() => {
    setCartNotification((prev) => (prev ? { ...prev, visible: false } : null));
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
    }
  }, []);

  const showCartNotification = useCallback(
    (course: Course, message = 'Có 1 sản phẩm mới thêm vào giỏ') => {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
      setCartNotification({
        visible: true,
        course,
        message,
      });
      notificationTimerRef.current = setTimeout(() => {
        setCartNotification((prev) =>
          prev ? { ...prev, visible: false } : null,
        );
      }, 4500);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (notificationTimerRef.current)
        clearTimeout(notificationTimerRef.current);
      if (bounceTimerRef.current) clearTimeout(bounceTimerRef.current);
    };
  }, []);

  // Helper to calculate total amount from cart items
  const computeTotalAmount = (items: CartItemResponse[]): number => {
    return items.reduce((sum, item) => {
      const c = item.courseId;
      if (!c) return sum;
      const price =
        c.discountPrice && c.discountPrice > 0 && c.discountPrice < c.price
          ? c.discountPrice
          : c.price;
      return sum + (price || 0);
    }, 0);
  };

  const saveGuestCart = (items: CartItemResponse[]) => {
    try {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  };

  const saveGuestWishlist = (items: WishlistItemResponse[]) => {
    try {
      localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  };

  // Fetch cart items
  const refreshCart = useCallback(async () => {
    if (isAuthenticated) {
      setIsLoading(true);
      try {
        const data = await cartWishlistApi.getCart();
        setCartItems(data.items || []);
      } catch {
        // Fallback to empty if error
      } finally {
        setIsLoading(false);
      }
    } else {
      setCartItems(loadGuestCart());
    }
  }, [isAuthenticated]);

  // Fetch wishlist items
  const refreshWishlist = useCallback(async () => {
    if (isAuthenticated) {
      try {
        const data = await cartWishlistApi.getWishlist();
        setWishlistItems(data.items || []);
      } catch {
        // Fallback
      }
    } else {
      setWishlistItems(loadGuestWishlist());
    }
  }, [isAuthenticated]);

  // Sync on auth state changes
  useEffect(() => {
    let isMounted = true;
    if (isAuthenticated) {
      Promise.all([cartWishlistApi.getCart(), cartWishlistApi.getWishlist()])
        .then(([cartData, wishData]) => {
          if (isMounted) {
            setCartItems(cartData.items || []);
            setWishlistItems(wishData.items || []);
          }
        })
        .catch(() => {
          // ignore
        });
    } else {
      // In guest mode, load asynchronously to prevent cascading renders
      setTimeout(() => {
        if (isMounted) {
          setCartItems(loadGuestCart());
          setWishlistItems(loadGuestWishlist());
        }
      }, 0);
    }
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  // Check membership
  const isInCart = useCallback(
    (courseId: string) => {
      return cartItems.some(
        (item) =>
          item.courseId?._id === courseId || item.courseId?.id === courseId,
      );
    },
    [cartItems],
  );

  const isInWishlist = useCallback(
    (courseId: string) => {
      return wishlistItems.some(
        (item) =>
          item.courseId?._id === courseId || item.courseId?.id === courseId,
      );
    },
    [wishlistItems],
  );

  // Add to cart
  const addToCart = async (
    course: Course,
    eventOrCoords?: React.MouseEvent | { x: number; y: number },
  ): Promise<{ success: boolean; message: string }> => {
    const courseId = course._id || course.id || '';
    if (!courseId) return { success: false, message: 'Khóa học không hợp lệ' };

    if (isInCart(courseId)) {
      triggerCartBounce();
      showCartNotification(course, 'Khóa học đã có trong giỏ hàng');
      return {
        success: false,
        message: 'Khóa học đã có trong giỏ hàng của bạn.',
      };
    }

    // Tính tọa độ bắt đầu hiệu ứng bay
    let startCoords: { x: number; y: number } = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };

    if (eventOrCoords && 'clientX' in eventOrCoords) {
      const rect = (
        eventOrCoords.currentTarget as HTMLElement
      )?.getBoundingClientRect();
      startCoords = rect
        ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
        : { x: eventOrCoords.clientX, y: eventOrCoords.clientY };
    } else if (eventOrCoords && 'x' in eventOrCoords) {
      startCoords = eventOrCoords;
    }

    // Kích hoạt hiệu ứng bay vào giỏ hàng
    flyItemToCart(startCoords, course.thumbnailUrl, () => {
      triggerCartBounce();
      showCartNotification(course, 'Có 1 sản phẩm mới thêm vào giỏ');
    });

    if (isAuthenticated) {
      try {
        const res = await cartWishlistApi.addToCart(courseId);
        if (res.success) {
          await refreshCart();
          return {
            success: true,
            message: res.message || 'Đã thêm vào giỏ hàng!',
          };
        }
        return {
          success: false,
          message: res.message || 'Không thể thêm vào giỏ hàng.',
        };
      } catch {
        return {
          success: false,
          message: 'Lỗi mạng khi thêm vào giỏ hàng.',
        };
      }
    } else {
      // Guest local storage
      const newItem: CartItemResponse = {
        _id: 'guest_cart_' + Date.now(),
        userId: 'guest',
        courseId: course,
        createdAt: new Date().toISOString(),
      };
      const updated = [newItem, ...cartItems];
      setCartItems(updated);
      saveGuestCart(updated);
      return { success: true, message: 'Đã thêm vào giỏ hàng!' };
    }
  };

  // Remove from cart
  const removeFromCart = async (courseId: string): Promise<void> => {
    if (isAuthenticated) {
      try {
        await cartWishlistApi.removeFromCart(courseId);
        await refreshCart();
      } catch {
        // Fallback
      }
    } else {
      const updated = cartItems.filter(
        (item) =>
          item.courseId?._id !== courseId && item.courseId?.id !== courseId,
      );
      setCartItems(updated);
      saveGuestCart(updated);
    }
  };

  // Clear cart
  const clearCart = async (): Promise<void> => {
    if (isAuthenticated) {
      try {
        await cartWishlistApi.clearCart();
        setCartItems([]);
      } catch {
        // Fallback
      }
    } else {
      setCartItems([]);
      saveGuestCart([]);
    }
  };

  // Toggle wishlist
  const toggleWishlist = async (
    course: Course,
  ): Promise<{ success: boolean; isWishlisted: boolean; message: string }> => {
    const courseId = course._id || course.id || '';
    if (!courseId) {
      return {
        success: false,
        isWishlisted: false,
        message: 'Khóa học không hợp lệ',
      };
    }

    if (isAuthenticated) {
      try {
        const res = await cartWishlistApi.toggleWishlist(courseId);
        await refreshWishlist();
        return {
          success: true,
          isWishlisted: res.isWishlisted,
          message: res.message,
        };
      } catch {
        return {
          success: false,
          isWishlisted: false,
          message: 'Lỗi khi cập nhật danh sách yêu thích.',
        };
      }
    } else {
      const alreadyWishlisted = isInWishlist(courseId);
      let updated: WishlistItemResponse[];
      let message: string;
      if (alreadyWishlisted) {
        updated = wishlistItems.filter(
          (item) =>
            item.courseId?._id !== courseId && item.courseId?.id !== courseId,
        );
        message = 'Đã xóa khỏi danh sách yêu thích';
      } else {
        const newItem: WishlistItemResponse = {
          _id: 'guest_wishlist_' + Date.now(),
          userId: 'guest',
          courseId: course,
          createdAt: new Date().toISOString(),
        };
        updated = [newItem, ...wishlistItems];
        message = 'Đã thêm vào danh sách yêu thích!';
      }
      setWishlistItems(updated);
      saveGuestWishlist(updated);
      return {
        success: true,
        isWishlisted: !alreadyWishlisted,
        message,
      };
    }
  };

  // Move from cart to wishlist
  const moveToWishlist = async (course: Course): Promise<void> => {
    const courseId = course._id || course.id || '';
    await removeFromCart(courseId);
    if (!isInWishlist(courseId)) {
      await toggleWishlist(course);
    }
  };

  // Move from wishlist to cart
  const moveToCart = async (course: Course): Promise<void> => {
    await toggleWishlist(course); // remove from wishlist
    await addToCart(course);
  };

  const totalAmount = useMemo(() => computeTotalAmount(cartItems), [cartItems]);

  return (
    <CartWishlistContext.Provider
      value={{
        cartItems,
        cartCount: cartItems.length,
        totalAmount,
        wishlistItems,
        wishlistCount: wishlistItems.length,
        isCartOpen,
        isWishlistOpen,
        isLoading,
        cartNotification,
        isCartBouncing,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
        openWishlist: () => setIsWishlistOpen(true),
        closeWishlist: () => setIsWishlistOpen(false),
        showCartNotification,
        hideCartNotification,
        triggerCartBounce,
        addToCart,
        removeFromCart,
        clearCart,
        toggleWishlist,
        moveToWishlist,
        moveToCart,
        isInCart,
        isInWishlist,
        refreshCart,
        refreshWishlist,
      }}
    >
      {children}
    </CartWishlistContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCartWishlist = (): CartWishlistContextType => {
  const context = useContext(CartWishlistContext);
  if (!context) {
    throw new Error(
      'useCartWishlist must be used within a CartWishlistProvider',
    );
  }
  return context;
};
