// Service Worker para notificaciones push
// CCB - Centro Cultural Banreservas

const CACHE_NAME = 'ccb-notifications-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Claim any clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event (basic caching strategy)
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Push event - Handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  let notificationData = {
    title: 'Centro Cultural Banreservas',
    body: 'Nueva notificación disponible',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: {},
    actions: [],
    requireInteraction: false,
    silent: false
  };

  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = {
        ...notificationData,
        ...pushData,
      };
    } catch (e) {
      console.error('Error parsing push data:', e);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  // Add default actions based on notification type
  if (notificationData.data?.type === 'event') {
    notificationData.actions = [
      {
        action: 'view',
        title: 'Ver Evento',
        icon: '/icon-action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Descartar',
        icon: '/icon-action-dismiss.png'
      }
    ];
  } else if (notificationData.data?.type === 'reservation') {
    notificationData.actions = [
      {
        action: 'view',
        title: 'Ver Reserva',
        icon: '/icon-action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Descartar',
        icon: '/icon-action-dismiss.png'
      }
    ];
  }

  // Set requireInteraction for urgent notifications
  if (notificationData.data?.priority === 'urgent') {
    notificationData.requireInteraction = true;
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      data: notificationData.data,
      actions: notificationData.actions,
      requireInteraction: notificationData.requireInteraction,
      silent: notificationData.silent,
      tag: notificationData.data?.id || 'ccb-notification',
      renotify: true,
      timestamp: Date.now(),
      vibrate: notificationData.data?.priority === 'urgent' ? [200, 100, 200] : [100, 50, 100]
    }
  );

  event.waitUntil(promiseChain);
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  notification.close();

  // Handle different actions
  if (action === 'dismiss') {
    // Just close the notification
    return;
  }

  // Default action or 'view' action
  let url = '/';
  
  if (data.type === 'event' && data.eventId) {
    url = `/events/${data.eventId}`;
  } else if (data.type === 'reservation' && data.reservationId) {
    url = `/reservations/${data.reservationId}`;
  } else if (data.url) {
    url = data.url;
  }

  // Open the app
  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((clientList) => {
    // Check if app is already open
    for (const client of clientList) {
      if (client.url === url && 'focus' in client) {
        return client.focus();
      }
    }

    // If app is not open or URL is different, open new window
    if (clients.openWindow) {
      return clients.openWindow(url);
    }
  }).then((client) => {
    // Send message to client about the notification click
    if (client) {
      client.postMessage({
        type: 'NOTIFICATION_CLICKED',
        data: data,
        action: action
      });
    }
  });

  event.waitUntil(promiseChain);
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
  
  const notification = event.notification;
  const data = notification.data || {};
  
  // Track notification dismissal if needed
  if (data.id) {
    // Could send analytics about dismissed notifications
    console.log('Notification dismissed:', data.id);
  }
});

// Background sync (for future implementation)
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event);
  
  if (event.tag === 'notification-sync') {
    event.waitUntil(
      // Sync notifications with server
      syncNotifications()
    );
  }
});

// Helper function to sync notifications
async function syncNotifications() {
  try {
    console.log('Syncing notifications with server...');
    
    // This would typically fetch latest notifications from server
    // and update the local cache
    
    // For now, just log the attempt
    console.log('Notification sync completed');
  } catch (error) {
    console.error('Notification sync failed:', error);
  }
}

// Message event - Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
      case 'GET_VERSION':
        event.ports[0].postMessage({ version: CACHE_NAME });
        break;
      case 'CLEAR_NOTIFICATIONS':
        // Clear all notifications
        self.registration.getNotifications().then(notifications => {
          notifications.forEach(notification => notification.close());
        });
        break;
      default:
        console.log('Unknown message type:', event.data.type);
    }
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason);
});