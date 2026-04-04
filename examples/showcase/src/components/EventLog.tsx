import { useEffect, useState } from 'react';

import { authClient } from '../auth';

type AuthEvent = {
  name: string;
  timestamp: string;
};

const EVENT_NAMES = [
  'initSuccess',
  'initFailed',
  'loginStarted',
  'loginSuccess',
  'loginFailed',
  'refreshStarted',
  'refreshSuccess',
  'refreshFailed',
  'logoutStarted',
  'logoutSuccess',
  'logoutFailed',
] as const;

export const EventLog = () => {
  const [events, setEvents] = useState<AuthEvent[]>([]);

  useEffect(() => {
    const handlers = EVENT_NAMES.map((name) => {
      const handler = () => {
        setEvents((prev) => [
          ...prev,
          { name, timestamp: new Date().toLocaleTimeString() },
        ]);
      };
      authClient.on(name, handler);
      return { name, handler };
    });

    return () => {
      handlers.forEach(({ name, handler }) => {
        authClient.off(name, handler);
      });
    };
  }, []);

  const clearEvents = () => setEvents([]);

  return (
    <div className="card event-log" data-testid="event-log">
      <div className="event-log-header">
        <h2>Event Log</h2>
        <button onClick={clearEvents} data-testid="clear-events-button">
          Clear
        </button>
      </div>
      <div className="event-list" data-testid="event-list">
        {events.length === 0 ? (
          <p className="empty-message">No events yet</p>
        ) : (
          events.map((event, index) => (
            <div key={index} className="event-item" data-testid="event-item">
              <span className="event-time">{event.timestamp}</span>
              <span className="event-name">{event.name}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
