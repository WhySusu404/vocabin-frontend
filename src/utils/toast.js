// Toast utility for showing notifications
export function showToast(message, variant = 'primary', duration = 3000) {
  const toastContainer = document.getElementById('toast-container');
  
  if (!toastContainer) {
    console.error('Toast container not found');
    // Fallback to console and browser alert if no container
    console.log(`Toast (${variant}): ${message}`);
    return;
  }
  
  // Try to create Shoelace toast first
  if (customElements.get('sl-alert')) {
    return createShoelaceToast(message, variant, duration, toastContainer);
  } else {
    // Fallback to HTML toast
    return createHtmlToast(message, variant, duration, toastContainer);
  }
}

function createShoelaceToast(message, variant, duration, toastContainer) {
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
  setTimeout(showToastWhenReady, 0);

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

function createHtmlToast(message, variant, duration, toastContainer) {
  console.log(`📢 Toast fallback (${variant}): ${message}`);
  
  // Create HTML toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${variant}`;
  toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-icon">${getIconForVariant(variant, true)}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;
  
  // Add basic styling
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    background: ${getColorForVariant(variant)};
    color: white;
    padding: 12px 16px;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    margin-bottom: 8px;
    max-width: 400px;
    animation: slideIn 0.3s ease-out;
  `;

  // Add to container
  toastContainer.appendChild(toast);

  // Auto-hide after duration
  if (duration > 0) {
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  return toast;
}

function getIconForVariant(variant, isText = false) {
  if (isText) {
    const textIcons = {
      primary: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      danger: '❌'
    };
    return textIcons[variant] || 'ℹ️';
  }
  
  const icons = {
    primary: 'info-circle',
    success: 'check-circle',
    warning: 'exclamation-triangle',
    danger: 'exclamation-octagon'
  };
  return icons[variant] || 'info-circle';
}

function getColorForVariant(variant) {
  const colors = {
    primary: '#0ea5e9',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
  };
  return colors[variant] || '#0ea5e9';
}

export default { showToast }; 