self.addEventListener('push', function(event) {
  if (!event.data) {
    console.log('Push event but no data');
    return;
  }

  const data = event.data.json();

  const options = {
    body: data.message,
    icon: data.icon || '/icons/notification.png',
    badge: data.badge || '/icons/badge.png',
    data: data.data,
    tag: data.tag,
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    timestamp: data.timestamp,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const action = event.action;
  const notification = event.notification;
  const data = notification.data || {};

  let url = '/';

  // Handle different actions
  switch (action) {
    case 'view':
      if (data.type === 'task_assigned' || data.type === 'task_updated' || data.type === 'task_commented') {
        url = `/tasks/${data.taskId}`;
      } else if (data.type === 'project_updated' || data.type === 'project_member_added' || data.type === 'project_member_removed') {
        url = `/projects/${data.projectId}`;
      }
      break;
    case 'accept':
      url = `/tasks/${data.taskId}/accept`;
      break;
    case 'decline':
      url = `/tasks/${data.taskId}/decline`;
      break;
    case 'reply':
      url = `/tasks/${data.taskId}/comment`;
      break;
    default:
      // If no action or unknown action, use the default URL from data
      url = data.url || '/';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      // If a window client is available, navigate it to the URL
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window client is available, open a new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

self.addEventListener('notificationclose', function(event) {
  // You can track notification close events if needed
  const notification = event.notification;
  const data = notification.data || {};

  // Log or track the close event
  console.log('Notification closed', {
    tag: notification.tag,
    data: data,
  });
}); 