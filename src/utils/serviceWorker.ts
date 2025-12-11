/**
 * Service Worker Registration
 * Phase 4: PWA & Offline Support
 */

// Check if service workers are supported
export const isServiceWorkerSupported = (): boolean => {
  return 'serviceWorker' in navigator;
};

// Register service worker
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isServiceWorkerSupported()) {
    console.warn('[SW] Service workers are not supported in this browser');
    return null;
  }

  try {
    console.log('[SW] Registering service worker...');
    
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none', // Always check for updates
    });

    console.log('[SW] Service worker registered successfully:', registration.scope);

    // Check for updates periodically
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000); // Check every hour

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      if (newWorker) {
        console.log('[SW] New service worker found, installing...');
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[SW] New service worker installed, prompting user to update');
            
            // Show update notification
            showUpdateNotification();
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('[SW] Service worker registration failed:', error);
    return null;
  }
};

// Unregister service worker (for debugging)
export const unregisterServiceWorker = async (): Promise<boolean> => {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    
    if (registration) {
      const success = await registration.unregister();
      console.log('[SW] Service worker unregistered:', success);
      return success;
    }
    
    return false;
  } catch (error) {
    console.error('[SW] Failed to unregister service worker:', error);
    return false;
  }
};

// Show update notification
const showUpdateNotification = () => {
  // Create notification element
  const notification = document.createElement('div');
  notification.id = 'sw-update-notification';
  notification.innerHTML = `
    <div style="
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      padding: 20px;
      max-width: 400px;
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    ">
      <style>
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      </style>
      <div style="display: flex; align-items: start; gap: 12px;">
        <div style="font-size: 24px;">🔄</div>
        <div style="flex: 1;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1f2937;">
            Phiên bản mới có sẵn!
          </h3>
          <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280; line-height: 1.5;">
            Love Journal đã được cập nhật. Tải lại trang để sử dụng phiên bản mới.
          </p>
          <div style="display: flex; gap: 8px;">
            <button id="sw-update-btn" style="
              flex: 1;
              padding: 10px 16px;
              background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%);
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              transition: transform 0.2s;
            ">
              Cập nhật ngay
            </button>
            <button id="sw-dismiss-btn" style="
              padding: 10px 16px;
              background: #f3f4f6;
              color: #374151;
              border: none;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              transition: background 0.2s;
            ">
              Để sau
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(notification);

  // Update button
  document.getElementById('sw-update-btn')?.addEventListener('click', () => {
    window.location.reload();
  });

  // Dismiss button
  document.getElementById('sw-dismiss-btn')?.addEventListener('click', () => {
    notification.remove();
  });
};

// Check if app is installed (running as PWA)
export const isInstalled = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
};

// Prompt to install PWA
export const promptInstall = async (): Promise<boolean> => {
  // Check if prompt is available
  const deferredPrompt = (window as any).deferredPrompt;
  
  if (!deferredPrompt) {
    console.log('[PWA] Install prompt not available');
    return false;
  }

  try {
    // Show install prompt
    deferredPrompt.prompt();

    // Wait for user response
    const choiceResult = await deferredPrompt.userChoice;

    console.log('[PWA] User choice:', choiceResult.outcome);

    // Clear the prompt
    (window as any).deferredPrompt = null;

    return choiceResult.outcome === 'accepted';
  } catch (error) {
    console.error('[PWA] Install prompt failed:', error);
    return false;
  }
};

// Listen for install prompt event
export const setupInstallPrompt = () => {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent default install prompt
    e.preventDefault();
    
    // Store for later use
    (window as any).deferredPrompt = e;
    
    console.log('[PWA] Install prompt available');
    
    // Show custom install button/banner
    showInstallBanner();
  });

  // Listen for app installed event
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully');
    
    // Clear deferred prompt
    (window as any).deferredPrompt = null;
    
    // Hide install banner
    hideInstallBanner();
    
    // Show success message
    showInstallSuccess();
  });
};

// Show install banner
const showInstallBanner = () => {
  // Skip if already installed
  if (isInstalled()) {
    return;
  }

  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%);
      color: white;
      padding: 16px 20px;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideDown 0.3s ease-out;
    ">
      <style>
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
          }
          to {
            transform: translateY(0);
          }
        }
      </style>
      <div style="max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 16px;">
        <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
          <span style="font-size: 24px;">📱</span>
          <div>
            <div style="font-weight: 600; margin-bottom: 2px;">Cài đặt Love Journal</div>
            <div style="font-size: 13px; opacity: 0.9;">Truy cập nhanh như một ứng dụng</div>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="pwa-install-btn" style="
            padding: 10px 20px;
            background: white;
            color: #ec4899;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            white-space: nowrap;
          ">
            Cài đặt
          </button>
          <button id="pwa-dismiss-btn" style="
            padding: 10px 16px;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            cursor: pointer;
          ">
            ✕
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(banner);

  // Install button
  document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
    const installed = await promptInstall();
    if (installed) {
      banner.remove();
    }
  });

  // Dismiss button
  document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
    banner.remove();
    // Remember dismissal for 7 days
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
  });

  // Auto-hide after 10 seconds
  setTimeout(() => {
    banner.remove();
  }, 10000);
};

// Hide install banner
const hideInstallBanner = () => {
  document.getElementById('pwa-install-banner')?.remove();
};

// Show install success message
const showInstallSuccess = () => {
  const message = document.createElement('div');
  message.innerHTML = `
    <div style="
      position: fixed;
      top: 24px;
      right: 24px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      padding: 20px;
      max-width: 400px;
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    ">
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="font-size: 32px;">✅</div>
        <div>
          <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #1f2937;">
            Cài đặt thành công!
          </h3>
          <p style="margin: 0; font-size: 14px; color: #6b7280;">
            Love Journal đã được thêm vào màn hình chính
          </p>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(message);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    message.remove();
  }, 3000);
};

// Check if banner was dismissed recently
const shouldShowBanner = (): boolean => {
  const dismissed = localStorage.getItem('pwa-banner-dismissed');
  if (!dismissed) return true;

  const dismissedTime = parseInt(dismissed);
  const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

  return daysSinceDismissed > 7; // Show again after 7 days
};

// Initialize PWA features
export const initPWA = async () => {
  console.log('[PWA] Initializing...');

  // Register service worker
  await registerServiceWorker();

  // Setup install prompt
  if (shouldShowBanner()) {
    setupInstallPrompt();
  }

  // Log PWA status
  console.log('[PWA] Installed:', isInstalled());
  console.log('[PWA] Service Worker:', isServiceWorkerSupported());
};

export default {
  registerServiceWorker,
  unregisterServiceWorker,
  isInstalled,
  promptInstall,
  setupInstallPrompt,
  initPWA,
};
