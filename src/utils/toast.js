// Toast utility for showing notifications
export function showToast(message, variant = 'primary', duration = 3000) {
  const toastContainer = document.getElementById('toast-container');
  
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

  // Show the toast
  toast.toast();

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