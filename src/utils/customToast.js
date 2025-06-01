export function showWooooWToast(title, messageText) {
    // Remove any existing toast
    const existingToast = document.getElementById('woooow-toast');
    if (existingToast) {
        existingToast.remove();
        if (existingToast.timeoutId) clearTimeout(existingToast.timeoutId);
    }

    const toast = document.createElement('div');
    toast.id = 'woooow-toast';
    toast.style.position = 'fixed';
    toast.style.left = '50%';
    toast.style.top = '50%';
    toast.style.transform = 'translate(-50%, -50%)';
    toast.style.backgroundColor = '#4A7C82'; // Matching the image
    toast.style.color = 'white';
    toast.style.padding = '25px 40px'; // Increased padding
    toast.style.borderRadius = '15px';
    toast.style.textAlign = 'center';
    toast.style.zIndex = '10000';
    toast.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)'; // Enhanced shadow
    toast.style.fontFamily = 'Arial, sans-serif'; // A common sans-serif font

    const closeButton = document.createElement('span');
    closeButton.innerHTML = '&times;';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '15px';
    closeButton.style.fontSize = '28px'; // Slightly larger close button
    closeButton.style.fontWeight = 'bold';
    closeButton.style.cursor = 'pointer';
    closeButton.style.lineHeight = '1';
    closeButton.style.color = 'rgba(255, 255, 255, 0.7)';

    closeButton.onmouseover = () => {
        closeButton.style.color = 'white';
    };
    closeButton.onmouseout = () => {
        closeButton.style.color = 'rgba(255, 255, 255, 0.7)';
    };

    closeButton.onclick = () => {
        toast.remove();
        if (toast.timeoutId) clearTimeout(toast.timeoutId);
    };

    const titleElement = document.createElement('div');
    titleElement.textContent = title;
    titleElement.style.fontSize = '32px'; // Larger title font
    titleElement.style.fontWeight = 'bold';
    titleElement.style.marginBottom = '12px'; // More space below title

    const messageElement = document.createElement('div');
    messageElement.textContent = messageText;
    messageElement.style.fontSize = '18px'; // Larger message font

    toast.appendChild(closeButton);
    toast.appendChild(titleElement);
    toast.appendChild(messageElement);

    document.body.appendChild(toast);

    // Auto-dismiss after 3.5 seconds
    toast.timeoutId = setTimeout(() => {
        if (document.body.contains(toast)) {
            toast.remove();
        }
    }, 3500);
}
