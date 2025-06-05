// Toast utility for showing notifications
export function showToast(message, variant = 'primary', duration = 3000) {
  const toastContainer = document.getElementById('toast-container');
  
  if (!toastContainer) {
    console.error('Toast container not found');
    return;
  }
  
  // Create toast element
  const toast = document.createElement('sl-alert');
  toast.variant = variant;
  toast.closable = true;
  toast.duration = duration;
  toast.innerHTML = `
    <sl-icon name="${getIconForVariant(variant)}" slot="icon"></sl-icon>
    ${message}
  `;

  // Add to container
  toastContainer.appendChild(toast);

  // Wait for element to be defined and connected, then show
  const showToastWhenReady = () => {
    if (toast.show && typeof toast.show === 'function') {
      try {
        toast.show();
      } catch (error) {
        console.error('Error showing toast:', error);
        // Fallback: just display the toast without animation
        toast.style.display = 'block';
      }
    } else {
      // Fallback: just display the toast without animation  
      toast.style.display = 'block';
    }
  };

  // Check if component is ready, if not wait a bit
  if (customElements.get('sl-alert')) {
    // Element is defined, wait for next tick to ensure it's connected
    setTimeout(showToastWhenReady, 0);
  } else {
    // Wait for Shoelace to load
    setTimeout(showToastWhenReady, 100);
  }

  // Auto-hide after duration
  if (duration > 0) {
    setTimeout(() => {
      if (toast.hide && typeof toast.hide === 'function') {
        try {
          toast.hide();
        } catch (error) {
          console.error('Error hiding toast:', error);
          toast.remove();
        }
      } else {
        toast.remove();
      }
    }, duration);
  }

  // Remove from DOM after animation
  toast.addEventListener('sl-after-hide', () => {
    toast.remove();
  });

  return toast;
}

function getIconForVariant(variant) {
  const icons = {
    primary: 'info-circle',
    success: 'check-circle',
    warning: 'exclamation-triangle',
    danger: 'exclamation-octagon'
  };
  return icons[variant] || 'info-circle';
}

export default { showToast }; 