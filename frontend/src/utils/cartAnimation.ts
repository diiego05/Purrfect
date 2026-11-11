/**
 * Hiệu ứng chuyển động bay vào biểu tượng giỏ hàng trên Header (Fly-to-Cart Animation)
 */
export const flyItemToCart = (
  start: { x: number; y: number },
  imageUrl?: string,
  onComplete?: () => void,
) => {
  // Tìm phần tử giỏ hàng trên Header
  const cartTarget = document.querySelector(
    '[data-cart-icon]',
  ) as HTMLElement | null;
  if (!cartTarget) {
    onComplete?.();
    return;
  }

  const targetRect = cartTarget.getBoundingClientRect();
  const endX = targetRect.left + targetRect.width / 2;
  const endY = targetRect.top + targetRect.height / 2;

  // Tạo particle bay
  const flyer = document.createElement('div');
  flyer.className = 'purr-fly-to-cart-item';

  if (imageUrl) {
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = 'Flying course';
    img.onerror = () => {
      img.src = '/assets/advanced_digital_skills.jpg';
    };
    flyer.appendChild(img);
  } else {
    flyer.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.5 4.5H5.8L7.8 14.5C7.9 15 8.3 15.4 8.8 15.4H18.2C18.7 15.4 19.1 15 19.2 14.5L20.5 7.5H6.5" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="19.5" r="1.5" stroke="#ffffff" stroke-width="1.5"/><circle cx="17.5" cy="19.5" r="1.5" stroke="#ffffff" stroke-width="1.5"/></svg>`;
  }

  document.body.appendChild(flyer);

  const startX = start.x - 24;
  const startY = start.y - 24;
  const destX = endX - 16;
  const destY = endY - 16;

  // Điểm vòng cung parabol
  const midX = startX + (destX - startX) * 0.45;
  const midY =
    Math.min(startY, destY) -
    Math.min(90, Math.max(40, Math.abs(destX - startX) * 0.18));

  if (typeof flyer.animate === 'function') {
    const animation = flyer.animate(
      [
        {
          transform: `translate3d(${startX}px, ${startY}px, 0) scale(1) rotate(0deg)`,
          opacity: 1,
        },
        {
          transform: `translate3d(${midX}px, ${midY}px, 0) scale(1.18) rotate(15deg)`,
          opacity: 0.95,
          offset: 0.45,
        },
        {
          transform: `translate3d(${destX}px, ${destY}px, 0) scale(0.2) rotate(45deg)`,
          opacity: 0.3,
        },
      ],
      {
        duration: 650,
        easing: 'cubic-bezier(0.2, 0.8, 0.25, 1)',
        fill: 'forwards',
      },
    );

    animation.onfinish = () => {
      flyer.remove();
      onComplete?.();
    };

    animation.oncancel = () => {
      flyer.remove();
      onComplete?.();
    };
  } else {
    flyer.remove();
    onComplete?.();
  }
};
