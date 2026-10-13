import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../utils/api';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  RefreshCw,
  Play,
  StopCircle,
  Search,
  HardDrive,
  FileText,
  Sliders,
  Activity,
  Layers,
  Archive,
  Calendar,
  AlertCircle,
  HelpCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Info,
  Check,
  X,
  ExternalLink,
  Cpu
} from 'lucide-react';

const formatDateNice = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const parts = String(dateStr).split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parts[2];
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${day} ${months[monthIdx]} ${year}`;
      }
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

const shortenHash = (hash, len = 8) => {
  if (!hash || typeof hash !== 'string') return 'N/A';
  if (hash.length <= len * 2) return hash;
  return `${hash.slice(0, len)}...${hash.slice(-len)}`;
};

export default function DataIntegrityPage() {
  const pollTimerRef = useRef(null);

  // Bootstrap State
  const [bootstrapData, setBootstrapData] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);
  const [notification, setNotification] = useState({ type: '', text: '' });

  // Active Tab: 'queue' | 'archives' | 'history' | 'mapping' | 'storage' | 'audit'
  const [activeTab, setActiveTab] = useState('queue');

  // Action Loading States
  const [scanning, setScanning] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [cleaningStorage, setCleaningStorage] = useState(false);
  const [togglingMaster, setTogglingMaster] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  // Confirmation Modals
  const [masterModal, setMasterModal] = useState({ open: false, targetEnabled: false });
  const [scanModal, setScanModal] = useState(false);
  const [recoveryModal, setRecoveryModal] = useState(false);
  const [historyDetailModal, setHistoryDetailModal] = useState(null);

  // Queue Tab State
  const [queueItems, setQueueItems] = useState([]);
  const [queueCounts, setQueueCounts] = useState({});
  const [queueTotal, setQueueTotal] = useState(0);
  const [queueOffset, setQueueOffset] = useState(0);
  const queueLimit = 50;
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueDateFilter, setQueueDateFilter] = useState('');
  const [queueDeviceFilter, setQueueDeviceFilter] = useState('');
  const [queueStatusFilter, setQueueStatusFilter] = useState('');
  const [queueIntegrityFilter, setQueueIntegrityFilter] = useState('');

  // Archives Tab State
  const [archiveItems, setArchiveItems] = useState([]);
  const [archiveTotal, setArchiveTotal] = useState(0);
  const [archiveOffset, setArchiveOffset] = useState(0);
  const archiveLimit = 50;
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveDateFilter, setArchiveDateFilter] = useState('');
  const [archiveStatusFilter, setArchiveStatusFilter] = useState('');

  // History Tab State
  const [historyItems, setHistoryItems] = useState([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyOffset, setHistoryOffset] = useState(0);
  const historyLimit = 50;
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyDateFilter, setHistoryDateFilter] = useState('');
  const [historyDeviceFilter, setHistoryDeviceFilter] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('');

  // Mapping Tab State
  const [mappingData, setMappingData] = useState(null);
  const [mappingLoading, setMappingLoading] = useState(false);

  // Audit Tab State
  const [auditLines, setAuditLines] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // Editable Recovery Config Form State (Section 16)
  const [configForm, setConfigForm] = useState({
    poll_interval_seconds: 60,
    task1_guard_minutes: 15,
    offline_retry_interval_minutes: 15,
    recovery_error_retry_interval_minutes: 10,
    max_auto_attempts_per_device: 8,
    max_dates_per_cycle: 1,
    run_integrity_scan_before_queue: true,
    session_retention_days: 7,
    manual_review_retention_days: 30,
    backup_retention_days: 30,
    backups_per_archive: 2,
    max_recovery_storage_gb: 5.0,
    cleanup_on_start: true,
    cleanup_after_cycle: true,
  });

  const showNotification = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => {
      setNotification((curr) => (curr.text === text ? { type: '', text: '' } : curr));
    }, 6000);
  };

  // 1. Load Bootstrap Data
  const loadBootstrap = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setRefreshing(true);
      const data = await api.get(`/integrity/bootstrap?_=${Date.now()}`);
      if (data && typeof data === 'object') {
        setBootstrapData(data);
        setLastRefreshedAt(new Date().toLocaleTimeString());

        // Sync config form with loaded recovery config if not dirty
        if (data.recovery?.config) {
          setConfigForm((prev) => ({
            ...prev,
            ...data.recovery.config,
          }));
        }

        // Cache fresh mapping if available
        if (data.mapping) {
          setMappingData(data.mapping);
        }
      }
    } catch (err) {
      console.error('Failed to load integrity bootstrap:', err);
      if (!isSilent) {
        showNotification('error', err.message || 'Failed to load integrity bootstrap state.');
      }
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, []);

  // 2. Fetch Queue Data
  const fetchQueue = useCallback(async (offset = 0) => {
    setQueueLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('offset', String(offset));
      params.append('limit', String(queueLimit));
      if (queueDateFilter.trim()) params.append('date', queueDateFilter.trim());
      if (queueDeviceFilter.trim()) params.append('device', queueDeviceFilter.trim());
      if (queueStatusFilter.trim()) params.append('queue_status', queueStatusFilter.trim());
      if (queueIntegrityFilter.trim()) params.append('integrity_status', queueIntegrityFilter.trim());

      const res = await api.get(`/integrity/queue?${params.toString()}`);
      if (res) {
        setQueueItems(res.items || []);
        setQueueTotal(res.filtered_total ?? (res.items?.length || 0));
        setQueueCounts(res.counts || {});
        setQueueOffset(offset);
      }
    } catch (err) {
      console.error('Failed to fetch queue:', err);
      showNotification('error', err.message || 'Failed to load recovery queue items.');
    } finally {
      setQueueLoading(false);
    }
  }, [queueDateFilter, queueDeviceFilter, queueStatusFilter, queueIntegrityFilter]);

  // 3. Fetch Archives Data
  const fetchArchives = useCallback(async (offset = 0) => {
    setArchiveLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('offset', String(offset));
      params.append('limit', String(archiveLimit));
      if (archiveDateFilter.trim()) params.append('date', archiveDateFilter.trim());
      if (archiveStatusFilter.trim()) params.append('status', archiveStatusFilter.trim());

      const res = await api.get(`/integrity/archives?${params.toString()}`);
      if (res) {
        setArchiveItems(res.items || []);
        setArchiveTotal(res.total ?? (res.items?.length || 0));
        setArchiveOffset(offset);
      }
    } catch (err) {
      console.error('Failed to fetch archives:', err);
      showNotification('error', err.message || 'Failed to load archive integrity items.');
    } finally {
      setArchiveLoading(false);
    }
  }, [archiveDateFilter, archiveStatusFilter]);

  // 4. Fetch Recovery History Data
  const fetchHistory = useCallback(async (offset = 0) => {
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('offset', String(offset));
      params.append('limit', String(historyLimit));
      if (historyDateFilter.trim()) params.append('date', historyDateFilter.trim());
      if (historyDeviceFilter.trim()) params.append('device', historyDeviceFilter.trim());
      if (historyStatusFilter.trim()) params.append('status', historyStatusFilter.trim());

      const res = await api.get(`/integrity/history?${params.toString()}`);
      if (res) {
        setHistoryItems(res.items || []);
        setHistoryTotal(res.total ?? (res.items?.length || 0));
        setHistoryOffset(offset);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
      showNotification('error', err.message || 'Failed to load recovery history.');
    } finally {
      setHistoryLoading(false);
    }
  }, [historyDateFilter, historyDeviceFilter, historyStatusFilter]);

  // 5. Fetch Mapping Summary
  const fetchMapping = useCallback(async () => {
    setMappingLoading(true);
    try {
      const res = await api.get(`/integrity/mapping?_=${Date.now()}`);
      if (res) {
        setMappingData(res);
      }
    } catch (err) {
      console.error('Failed to fetch mapping:', err);
      showNotification('error', err.message || 'Failed to load historical mapping summary.');
    } finally {
      setMappingLoading(false);
    }
  }, []);

  // 6. Fetch Audit Trail
  const fetchAudit = useCallback(async () => {
    setAuditLoading(true);
    try {
      const res = await api.get(`/integrity/audit?limit=100&_=${Date.now()}`);
      if (res) {
        setAuditLines(Array.isArray(res.lines) ? res.lines : []);
      }
    } catch (err) {
      console.error('Failed to fetch audit:', err);
      showNotification('error', err.message || 'Failed to load audit trail.');
    } finally {
      setAuditLoading(false);
    }
  }, []);

  // Initial Load & Tab Switching
  useEffect(() => {
    loadBootstrap();
  }, [loadBootstrap]);

  useEffect(() => {
    if (activeTab === 'queue') {
      fetchQueue(0);
    } else if (activeTab === 'archives') {
      fetchArchives(0);
    } else if (activeTab === 'history') {
      fetchHistory(0);
    } else if (activeTab === 'mapping') {
      fetchMapping();
    } else if (activeTab === 'audit') {
      fetchAudit();
    }
  }, [activeTab, fetchQueue, fetchArchives, fetchHistory, fetchMapping, fetchAudit]);

  // Periodic Bootstrap Polling (Requirement 19)
  useEffect(() => {
    const isBusy =
      bootstrapData?.recovery?.active ||
      ['RUNNING', 'SCANNING', 'RECOVERING_DATE', 'STOPPING'].includes(
        String(bootstrapData?.recovery?.status?.state || '').toUpperCase()
      ) ||
      ['SCANNING', 'MAPPING'].includes(
        String(bootstrapData?.integrity?.status?.state || '').toUpperCase()
      );

    const pollInterval = isBusy ? 8000 : 20000;

    pollTimerRef.current = setInterval(() => {
      loadBootstrap(true);
    }, pollInterval);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [bootstrapData, loadBootstrap]);

  // Action: Master Toggle Execution
  const executeMasterToggle = async (enable) => {
    setTogglingMaster(true);
    try {
      const res = await api.put('/integrity/master', { enabled: enable });
      showNotification('success', res?.message || `Task 3 master ${enable ? 'ENABLED' : 'DISABLED'}.`);
      setMasterModal({ open: false, targetEnabled: false });
      await loadBootstrap();
    } catch (err) {
      console.error('Master toggle failed:', err);
      showNotification('error', err.message || 'Failed to update master toggle state.');
    } finally {
      setTogglingMaster(false);
    }
  };

  // Action: Scan Now
  const handleScanNow = async () => {
    setScanning(true);
    try {
      const res = await api.post('/integrity/scan', { force_rescan: false });
      showNotification('success', res?.message || 'Historical integrity scan started in background.');
      setScanModal(false);
      await loadBootstrap();
    } catch (err) {
      console.error('Scan now failed:', err);
      showNotification('error', err.message || 'Failed to start integrity scan.');
    } finally {
      setScanning(false);
    }
  };

  // Action: Run Recovery Now
  const handleRunRecoveryNow = async () => {
    setRecovering(true);
    try {
      const res = await api.post('/integrity/recovery/run-now');
      showNotification('success', res?.message || 'Historical recovery cycle started.');
      setRecoveryModal(false);
      await loadBootstrap();
      if (activeTab === 'queue') fetchQueue(0);
    } catch (err) {
      console.error('Run recovery failed:', err);
      showNotification('error', err.message || 'Failed to start recovery cycle.');
    } finally {
      setRecovering(false);
    }
  };

  // Action: Safe Stop
  const handleSafeStop = async () => {
    setStopping(true);
    try {
      const res = await api.post('/integrity/recovery/stop');
      showNotification('info', res?.message || 'Safe stop requested.');
      await loadBootstrap();
    } catch (err) {
      console.error('Safe stop failed:', err);
      showNotification('error', err.message || 'Failed to request safe stop.');
    } finally {
      setStopping(false);
    }
  };

  // Action: Storage Dry Run
  const handleStorageCleanup = async () => {
    setCleaningStorage(true);
    try {
      const res = await api.post('/integrity/storage/cleanup', { dry_run: true });
      const actionsCount = res?.storage?.actions?.length || 0;
      showNotification(
        'info',
        `Storage Dry Run completed. ${actionsCount} candidate cleanups evaluated without deleting files.`
      );
      await loadBootstrap();
    } catch (err) {
      console.error('Storage cleanup failed:', err);
      showNotification('error', err.message || 'Storage cleanup dry run failed.');
    } finally {
      setCleaningStorage(false);
    }
  };

  // Action: Save Recovery Config
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const payload = {
        poll_interval_seconds: Number(configForm.poll_interval_seconds),
        task1_guard_minutes: Number(configForm.task1_guard_minutes),
        offline_retry_interval_minutes: Number(configForm.offline_retry_interval_minutes),
        recovery_error_retry_interval_minutes: Number(configForm.recovery_error_retry_interval_minutes),
        max_auto_attempts_per_device: Number(configForm.max_auto_attempts_per_device),
        max_dates_per_cycle: Number(configForm.max_dates_per_cycle),
        session_retention_days: Number(configForm.session_retention_days),
        manual_review_retention_days: Number(configForm.manual_review_retention_days),
        backup_retention_days: Number(configForm.backup_retention_days),
        backups_per_archive: Number(configForm.backups_per_archive),
        max_recovery_storage_gb: Number(configForm.max_recovery_storage_gb),
        run_integrity_scan_before_queue: Boolean(configForm.run_integrity_scan_before_queue),
        cleanup_on_start: Boolean(configForm.cleanup_on_start),
        cleanup_after_cycle: Boolean(configForm.cleanup_after_cycle),
      };

      const res = await api.put('/integrity/recovery/config', payload);
      showNotification('success', res?.message || 'Recovery manager settings saved.');
      await loadBootstrap();
    } catch (err) {
      console.error('Save config failed:', err);
      showNotification('error', err.message || 'Failed to save recovery configuration.');
    } finally {
      setSavingConfig(false);
    }
  };

  // Safe Badge Style Helper
  const getBadgeStyle = (status) => {
    const s = String(status || '').toUpperCase();
    if (['COMPLETED', 'VERIFIED', 'ENABLED', 'RECOVERED', 'RECOVERED_RECONCILED', 'ACTIVE', 'BUILT'].includes(s)) {
      return { color: '#4ade80', bg: 'rgba(74, 222, 128, 0.12)', border: '#22c55e' };
    }
    if (['RUNNING', 'SCANNING', 'RECOVERING_DATE', 'PROMOTION_INFERRED', 'READY'].includes(s)) {
      return { color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.12)', border: '#3b82f6' };
    }
    if (['PAUSED', 'WAITING_RETRY', 'DEVICE_OFFLINE', 'STOPPING', 'MANUAL_REVIEW'].includes(s)) {
      return { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)', border: '#eab308' };
    }
    if (['ERROR', 'RECOVERY_ERROR', 'SUSPECTED_MISSING', 'BLOCKED_MAPPING'].includes(s)) {
      return { color: '#f87171', bg: 'rgba(248, 113, 113, 0.12)', border: '#ef4444' };
    }
    if (['ARCHIVE_REMOVED', 'TERMINAL', 'DISABLED', 'IDLE', 'NO_SOURCE_LOG'].includes(s)) {
      return { color: '#a3a3a3', bg: 'rgba(255, 255, 255, 0.05)', border: '#444' };
    }
    return { color: '#888', bg: 'rgba(255, 255, 255, 0.04)', border: '#333' };
  };

  if (initialLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem', gap: '1rem' }}>
        <RefreshCw className="animate-spin" size={32} color="#fff" />
        <span style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.2em', color: '#666' }}>
          BOOTSTRAPPING HISTORICAL DATA INTEGRITY ENGINE...
        </span>
      </div>
    );
  }

  // Derived Metrics (Requirement 3: CRITICAL QUEUE RULE: use recovery.queue_counts, NOT recovery.status.queue_*)
  const masterEnabled = Boolean(bootstrapData?.master_enabled);
  const task1Running = Boolean(bootstrapData?.task1_running);
  const queueCountsLive = bootstrapData?.recovery?.queue_counts || {};
  const totals = bootstrapData?.integrity?.state_summary?.totals || {};
  const recoveryStatus = bootstrapData?.recovery?.status || {};
  const integrityStatus = bootstrapData?.integrity?.status || {};
  const nextGroup = bootstrapData?.recovery?.next_group;
  const storage = recoveryStatus?.storage || {};

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* 1. Page Header & Master Toggle (Requirement 5) */}
      <div style={{ borderBottom: '1px solid #222', paddingBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#fff', margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldCheck size={22} color="#fff" />
            DATA INTEGRITY
          </h1>
          <p style={{ color: '#666', fontSize: '0.75rem', fontWeight: '700', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            HISTORICAL ATTENDANCE VERIFICATION, MAPPING AND RECOVERY CONTROL
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {lastRefreshedAt && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#141414', border: '1px solid #222', padding: '0.45rem 0.85rem', borderRadius: '2px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: masterEnabled ? '#4ade80' : '#888', boxShadow: masterEnabled ? '0 0 8px #4ade80' : 'none' }}></span>
              <span style={{ fontSize: '0.65rem', color: '#888', fontWeight: '700', letterSpacing: '0.05em' }}>
                SYNC: {lastRefreshedAt}
              </span>
            </div>
          )}

          {/* Master Toggle Area */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: '#141414',
            border: `1px solid ${masterEnabled ? '#22c55e' : '#333'}`,
            padding: '0.35rem 0.75rem',
            borderRadius: '2px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.55rem', fontWeight: '900', color: '#888', letterSpacing: '0.1em' }}>
                TASK 3 MASTER
              </span>
              <span style={{ fontSize: '0.7rem', fontWeight: '900', color: masterEnabled ? '#4ade80' : '#888', fontFamily: 'monospace' }}>
                {masterEnabled ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setMasterModal({ open: true, targetEnabled: !masterEnabled })}
              disabled={togglingMaster}
              style={{
                background: masterEnabled ? '#1c1212' : '#142918',
                border: `1px solid ${masterEnabled ? '#7f1d1d' : '#22c55e'}`,
                color: masterEnabled ? '#f87171' : '#4ade80',
                padding: '0.4rem 0.8rem',
                fontSize: '0.65rem',
                fontWeight: '900',
                borderRadius: '2px',
                cursor: 'pointer',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                transition: 'all 0.15s ease'
              }}
            >
              {togglingMaster ? 'UPDATING...' : masterEnabled ? 'TURN OFF' : 'TURN ON'}
            </button>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification.text && (
        <div style={{
          padding: '0.75rem 1.25rem',
          borderRadius: '2px',
          fontSize: '0.75rem',
          fontWeight: '700',
          letterSpacing: '0.05em',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          background: notification.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : notification.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(59, 130, 246, 0.15)',
          border: `1px solid ${notification.type === 'error' ? '#ef4444' : notification.type === 'success' ? '#22c55e' : '#3b82f6'}`,
          color: notification.type === 'error' ? '#fca5a5' : notification.type === 'success' ? '#86efac' : '#93c5fd'
        }}>
          {notification.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Task 1 Priority Banner (Requirement 18) */}
      {task1Running && (
        <div style={{
          background: '#1c1917',
          border: '1px solid #78350f',
          borderLeft: '4px solid #f59e0b',
          padding: '1rem 1.25rem',
          borderRadius: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={18} color="#f59e0b" />
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '900', color: '#fef3c7', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                TASK 1 PRIORITY ACTIVE
              </div>
              <div style={{ fontSize: '0.7rem', color: '#d6d3d1', marginTop: '0.15rem' }}>
                Historical recovery will yield safely while current-day attendance synchronization runs.
              </div>
            </div>
          </div>
          <span style={{ fontSize: '0.65rem', fontWeight: '800', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid #f59e0b', padding: '0.25rem 0.5rem', borderRadius: '2px' }}>
            TASK 1 RUNNING
          </span>
        </div>
      )}

      {/* 2. Engine Status Panel (Requirement 6) */}
      <div style={{ background: '#141414', border: '1px solid #222', borderRadius: '2px', padding: '0' }}>
        <div style={{ padding: '0.9rem 1.5rem', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1a1a1a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Activity size={16} color="#fff" />
            <h2 style={{ fontSize: '0.8rem', fontWeight: '900', letterSpacing: '0.1em', margin: 0, textTransform: 'uppercase', color: '#fff' }}>
              ENGINE TELEMETRY &amp; STATUS
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              fontSize: '0.65rem',
              fontWeight: '800',
              padding: '0.2rem 0.6rem',
              borderRadius: '2px',
              fontFamily: 'monospace',
              border: `1px solid ${getBadgeStyle(recoveryStatus.state || 'IDLE').border}`,
              color: getBadgeStyle(recoveryStatus.state || 'IDLE').color,
              background: getBadgeStyle(recoveryStatus.state || 'IDLE').bg
            }}>
              {recoveryStatus.state || 'IDLE'}
            </span>
          </div>
        </div>

        <div style={{
          padding: '1.25rem 1.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
          background: '#141414'
        }}>
          <div>
            <span style={{ fontSize: '0.65rem', color: '#666', fontWeight: '800', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              MASTER TOGGLE
            </span>
            <span style={{ fontSize: '0.8rem', color: masterEnabled ? '#4ade80' : '#888', fontWeight: '800', fontFamily: 'monospace', display: 'block', marginTop: '0.25rem' }}>
              {masterEnabled ? 'ENABLED' : 'DISABLED'}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.65rem', color: '#666', fontWeight: '800', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              INTEGRITY ENGINE
            </span>
            <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: '700', fontFamily: 'monospace', display: 'block', marginTop: '0.25rem' }}>
              {integrityStatus.state || 'IDLE'}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.65rem', color: '#666', fontWeight: '800', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              RECOVERY MANAGER
            </span>
            <span style={{
              fontSize: '0.8rem',
              fontWeight: '700',
              fontFamily: 'monospace',
              display: 'block',
              marginTop: '0.25rem',
              color: getBadgeStyle(recoveryStatus.state || 'IDLE').color
            }}>
              {recoveryStatus.state || 'IDLE'}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.65rem', color: '#666', fontWeight: '800', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              RECOVERY ACTIVE
            </span>
            <span style={{
              fontSize: '0.8rem',
              fontWeight: '800',
              fontFamily: 'monospace',
              display: 'block',
              marginTop: '0.25rem',
              color: bootstrapData?.recovery?.active ? '#4ade80' : '#888'
            }}>
              {bootstrapData?.recovery?.active ? 'YES' : 'NO'}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.65rem', color: '#666', fontWeight: '800', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              CURRENT STAGE
            </span>
            <span style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: '700', fontFamily: 'monospace', display: 'block', marginTop: '0.25rem' }}>
              {recoveryStatus.stage || 'IDLE'}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.65rem', color: '#666', fontWeight: '800', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              TASK 1 STATUS
            </span>
            <span style={{ fontSize: '0.8rem', color: task1Running ? '#fbbf24' : '#4ade80', fontWeight: '800', fontFamily: 'monospace', display: 'block', marginTop: '0.25rem' }}>
              {task1Running ? 'TASK 1 ACTIVE — WILL YIELD' : 'TASK 1 IDLE'}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.65rem', color: '#666', fontWeight: '800', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              CURRENT RECOVERY DATE
            </span>
            <span style={{ fontSize: '0.8rem', color: recoveryStatus.current_date ? '#fff' : '#666', fontWeight: '700', fontFamily: 'monospace', display: 'block', marginTop: '0.25rem' }}>
              {recoveryStatus.current_date ? formatDateNice(recoveryStatus.current_date) : 'NONE'}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.65rem', color: '#666', fontWeight: '800', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              CURRENT TARGET DEVICES
            </span>
            <span style={{
              fontSize: '0.75rem',
              color: Array.isArray(recoveryStatus.current_devices) && recoveryStatus.current_devices.length > 0 ? '#fde68a' : '#666',
              fontWeight: '700',
              fontFamily: 'monospace',
              display: 'block',
              marginTop: '0.25rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {Array.isArray(recoveryStatus.current_devices) && recoveryStatus.current_devices.length > 0
                ? recoveryStatus.current_devices.join(', ')
                : 'NONE'}
            </span>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <span style={{ fontSize: '0.65rem', color: '#666', fontWeight: '800', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ENGINE MESSAGE
            </span>
            <span style={{ fontSize: '0.75rem', color: '#d4d4d4', fontFamily: 'monospace', display: 'block', marginTop: '0.25rem' }}>
              {recoveryStatus.message || integrityStatus.message || 'Engine idle'}
            </span>
          </div>

          {(recoveryStatus.last_error || integrityStatus.last_error) && (
            <div style={{ gridColumn: '1 / -1', background: '#1c1212', border: '1px solid #3d1c1c', padding: '0.75rem', borderRadius: '2px' }}>
              <span style={{ fontSize: '0.65rem', color: '#f87171', fontWeight: '800', display: 'block', textTransform: 'uppercase' }}>
                LAST ERROR
              </span>
              <span style={{ fontSize: '0.75rem', color: '#fca5a5', fontFamily: 'monospace', display: 'block', marginTop: '0.25rem' }}>
                {recoveryStatus.last_error || integrityStatus.last_error}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Primary Metric Cards Grid (Requirements 7, 3, 8) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem' }}>
        {/* RECOVERY QUEUE (Live Queue Total) */}
        <div style={{ background: '#0a0a0a', border: '1px solid #222', padding: '1.1rem', borderRadius: '2px' }}>
          <div style={{ fontSize: '0.65rem', color: '#888', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            RECOVERY QUEUE
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: (queueCountsLive.total || 0) > 0 ? '#60a5fa' : '#666', margin: '0.25rem 0', fontFamily: 'monospace' }}>
            {queueCountsLive.total ?? 0}
          </div>
          <div style={{ fontSize: '0.6rem', color: '#555', fontWeight: '700' }}>
            TOTAL RECOVERY BACKLOG
          </div>
        </div>

        {/* READY NOW */}
        <div style={{ background: '#0a0a0a', border: '1px solid #222', padding: '1.1rem', borderRadius: '2px' }}>
          <div style={{ fontSize: '0.65rem', color: '#888', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            READY NOW
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: (queueCountsLive.ready || 0) > 0 ? '#4ade80' : '#666', margin: '0.25rem 0', fontFamily: 'monospace' }}>
            {queueCountsLive.ready ?? 0}
          </div>
          <div style={{ fontSize: '0.6rem', color: '#555', fontWeight: '700' }}>
            ELIGIBLE FOR IMMEDIATE CYCLE
          </div>
        </div>

        {/* WAITING RETRY */}
        <div style={{ background: '#0a0a0a', border: '1px solid #222', padding: '1.1rem', borderRadius: '2px' }}>
          <div style={{ fontSize: '0.65rem', color: '#888', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            WAITING RETRY
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: (queueCountsLive.waiting_retry || 0) > 0 ? '#fbbf24' : '#666', margin: '0.25rem 0', fontFamily: 'monospace' }}>
            {queueCountsLive.waiting_retry ?? 0}
          </div>
          <div style={{ fontSize: '0.6rem', color: '#555', fontWeight: '700' }}>
            IN COOLDOWN RETRY INTERVAL
          </div>
        </div>

        {/* BLOCKED MAPPING */}
        <div style={{ background: '#0a0a0a', border: '1px solid #222', padding: '1.1rem', borderRadius: '2px' }}>
          <div style={{ fontSize: '0.65rem', color: '#888', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            BLOCKED MAPPING
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: (queueCountsLive.blocked_mapping || 0) > 0 ? '#f87171' : '#666', margin: '0.25rem 0', fontFamily: 'monospace' }}>
            {queueCountsLive.blocked_mapping ?? 0}
          </div>
          <div style={{ fontSize: '0.6rem', color: '#555', fontWeight: '700' }}>
            REQUIRES CLASS RESOLUTION
          </div>
        </div>

        {/* TERMINAL */}
        <div style={{ background: '#0a0a0a', border: '1px solid #222', padding: '1.1rem', borderRadius: '2px' }}>
          <div style={{ fontSize: '0.65rem', color: '#888', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            TERMINAL
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: (queueCountsLive.terminal || 0) > 0 ? '#a3a3a3' : '#666', margin: '0.25rem 0', fontFamily: 'monospace' }}>
            {queueCountsLive.terminal ?? 0}
          </div>
          <div style={{ fontSize: '0.6rem', color: '#555', fontWeight: '700' }}>
            NO AUTOMATIC RETRY PLANNED
          </div>
        </div>

        {/* ARCHIVES COMPLETED (ACTIVE VS REMOVED - Requirement 8) */}
        <div style={{ background: '#0a0a0a', border: '1px solid #222', padding: '1.1rem', borderRadius: '2px' }}>
          <div style={{ fontSize: '0.65rem', color: '#888', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            ARCHIVES COMPLETED
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#fff', margin: '0.25rem 0', fontFamily: 'monospace' }}>
            {totals.completed_files ?? 0}
          </div>
          <div style={{ fontSize: '0.6rem', color: '#666', fontWeight: '700' }}>
            ACTIVE ARCHIVES ({totals.archive_removed_files ?? 0} REMOVED)
          </div>
        </div>

        {/* VERIFIED DEVICE-DATES */}
        <div style={{ background: '#0a0a0a', border: '1px solid #222', padding: '1.1rem', borderRadius: '2px' }}>
          <div style={{ fontSize: '0.65rem', color: '#888', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            VERIFIED DEVICE-DATES
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#4ade80', margin: '0.25rem 0', fontFamily: 'monospace' }}>
            {totals.verified_devices ?? 0}
          </div>
          <div style={{ fontSize: '0.6rem', color: '#555', fontWeight: '700' }}>
            CONFIRMED HISTORICAL LOGS
          </div>
        </div>

        {/* SUSPECTED MISSING */}
        <div style={{ background: '#0a0a0a', border: '1px solid #222', padding: '1.1rem', borderRadius: '2px' }}>
          <div style={{ fontSize: '0.65rem', color: '#888', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            SUSPECTED MISSING
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: (totals.suspected_missing_devices || 0) > 0 ? '#fbbf24' : '#4ade80', margin: '0.25rem 0', fontFamily: 'monospace' }}>
            {totals.suspected_missing_devices ?? 0}
          </div>
          <div style={{ fontSize: '0.6rem', color: '#555', fontWeight: '700' }}>
            LACK BIOMETRIC EVIDENCE
          </div>
        </div>

        {/* MANUAL REVIEW */}
        <div style={{ background: '#0a0a0a', border: '1px solid #222', padding: '1.1rem', borderRadius: '2px' }}>
          <div style={{ fontSize: '0.65rem', color: '#888', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            MANUAL REVIEW
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: (totals.manual_review_devices || 0) > 0 ? '#e879f9' : '#666', margin: '0.25rem 0', fontFamily: 'monospace' }}>
            {totals.manual_review_devices ?? 0}
          </div>
          <div style={{ fontSize: '0.6rem', color: '#555', fontWeight: '700' }}>
            OPERATOR ATTENTION REQUIRED
          </div>
        </div>
      </div>

      {/* 4. Action Controls Bar (Requirement 10) */}
      <div style={{ background: '#141414', border: '1px solid #222', borderRadius: '2px', padding: '0' }}>
        <div style={{ padding: '0.85rem 1.5rem', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1a1a1a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Sliders size={16} color="#fff" />
            <h2 style={{ fontSize: '0.8rem', fontWeight: '900', letterSpacing: '0.1em', margin: 0, textTransform: 'uppercase', color: '#fff' }}>
              DIRECT OPERATOR ACTIONS
            </h2>
          </div>
          <span style={{ fontSize: '0.65rem', fontWeight: '700', color: masterEnabled ? '#4ade80' : '#888', letterSpacing: '0.05em' }}>
            {masterEnabled ? 'CONTROLS ACTIVE' : 'TASK 3 DISABLED — ENABLE TO EXECUTE'}
          </span>
        </div>

        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* REFRESH */}
          <button
            type="button"
            onClick={() => loadBootstrap()}
            disabled={refreshing}
            style={{
              flex: '1 1 140px',
              height: '42px',
              background: '#1f1f1f',
              border: '1px solid #333',
              color: '#fff',
              fontWeight: '800',
              fontSize: '0.7rem',
              borderRadius: '2px',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              letterSpacing: '0.05em'
            }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>REFRESH</span>
          </button>

          {/* SCAN NOW */}
          <button
            type="button"
            onClick={() => setScanModal(true)}
            disabled={!masterEnabled || scanning}
            title={!masterEnabled ? 'Enable Task 3 first' : 'Run read-only integrity scan'}
            style={{
              flex: '1 1 160px',
              height: '42px',
              background: masterEnabled ? '#222' : '#141414',
              border: `1px solid ${masterEnabled ? '#444' : '#222'}`,
              color: masterEnabled ? '#fff' : '#555',
              fontWeight: '800',
              fontSize: '0.7rem',
              borderRadius: '2px',
              cursor: !masterEnabled || scanning ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              letterSpacing: '0.05em'
            }}
          >
            <Search size={14} />
            <span>{scanning ? 'SCANNING...' : 'SCAN NOW'}</span>
          </button>

          {/* RUN RECOVERY NOW */}
          <button
            type="button"
            onClick={() => setRecoveryModal(true)}
            disabled={!masterEnabled || recovering}
            title={!masterEnabled ? 'Enable Task 3 first' : 'Run eligible recovery cycle'}
            style={{
              flex: '1 1 190px',
              height: '42px',
              background: masterEnabled ? '#fff' : '#222',
              border: 'none',
              color: masterEnabled ? '#000' : '#555',
              fontWeight: '900',
              fontSize: '0.7rem',
              borderRadius: '2px',
              cursor: !masterEnabled || recovering ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              letterSpacing: '0.05em'
            }}
          >
            <Play size={14} />
            <span>{recovering ? 'STARTING CYCLE...' : 'RUN RECOVERY NOW'}</span>
          </button>

          {/* SAFE STOP */}
          <button
            type="button"
            onClick={handleSafeStop}
            disabled={stopping}
            style={{
              flex: '1 1 140px',
              height: '42px',
              background: '#1c1212',
              border: '1px solid #3d1c1c',
              color: '#f87171',
              fontWeight: '800',
              fontSize: '0.7rem',
              borderRadius: '2px',
              cursor: stopping ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              letterSpacing: '0.05em'
            }}
          >
            <StopCircle size={14} />
            <span>{stopping ? 'STOPPING...' : 'SAFE STOP'}</span>
          </button>

          {/* STORAGE DRY RUN */}
          <button
            type="button"
            onClick={handleStorageCleanup}
            disabled={cleaningStorage}
            style={{
              flex: '1 1 170px',
              height: '42px',
              background: '#16191f',
              border: '1px solid #1e293b',
              color: '#94a3b8',
              fontWeight: '800',
              fontSize: '0.7rem',
              borderRadius: '2px',
              cursor: cleaningStorage ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              letterSpacing: '0.05em'
            }}
          >
            <HardDrive size={14} />
            <span>{cleaningStorage ? 'EVALUATING...' : 'STORAGE DRY RUN'}</span>
          </button>
        </div>

        <div style={{ padding: '0.5rem 1.5rem 1rem 1.5rem', borderTop: '1px solid #1a1a1a', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.65rem', color: '#666', lineHeight: '1.4' }}>
            <span style={{ fontWeight: '800', color: '#888' }}>SAFE STOP:</span> Waits for the current protected device/workbook step to finish before stopping.
          </span>
          <span style={{ fontSize: '0.65rem', color: '#666', lineHeight: '1.4' }}>
            <span style={{ fontWeight: '800', color: '#888' }}>STORAGE DRY RUN:</span> Evaluates retention rules and storage quotas without modifying or deleting files.
          </span>
        </div>
      </div>

      {/* 5. Next Eligible Recovery Panel (Requirement 9) */}
      <div style={{ background: '#141414', border: '1px solid #222', borderRadius: '2px', padding: '0' }}>
        <div style={{ padding: '0.85rem 1.5rem', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1a1a1a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Clock size={16} color="#fbbf24" />
            <h2 style={{ fontSize: '0.8rem', fontWeight: '900', letterSpacing: '0.1em', margin: 0, textTransform: 'uppercase', color: '#fff' }}>
              NEXT ELIGIBLE RECOVERY
            </h2>
          </div>
          {nextGroup && (
            <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#fbbf24', fontFamily: 'monospace' }}>
              TARGET: {formatDateNice(nextGroup.date)} ({nextGroup.device_count || 0} DEVICES)
            </span>
          )}
        </div>

        <div style={{ padding: '1.25rem 1.5rem' }}>
          {nextGroup ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', background: '#0a0a0a', padding: '0.85rem 1rem', border: '1px solid #222' }}>
                <div>
                  <span style={{ fontSize: '0.6rem', color: '#666', fontWeight: '800', display: 'block', textTransform: 'uppercase' }}>TARGET DATE</span>
                  <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: '900', fontFamily: 'monospace' }}>
                    {formatDateNice(nextGroup.date)}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.6rem', color: '#666', fontWeight: '800', display: 'block', textTransform: 'uppercase' }}>DEVICE COUNT</span>
                  <span style={{ fontSize: '0.9rem', color: '#60a5fa', fontWeight: '900', fontFamily: 'monospace' }}>
                    {nextGroup.device_count ?? 0}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.6rem', color: '#666', fontWeight: '800', display: 'block', textTransform: 'uppercase' }}>DEVICES</span>
                  <span style={{ fontSize: '0.8rem', color: '#fde68a', fontWeight: '700', fontFamily: 'monospace' }}>
                    {Array.isArray(nextGroup.devices) ? nextGroup.devices.join(', ') : 'None'}
                  </span>
                </div>
              </div>

              {/* Items List in next_group */}
              {Array.isArray(nextGroup.items) && nextGroup.items.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                  {nextGroup.items.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: '#0d0d0d',
                        border: '1px solid #222',
                        borderLeft: '3px solid #60a5fa',
                        padding: '0.75rem 1rem',
                        borderRadius: '2px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#fff', fontFamily: 'monospace' }}>
                          {item.device}
                        </span>
                        <span style={{
                          fontSize: '0.6rem',
                          fontWeight: '800',
                          padding: '0.15rem 0.4rem',
                          borderRadius: '2px',
                          border: `1px solid ${getBadgeStyle(item.queue_status).border}`,
                          color: getBadgeStyle(item.queue_status).color,
                          background: getBadgeStyle(item.queue_status).bg
                        }}>
                          {item.queue_status}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.7rem', color: '#aaa' }}>
                        Historical: <span style={{ color: '#fff', fontWeight: '700' }}>{Array.isArray(item.historical_sheets) ? item.historical_sheets.join(', ') : 'N/A'}</span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem', fontSize: '0.65rem' }}>
                        <span style={{ color: '#888' }}>
                          Mapping: <span style={{ color: '#93c5fd' }}>{Array.isArray(item.mapping_statuses) ? item.mapping_statuses.join(', ') : 'N/A'}</span>
                        </span>
                        <span style={{ color: '#888' }}>
                          Prev: <span style={{ color: '#fde68a' }}>{item.previous_recovery_status || 'NONE'}</span>
                        </span>
                        <span style={{ color: '#888' }}>
                          Attempts: <span style={{ color: '#fff' }}>{item.attempts ?? 0}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{
              padding: '1.5rem',
              background: '#0a0a0a',
              border: '1px solid #222',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: '#888'
            }}>
              <CheckCircle2 size={16} color="#4ade80" />
              <span style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.05em' }}>
                No historical recovery is currently eligible.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 6. Tabs Navigation (Requirement 21) */}
      <div style={{ borderBottom: '1px solid #222', display: 'flex', gap: '0.25rem', overflowX: 'auto' }}>
        {[
          { id: 'queue', label: 'RECOVERY QUEUE', count: queueCountsLive.total },
          { id: 'archives', label: 'ARCHIVE INTEGRITY', count: totals.completed_files },
          { id: 'history', label: 'RECOVERY HISTORY', count: null },
          { id: 'mapping', label: 'HISTORICAL MAPPING', count: null },
          { id: 'storage', label: 'STORAGE & SETTINGS', count: null },
          { id: 'audit', label: 'AUDIT TRAIL', count: null }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: isActive ? '#141414' : 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid #fff' : '2px solid transparent',
                color: isActive ? '#fff' : '#666',
                padding: '0.85rem 1.25rem',
                fontSize: '0.75rem',
                fontWeight: '900',
                letterSpacing: '0.08em',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span>{tab.label}</span>
              {tab.count !== null && tab.count !== undefined && (
                <span style={{
                  fontSize: '0.65rem',
                  padding: '0.1rem 0.35rem',
                  borderRadius: '2px',
                  background: isActive ? '#222' : '#141414',
                  color: isActive ? '#fff' : '#888',
                  fontFamily: 'monospace'
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: RECOVERY QUEUE (Requirement 11) */}
      {activeTab === 'queue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Filters Bar */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', background: '#141414', padding: '1rem', border: '1px solid #222', borderRadius: '2px' }}>
            <div style={{ flex: '1 1 140px' }}>
              <input
                type="text"
                placeholder="Date (YYYY-MM-DD)"
                value={queueDateFilter}
                onChange={(e) => setQueueDateFilter(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', background: '#0a0a0a', border: '1px solid #333', color: '#fff', fontSize: '0.75rem', borderRadius: '2px' }}
              />
            </div>
            <div style={{ flex: '1 1 180px' }}>
              <input
                type="text"
                placeholder="Filter Device..."
                value={queueDeviceFilter}
                onChange={(e) => setQueueDeviceFilter(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', background: '#0a0a0a', border: '1px solid #333', color: '#fff', fontSize: '0.75rem', borderRadius: '2px' }}
              />
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <select
                value={queueStatusFilter}
                onChange={(e) => setQueueStatusFilter(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', background: '#0a0a0a', border: '1px solid #333', color: '#fff', fontSize: '0.75rem', borderRadius: '2px' }}
              >
                <option value="">All Queue Statuses</option>
                <option value="READY">READY</option>
                <option value="WAITING_RETRY">WAITING_RETRY</option>
                <option value="BLOCKED_MAPPING">BLOCKED_MAPPING</option>
                <option value="TERMINAL">TERMINAL</option>
              </select>
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <select
                value={queueIntegrityFilter}
                onChange={(e) => setQueueIntegrityFilter(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', background: '#0a0a0a', border: '1px solid #333', color: '#fff', fontSize: '0.75rem', borderRadius: '2px' }}
              >
                <option value="">All Integrity Statuses</option>
                <option value="SUSPECTED_MISSING">SUSPECTED_MISSING</option>
                <option value="MANUAL_REVIEW">MANUAL_REVIEW</option>
                <option value="VERIFIED">VERIFIED</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => fetchQueue(0)}
              style={{ padding: '0.5rem 1rem', background: '#fff', color: '#000', fontWeight: '900', fontSize: '0.7rem', border: 'none', borderRadius: '2px', cursor: 'pointer' }}
            >
              APPLY FILTERS
            </button>
          </div>

          {/* Queue Table */}
          <div style={{ background: '#141414', border: '1px solid #222', borderRadius: '2px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ background: '#1a1a1a', borderBottom: '1px solid #222', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>DATE</th>
                  <th style={{ padding: '0.75rem 1rem' }}>DEVICE</th>
                  <th style={{ padding: '0.75rem 1rem' }}>HISTORICAL CLASS / SHEETS</th>
                  <th style={{ padding: '0.75rem 1rem' }}>INTEGRITY STATUS</th>
                  <th style={{ padding: '0.75rem 1rem' }}>MAPPING</th>
                  <th style={{ padding: '0.75rem 1rem' }}>PREVIOUS RESULT</th>
                  <th style={{ padding: '0.75rem 1rem' }}>ATTEMPTS</th>
                  <th style={{ padding: '0.75rem 1rem' }}>QUEUE STATUS</th>
                  <th style={{ padding: '0.75rem 1rem' }}>REASON</th>
                </tr>
              </thead>
              <tbody>
                {queueLoading ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
                      <RefreshCw className="animate-spin" size={20} style={{ margin: '0 auto 0.5rem auto' }} />
                      Loading queue data...
                    </td>
                  </tr>
                ) : queueItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
                      No recovery queue items match the current filters.
                    </td>
                  </tr>
                ) : (
                  queueItems.map((item, idx) => {
                    const badge = getBadgeStyle(item.queue_status);
                    const integrityBadge = getBadgeStyle(item.integrity_status);
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #1c1c1c' }}>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#fff' }}>
                          {formatDateNice(item.date)}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#fff' }}>
                          {item.device}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#aaa' }}>
                          {Array.isArray(item.historical_sheets) ? item.historical_sheets.join(', ') : 'N/A'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem', borderRadius: '2px', border: `1px solid ${integrityBadge.border}`, color: integrityBadge.color, background: integrityBadge.bg }}>
                            {item.integrity_status}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#93c5fd', fontSize: '0.7rem' }}>
                          {Array.isArray(item.mapping_statuses) ? item.mapping_statuses.join(', ') : 'N/A'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem', borderRadius: '2px', border: `1px solid ${getBadgeStyle(item.previous_recovery_status).border}`, color: getBadgeStyle(item.previous_recovery_status).color, background: getBadgeStyle(item.previous_recovery_status).bg }}>
                            {item.previous_recovery_status || 'NONE'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#fff' }}>
                          {item.attempts ?? 0}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: '800', padding: '0.15rem 0.45rem', borderRadius: '2px', border: `1px solid ${badge.border}`, color: badge.color, background: badge.bg }}>
                            {item.queue_status}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#777', fontSize: '0.65rem' }}>
                          {item.queue_reason || '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
            <span style={{ fontSize: '0.7rem', color: '#666' }}>
              Showing {queueItems.length > 0 ? queueOffset + 1 : 0}–{Math.min(queueOffset + queueLimit, queueTotal)} of {queueTotal} items
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                disabled={queueOffset === 0 || queueLoading}
                onClick={() => fetchQueue(Math.max(0, queueOffset - queueLimit))}
                style={{ padding: '0.4rem 0.75rem', background: '#1c1c1c', border: '1px solid #333', color: '#fff', fontSize: '0.7rem', borderRadius: '2px', cursor: queueOffset === 0 ? 'not-allowed' : 'pointer' }}
              >
                PREVIOUS
              </button>
              <button
                type="button"
                disabled={queueOffset + queueLimit >= queueTotal || queueLoading}
                onClick={() => fetchQueue(queueOffset + queueLimit)}
                style={{ padding: '0.4rem 0.75rem', background: '#1c1c1c', border: '1px solid #333', color: '#fff', fontSize: '0.7rem', borderRadius: '2px', cursor: queueOffset + queueLimit >= queueTotal ? 'not-allowed' : 'pointer' }}
              >
                NEXT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ARCHIVE INTEGRITY (Requirement 12) */}
      {activeTab === 'archives' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Informational banner about active vs removed workbooks */}
          <div style={{ background: '#0d0d0d', border: '1px solid #222', padding: '0.75rem 1rem', borderRadius: '2px', fontSize: '0.7rem', color: '#888' }}>
            <span style={{ fontWeight: '800', color: '#fff' }}>NOTE:</span> Archive integrity records track all historical workbooks. Deleted or moved workbooks are retained as historical records marked <span style={{ color: '#a3a3a3', fontWeight: '700' }}>ARCHIVE_REMOVED</span> and do not represent physical file errors.
          </div>

          {/* Filters Bar */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', background: '#141414', padding: '1rem', border: '1px solid #222', borderRadius: '2px' }}>
            <div style={{ flex: '1 1 180px' }}>
              <input
                type="text"
                placeholder="Date (YYYY-MM-DD)"
                value={archiveDateFilter}
                onChange={(e) => setArchiveDateFilter(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', background: '#0a0a0a', border: '1px solid #333', color: '#fff', fontSize: '0.75rem', borderRadius: '2px' }}
              />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <select
                value={archiveStatusFilter}
                onChange={(e) => setArchiveStatusFilter(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', background: '#0a0a0a', border: '1px solid #333', color: '#fff', fontSize: '0.75rem', borderRadius: '2px' }}
              >
                <option value="">All Archive Statuses</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="ARCHIVE_REMOVED">ARCHIVE_REMOVED (Historical Only)</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="PAUSED">PAUSED</option>
                <option value="DEFERRED_ERROR">DEFERRED_ERROR</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => fetchArchives(0)}
              style={{ padding: '0.5rem 1rem', background: '#fff', color: '#000', fontWeight: '900', fontSize: '0.7rem', border: 'none', borderRadius: '2px', cursor: 'pointer' }}
            >
              FILTER ARCHIVES
            </button>
          </div>

          {/* Archives Table */}
          <div style={{ background: '#141414', border: '1px solid #222', borderRadius: '2px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ background: '#1a1a1a', borderBottom: '1px solid #222', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>DATE</th>
                  <th style={{ padding: '0.75rem 1rem' }}>ARCHIVE</th>
                  <th style={{ padding: '0.75rem 1rem' }}>STATUS</th>
                  <th style={{ padding: '0.75rem 1rem' }}>STATE</th>
                  <th style={{ padding: '0.75rem 1rem' }}>CHECKED</th>
                  <th style={{ padding: '0.75rem 1rem' }}>VERIFIED</th>
                  <th style={{ padding: '0.75rem 1rem' }}>SUSPECTED</th>
                  <th style={{ padding: '0.75rem 1rem' }}>MANUAL</th>
                  <th style={{ padding: '0.75rem 1rem' }}>MAPPING ISSUES</th>
                  <th style={{ padding: '0.75rem 1rem' }}>COMPLETED AT</th>
                </tr>
              </thead>
              <tbody>
                {archiveLoading ? (
                  <tr>
                    <td colSpan={10} style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
                      <RefreshCw className="animate-spin" size={20} style={{ margin: '0 auto 0.5rem auto' }} />
                      Loading archive data...
                    </td>
                  </tr>
                ) : archiveItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
                      No archive integrity records match criteria.
                    </td>
                  </tr>
                ) : (
                  archiveItems.map((item, idx) => {
                    const badge = getBadgeStyle(item.status);
                    const isRemoved = item.status === 'ARCHIVE_REMOVED' || item.active === false;
                    const summary = item.summary || {};
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #1c1c1c', opacity: isRemoved ? 0.75 : 1 }}>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#fff' }}>
                          {formatDateNice(item.date)}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: isRemoved ? '#888' : '#e5e5e5' }}>
                          {item.relative_path}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: '800', padding: '0.15rem 0.45rem', borderRadius: '2px', border: `1px solid ${badge.border}`, color: badge.color, background: badge.bg }}>
                            {item.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: '700',
                            color: item.active !== false ? '#4ade80' : '#888'
                          }}>
                            {item.active !== false ? 'ACTIVE' : 'INACTIVE / REMOVED'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#fff' }}>
                          {summary.devices_checked ?? 0}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#4ade80' }}>
                          {summary.verified_devices ?? 0}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: (summary.suspected_missing_devices || 0) > 0 ? '#fbbf24' : '#666' }}>
                          {summary.suspected_missing_devices ?? 0}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: (summary.manual_review_devices || 0) > 0 ? '#e879f9' : '#666' }}>
                          {summary.manual_review_devices ?? 0}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: Array.isArray(item.mapping_issues) && item.mapping_issues.length > 0 ? '#f87171' : '#666' }}>
                          {Array.isArray(item.mapping_issues) ? item.mapping_issues.length : 0}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#777', fontSize: '0.65rem' }}>
                          {item.completed_at ? String(item.completed_at).replace('T', ' ') : '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
            <span style={{ fontSize: '0.7rem', color: '#666' }}>
              Showing {archiveItems.length > 0 ? archiveOffset + 1 : 0}–{Math.min(archiveOffset + archiveLimit, archiveTotal)} of {archiveTotal} records
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                disabled={archiveOffset === 0 || archiveLoading}
                onClick={() => fetchArchives(Math.max(0, archiveOffset - archiveLimit))}
                style={{ padding: '0.4rem 0.75rem', background: '#1c1c1c', border: '1px solid #333', color: '#fff', fontSize: '0.7rem', borderRadius: '2px', cursor: archiveOffset === 0 ? 'not-allowed' : 'pointer' }}
              >
                PREVIOUS
              </button>
              <button
                type="button"
                disabled={archiveOffset + archiveLimit >= archiveTotal || archiveLoading}
                onClick={() => fetchArchives(archiveOffset + archiveLimit)}
                style={{ padding: '0.4rem 0.75rem', background: '#1c1c1c', border: '1px solid #333', color: '#fff', fontSize: '0.7rem', borderRadius: '2px', cursor: archiveOffset + archiveLimit >= archiveTotal ? 'not-allowed' : 'pointer' }}
              >
                NEXT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RECOVERY HISTORY (Requirement 13) */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Filters Bar */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', background: '#141414', padding: '1rem', border: '1px solid #222', borderRadius: '2px' }}>
            <div style={{ flex: '1 1 180px' }}>
              <input
                type="text"
                placeholder="Date (YYYY-MM-DD)"
                value={historyDateFilter}
                onChange={(e) => setHistoryDateFilter(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', background: '#0a0a0a', border: '1px solid #333', color: '#fff', fontSize: '0.75rem', borderRadius: '2px' }}
              />
            </div>
            <div style={{ flex: '1 1 180px' }}>
              <input
                type="text"
                placeholder="Filter Device..."
                value={historyDeviceFilter}
                onChange={(e) => setHistoryDeviceFilter(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', background: '#0a0a0a', border: '1px solid #333', color: '#fff', fontSize: '0.75rem', borderRadius: '2px' }}
              />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <select
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', background: '#0a0a0a', border: '1px solid #333', color: '#fff', fontSize: '0.75rem', borderRadius: '2px' }}
              >
                <option value="">All Recovery Results</option>
                <option value="RECOVERED">RECOVERED</option>
                <option value="RECOVERED_RECONCILED">RECOVERED_RECONCILED</option>
                <option value="DEVICE_OFFLINE">DEVICE_OFFLINE</option>
                <option value="NO_SOURCE_LOG">NO_SOURCE_LOG</option>
                <option value="MANUAL_REVIEW">MANUAL_REVIEW</option>
                <option value="RECOVERY_ERROR">RECOVERY_ERROR</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => fetchHistory(0)}
              style={{ padding: '0.5rem 1rem', background: '#fff', color: '#000', fontWeight: '900', fontSize: '0.7rem', border: 'none', borderRadius: '2px', cursor: 'pointer' }}
            >
              FILTER HISTORY
            </button>
          </div>

          {/* History Compact Table */}
          <div style={{ background: '#141414', border: '1px solid #222', borderRadius: '2px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ background: '#1a1a1a', borderBottom: '1px solid #222', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>DATE</th>
                  <th style={{ padding: '0.75rem 1rem' }}>DEVICE</th>
                  <th style={{ padding: '0.75rem 1rem' }}>STATUS</th>
                  <th style={{ padding: '0.75rem 1rem' }}>REASON</th>
                  <th style={{ padding: '0.75rem 1rem' }}>ATTEMPTS</th>
                  <th style={{ padding: '0.75rem 1rem' }}>LAST ATTEMPT</th>
                  <th style={{ padding: '0.75rem 1rem' }}>SESSION</th>
                  <th style={{ padding: '0.75rem 1rem' }}>ARCHIVE</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>EVIDENCE</th>
                </tr>
              </thead>
              <tbody>
                {historyLoading ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
                      <RefreshCw className="animate-spin" size={20} style={{ margin: '0 auto 0.5rem auto' }} />
                      Loading recovery history...
                    </td>
                  </tr>
                ) : historyItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
                      No recovery history records found.
                    </td>
                  </tr>
                ) : (
                  historyItems.map((item, idx) => {
                    const badge = getBadgeStyle(item.status);
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #1c1c1c' }}>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#fff' }}>
                          {formatDateNice(item.date)}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#fff' }}>
                          {item.device}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: '800', padding: '0.15rem 0.45rem', borderRadius: '2px', border: `1px solid ${badge.border}`, color: badge.color, background: badge.bg }}>
                            {item.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#aaa', fontSize: '0.7rem' }}>
                          {item.reason || '—'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#fff' }}>
                          {item.attempts ?? 0}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#777', fontSize: '0.65rem' }}>
                          {item.last_attempt_at ? String(item.last_attempt_at).replace('T', ' ') : '—'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#888', fontSize: '0.65rem' }}>
                          {shortenHash(item.session_id, 6)}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#666', fontSize: '0.65rem' }}>
                          {item.relative_path}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setHistoryDetailModal(item)}
                            style={{
                              padding: '0.25rem 0.6rem',
                              background: '#222',
                              border: '1px solid #333',
                              color: '#fff',
                              fontSize: '0.65rem',
                              fontWeight: '700',
                              borderRadius: '2px',
                              cursor: 'pointer'
                            }}
                          >
                            DETAILS
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
            <span style={{ fontSize: '0.7rem', color: '#666' }}>
              Showing {historyItems.length > 0 ? historyOffset + 1 : 0}–{Math.min(historyOffset + historyLimit, historyTotal)} of {historyTotal} records
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                disabled={historyOffset === 0 || historyLoading}
                onClick={() => fetchHistory(Math.max(0, historyOffset - historyLimit))}
                style={{ padding: '0.4rem 0.75rem', background: '#1c1c1c', border: '1px solid #333', color: '#fff', fontSize: '0.7rem', borderRadius: '2px', cursor: historyOffset === 0 ? 'not-allowed' : 'pointer' }}
              >
                PREVIOUS
              </button>
              <button
                type="button"
                disabled={historyOffset + historyLimit >= historyTotal || historyLoading}
                onClick={() => fetchHistory(historyOffset + historyLimit)}
                style={{ padding: '0.4rem 0.75rem', background: '#1c1c1c', border: '1px solid #333', color: '#fff', fontSize: '0.7rem', borderRadius: '2px', cursor: historyOffset + historyLimit >= historyTotal ? 'not-allowed' : 'pointer' }}
              >
                NEXT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: HISTORICAL MAPPING (Requirement 14) */}
      {activeTab === 'mapping' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {mappingLoading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#666' }}>
              <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 0.5rem auto' }} />
              Loading mapping summary...
            </div>
          ) : (
            <>
              {/* Mapping Summary Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div style={{ background: '#0a0a0a', border: '1px solid #222', padding: '1rem', borderRadius: '2px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#888', fontWeight: '800' }}>CLASS MAPPINGS</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#fff', fontFamily: 'monospace', margin: '0.25rem 0' }}>
                    {mappingData?.summary?.class_mappings ?? 0}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#555' }}>TOTAL HISTORICAL SHEETS</div>
                </div>

                <div style={{ background: '#0a0a0a', border: '1px solid #222', padding: '1rem', borderRadius: '2px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#888', fontWeight: '800' }}>CURRENT ROSTER CONFIRMED</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#4ade80', fontFamily: 'monospace', margin: '0.25rem 0' }}>
                    {mappingData?.summary?.current_roster_confirmed ?? 0}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#555' }}>EXACT ROSTER MATCH</div>
                </div>

                <div style={{ background: '#0a0a0a', border: '1px solid #222', padding: '1rem', borderRadius: '2px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#888', fontWeight: '800' }}>PROMOTION INFERRED</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#60a5fa', fontFamily: 'monospace', margin: '0.25rem 0' }}>
                    {mappingData?.summary?.promotion_inferred ?? 0}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#555' }}>COHORT ADVANCEMENT DETECTED</div>
                </div>

                <div style={{ background: '#0a0a0a', border: '1px solid #222', padding: '1rem', borderRadius: '2px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#888', fontWeight: '800' }}>MULTI-YEAR CONTINUITY</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#a78bfa', fontFamily: 'monospace', margin: '0.25rem 0' }}>
                    {mappingData?.summary?.multi_year_continuity ?? 0}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#555' }}>MULTI-ACADEMIC YEAR TRACE</div>
                </div>

                <div style={{ background: '#0a0a0a', border: '1px solid #222', padding: '1rem', borderRadius: '2px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#888', fontWeight: '800' }}>REASSIGNMENT</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#fde68a', fontFamily: 'monospace', margin: '0.25rem 0' }}>
                    {mappingData?.summary?.reassignment_inferred ?? 0}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#555' }}>SECTION SPLIT / REASSIGNMENT</div>
                </div>

                <div style={{ background: '#0a0a0a', border: '1px solid #222', padding: '1rem', borderRadius: '2px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#888', fontWeight: '800' }}>COHORT CONTINUITY</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#38bdf8', fontFamily: 'monospace', margin: '0.25rem 0' }}>
                    {mappingData?.summary?.cohort_continuity ?? 0}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#555' }}>CONTINUOUS ENROLLMENT</div>
                </div>

                <div style={{ background: '#0a0a0a', border: '1px solid #222', padding: '1rem', borderRadius: '2px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#888', fontWeight: '800' }}>MAPPING AMBIGUOUS</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '900', color: (mappingData?.summary?.mapping_ambiguous || 0) > 0 ? '#f87171' : '#666', fontFamily: 'monospace', margin: '0.25rem 0' }}>
                    {mappingData?.summary?.mapping_ambiguous ?? 0}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#555' }}>MULTIPLE MATCHES</div>
                </div>

                <div style={{ background: '#0a0a0a', border: '1px solid #222', padding: '1rem', borderRadius: '2px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#888', fontWeight: '800' }}>MAPPING NOT FOUND</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '900', color: (mappingData?.summary?.mapping_not_found || 0) > 0 ? '#fbbf24' : '#666', fontFamily: 'monospace', margin: '0.25rem 0' }}>
                    {mappingData?.summary?.mapping_not_found ?? 0}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#555' }}>SHEET LEVEL (NOT QUEUE BLOCKED)</div>
                </div>
              </div>

              {/* Informational Distinction (Requirement 14) */}
              <div style={{ background: '#0d0d0d', border: '1px solid #222', padding: '0.85rem 1.25rem', borderRadius: '2px', fontSize: '0.7rem', color: '#888' }}>
                <span style={{ fontWeight: '800', color: '#fbbf24' }}>CRITICAL DISTINCTION:</span> <code style={{ color: '#fff' }}>mapping_not_found</code> measures individual sheets without current active roster matches in historical archives. It is distinct from <code style={{ color: '#fff' }}>recovery.queue_counts.blocked_mapping</code>, which only counts actionable queue candidates that cannot safely resolve their historical target.
              </div>

              {/* Mapping Eras Section (Requirement 14) */}
              <div style={{ background: '#141414', border: '1px solid #222', borderRadius: '2px', padding: '1.25rem 1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <Layers size={16} color="#fff" />
                  <h3 style={{ fontSize: '0.8rem', fontWeight: '900', letterSpacing: '0.08em', margin: 0, textTransform: 'uppercase', color: '#fff' }}>
                    HISTORICAL MAPPING ERAS
                  </h3>
                </div>

                {Array.isArray(mappingData?.eras) && mappingData.eras.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                    {mappingData.eras.map((era, idx) => (
                      <div key={idx} style={{ background: '#0a0a0a', border: '1px solid #222', padding: '1rem', borderRadius: '2px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: '900', color: '#fff', fontFamily: 'monospace' }}>
                            {formatDateNice(era.start_date)} → {formatDateNice(era.end_date)}
                          </span>
                          <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#60a5fa', fontFamily: 'monospace', background: 'rgba(96, 165, 250, 0.12)', padding: '0.2rem 0.5rem', borderRadius: '2px' }}>
                            {era.files} files
                          </span>
                        </div>
                        <div style={{ fontSize: '0.65rem', color: '#666', fontFamily: 'monospace' }}>
                          Signature: <span style={{ color: '#aaa' }}>{shortenHash(era.mapping_signature, 10)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#666', fontSize: '0.75rem' }}>No mapping eras discovered.</div>
                )}
              </div>

              {/* Build Metadata */}
              <div style={{ background: '#141414', border: '1px solid #222', borderRadius: '2px', padding: '1.25rem 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.65rem', color: '#666', fontWeight: '800', display: 'block', textTransform: 'uppercase' }}>LAST MAPPING BUILD</span>
                  <span style={{ fontSize: '0.8rem', color: '#fff', fontFamily: 'monospace', display: 'block', marginTop: '0.25rem' }}>
                    {mappingData?.updated_at ? String(mappingData.updated_at).replace('T', ' ') : 'N/A'}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.65rem', color: '#666', fontWeight: '800', display: 'block', textTransform: 'uppercase' }}>STATE SIGNATURE</span>
                  <span style={{ fontSize: '0.8rem', color: '#aaa', fontFamily: 'monospace', display: 'block', marginTop: '0.25rem' }}>
                    {shortenHash(mappingData?.mapping_state_signature, 10)}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.65rem', color: '#666', fontWeight: '800', display: 'block', textTransform: 'uppercase' }}>MAPPING STATE STATUS</span>
                  <span style={{ fontSize: '0.8rem', color: mappingData?.built ? '#4ade80' : '#fbbf24', fontWeight: '800', display: 'block', marginTop: '0.25rem' }}>
                    {mappingData?.built ? 'BUILT & VERIFIED' : 'PENDING BUILD'}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 5: STORAGE & SETTINGS (Requirements 15 & 16) */}
      {activeTab === 'storage' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Storage Telemetry Panel (Requirement 15) */}
          <div style={{ background: '#141414', border: '1px solid #222', borderRadius: '2px', padding: '0' }}>
            <div style={{ padding: '0.85rem 1.5rem', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1a1a1a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <HardDrive size={16} color="#fff" />
                <h3 style={{ fontSize: '0.8rem', fontWeight: '900', letterSpacing: '0.1em', margin: 0, textTransform: 'uppercase', color: '#fff' }}>
                  HISTORICAL RECOVERY STORAGE &amp; QUOTA
                </h3>
              </div>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: '800',
                padding: '0.2rem 0.5rem',
                borderRadius: '2px',
                border: `1px solid ${storage.over_quota ? '#ef4444' : '#22c55e'}`,
                color: storage.over_quota ? '#f87171' : '#4ade80',
                background: storage.over_quota ? 'rgba(239, 68, 68, 0.12)' : 'rgba(74, 222, 128, 0.12)'
              }}>
                {storage.over_quota ? 'OVER QUOTA' : 'WITHIN QUOTA'}
              </span>
            </div>

            <div style={{ padding: '1.5rem' }}>
              {/* Storage Usage Bar */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '800', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#fff', fontFamily: 'monospace' }}>
                    USED: {Number(storage.size_gb ?? 0).toFixed(3)} GB
                  </span>
                  <span style={{ color: '#888', fontFamily: 'monospace' }}>
                    QUOTA: {Number(storage.quota_gb ?? configForm.max_recovery_storage_gb ?? 5.0).toFixed(1)} GB
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#222', borderRadius: '2px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, Math.max(2, (((storage.size_gb ?? 0) / (storage.quota_gb || 5.0)) * 100)))}%`,
                      background: storage.over_quota ? '#ef4444' : '#60a5fa',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
              </div>

              {/* Storage Retention Parameters */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ background: '#0a0a0a', border: '1px solid #222', padding: '0.75rem 1rem', borderRadius: '2px' }}>
                  <span style={{ fontSize: '0.6rem', color: '#666', fontWeight: '800', display: 'block', textTransform: 'uppercase' }}>PROTECTED ITEMS</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#fff', fontFamily: 'monospace' }}>
                    {storage.protected_count ?? 0}
                  </span>
                </div>
                <div style={{ background: '#0a0a0a', border: '1px solid #222', padding: '0.75rem 1rem', borderRadius: '2px' }}>
                  <span style={{ fontSize: '0.6rem', color: '#666', fontWeight: '800', display: 'block', textTransform: 'uppercase' }}>SESSION RETENTION</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#fff', fontFamily: 'monospace' }}>
                    {configForm.session_retention_days} DAYS
                  </span>
                </div>
                <div style={{ background: '#0a0a0a', border: '1px solid #222', padding: '0.75rem 1rem', borderRadius: '2px' }}>
                  <span style={{ fontSize: '0.6rem', color: '#666', fontWeight: '800', display: 'block', textTransform: 'uppercase' }}>MANUAL REVIEW RETENTION</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#fff', fontFamily: 'monospace' }}>
                    {configForm.manual_review_retention_days} DAYS
                  </span>
                </div>
                <div style={{ background: '#0a0a0a', border: '1px solid #222', padding: '0.75rem 1rem', borderRadius: '2px' }}>
                  <span style={{ fontSize: '0.6rem', color: '#666', fontWeight: '800', display: 'block', textTransform: 'uppercase' }}>BACKUPS PER ARCHIVE</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#fff', fontFamily: 'monospace' }}>
                    {configForm.backups_per_archive}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recovery Configuration Form (Requirement 16) */}
          <div style={{ background: '#141414', border: '1px solid #222', borderRadius: '2px', padding: '0' }}>
            <div style={{ padding: '0.85rem 1.5rem', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1a1a1a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Sliders size={16} color="#fff" />
                <h3 style={{ fontSize: '0.8rem', fontWeight: '900', letterSpacing: '0.1em', margin: 0, textTransform: 'uppercase', color: '#fff' }}>
                  STAGE 3 RECOVERY MANAGER SETTINGS
                </h3>
              </div>
              <span style={{ fontSize: '0.65rem', color: '#888' }}>
                PUT /integrity/recovery/config
              </span>
            </div>

            <form onSubmit={handleSaveConfig} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: '800', color: '#bbb', display: 'block', marginBottom: '0.35rem' }}>
                    POLL INTERVAL (SECONDS)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="600"
                    value={configForm.poll_interval_seconds}
                    onChange={(e) => setConfigForm({ ...configForm, poll_interval_seconds: parseInt(e.target.value, 10) || 0 })}
                    style={{ width: '100%', padding: '0.55rem', background: '#0a0a0a', border: '1px solid #333', color: '#fff', fontSize: '0.75rem', borderRadius: '2px', fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: '800', color: '#bbb', display: 'block', marginBottom: '0.35rem' }}>
                    TASK 1 GUARD WINDOW (MINUTES)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={configForm.task1_guard_minutes}
                    onChange={(e) => setConfigForm({ ...configForm, task1_guard_minutes: parseInt(e.target.value, 10) || 0 })}
                    style={{ width: '100%', padding: '0.55rem', background: '#0a0a0a', border: '1px solid #333', color: '#fff', fontSize: '0.75rem', borderRadius: '2px', fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: '800', color: '#bbb', display: 'block', marginBottom: '0.35rem' }}>
                    OFFLINE RETRY INTERVAL (MINUTES)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    value={configForm.offline_retry_interval_minutes}
                    onChange={(e) => setConfigForm({ ...configForm, offline_retry_interval_minutes: parseInt(e.target.value, 10) || 0 })}
                    style={{ width: '100%', padding: '0.55rem', background: '#0a0a0a', border: '1px solid #333', color: '#fff', fontSize: '0.75rem', borderRadius: '2px', fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: '800', color: '#bbb', display: 'block', marginBottom: '0.35rem' }}>
                    ERROR RETRY INTERVAL (MINUTES)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    value={configForm.recovery_error_retry_interval_minutes}
                    onChange={(e) => setConfigForm({ ...configForm, recovery_error_retry_interval_minutes: parseInt(e.target.value, 10) || 0 })}
                    style={{ width: '100%', padding: '0.55rem', background: '#0a0a0a', border: '1px solid #333', color: '#fff', fontSize: '0.75rem', borderRadius: '2px', fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: '800', color: '#bbb', display: 'block', marginBottom: '0.35rem' }}>
                    MAX ATTEMPTS PER DEVICE
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={configForm.max_auto_attempts_per_device}
                    onChange={(e) => setConfigForm({ ...configForm, max_auto_attempts_per_device: parseInt(e.target.value, 10) || 0 })}
                    style={{ width: '100%', padding: '0.55rem', background: '#0a0a0a', border: '1px solid #333', color: '#fff', fontSize: '0.75rem', borderRadius: '2px', fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: '800', color: '#bbb', display: 'block', marginBottom: '0.35rem' }}>
                    MAX DATES PER CYCLE
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={configForm.max_dates_per_cycle}
                    onChange={(e) => setConfigForm({ ...configForm, max_dates_per_cycle: parseInt(e.target.value, 10) || 0 })}
                    style={{ width: '100%', padding: '0.55rem', background: '#0a0a0a', border: '1px solid #333', color: '#fff', fontSize: '0.75rem', borderRadius: '2px', fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: '800', color: '#bbb', display: 'block', marginBottom: '0.35rem' }}>
                    MAX STORAGE QUOTA (GB)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="100"
                    value={configForm.max_recovery_storage_gb}
                    onChange={(e) => setConfigForm({ ...configForm, max_recovery_storage_gb: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '0.55rem', background: '#0a0a0a', border: '1px solid #333', color: '#fff', fontSize: '0.75rem', borderRadius: '2px', fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: '800', color: '#bbb', display: 'block', marginBottom: '0.35rem' }}>
                    BACKUP RETENTION (DAYS)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={configForm.backup_retention_days}
                    onChange={(e) => setConfigForm({ ...configForm, backup_retention_days: parseInt(e.target.value, 10) || 0 })}
                    style={{ width: '100%', padding: '0.55rem', background: '#0a0a0a', border: '1px solid #333', color: '#fff', fontSize: '0.75rem', borderRadius: '2px', fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: '800', color: '#bbb', display: 'block', marginBottom: '0.35rem' }}>
                    SESSION RETENTION (DAYS)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={configForm.session_retention_days}
                    onChange={(e) => setConfigForm({ ...configForm, session_retention_days: parseInt(e.target.value, 10) || 0 })}
                    style={{ width: '100%', padding: '0.55rem', background: '#0a0a0a', border: '1px solid #333', color: '#fff', fontSize: '0.75rem', borderRadius: '2px', fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: '800', color: '#bbb', display: 'block', marginBottom: '0.35rem' }}>
                    MANUAL REVIEW RETENTION (DAYS)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={configForm.manual_review_retention_days}
                    onChange={(e) => setConfigForm({ ...configForm, manual_review_retention_days: parseInt(e.target.value, 10) || 0 })}
                    style={{ width: '100%', padding: '0.55rem', background: '#0a0a0a', border: '1px solid #333', color: '#fff', fontSize: '0.75rem', borderRadius: '2px', fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: '800', color: '#bbb', display: 'block', marginBottom: '0.35rem' }}>
                    BACKUPS PER ARCHIVE
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={configForm.backups_per_archive}
                    onChange={(e) => setConfigForm({ ...configForm, backups_per_archive: parseInt(e.target.value, 10) || 0 })}
                    style={{ width: '100%', padding: '0.55rem', background: '#0a0a0a', border: '1px solid #333', color: '#fff', fontSize: '0.75rem', borderRadius: '2px', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              {/* Boolean Toggles */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', borderTop: '1px solid #222', paddingTop: '1.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.75rem', color: '#ddd' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(configForm.run_integrity_scan_before_queue)}
                    onChange={(e) => setConfigForm({ ...configForm, run_integrity_scan_before_queue: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: '#3b82f6' }}
                  />
                  <span>Run integrity scan before queue rebuild</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.75rem', color: '#ddd' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(configForm.cleanup_on_start)}
                    onChange={(e) => setConfigForm({ ...configForm, cleanup_on_start: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: '#3b82f6' }}
                  />
                  <span>Perform storage cleanup on cycle start</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.75rem', color: '#ddd' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(configForm.cleanup_after_cycle)}
                    onChange={(e) => setConfigForm({ ...configForm, cleanup_after_cycle: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: '#3b82f6' }}
                  />
                  <span>Perform storage cleanup after cycle commit</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #222', paddingTop: '1rem' }}>
                <button
                  type="submit"
                  disabled={savingConfig}
                  style={{
                    padding: '0.6rem 1.5rem',
                    background: '#fff',
                    color: '#000',
                    fontWeight: '900',
                    fontSize: '0.75rem',
                    border: 'none',
                    borderRadius: '2px',
                    cursor: savingConfig ? 'not-allowed' : 'pointer',
                    letterSpacing: '0.08em'
                  }}
                >
                  {savingConfig ? 'SAVING SETTINGS...' : 'SAVE SETTINGS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT TRAIL (Requirement 17) */}
      {activeTab === 'audit' && (
        <div style={{ background: '#141414', border: '1px solid #222', borderRadius: '2px', padding: '0' }}>
          <div style={{ padding: '0.85rem 1.5rem', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1a1a1a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <FileText size={16} color="#fff" />
              <h3 style={{ fontSize: '0.8rem', fontWeight: '900', letterSpacing: '0.1em', margin: 0, textTransform: 'uppercase', color: '#fff' }}>
                DATA INTEGRITY AUDIT TRAIL
              </h3>
            </div>
            <button
              type="button"
              onClick={fetchAudit}
              disabled={auditLoading}
              style={{
                padding: '0.35rem 0.75rem',
                background: '#222',
                border: '1px solid #333',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: '800',
                borderRadius: '2px',
                cursor: auditLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <RefreshCw size={12} className={auditLoading ? 'animate-spin' : ''} />
              <span>REFRESH AUDIT</span>
            </button>
          </div>

          <div style={{ padding: '1rem', maxHeight: '500px', overflowY: 'auto', background: '#0a0a0a', fontFamily: 'monospace', fontSize: '0.7rem' }}>
            {auditLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
                <RefreshCw className="animate-spin" size={20} style={{ margin: '0 auto 0.5rem auto' }} />
                Loading audit trail...
              </div>
            ) : auditLines.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
                No audit events recorded.
              </div>
            ) : (
              auditLines.map((line, idx) => {
                let badgeColor = '#888';
                if (line.includes('SCAN_CYCLE_STARTED')) badgeColor = '#60a5fa';
                else if (line.includes('SCAN_CYCLE_COMPLETED')) badgeColor = '#4ade80';
                else if (line.includes('FILE_SCAN_COMPLETED')) badgeColor = '#38bdf8';
                else if (line.includes('SUSPECTED_MISSING')) badgeColor = '#fbbf24';
                else if (line.includes('MANUAL_REVIEW')) badgeColor = '#e879f9';
                else if (line.includes('RECOVERY_POST_COMMIT_SCAN')) badgeColor = '#a78bfa';
                else if (line.includes('RECOVERY_STORAGE_CLEANUP')) badgeColor = '#94a3b8';
                else if (line.includes('ARCHIVE_REMOVED')) badgeColor = '#f87171';

                return (
                  <div
                    key={idx}
                    style={{
                      padding: '0.4rem 0.6rem',
                      borderBottom: '1px solid #161616',
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems: 'flex-start',
                      lineHeight: '1.4'
                    }}
                  >
                    <span style={{ color: '#555', flexShrink: 0, userSelect: 'none' }}>
                      {String(idx + 1).padStart(3, '0')}
                    </span>
                    <span style={{ color: badgeColor, wordBreak: 'break-all' }}>
                      {line}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: Master Toggle Confirmation Modal (Requirement 5) */}
      {masterModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ background: '#141414', border: '1px solid #333', maxWidth: '520px', width: '100%', borderRadius: '2px', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '900', color: '#fff', margin: '0 0 0.75rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {masterModal.targetEnabled ? 'Enable Historical Integrity & Recovery?' : 'Disable Task 3?'}
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#bbb', lineHeight: '1.6', margin: '0 0 1.5rem 0' }}>
              {masterModal.targetEnabled
                ? 'BIOSYNC will begin monitoring historical attendance integrity. Eligible missing historical attendance may be recovered automatically according to the configured recovery manager. Task 1 attendance synchronization keeps priority.'
                : 'Any active historical device/workbook verification step will finish safely before Task 3 stops.'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setMasterModal({ open: false, targetEnabled: false })}
                style={{ padding: '0.5rem 1rem', background: '#222', border: '1px solid #333', color: '#fff', fontSize: '0.75rem', fontWeight: '800', borderRadius: '2px', cursor: 'pointer' }}
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={() => executeMasterToggle(masterModal.targetEnabled)}
                disabled={togglingMaster}
                style={{
                  padding: '0.5rem 1.25rem',
                  background: masterModal.targetEnabled ? '#fff' : '#1c1212',
                  border: masterModal.targetEnabled ? 'none' : '1px solid #7f1d1d',
                  color: masterModal.targetEnabled ? '#000' : '#f87171',
                  fontSize: '0.75rem',
                  fontWeight: '900',
                  borderRadius: '2px',
                  cursor: togglingMaster ? 'not-allowed' : 'pointer'
                }}
              >
                {togglingMaster ? 'TRANSMITTING...' : masterModal.targetEnabled ? 'ENABLE TASK 3' : 'DISABLE SAFELY'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Scan Now Confirmation Modal (Requirement 10) */}
      {scanModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ background: '#141414', border: '1px solid #333', maxWidth: '520px', width: '100%', borderRadius: '2px', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '900', color: '#fff', margin: '0 0 0.75rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Run historical integrity scan now?
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#bbb', lineHeight: '1.6', margin: '0 0 1.5rem 0' }}>
              This is the read-only historical integrity scanner. It does not itself modify attendance workbooks.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setScanModal(false)}
                style={{ padding: '0.5rem 1rem', background: '#222', border: '1px solid #333', color: '#fff', fontSize: '0.75rem', fontWeight: '800', borderRadius: '2px', cursor: 'pointer' }}
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleScanNow}
                disabled={scanning}
                style={{ padding: '0.5rem 1.25rem', background: '#fff', color: '#000', fontSize: '0.75rem', fontWeight: '900', border: 'none', borderRadius: '2px', cursor: scanning ? 'not-allowed' : 'pointer' }}
              >
                {scanning ? 'STARTING SCAN...' : 'START SCAN'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Run Recovery Confirmation Modal (Requirement 10) */}
      {recoveryModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ background: '#141414', border: '1px solid #333', maxWidth: '520px', width: '100%', borderRadius: '2px', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '900', color: '#fff', margin: '0 0 0.75rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Run Historical Recovery Now?
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#bbb', lineHeight: '1.6', margin: '0 0 1.5rem 0' }}>
              BIOSYNC will process the earliest eligible historical recovery according to the protected recovery queue. Exact-date source logs and historical roster matching are required before archive changes are committed. Task 1 has priority.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setRecoveryModal(false)}
                style={{ padding: '0.5rem 1rem', background: '#222', border: '1px solid #333', color: '#fff', fontSize: '0.75rem', fontWeight: '800', borderRadius: '2px', cursor: 'pointer' }}
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleRunRecoveryNow}
                disabled={recovering}
                style={{ padding: '0.5rem 1.25rem', background: '#fff', color: '#000', fontSize: '0.75rem', fontWeight: '900', border: 'none', borderRadius: '2px', cursor: recovering ? 'not-allowed' : 'pointer' }}
              >
                {recovering ? 'STARTING CYCLE...' : 'RUN RECOVERY'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Recovery History Summarized Evidence Modal (Requirement 13) */}
      {historyDetailModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '1rem' }}>
          <div style={{ background: '#141414', border: '1px solid #333', maxWidth: '640px', width: '100%', borderRadius: '2px', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #222', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '900', color: '#fff', margin: 0, textTransform: 'uppercase' }}>
                  RECOVERY EVIDENCE SUMMARY
                </h3>
                <span style={{ fontSize: '0.65rem', color: '#888', fontFamily: 'monospace' }}>
                  {historyDetailModal.device} — {formatDateNice(historyDetailModal.date)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setHistoryDetailModal(null)}
                style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Summarized Evidence Details ONLY (Requirement 13: NO massive roster_ids or raw JSON) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.65rem', color: '#666', fontWeight: '800', display: 'block' }}>RESULT STATUS</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: '900', color: getBadgeStyle(historyDetailModal.status).color }}>
                    {historyDetailModal.status}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.65rem', color: '#666', fontWeight: '800', display: 'block' }}>REASON</span>
                  <span style={{ fontSize: '0.8rem', color: '#ddd' }}>
                    {historyDetailModal.reason || 'None specified'}
                  </span>
                </div>
              </div>

              {/* Before vs After Evidence */}
              {historyDetailModal.details && (historyDetailModal.details.before || historyDetailModal.details.after) && (
                <div style={{ border: '1px solid #222', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ background: '#1a1a1a', padding: '0.5rem 0.75rem', fontWeight: '800', fontSize: '0.7rem', color: '#bbb' }}>
                    WORKBOOK AUDIT METRICS (BEFORE VS AFTER)
                  </div>
                  <div style={{ padding: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#0a0a0a' }}>
                    {/* Before Summary */}
                    <div>
                      <span style={{ fontSize: '0.65rem', color: '#888', fontWeight: '800', display: 'block', marginBottom: '0.35rem' }}>BEFORE RECOVERY</span>
                      {historyDetailModal.details.before ? (
                        Object.entries(historyDetailModal.details.before).map(([cls, metrics]) => (
                          <div key={cls} style={{ background: '#111', padding: '0.5rem', marginBottom: '0.35rem', borderRadius: '2px' }}>
                            <div style={{ fontWeight: '700', color: '#fff', fontSize: '0.7rem' }}>{cls}</div>
                            <div style={{ color: '#aaa', fontSize: '0.65rem', fontFamily: 'monospace' }}>Students: {metrics.student_rows ?? 'N/A'}</div>
                            <div style={{ color: '#aaa', fontSize: '0.65rem', fontFamily: 'monospace' }}>Present: {metrics.present_count ?? 0}</div>
                            <div style={{ color: '#aaa', fontSize: '0.65rem', fontFamily: 'monospace' }}>Last Punch: {metrics.last_punch_count ?? 0}</div>
                            <div style={{ color: '#aaa', fontSize: '0.65rem', fontFamily: 'monospace' }}>Punches Rows: {metrics.punch_record_rows ?? 0}</div>
                          </div>
                        ))
                      ) : (
                        <span style={{ color: '#555' }}>No prior data recorded</span>
                      )}
                    </div>

                    {/* After Summary */}
                    <div>
                      <span style={{ fontSize: '0.65rem', color: '#4ade80', fontWeight: '800', display: 'block', marginBottom: '0.35rem' }}>AFTER RECOVERY</span>
                      {historyDetailModal.details.after ? (
                        Object.entries(historyDetailModal.details.after).map(([cls, metrics]) => (
                          <div key={cls} style={{ background: '#111', padding: '0.5rem', marginBottom: '0.35rem', borderRadius: '2px' }}>
                            <div style={{ fontWeight: '700', color: '#fff', fontSize: '0.7rem' }}>{cls}</div>
                            <div style={{ color: '#aaa', fontSize: '0.65rem', fontFamily: 'monospace' }}>Students: {metrics.student_rows ?? 'N/A'}</div>
                            <div style={{ color: '#4ade80', fontSize: '0.65rem', fontFamily: 'monospace' }}>Present: {metrics.present_count ?? 0}</div>
                            <div style={{ color: '#aaa', fontSize: '0.65rem', fontFamily: 'monospace' }}>Last Punch: {metrics.last_punch_count ?? 0}</div>
                            <div style={{ color: '#aaa', fontSize: '0.65rem', fontFamily: 'monospace' }}>Punches Rows: {metrics.punch_record_rows ?? 0}</div>
                            {metrics.report_date_text && (
                              <div style={{ color: '#93c5fd', fontSize: '0.65rem' }}>Report Date: {metrics.report_date_text}</div>
                            )}
                            <div style={{ color: metrics.footer_date_match ? '#4ade80' : '#888', fontSize: '0.65rem' }}>
                              Footer Match: {metrics.footer_date_match ? 'YES' : 'NO'}
                            </div>
                          </div>
                        ))
                      ) : (
                        <span style={{ color: '#555' }}>No post-commit metrics</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Safety Backup & SDK Status */}
              <div style={{ background: '#0a0a0a', border: '1px solid #222', padding: '0.75rem', borderRadius: '2px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.65rem', color: '#666', fontWeight: '800', display: 'block' }}>SAFETY BACKUP FILE</span>
                  <span style={{ fontSize: '0.7rem', color: '#ddd', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {historyDetailModal.details?.safety_backup || 'None required / not created'}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.65rem', color: '#666', fontWeight: '800', display: 'block' }}>SESSION ID</span>
                  <span style={{ fontSize: '0.7rem', color: '#ddd', fontFamily: 'monospace' }}>
                    {historyDetailModal.session_id || 'N/A'}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.65rem', color: '#666', fontWeight: '800', display: 'block' }}>SDK RESPONSE CODE</span>
                  <span style={{ fontSize: '0.7rem', color: '#60a5fa', fontFamily: 'monospace' }}>
                    {historyDetailModal.details?.sdk_status ?? 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setHistoryDetailModal(null)}
                style={{ padding: '0.5rem 1.25rem', background: '#fff', color: '#000', fontWeight: '900', fontSize: '0.75rem', border: 'none', borderRadius: '2px', cursor: 'pointer' }}
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
