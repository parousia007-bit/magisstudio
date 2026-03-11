// ─── magis-studio/frontend/src/components/social/StoriesBar.jsx ──────────────
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { socialKeys } from '../../hooks/useSocial';
import './StoriesBar.css';

export default function StoriesBar({ groups, currentUser }) {
  const [active, setActive]       = useState(null); // { groupIdx, storyIdx }
  const [progress, setProgress]   = useState(0);
  const qc = useQueryClient();

  const openStory = (gIdx, sIdx = 0) => {
    setActive({ gIdx, sIdx });
    setProgress(0);
    const story = groups[gIdx].stories[sIdx];
    // Mark as viewed
    api.post(`/social/posts/${story._id}/view`).catch(() => {});
    qc.invalidateQueries({ queryKey: socialKeys.stories() });
  };

  const closeStory = () => setActive(null);

  const nextStory = () => {
    if (!active) return;
    const group = groups[active.gIdx];
    if (active.sIdx < group.stories.length - 1) {
      openStory(active.gIdx, active.sIdx + 1);
    } else if (active.gIdx < groups.length - 1) {
      openStory(active.gIdx + 1, 0);
    } else {
      closeStory();
    }
  };

  const prevStory = () => {
    if (!active) return;
    if (active.sIdx > 0) openStory(active.gIdx, active.sIdx - 1);
    else if (active.gIdx > 0) openStory(active.gIdx - 1, 0);
  };

  const activeStory = active
    ? groups[active.gIdx]?.stories[active.sIdx]
    : null;

  return (
    <>
      {/* ── Stories thumbnails row ───────────────────────────────────────── */}
      <div className="stories-bar" role="list" aria-label="Stories">
        {groups.map((group, i) => (
          <button
            key={group.author._id}
            className={`story-thumb ${group.hasUnseen ? 'has-unseen' : 'is-seen'}`}
            onClick={() => openStory(i)}
            role="listitem"
            aria-label={`Story de ${group.author.username}`}
          >
            <div className="story-thumb__ring">
              <div className="story-thumb__avatar">
                {group.author.avatar?.url
                  ? <img src={group.author.avatar.url} alt={group.author.username} />
                  : <span>{group.author.username[0].toUpperCase()}</span>
                }
              </div>
            </div>
            <span className="story-thumb__name font-mono">{group.author.username}</span>
          </button>
        ))}
      </div>

      {/* ── Story viewer overlay ────────────────────────────────────────── */}
      {active && activeStory && (
        <div className="story-viewer" role="dialog" aria-modal="true" aria-label="Story viewer">
          <div className="story-viewer__backdrop" onClick={closeStory} aria-hidden="true" />

          <div className="story-viewer__window glass-heavy">
            {/* Progress bars */}
            <div className="story-viewer__progress" role="progressbar">
              {groups[active.gIdx].stories.map((_, i) => (
                <div key={i} className={`story-viewer__progress-bar ${i < active.sIdx ? 'is-done' : i === active.sIdx ? 'is-active' : ''}`} />
              ))}
            </div>

            {/* Header */}
            <div className="story-viewer__header">
              <div className="story-viewer__author">
                <div className="story-viewer__avatar">
                  {groups[active.gIdx].author.avatar?.url
                    ? <img src={groups[active.gIdx].author.avatar.url} alt="" />
                    : <span>{groups[active.gIdx].author.username[0].toUpperCase()}</span>
                  }
                </div>
                <span className="story-viewer__username">{groups[active.gIdx].author.username}</span>
              </div>
              <button className="story-viewer__close" onClick={closeStory} aria-label="Cerrar">✕</button>
            </div>

            {/* Media */}
            <div className="story-viewer__media">
              {activeStory.media?.[0]?.type === 'video' ? (
                <video src={activeStory.media[0].url} autoPlay muted className="story-viewer__img" />
              ) : activeStory.media?.[0]?.url ? (
                <img src={activeStory.media[0].url} alt="" className="story-viewer__img" />
              ) : (
                <div className="story-viewer__text-story">
                  <p>{activeStory.caption}</p>
                </div>
              )}
            </div>

            {/* Caption */}
            {activeStory.caption && (
              <p className="story-viewer__caption">{activeStory.caption}</p>
            )}

            {/* Navigation zones */}
            <button className="story-viewer__nav story-viewer__nav--prev" onClick={prevStory} aria-label="Anterior" />
            <button className="story-viewer__nav story-viewer__nav--next" onClick={nextStory} aria-label="Siguiente" />
          </div>
        </div>
      )}
    </>
  );
}

// ─── magis-studio/frontend/src/components/social/NotificationBell.jsx ────────
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
