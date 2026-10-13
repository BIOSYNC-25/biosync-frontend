import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import {
  Bot,
  Play,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  Activity,
  Terminal,
  Sliders,
  StopCircle,
  AlertCircle,
  Check,
  ShieldCheck,
  Hourglass,
  Layers,
  RotateCcw,
  Plus
} from 'lucide-react';

const ALL_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export default function AutomationPage() {
  const pollTimerRef = useRef(null);

  // Editable local form state (Section 1 & 2)
  const [configForm, setConfigForm] = useState({
    automation_enabled: false,
    run_times: ['09:00'],
    run_time: '09:00', // legacy compatibility
    run_days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
    offline_recovery_enabled: true,
    offline_check_interval_minutes: 5,
    recovery_mode: 'retry_window',
    max_retry_attempts: 3,
    retry_window_minutes: 60,
  });

  // Live status state (Section 3) - separate from editable form state
  const [statusData, setStatusData] = useState({
    state: 'IDLE',
    stage: 'IDLE',
    trigger: null,
    run_date: null,
    started_at: null,
    completed_at: null,
    last_scheduled_date: null,
    schedule_date: null,
    daily_known_count: null,
    daily_covered_count: null,
    daily_uncovered_count: null,
    daily_covered_devices: [],
    daily_uncovered_devices: [],
    latest_schedule_slot: null,
    latest_schedule_pending_count: null,
    latest_schedule_pending_devices: [],
    latest_schedule_successful_devices: [],
    latest_schedule_completed_at: null,
    scheduled_runs_today: [],
    deferred_runs_today: [],
    current_schedule_slot: null,
    catchup_due_at: null,
    catchup_for_times: [],
    retry_count: 0,
    initial_total_devices: 0,
    successful_devices: [],
    no_log_devices: [],
    pending_devices: [],
    unresolved_devices: [],
    successful_count: 0,
    no_log_count: 0,
    pending_count: 0,
    next_check_at: null,
    last_fetch_completed_at: null,
    last_combine_completed_at: null,
    last_error: null,
    message: 'Automation idle',
  });

  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [runningNow, setRunningNow] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [notification, setNotification] = useState({ type: '', text: '' });
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);

  const showNotification = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => {
      setNotification((curr) => (curr.text === text ? { type: '', text: '' } : curr));
    }, 5000);
  };

  // Initial Bootstrap loading
  const loadBootstrap = async () => {
    try {
      setInitialLoading(true);
      const data = await api.get(`/automation/bootstrap?_=${Date.now()}`);
      if (data && typeof data === 'object') {
        if (data.config) {
          const loadedRunTimes = Array.isArray(data.config.run_times) && data.config.run_times.length > 0
            ? data.config.run_times
            : (data.config.run_time ? [data.config.run_time] : ['09:00']);

          setConfigForm({
            automation_enabled: Boolean(data.config.automation_enabled),
            run_times: loadedRunTimes,
            run_time: loadedRunTimes[0] || '09:00',
            run_days: Array.isArray(data.config.run_days) ? data.config.run_days : ALL_DAYS.slice(0, 6),
            offline_recovery_enabled: data.config.offline_recovery_enabled !== undefined ? Boolean(data.config.offline_recovery_enabled) : true,
            offline_check_interval_minutes: data.config.offline_check_interval_minutes ?? 5,
            recovery_mode: data.config.recovery_mode || 'retry_window',
            max_retry_attempts: data.config.max_retry_attempts ?? 3,
            retry_window_minutes: data.config.retry_window_minutes ?? 60,
          });
        }
        if (data.status) {
          setStatusData(data.status);
          setLastRefreshedAt(new Date().toLocaleTimeString());
        }
      }
    } catch (err) {
      console.error('Failed to load automation bootstrap:', err);
      showNotification('error', err.message || 'Failed to load initial automation settings.');
    } finally {
      setInitialLoading(false);
    }
  };

  // Periodic Status Polling (does NOT overwrite unsaved form config)
  const pollStatus = async () => {
    try {
      const data = await api.get(`/automation/status?_=${Date.now()}`);
      if (data && typeof data === 'object') {
        setStatusData(data);
        setLastRefreshedAt(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.warn('Status refresh warning:', err);
    }
  };

  useEffect(() => {
    loadBootstrap();

    // Start background status refresh (every 3.5 seconds)
    pollTimerRef.current = setInterval(() => {
      pollStatus();
    }, 3500);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        pollStatus();
        if (!pollTimerRef.current) {
          pollTimerRef.current = setInterval(pollStatus, 3500);
        }
      } else {
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Multi-Run Times Editor Handlers
  const handleUpdateTime = (index, value) => {
    setConfigForm((prev) => {
      const updated = [...prev.run_times];
      updated[index] = value;
      return {
        ...prev,
        run_times: updated,
      };
    });
  };

  const handleAddTime = () => {
    setConfigForm((prev) => {
      const current = prev.run_times || [];
      const standardCandidates = [
        '09:00', '13:30', '16:00', '11:00', '14:00',
        '17:00', '10:00', '12:00', '15:00', '18:00'
      ];
      let candidate = standardCandidates.find((slot) => !current.includes(slot));
      if (!candidate) {
        for (let h = 0; h < 24; h++) {
          const hh = `${String(h).padStart(2, '0')}:00`;
          if (!current.includes(hh)) {
            candidate = hh;
            break;
          }
        }
      }
      if (!candidate) candidate = '12:00';
      return {
        ...prev,
        run_times: [...current, candidate],
      };
    });
  };

  const handleRemoveTime = (index) => {
    setConfigForm((prev) => {
      if (prev.run_times.length <= 1) {
        showNotification('error', 'AT LEAST ONE AUTOMATIC RUN TIME MUST REMAIN');
        return prev;
      }
      const updated = prev.run_times.filter((_, i) => i !== index);
      return {
        ...prev,
        run_times: updated,
      };
    });
  };

  // Day selection toggle handler
  const handleToggleDay = (day) => {
    setConfigForm((prev) => {
      const currentDays = prev.run_days || [];
      if (currentDays.includes(day)) {
        if (currentDays.length <= 1) {
          showNotification('error', 'AT LEAST ONE RUN DAY IS REQUIRED');
          return prev;
        }
        return {
          ...prev,
          run_days: currentDays.filter((d) => d !== day),
        };
      } else {
        const updated = ALL_DAYS.filter((d) => d === day || currentDays.includes(d));
        return {
          ...prev,
          run_days: updated,
        };
      }
    });
  };

  // Quick day selectors
  const setWeekdaysOnly = () => {
    setConfigForm((prev) => ({
      ...prev,
      run_days: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
    }));
  };

  const setAllDays = () => {
    setConfigForm((prev) => ({
      ...prev,
      run_days: [...ALL_DAYS],
    }));
  };

  // Save Settings handler (calls PUT /automation/config)
  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();

    if (!configForm.run_days || configForm.run_days.length === 0) {
      showNotification('error', 'PLEASE SELECT AT LEAST ONE SCHEDULED RUN DAY');
      return;
    }

    if (!configForm.run_times || configForm.run_times.length === 0) {
      showNotification('error', 'AT LEAST ONE AUTOMATIC RUN TIME IS REQUIRED');
      return;
    }

    // Validate 24-hour HH:MM format for every time slot
    const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
    for (const t of configForm.run_times) {
      const trimmed = String(t || '').trim();
      if (!trimmed || !timeRegex.test(trimmed)) {
        showNotification('error', `INVALID TIME FORMAT: "${t}". USE 24-HOUR HH:MM FORMAT`);
        return;
      }
    }

    // Prevent duplicate times
    const trimmedTimes = configForm.run_times.map((t) => String(t).trim());
    const uniqueTimes = new Set(trimmedTimes);
    if (uniqueTimes.size !== trimmedTimes.length) {
      showNotification('error', 'DUPLICATE RUN TIMES DETECTED. EACH SCHEDULED SLOT MUST BE UNIQUE');
      return;
    }

    // Sort times chronologically
    const sortedRunTimes = Array.from(uniqueTimes).sort();

    // Validate max_retry_attempts supports up to 1000
    const maxRetries = Number(configForm.max_retry_attempts);
    if (isNaN(maxRetries) || maxRetries < 0 || maxRetries > 1000) {
      showNotification('error', 'MAXIMUM RETRY ATTEMPTS MUST BE BETWEEN 0 AND 1000');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        automation_enabled: Boolean(configForm.automation_enabled),
        run_times: sortedRunTimes,
        run_time: sortedRunTimes[0], // backward compatibility
        run_days: configForm.run_days,
        offline_recovery_enabled: Boolean(configForm.offline_recovery_enabled),
        offline_check_interval_minutes: Number(configForm.offline_check_interval_minutes) || 5,
        recovery_mode: configForm.recovery_mode,
        max_retry_attempts: maxRetries,
        retry_window_minutes: Number(configForm.retry_window_minutes) || 60,
      };

      const res = await api.put('/automation/config', payload);
      if (res && res.config) {
        const returnedTimes = Array.isArray(res.config.run_times) && res.config.run_times.length > 0
          ? res.config.run_times
          : (res.config.run_time ? [res.config.run_time] : sortedRunTimes);

        setConfigForm({
          automation_enabled: Boolean(res.config.automation_enabled),
          run_times: returnedTimes,
          run_time: returnedTimes[0] || '09:00',
          run_days: res.config.run_days,
          offline_recovery_enabled: Boolean(res.config.offline_recovery_enabled),
          offline_check_interval_minutes: res.config.offline_check_interval_minutes,
          recovery_mode: res.config.recovery_mode,
          max_retry_attempts: res.config.max_retry_attempts,
          retry_window_minutes: res.config.retry_window_minutes,
        });
      } else {
        setConfigForm((prev) => ({
          ...prev,
          run_times: sortedRunTimes,
          run_time: sortedRunTimes[0],
        }));
      }
      showNotification('success', 'AUTOMATION CONFIGURATION PARAMETERS SAVED');
    } catch (err) {
      showNotification('error', err.message || 'FAILED TO SAVE AUTOMATION SETTINGS');
    } finally {
      setSaving(false);
    }
  };

  // Run Automation Now handler (calls POST /automation/run-now)
  const handleRunNow = async () => {
    if (runningNow || statusData.state === 'RUNNING') return;

    try {
      setRunningNow(true);
      const res = await api.post('/automation/run-now');
      showNotification('success', res?.message || 'AUTOMATION CYCLE INITIALIZED');
      await pollStatus();
    } catch (err) {
      showNotification('error', err.message || 'FAILED TO INITIATE AUTOMATION CYCLE');
    } finally {
      setRunningNow(false);
    }
  };

  // Safe Stop handler (calls POST /automation/stop)
  const handleSafeStop = async () => {
    if (stopping) return;

    try {
      setStopping(true);
      const res = await api.post('/automation/stop');
      showNotification('info', res?.message || 'SAFE STOP INSTRUCTION TRANSMITTED');
      setShowStopModal(false);
      await pollStatus();
    } catch (err) {
      showNotification('error', err.message || 'FAILED TO TRANSMIT STOP COMMAND');
    } finally {
      setStopping(false);
    }
  };

  // State styling helper
  const getStateBadgeStyle = (state) => {
    switch (state) {
      case 'RUNNING':
        return { color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.12)', border: '#3b82f6' };
      case 'COMPLETED':
        return { color: '#4ade80', bg: 'rgba(74, 222, 128, 0.12)', border: '#22c55e' };
      case 'COMPLETED_WITH_PENDING':
      case 'RECOVERY_WAIT':
      case 'STOPPED':
        return { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)', border: '#eab308' };
      case 'FAILED':
        return { color: '#f87171', bg: 'rgba(248, 113, 113, 0.12)', border: '#ef4444' };
      case 'IDLE':
      default:
        return { color: '#888888', bg: 'rgba(255, 255, 255, 0.05)', border: '#333333' };
    }
  };

  const isRunning = statusData.state === 'RUNNING';
  const stateStyle = getStateBadgeStyle(statusData.state);

  // Task 1 Daily Automation Telemetry & Freshness Metrics
  const initialTotal = statusData.initial_total_devices ?? 0;
  const successfulCountFallback = statusData.successful_count ?? (statusData.successful_devices?.length || 0);

  // Daily Coverage metrics (with graceful fallbacks)
  const dailyKnownCount = statusData.daily_known_count ?? initialTotal;
  const dailyCoveredCount = statusData.daily_covered_count ?? successfulCountFallback;
  const dailyUncoveredCount = statusData.daily_uncovered_count ?? Math.max(0, dailyKnownCount - dailyCoveredCount);

  // Latest Schedule Pending metrics (with graceful fallbacks)
  const latestScheduleSlot = statusData.latest_schedule_slot || statusData.current_schedule_slot || null;
  const latestPendingCount = statusData.latest_schedule_pending_count ?? (statusData.pending_count ?? (statusData.pending_devices?.length || 0));

  // Device lists
  const latestPendingList = Array.isArray(statusData.latest_schedule_pending_devices) && statusData.latest_schedule_pending_devices.length > 0
    ? statusData.latest_schedule_pending_devices
    : (Array.isArray(statusData.pending_devices) ? statusData.pending_devices : (Array.isArray(statusData.unresolved_devices) ? statusData.unresolved_devices : []));

  const neverFetchedList = Array.isArray(statusData.daily_uncovered_devices)
    ? statusData.daily_uncovered_devices
    : [];

  // Retry budget
  const maxRetries = configForm.max_retry_attempts ?? (statusData.max_retry_attempts ?? 80);
  const currentRetries = statusData.retry_count ?? 0;

  if (initialLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem', gap: '1rem' }}>
        <RefreshCw className="animate-spin" size={32} color="#fff" />
        <span style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.2em', color: '#666' }}>
          BOOTSTRAPPING AUTOMATION ENGINE...
        </span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Page Header Area */}
      <div style={{ borderBottom: '1px solid #222', paddingBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#fff', margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Bot size={22} color="#fff" />
            AUTOMATION CONTROL &amp; RECOVERY
          </h1>
          <p style={{ color: '#666', fontSize: '0.75rem', fontWeight: '700', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            CONFIGURE SCHEDULED BIOMETRIC SYNCHRONIZATION, OFFLINE DEVICE HEALING &amp; LIVE STATUS TELEMETRY
          </p>
        </div>

        {lastRefreshedAt && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#141414', border: '1px solid #222', padding: '0.4rem 0.75rem', borderRadius: '2px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isRunning ? '#60a5fa' : '#4ade80', boxShadow: isRunning ? '0 0 8px #60a5fa' : 'none' }}></span>
            <span style={{ fontSize: '0.65rem', color: '#888', fontWeight: '700', letterSpacing: '0.05em' }}>
              TELEMETRY: {lastRefreshedAt}
            </span>
          </div>
        )}
      </div>

      {/* Feedback Notification Alert */}
      {notification.text && (
        <div style={{
          padding: '1rem 1.5rem',
          background: notification.type === 'success' ? '#0f1712' : notification.type === 'error' ? '#221111' : '#141720',
          borderLeft: `3px solid ${notification.type === 'success' ? '#4ade80' : notification.type === 'error' ? '#f87171' : '#60a5fa'}`,
          color: notification.type === 'success' ? '#4ade80' : notification.type === 'error' ? '#f87171' : '#93c5fd',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          fontSize: '0.75rem',
          fontWeight: '700',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          borderRadius: '2px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: notification.type === 'success' ? '#4ade80' : notification.type === 'error' ? '#f87171' : '#60a5fa'
          }}></div>
          <span style={{ flex: 1 }}>{notification.text}</span>
        </div>
      )}

      {/* ACTION CONTROLS BAR (RUN NOW / SAFE STOP) */}
      <div className="ud-card" style={{ padding: '0', border: '1px solid #222', borderRadius: '2px', background: '#141414' }}>
        <div style={{
          padding: '1rem 1.75rem',
          borderBottom: '1px solid #222',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#1a1a1a'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Activity size={16} color="#fff" />
            <h2 style={{ fontSize: '0.8rem', fontWeight: '900', letterSpacing: '0.1em', margin: 0, textTransform: 'uppercase', color: '#fff' }}>
              DIRECT RUNTIME CONTROLS
            </h2>
          </div>
          <span style={{ fontSize: '0.65rem', fontWeight: '800', color: isRunning ? '#60a5fa' : '#666', letterSpacing: '0.1em' }}>
            {isRunning ? 'EXECUTION IN PROGRESS' : 'STANDBY MODE'}
          </span>
        </div>

        <div style={{ padding: '1.5rem 1.75rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', background: '#141414', alignItems: 'center' }}>
          {/* RUN AUTOMATION NOW Button */}
          <button
            type="button"
            className="btn-solid"
            onClick={handleRunNow}
            disabled={runningNow || isRunning}
            style={{
              flex: '1 1 240px',
              height: '46px',
              backgroundColor: isRunning ? '#222' : '#fff',
              color: isRunning ? '#666' : '#000',
              border: 'none',
              fontWeight: '900',
              opacity: runningNow || isRunning ? 0.6 : 1,
              cursor: runningNow || isRunning ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {runningNow ? (
              <>
                <RefreshCw className="animate-spin" size={16} />
                <span>STARTING CYCLE...</span>
              </>
            ) : (
              <>
                <Play size={16} />
                <span>{isRunning ? 'CYCLE RUNNING' : 'RUN AUTOMATION NOW'}</span>
              </>
            )}
          </button>

          {/* SAFE STOP Button */}
          <button
            type="button"
            className="btn-solid"
            onClick={() => setShowStopModal(true)}
            disabled={stopping || !isRunning}
            style={{
              flex: '1 1 240px',
              height: '46px',
              backgroundColor: '#1c1212',
              color: isRunning ? '#f87171' : '#666',
              border: `1px solid ${isRunning ? '#7f1d1d' : '#2c1e1e'}`,
              fontWeight: '800',
              opacity: stopping || !isRunning ? 0.5 : 1,
              cursor: stopping || !isRunning ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {stopping ? (
              <>
                <RefreshCw className="animate-spin" size={16} />
                <span>TRANSMITTING STOP...</span>
              </>
            ) : (
              <>
                <StopCircle size={16} color={isRunning ? '#f87171' : '#666'} />
                <span>SAFE STOP</span>
              </>
            )}
          </button>
        </div>

        {/* Inline confirmation for Safe Stop */}
        {showStopModal && (
          <div style={{
            margin: '0 1.75rem 1.5rem 1.75rem',
            padding: '1.25rem',
            background: '#221111',
            border: '1px solid #7f1d1d',
            borderRadius: '2px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <AlertTriangle size={18} color="#f87171" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#f87171', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  CONFIRM SAFE STOP INSTRUCTION
                </div>
                <div style={{ fontSize: '0.7rem', color: '#ccc', marginTop: '0.25rem', lineHeight: '1.4' }}>
                  This sends a graceful stop request to the BIOSYNC backend. Ongoing SDK pull or file writing operations will complete safely before automation halting to prevent workbook corruption.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowStopModal(false)}
                disabled={stopping}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'transparent',
                  border: '1px solid #444',
                  color: '#bbb',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  borderRadius: '2px',
                  cursor: 'pointer'
                }}
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleSafeStop}
                disabled={stopping}
                style={{
                  padding: '0.5rem 1.25rem',
                  background: '#b91c1c',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.7rem',
                  fontWeight: '800',
                  letterSpacing: '0.05em',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {stopping && <RefreshCw className="animate-spin" size={14} />}
                CONFIRM SAFE STOP
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 1 — AUTOMATION CONTROL */}
      <div className="ud-card" style={{ padding: '0', border: '1px solid #222', borderRadius: '2px', background: '#141414' }}>
        <div style={{
          padding: '1.25rem 2rem',
          borderBottom: '1px solid #222',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#1a1a1a'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Sliders size={18} color="#fff" />
            <h2 style={{ fontSize: '0.875rem', fontWeight: '900', letterSpacing: '0.1em', margin: 0, textTransform: 'uppercase' }}>
              AUTOMATION CONTROL
            </h2>
          </div>
          <span style={{ fontSize: '0.65rem', fontWeight: '700', color: '#555', letterSpacing: '0.1em' }}>
            SECTION 01 // DISPATCH
          </span>
        </div>

        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', background: '#141414' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', alignItems: 'start' }}>
            {/* Automation Mode Toggle */}
            <div>
              <label className="input-label">AUTOMATION MODE</label>
              <div style={{
                display: 'flex',
                background: '#0a0a0a',
                border: '1px solid #222',
                padding: '4px',
                borderRadius: '2px',
                gap: '4px'
              }}>
                <button
                  type="button"
                  onClick={() => setConfigForm((prev) => ({ ...prev, automation_enabled: true }))}
                  style={{
                    flex: 1,
                    padding: '0.7rem',
                    border: 'none',
                    borderRadius: '2px',
                    background: configForm.automation_enabled ? '#fff' : 'transparent',
                    color: configForm.automation_enabled ? '#000' : '#666',
                    fontWeight: '800',
                    fontSize: '0.75rem',
                    letterSpacing: '0.08em',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Check size={14} color={configForm.automation_enabled ? '#000' : '#444'} />
                  ENABLED
                </button>
                <button
                  type="button"
                  onClick={() => setConfigForm((prev) => ({ ...prev, automation_enabled: false }))}
                  style={{
                    flex: 1,
                    padding: '0.7rem',
                    border: 'none',
                    borderRadius: '2px',
                    background: !configForm.automation_enabled ? '#262626' : 'transparent',
                    color: !configForm.automation_enabled ? '#fff' : '#666',
                    fontWeight: '800',
                    fontSize: '0.75rem',
                    letterSpacing: '0.08em',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  DISABLED
                </button>
              </div>
              <div style={{ fontSize: '0.65rem', color: '#555', marginTop: '0.6rem', fontWeight: '600' }}>
                Master switch for scheduled background dispatch.
              </div>
            </div>

            {/* FEATURE 1: MULTIPLE AUTOMATIC RUN TIMES (24-HOUR) */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label className="input-label" style={{ margin: 0 }}>AUTOMATIC RUN TIMES (24-HOUR)</label>
                <span style={{ fontSize: '0.65rem', color: '#666', fontWeight: '700' }}>
                  {configForm.run_times?.length || 1} {configForm.run_times?.length === 1 ? 'SLOT' : 'SLOTS'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {configForm.run_times.map((timeVal, idx) => {
                  const isDuplicate = configForm.run_times.filter((t) => t === timeVal).length > 1;
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        background: '#0a0a0a',
                        border: `1px solid ${isDuplicate ? '#7f1d1d' : '#222'}`,
                        padding: '0.5rem 0.75rem',
                        borderRadius: '2px'
                      }}
                    >
                      <span style={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        fontWeight: '900',
                        color: '#666',
                        width: '24px',
                        textAlign: 'center'
                      }}>
                        {String(idx + 1).padStart(2, '0')}
                      </span>

                      <input
                        type="time"
                        className="input-tech"
                        value={timeVal}
                        onChange={(e) => handleUpdateTime(idx, e.target.value)}
                        style={{
                          backgroundColor: '#141414',
                          border: `1px solid ${isDuplicate ? '#991b1b' : '#333'}`,
                          fontFamily: 'monospace',
                          fontSize: '0.9rem',
                          fontWeight: '700',
                          padding: '0.45rem 0.75rem',
                          maxWidth: '160px'
                        }}
                      />

                      {isDuplicate && (
                        <span style={{ fontSize: '0.65rem', color: '#f87171', fontWeight: '700', letterSpacing: '0.05em' }}>
                          DUPLICATE
                        </span>
                      )}

                      <div style={{ flex: 1 }} />

                      <button
                        type="button"
                        onClick={() => handleRemoveTime(idx)}
                        disabled={configForm.run_times.length <= 1}
                        title={configForm.run_times.length <= 1 ? 'At least one run time must always remain' : 'Remove run time'}
                        style={{
                          background: 'transparent',
                          border: '1px solid #333',
                          color: configForm.run_times.length <= 1 ? '#444' : '#888',
                          padding: '0.4rem 0.75rem',
                          fontSize: '0.65rem',
                          fontWeight: '800',
                          letterSpacing: '0.05em',
                          borderRadius: '2px',
                          cursor: configForm.run_times.length <= 1 ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseOver={(e) => {
                          if (configForm.run_times.length > 1) {
                            e.currentTarget.style.color = '#f87171';
                            e.currentTarget.style.borderColor = '#7f1d1d';
                            e.currentTarget.style.background = '#1a0d0d';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (configForm.run_times.length > 1) {
                            e.currentTarget.style.color = '#888';
                            e.currentTarget.style.borderColor = '#333';
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
                      >
                        REMOVE
                      </button>
                    </div>
                  );
                })}

                <div style={{ marginTop: '0.25rem' }}>
                  <button
                    type="button"
                    onClick={handleAddTime}
                    style={{
                      background: '#171717',
                      border: '1px dashed #333',
                      color: '#bbb',
                      width: '100%',
                      padding: '0.65rem',
                      fontSize: '0.7rem',
                      fontWeight: '800',
                      letterSpacing: '0.08em',
                      borderRadius: '2px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#222';
                      e.currentTarget.style.color = '#fff';
                      e.currentTarget.style.borderColor = '#555';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#171717';
                      e.currentTarget.style.color = '#bbb';
                      e.currentTarget.style.borderColor = '#333';
                    }}
                  >
                    <Plus size={14} />
                    <span>ADD RUN TIME</span>
                  </button>
                </div>

                <div style={{ fontSize: '0.65rem', color: '#555', marginTop: '0.4rem', fontWeight: '600' }}>
                  Daily schedule slots (24-hour HH:MM). All configured times execute on the selected run days below.
                </div>
              </div>
            </div>
          </div>

          {/* Run Days */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label className="input-label" style={{ margin: 0 }}>RUN DAYS</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={setWeekdaysOnly}
                  style={{
                    background: 'transparent',
                    border: '1px solid #2a2a2a',
                    color: '#888',
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.6rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    borderRadius: '2px'
                  }}
                >
                  WEEKDAYS (MON-FRI)
                </button>
                <button
                  type="button"
                  onClick={setAllDays}
                  style={{
                    background: 'transparent',
                    border: '1px solid #2a2a2a',
                    color: '#888',
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.6rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    borderRadius: '2px'
                  }}
                >
                  ALL DAYS (7D)
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
              {ALL_DAYS.map((day) => {
                const isSelected = configForm.run_days?.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleToggleDay(day)}
                    style={{
                      padding: '0.8rem 0.2rem',
                      background: isSelected ? '#fff' : '#0a0a0a',
                      color: isSelected ? '#000' : '#666',
                      border: isSelected ? '1px solid #fff' : '1px solid #222',
                      borderRadius: '2px',
                      fontWeight: '900',
                      fontSize: '0.75rem',
                      letterSpacing: '0.05em',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#555', marginTop: '0.6rem', fontWeight: '600' }}>
              Selected days when automated cycles will run ({configForm.run_days?.length || 0} active).
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2 — OFFLINE DEVICE RECOVERY */}
      <div className="ud-card" style={{ padding: '0', border: '1px solid #222', borderRadius: '2px', background: '#141414' }}>
        <div style={{
          padding: '1.25rem 2rem',
          borderBottom: '1px solid #222',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#1a1a1a'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <RotateCcw size={18} color="#fff" />
            <h2 style={{ fontSize: '0.875rem', fontWeight: '900', letterSpacing: '0.1em', margin: 0, textTransform: 'uppercase' }}>
              OFFLINE DEVICE RECOVERY
            </h2>
          </div>
          <span style={{ fontSize: '0.65rem', fontWeight: '700', color: '#555', letterSpacing: '0.1em' }}>
            SECTION 02 // FAULT RECOVERY
          </span>
        </div>

        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', background: '#141414' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            {/* Offline Device Recovery Switch */}
            <div>
              <label className="input-label">OFFLINE DEVICE RECOVERY</label>
              <div style={{
                display: 'flex',
                background: '#0a0a0a',
                border: '1px solid #222',
                padding: '4px',
                borderRadius: '2px',
                gap: '4px'
              }}>
                <button
                  type="button"
                  onClick={() => setConfigForm((prev) => ({ ...prev, offline_recovery_enabled: true }))}
                  style={{
                    flex: 1,
                    padding: '0.7rem',
                    border: 'none',
                    borderRadius: '2px',
                    background: configForm.offline_recovery_enabled ? '#fff' : 'transparent',
                    color: configForm.offline_recovery_enabled ? '#000' : '#666',
                    fontWeight: '800',
                    fontSize: '0.75rem',
                    letterSpacing: '0.08em',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Check size={14} color={configForm.offline_recovery_enabled ? '#000' : '#444'} />
                  ENABLED
                </button>
                <button
                  type="button"
                  onClick={() => setConfigForm((prev) => ({ ...prev, offline_recovery_enabled: false }))}
                  style={{
                    flex: 1,
                    padding: '0.7rem',
                    border: 'none',
                    borderRadius: '2px',
                    background: !configForm.offline_recovery_enabled ? '#262626' : 'transparent',
                    color: !configForm.offline_recovery_enabled ? '#fff' : '#666',
                    fontWeight: '800',
                    fontSize: '0.75rem',
                    letterSpacing: '0.08em',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  DISABLED
                </button>
              </div>
              <div style={{ fontSize: '0.65rem', color: '#555', marginTop: '0.6rem', fontWeight: '600' }}>
                Automatically retry endpoints that did not respond on initial pull.
              </div>
            </div>

            {/* Check Offline Devices Every (interval minutes) */}
            <div>
              <label className="input-label" htmlFor="offline_interval">CHECK OFFLINE DEVICES EVERY</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input
                  id="offline_interval"
                  type="number"
                  min="1"
                  max="1440"
                  className="input-tech"
                  value={configForm.offline_check_interval_minutes}
                  onChange={(e) => setConfigForm({ ...configForm, offline_check_interval_minutes: e.target.value })}
                  style={{
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #222',
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    padding: '0.65rem 1rem'
                  }}
                />
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#888', whiteSpace: 'nowrap' }}>
                  MINUTES
                </span>
              </div>
              <div style={{ fontSize: '0.65rem', color: '#555', marginTop: '0.6rem', fontWeight: '600' }}>
                Sleep duration between subsequent retry cycles (maps to offline_check_interval_minutes).
              </div>
            </div>
          </div>

          {/* Recovery Method & Dynamic Field */}
          <div style={{ borderTop: '1px solid #222', paddingTop: '1.75rem' }}>
            <label className="input-label">RECOVERY METHOD</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {/* Option 1: Retry Window */}
              <button
                type="button"
                onClick={() => setConfigForm((prev) => ({ ...prev, recovery_mode: 'retry_window' }))}
                style={{
                  padding: '1.25rem',
                  background: configForm.recovery_mode === 'retry_window' ? '#1c1c1c' : '#0a0a0a',
                  border: configForm.recovery_mode === 'retry_window' ? '1px solid #fff' : '1px solid #222',
                  borderRadius: '2px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '900', color: configForm.recovery_mode === 'retry_window' ? '#fff' : '#888', letterSpacing: '0.05em' }}>
                    1. RETRY WINDOW
                  </span>
                  {configForm.recovery_mode === 'retry_window' && (
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }}></span>
                  )}
                </div>
                <span style={{ fontSize: '0.65rem', color: '#555', lineHeight: '1.4' }}>
                  Retry unresolved devices within a bounded elapsed time duration.
                </span>
              </button>

              {/* Option 2: Retry Attempts */}
              <button
                type="button"
                onClick={() => setConfigForm((prev) => ({ ...prev, recovery_mode: 'retry_attempts' }))}
                style={{
                  padding: '1.25rem',
                  background: configForm.recovery_mode === 'retry_attempts' ? '#1c1c1c' : '#0a0a0a',
                  border: configForm.recovery_mode === 'retry_attempts' ? '1px solid #fff' : '1px solid #222',
                  borderRadius: '2px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '900', color: configForm.recovery_mode === 'retry_attempts' ? '#fff' : '#888', letterSpacing: '0.05em' }}>
                    2. RETRY ATTEMPTS
                  </span>
                  {configForm.recovery_mode === 'retry_attempts' && (
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }}></span>
                  )}
                </div>
                <span style={{ fontSize: '0.65rem', color: '#555', lineHeight: '1.4' }}>
                  Retry unresolved devices a fixed maximum number of execution attempts.
                </span>
              </button>
            </div>

            {/* Dynamic field based on chosen recovery method while preserving other value */}
            <div style={{ background: '#0a0a0a', border: '1px solid #222', padding: '1.5rem', borderRadius: '2px' }}>
              {configForm.recovery_mode === 'retry_window' ? (
                <div>
                  <label className="input-label" htmlFor="retry_window_val">RETRY WINDOW</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', maxWidth: '300px' }}>
                    <input
                      id="retry_window_val"
                      type="number"
                      min="1"
                      max="1440"
                      className="input-tech"
                      value={configForm.retry_window_minutes}
                      onChange={(e) => setConfigForm({ ...configForm, retry_window_minutes: e.target.value })}
                      style={{
                        backgroundColor: '#141414',
                        border: '1px solid #333',
                        fontFamily: 'monospace',
                        fontSize: '0.9rem',
                        fontWeight: '700'
                      }}
                    />
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#888', whiteSpace: 'nowrap' }}>
                      MINUTES
                    </span>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#555', marginTop: '0.5rem', fontWeight: '600' }}>
                    Configured deadline window for repeating offline attempts (maps to retry_window_minutes).
                  </div>
                </div>
              ) : (
                <div>
                  <label className="input-label" htmlFor="max_retries_val">MAXIMUM RETRY ATTEMPTS</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', maxWidth: '300px' }}>
                    {/* FEATURE 2: RETRY CEILING UP TO 1000 */}
                    <input
                      id="max_retries_val"
                      type="number"
                      min="0"
                      max="1000"
                      className="input-tech"
                      value={configForm.max_retry_attempts}
                      onChange={(e) => setConfigForm({ ...configForm, max_retry_attempts: e.target.value })}
                      style={{
                        backgroundColor: '#141414',
                        border: '1px solid #333',
                        fontFamily: 'monospace',
                        fontSize: '0.9rem',
                        fontWeight: '700'
                      }}
                    />
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#888', whiteSpace: 'nowrap' }}>
                      CYCLES
                    </span>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#555', marginTop: '0.5rem', fontWeight: '600' }}>
                    Maximum ceiling only. Recovery stops automatically when no devices remain pending.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SAVE SETTINGS ACTION BUTTON */}
          <div style={{ paddingTop: '1rem', borderTop: '1px solid #222' }}>
            <button
              type="button"
              className="btn-solid"
              onClick={handleSaveSettings}
              disabled={saving}
              style={{
                width: '100%',
                backgroundColor: '#222',
                color: '#fff',
                height: '48px',
                border: '1px solid #333',
                fontWeight: '800',
                letterSpacing: '0.1em'
              }}
            >
              {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
              {saving ? 'SAVING CONFIGURATION...' : 'SAVE SETTINGS'}
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3 — LIVE AUTOMATION STATUS */}
      <div className="ud-card" style={{ padding: '0', border: '1px solid #222', borderRadius: '2px', background: '#141414' }}>
        <div style={{
          padding: '1.25rem 2rem',
          borderBottom: '1px solid #222',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#1a1a1a',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Activity size={18} color="#fff" />
            <h2 style={{ fontSize: '0.875rem', fontWeight: '900', letterSpacing: '0.1em', margin: 0, textTransform: 'uppercase' }}>
              AUTOMATION STATUS
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Live State Badge */}
            <div style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '2px',
              backgroundColor: stateStyle.bg,
              border: `1px solid ${stateStyle.border}`,
              color: stateStyle.color,
              fontSize: '0.7rem',
              fontWeight: '900',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: stateStyle.color }}></span>
              {statusData.state || 'UNKNOWN'}
            </div>
          </div>
        </div>

        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', background: '#141414' }}>

          {/* Current Message / Error Banner */}
          <div style={{
            background: statusData.last_error ? '#221111' : '#0a0a0a',
            border: `1px solid ${statusData.last_error ? '#7f1d1d' : '#222'}`,
            padding: '1rem 1.25rem',
            borderRadius: '2px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Terminal size={14} color={statusData.last_error ? '#f87171' : '#888'} />
              <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#666', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                CURRENT MESSAGE
              </span>
            </div>
            <div style={{
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              color: statusData.last_error ? '#fca5a5' : '#e5e5e5',
              fontWeight: '600',
              lineHeight: '1.4'
            }}>
              {statusData.message || 'No active message'}
            </div>
            {statusData.last_error && (
              <div style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: '700', marginTop: '0.25rem', fontFamily: 'monospace' }}>
                LAST ERROR: {statusData.last_error}
              </div>
            )}
          </div>

          {/* FEATURE 3: MISSED RUN RECOVERY / CATCH-UP QUEUED STATUS */}
          {Array.isArray(statusData.catchup_for_times) && statusData.catchup_for_times.length > 0 && (
            <div style={{
              background: '#19150b',
              border: '1px solid #854d0e',
              borderLeft: '3px solid #fbbf24',
              padding: '1rem 1.25rem',
              borderRadius: '2px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={15} color="#fbbf24" />
                  <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#fbbf24', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    MISSED RUN RECOVERY // CATCH-UP QUEUED
                  </span>
                </div>
                {statusData.catchup_due_at && (
                  <span style={{ fontSize: '0.7rem', color: '#fef08a', fontFamily: 'monospace', fontWeight: '700' }}>
                    DUE AT: {statusData.catchup_due_at}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#d4d4d4', lineHeight: '1.4' }}>
                Missed schedule slot(s) queued for automatic single-cycle recovery:
                <span style={{ fontFamily: 'monospace', fontWeight: '800', color: '#fff', marginLeft: '0.5rem' }}>
                  {statusData.catchup_for_times.join(', ')}
                </span>
              </div>
            </div>
          )}

          {/* Status Metrics Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
            {/* 1. DAILY COVERAGE */}
            <div style={{ background: '#0a0a0a', border: '1px solid #222', padding: '1rem', borderRadius: '2px' }}>
              <div style={{ fontSize: '0.65rem', color: '#666', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                DAILY COVERAGE
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#4ade80', margin: '0.25rem 0', fontFamily: 'monospace' }}>
                {dailyCoveredCount} / {dailyKnownCount}
              </div>
              <div style={{
                fontSize: '0.6rem',
                color: dailyUncoveredCount === 0 && dailyKnownCount > 0 ? '#4ade80' : '#888',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                {dailyUncoveredCount === 0 && dailyKnownCount > 0 && <CheckCircle2 size={11} color="#4ade80" />}
                {dailyUncoveredCount === 0 && dailyKnownCount > 0 ? 'ALL DEVICES COVERED TODAY' : 'FETCHED AT LEAST ONCE TODAY'}
              </div>
            </div>

            {/* 2. NEVER FETCHED TODAY */}
            <div style={{ background: '#0a0a0a', border: '1px solid #222', padding: '1rem', borderRadius: '2px' }}>
              <div style={{ fontSize: '0.65rem', color: '#666', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                NEVER FETCHED TODAY
              </div>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: '900',
                color: dailyUncoveredCount === 0 ? '#4ade80' : '#f87171',
                margin: '0.25rem 0',
                fontFamily: 'monospace'
              }}>
                {dailyUncoveredCount}
              </div>
              <div style={{
                fontSize: '0.6rem',
                color: dailyUncoveredCount === 0 ? '#4ade80' : '#f87171',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                {dailyUncoveredCount === 0 ? 'ALL DEVICES COVERED TODAY' : 'STILL MISSING DAILY COVERAGE'}
              </div>
            </div>

            {/* 3. LATEST PENDING */}
            <div style={{ background: '#0a0a0a', border: '1px solid #222', padding: '1rem', borderRadius: '2px' }}>
              <div style={{ fontSize: '0.65rem', color: '#666', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                LATEST PENDING
              </div>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: '900',
                color: latestPendingCount > 0 ? '#fbbf24' : '#666',
                margin: '0.25rem 0',
                fontFamily: 'monospace'
              }}>
                {latestPendingCount}
              </div>
              <div style={{ fontSize: '0.6rem', color: '#888', fontWeight: '700' }}>
                AWAITING LATEST CAPTURE
              </div>
            </div>

            {/* 4. DAILY RETRIES */}
            <div style={{ background: '#0a0a0a', border: '1px solid #222', padding: '1rem', borderRadius: '2px' }}>
              <div style={{ fontSize: '0.65rem', color: '#666', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                DAILY RETRIES
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#60a5fa', margin: '0.25rem 0', fontFamily: 'monospace' }}>
                {currentRetries} / {maxRetries}
              </div>
              <div style={{ fontSize: '0.6rem', color: '#888', fontWeight: '700' }}>
                DAILY RETRY BUDGET USED
              </div>
            </div>

            {/* 5. TOTAL DEVICES */}
            <div style={{ background: '#0a0a0a', border: '1px solid #222', padding: '1rem', borderRadius: '2px' }}>
              <div style={{ fontSize: '0.65rem', color: '#666', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                TOTAL DEVICES
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#fff', margin: '0.25rem 0', fontFamily: 'monospace' }}>
                {dailyKnownCount}
              </div>
              <div style={{ fontSize: '0.6rem', color: '#555', fontWeight: '600' }}>
                DEVICE REPOSITORY
              </div>
            </div>

            {/* 6. NO LOG */}
            <div style={{ background: '#0a0a0a', border: '1px solid #222', padding: '1rem', borderRadius: '2px' }}>
              <div style={{ fontSize: '0.65rem', color: '#666', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                NO LOG
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#aaa', margin: '0.25rem 0', fontFamily: 'monospace' }}>
                {statusData.no_log_count ?? (statusData.no_log_devices?.length || 0)}
              </div>
              <div style={{ fontSize: '0.6rem', color: '#555', fontWeight: '600' }}>
                EMPTY LOG RETURNED
              </div>
            </div>
          </div>

          {/* Key Runtime Metadata Grid */}
          <div style={{
            background: '#0a0a0a',
            border: '1px solid #222',
            padding: '1.5rem',
            borderRadius: '2px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem'
          }}>
            <div>
              <span style={{ fontSize: '0.65rem', color: '#666', fontWeight: '800', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                CURRENT STAGE
              </span>
              <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: '700', fontFamily: 'monospace', display: 'block', marginTop: '0.25rem' }}>
                {statusData.stage || 'N/A'}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.65rem', color: '#666', fontWeight: '800', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                TRIGGER / RUN TYPE
              </span>
              <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: '700', fontFamily: 'monospace', display: 'block', marginTop: '0.25rem', textTransform: 'uppercase' }}>
                {statusData.trigger || 'N/A'}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.65rem', color: '#666', fontWeight: '800', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                LATEST SCHEDULE SLOT
              </span>
              <span style={{ fontSize: '0.8rem', color: latestScheduleSlot ? '#60a5fa' : '#888', fontWeight: '700', fontFamily: 'monospace', display: 'block', marginTop: '0.25rem' }}>
                {latestScheduleSlot ? `${latestScheduleSlot} HRS` : 'NONE'}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.65rem', color: '#666', fontWeight: '800', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                RUN DATE
              </span>
              <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: '700', fontFamily: 'monospace', display: 'block', marginTop: '0.25rem' }}>
                {statusData.run_date || statusData.schedule_date || 'N/A'}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.65rem', color: '#666', fontWeight: '800', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                STARTED AT
              </span>
              <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: '700', fontFamily: 'monospace', display: 'block', marginTop: '0.25rem' }}>
                {statusData.started_at || 'N/A'}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.65rem', color: '#666', fontWeight: '800', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                COMPLETED AT
              </span>
              <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: '700', fontFamily: 'monospace', display: 'block', marginTop: '0.25rem' }}>
                {statusData.completed_at || 'N/A'}
              </span>
            </div>

            {statusData.latest_schedule_completed_at && (
              <div>
                <span style={{ fontSize: '0.65rem', color: '#666', fontWeight: '800', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  LATEST SCHEDULE COMPLETED
                </span>
                <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: '700', fontFamily: 'monospace', display: 'block', marginTop: '0.25rem' }}>
                  {statusData.latest_schedule_completed_at}
                </span>
              </div>
            )}

            <div>
              <span style={{ fontSize: '0.65rem', color: '#666', fontWeight: '800', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                NEXT CHECK AT
              </span>
              <span style={{ fontSize: '0.8rem', color: statusData.next_check_at ? '#fbbf24' : '#888', fontWeight: '700', fontFamily: 'monospace', display: 'block', marginTop: '0.25rem' }}>
                {statusData.next_check_at || 'NONE SCHEDULED'}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.65rem', color: '#666', fontWeight: '800', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                LAST FETCH COMPLETED AT
              </span>
              <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: '700', fontFamily: 'monospace', display: 'block', marginTop: '0.25rem' }}>
                {statusData.last_fetch_completed_at || 'N/A'}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.65rem', color: '#666', fontWeight: '800', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                LAST COMBINE COMPLETED AT
              </span>
              <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: '700', fontFamily: 'monospace', display: 'block', marginTop: '0.25rem' }}>
                {statusData.last_combine_completed_at || 'N/A'}
              </span>
            </div>
          </div>

          {/* LATEST PENDING DEVICES SECTION */}
          <div style={{ borderTop: '1px solid #222', paddingTop: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Hourglass size={16} color={latestPendingList.length > 0 ? '#fbbf24' : '#666'} />
                <h3 style={{ fontSize: '0.8rem', fontWeight: '900', color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  LATEST PENDING DEVICES ({latestPendingList.length})
                </h3>
              </div>
              <span style={{ fontSize: '0.65rem', color: '#888', fontWeight: '700' }}>
                WAITING FOR RETRY FROM MOST RECENT CAPTURE{latestScheduleSlot ? ` [${latestScheduleSlot}]` : ''}
              </span>
            </div>

            {latestPendingList.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '0.6rem',
                maxHeight: '280px',
                overflowY: 'auto',
                background: '#0a0a0a',
                border: '1px solid #222',
                padding: '1rem',
                borderRadius: '2px'
              }}>
                {latestPendingList.map((device) => (
                  <div
                    key={device}
                    style={{
                      background: '#19150b',
                      border: '1px solid #3d2f13',
                      borderLeft: '3px solid #fbbf24',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Hourglass size={13} color="#fbbf24" style={{ flexShrink: 0 }} />
                    <span style={{
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      fontWeight: '700',
                      color: '#fde68a',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {device}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: '1.25rem',
                background: '#0a0a0a',
                border: '1px solid #222',
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: '#888'
              }}>
                <CheckCircle2 size={16} color="#4ade80" />
                <span style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.05em', color: '#aaa' }}>
                  No pending devices for the latest schedule capture.
                </span>
              </div>
            )}
          </div>

          {/* NEVER FETCHED TODAY SECTION (DAILY UNRESOLVED) */}
          <div style={{ borderTop: '1px solid #222', paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={16} color={neverFetchedList.length > 0 ? '#f87171' : '#4ade80'} />
                <h3 style={{ fontSize: '0.8rem', fontWeight: '900', color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  NEVER FETCHED TODAY ({neverFetchedList.length})
                </h3>
              </div>
              <span style={{ fontSize: '0.65rem', color: '#888', fontWeight: '700' }}>
                DEVICES WITH ZERO SUCCESSFUL FETCHES ALL DAY
              </span>
            </div>

            {neverFetchedList.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '0.6rem',
                maxHeight: '280px',
                overflowY: 'auto',
                background: '#0a0a0a',
                border: '1px solid #222',
                padding: '1rem',
                borderRadius: '2px'
              }}>
                {neverFetchedList.map((device) => (
                  <div
                    key={device}
                    style={{
                      background: '#160d0d',
                      border: '1px solid #3d1c1c',
                      borderLeft: '3px solid #f87171',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <AlertCircle size={13} color="#f87171" style={{ flexShrink: 0 }} />
                    <span style={{
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      fontWeight: '700',
                      color: '#fca5a5',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {device}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: '1.25rem',
                background: '#0a0a0a',
                border: '1px solid #1f3325',
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: '#4ade80'
              }}>
                <CheckCircle2 size={16} color="#4ade80" />
                <span style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.05em' }}>
                  Daily coverage complete — all devices fetched at least once.
                </span>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
