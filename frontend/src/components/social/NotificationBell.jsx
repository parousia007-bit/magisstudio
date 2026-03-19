import { useState } from 'react';
import { useNotifications, useMarkNotificationsRead } from '../../hooks/useSocial';
import './NotificationBell.css';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data } = useNotifications();
  const markRead = useMarkNotificationsRead();

  const notifications = data?.data ?? [];
  const unread = data?.unreadCount ?? 0;

  const handleOpen = () => {
    setOpen(v => !v);
    if (!open && unread > 0) markRead.mutate();
  };

  return (
    <div className="notif-bell" aria-haspopup="true" aria-expanded={open}>
      <button className="notif-bell__btn player__btn" onClick={handleOpen} aria-label={`${unread} notificaciones`}>
        <BellIcon />
        {unread > 0 && (
          <span className="notif-bell__badge" aria-label={`${unread} sin leer`}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="notif-bell__dropdown glass-heavy">
            <div className="notif-bell__header">
              <span className="notif-bell__title font-mono">NOTIFICACIONES</span>
            </div>
            <div className="notif-bell__list">
              {notifications.length === 0 ? (
                <p className="notif-bell__empty">Sin notificaciones nuevas</p>
              ) : (
                notifications.slice(0, 10).map(n => (
                  <div key={n._id} className={`notif-item ${!n.isRead ? 'is-unread' : ''}`}>
                    <div className="notif-item__avatar">
                      {n.sender?.avatar?.url
                        ? <img src={n.sender.avatar.url} alt={n.sender.username} />
                        : <span>{n.sender?.username?.[0]?.toUpperCase()}</span>
                      }
                    </div>
                    <div className="notif-item__body">
                      <p className="notif-item__msg">{n.message}</p>
                      <span className="notif-item__type badge badge-amber">{n.type}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="notif-bell__overlay" onClick={() => setOpen(false)} aria-hidden="true" />
        </>
      )}
    </div>
  );
}

export default NotificationBell;

const BellIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
