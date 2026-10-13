import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../utils/api';
import {
  Network,
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  Activity,
  Wifi,
  WifiOff,
  Lock,
  Layers,
  Server
} from 'lucide-react';

export default function DeviceManagementPage() {
  const [devices, setDevices] = useState([]);
  const [classSheets, setClassSheets] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState({ type: '', text: '' });

  // Modal State for Add / Edit
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [editingOriginalName, setEditingOriginalName] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    ip: '',
    port: 4370,
    selectedSheets: [],
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Class Sheet Search within Modal
  const [classFilterQuery, setClassFilterQuery] = useState('');

  // Connection Test State
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState(null); // { online: bool, message: string }

  // Delete Confirmation Modal State
  const [deletingDevice, setDeletingDevice] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const showNotification = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => {
      setNotification((curr) => (curr.text === text ? { type: '', text: '' } : curr));
    }, 4500);
  };

  // Fetch Devices and Lock Status
  const fetchDevices = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await api.get(`/devices?_=${Date.now()}`);
      if (data && typeof data === 'object') {
        setDevices(Array.isArray(data.devices) ? data.devices : []);
        setIsLocked(Boolean(data.locked));
      }
    } catch (err) {
      console.error('Failed to load biometric devices:', err);
      showNotification('error', err.message || 'Unable to load biometric device registry.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Fetch Class Sheets for mapping
  const fetchClassSheets = async () => {
    try {
      const data = await api.get(`/devices/class-sheets?_=${Date.now()}`);
      if (data && Array.isArray(data.sheets)) {
        setClassSheets(data.sheets);
      }
    } catch (err) {
      console.error('Failed to load class sheets:', err);
      showNotification('error', err.message || 'Unable to load available class mappings.');
    }
  };

  useEffect(() => {
    fetchDevices();
    fetchClassSheets();
  }, []);

  // Filtered devices based on search query
  const filteredDevices = useMemo(() => {
    if (!searchQuery.trim()) return devices;
    const q = searchQuery.toLowerCase().trim();

    return devices.filter((dev) => {
      const nameMatch = dev.name?.toLowerCase().includes(q);
      const ipMatch = dev.ip?.toLowerCase().includes(q);
      const portMatch = String(dev.port || '').includes(q);

      let sheetMatch = false;
      if (Array.isArray(dev.sheet)) {
        sheetMatch = dev.sheet.some((s) => s?.toLowerCase().includes(q));
      } else if (typeof dev.sheet === 'string') {
        sheetMatch = dev.sheet.toLowerCase().includes(q);
      }

      return nameMatch || ipMatch || portMatch || sheetMatch;
    });
  }, [devices, searchQuery]);

  // Open Add Device Modal
  const handleOpenAddModal = () => {
    if (isLocked) {
      showNotification('error', 'Device configuration is locked while automation is running.');
      return;
    }
    setFormData({
      name: '',
      ip: '',
      port: 4370,
      selectedSheets: [],
    });
    setEditingOriginalName('');
    setFormErrors({});
    setConnectionResult(null);
    setClassFilterQuery('');
    setModalMode('add');
  };

  // Open Edit Device Modal
  const handleOpenEditModal = (dev) => {
    if (isLocked) {
      showNotification('error', 'Device configuration is locked while automation is running.');
      return;
    }
    const mappedSheets = Array.isArray(dev.sheet)
      ? [...dev.sheet]
      : (dev.sheet ? [dev.sheet] : []);

    setFormData({
      name: dev.name || '',
      ip: dev.ip || '',
      port: dev.port || 4370,
      selectedSheets: mappedSheets,
    });
    setEditingOriginalName(dev.name || '');
    setFormErrors({});
    setConnectionResult(null);
    setClassFilterQuery('');
    setModalMode('edit');
  };

  const handleCloseModal = () => {
    if (submitting) return;
    setModalMode(null);
    setConnectionResult(null);
    setFormErrors({});
  };

  // Class Selection Toggle
  const handleToggleClass = (sheetName) => {
    setFormData((prev) => {
      const current = prev.selectedSheets || [];
      if (current.includes(sheetName)) {
        return {
          ...prev,
          selectedSheets: current.filter((s) => s !== sheetName),
        };
      } else {
        return {
          ...prev,
          selectedSheets: [...current, sheetName],
        };
      }
    });
    if (formErrors.sheets) {
      setFormErrors((prev) => ({ ...prev, sheets: null }));
    }
  };

  const handleRemoveClass = (sheetName) => {
    setFormData((prev) => ({
      ...prev,
      selectedSheets: (prev.selectedSheets || []).filter((s) => s !== sheetName),
    }));
  };

  // Test Connection
  const handleTestConnection = async () => {
    const ip = formData.ip.trim();
    const port = Number(formData.port);

    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ip || !ipRegex.test(ip)) {
      setConnectionResult({
        online: false,
        message: 'Enter a valid IPv4 address before testing.',
      });
      return;
    }

    if (isNaN(port) || port < 1 || port > 65535) {
      setConnectionResult({
        online: false,
        message: 'Port must be between 1 and 65535.',
      });
      return;
    }

    try {
      setTestingConnection(true);
      setConnectionResult(null);

      const res = await api.post('/devices/test-connection', {
        ip: ip,
        port: port,
      });

      if (res && res.online) {
        setConnectionResult({
          online: true,
          message: res.message || 'Device endpoint is reachable (ONLINE)',
        });
      } else {
        setConnectionResult({
          online: false,
          message: res?.message || 'Device endpoint is not reachable (OFFLINE)',
          error: res?.error,
        });
      }
    } catch (err) {
      setConnectionResult({
        online: false,
        message: err.message || 'Connection test failed',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // Form Validation
  const validateForm = () => {
    const errors = {};
    const name = formData.name.trim();
    const ip = formData.ip.trim();
    const port = Number(formData.port);

    if (!name) {
      errors.name = 'Device name is required.';
    }

    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ip) {
      errors.ip = 'IP address is required.';
    } else if (!ipRegex.test(ip)) {
      errors.ip = 'Invalid IPv4 address format (e.g. 172.16.31.108).';
    }

    if (isNaN(port) || port < 1 || port > 65535) {
      errors.port = 'Port must be a valid integer between 1 and 65535.';
    }

    if (!formData.selectedSheets || formData.selectedSheets.length === 0) {
      errors.sheets = 'At least one mapped class is required.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Add / Edit Form
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const sheetPayload =
      formData.selectedSheets.length === 1
        ? formData.selectedSheets[0]
        : formData.selectedSheets;

    const payload = {
      name: formData.name.trim(),
      ip: formData.ip.trim(),
      port: Number(formData.port),
      sheet: sheetPayload,
    };

    try {
      setSubmitting(true);

      if (modalMode === 'add') {
        const res = await api.post('/devices', payload);
        showNotification('success', res?.message || 'Device added successfully.');
      } else if (modalMode === 'edit') {
        const endpoint = `/devices/${encodeURIComponent(editingOriginalName)}`;
        const res = await api.put(endpoint, payload);
        showNotification('success', res?.message || 'Device updated successfully.');
      }

      setModalMode(null);
      await fetchDevices(true);
    } catch (err) {
      console.error('Save device failed:', err);
      if (err.message && err.message.toLowerCase().includes('locked')) {
        setIsLocked(true);
      }
      showNotification('error', err.message || 'Failed to save device configuration.');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Delete Confirmation
  const handleOpenDelete = (dev) => {
    if (isLocked) {
      showNotification('error', 'Device configuration is locked while automation is running.');
      return;
    }
    setDeletingDevice(dev);
  };

  // Confirm Delete Device
  const handleConfirmDelete = async () => {
    if (!deletingDevice) return;

    try {
      setDeleting(true);
      const endpoint = `/devices/${encodeURIComponent(deletingDevice.name)}`;
      const res = await api.delete(endpoint);

      showNotification('success', res?.message || 'Device removed successfully.');
      setDeletingDevice(null);
      await fetchDevices(true);
    } catch (err) {
      console.error('Delete device failed:', err);
      if (err.message && err.message.toLowerCase().includes('locked')) {
        setIsLocked(true);
      }
      showNotification('error', err.message || 'Failed to remove device.');
    } finally {
      setDeleting(false);
    }
  };

  // Filter available classes inside modal
  const filteredClassSheets = useMemo(() => {
    if (!classFilterQuery.trim()) return classSheets;
    const q = classFilterQuery.toLowerCase().trim();
    return classSheets.filter((s) => s.toLowerCase().includes(q));
  }, [classSheets, classFilterQuery]);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Page Header */}
      <div style={{ borderBottom: '1px solid #222', paddingBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#fff', margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Network size={22} color="#fff" />
            DEVICE MANAGEMENT
          </h1>
          <p style={{ color: '#666', fontSize: '0.75rem', fontWeight: '700', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            BIOMETRIC DEVICE REGISTRY &amp; CLASS SHEET MAPPINGS
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#141414', border: '1px solid #222', padding: '0.45rem 0.85rem', borderRadius: '2px' }}>
            <Server size={14} color="#888" />
            <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: '800', letterSpacing: '0.05em', fontFamily: 'monospace' }}>
              {devices.length} REGISTERED DEVICES
            </span>
          </div>

          <button
            type="button"
            onClick={() => fetchDevices()}
            title="Refresh device registry"
            style={{
              padding: '0.45rem 0.65rem',
              background: '#141414',
              border: '1px solid #222',
              color: '#888',
              borderRadius: '2px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#444'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = '#222'; }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Lock Notice Banner */}
      {isLocked && (
        <div style={{
          padding: '1.25rem 1.5rem',
          background: '#19150b',
          border: '1px solid #854d0e',
          borderLeft: '4px solid #fbbf24',
          borderRadius: '2px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem'
        }}>
          <Lock size={20} color="#fbbf24" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: '900', color: '#fbbf24', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              DEVICE CONFIGURATION LOCKED
            </div>
            <div style={{ fontSize: '0.75rem', color: '#d4d4d4', marginTop: '0.25rem', lineHeight: '1.4' }}>
              BIOSYNC attendance automation is currently running. Device configuration will become available after the current automation cycle completes.
            </div>
          </div>
        </div>
      )}

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

      {/* Top Controls Bar: Search & Add Device */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        {/* Search Field */}
        <div style={{ position: 'relative', flex: '1 1 340px' }}>
          <Search size={16} color="#666" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input-tech"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search device, IP address or mapped class..."
            style={{
              paddingLeft: '2.5rem',
              paddingRight: searchQuery ? '2.5rem' : '1rem',
              backgroundColor: '#141414',
              borderColor: '#222',
              fontSize: '0.8rem'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: '#666',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '0.25rem'
              }}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Add Device Button */}
        <button
          type="button"
          className="btn-solid"
          onClick={handleOpenAddModal}
          disabled={isLocked}
          style={{
            backgroundColor: isLocked ? '#222' : '#fff',
            color: isLocked ? '#666' : '#000',
            border: isLocked ? '1px solid #333' : 'none',
            fontWeight: '900',
            height: '42px',
            padding: '0 1.5rem',
            opacity: isLocked ? 0.5 : 1,
            cursor: isLocked ? 'not-allowed' : 'pointer'
          }}
        >
          <Plus size={16} />
          <span>ADD DEVICE</span>
        </button>
      </div>

      {/* Device Registry Table Card */}
      <div className="ud-card" style={{ padding: '0', border: '1px solid #222', borderRadius: '2px', background: '#141414' }}>
        <div style={{
          padding: '1rem 1.75rem',
          borderBottom: '1px solid #222',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#1a1a1a',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Layers size={16} color="#fff" />
            <h2 style={{ fontSize: '0.8rem', fontWeight: '900', letterSpacing: '0.1em', margin: 0, textTransform: 'uppercase', color: '#fff' }}>
              REGISTERED BIOMETRIC DEVICES
            </h2>
          </div>
          <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#666', letterSpacing: '0.05em' }}>
            SHOWING {filteredDevices.length} OF {devices.length}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem', gap: '1rem' }}>
              <RefreshCw className="animate-spin" size={28} color="#fff" />
              <span style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.15em', color: '#666' }}>
                LOADING DEVICES...
              </span>
            </div>
          ) : filteredDevices.length === 0 ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#666', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.05em' }}>
              {searchQuery ? 'No devices match your search query.' : 'No biometric devices registered.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #222', background: '#111' }}>
                  <th style={{ padding: '0.85rem 1.5rem', color: '#888', fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    DEVICE NAME
                  </th>
                  <th style={{ padding: '0.85rem 1.5rem', color: '#888', fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    IP ADDRESS
                  </th>
                  <th style={{ padding: '0.85rem 1.5rem', color: '#888', fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    PORT
                  </th>
                  <th style={{ padding: '0.85rem 1.5rem', color: '#888', fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    MAPPED CLASS / CLASSES
                  </th>
                  <th style={{ padding: '0.85rem 1.5rem', color: '#888', fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'right' }}>
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((dev) => {
                  const mappedSheets = Array.isArray(dev.sheet)
                    ? dev.sheet
                    : (dev.sheet ? [dev.sheet] : []);

                  return (
                    <tr
                      key={dev.name}
                      style={{
                        borderBottom: '1px solid #1c1c1c',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#181818'; }}
                      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      {/* Device Name */}
                      <td style={{ padding: '0.9rem 1.5rem', fontWeight: '800', color: '#fff', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                        {dev.name}
                      </td>

                      {/* IP Address */}
                      <td style={{ padding: '0.9rem 1.5rem', fontFamily: 'monospace', color: '#bbb', fontSize: '0.8rem' }}>
                        {dev.ip}
                      </td>

                      {/* Port */}
                      <td style={{ padding: '0.9rem 1.5rem', fontFamily: 'monospace', color: '#888', fontSize: '0.8rem' }}>
                        {dev.port || 4370}
                      </td>

                      {/* Mapped Classes */}
                      <td style={{ padding: '0.9rem 1.5rem' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {mappedSheets.length > 0 ? (
                            mappedSheets.map((sheetName, sIdx) => (
                              <span
                                key={sIdx}
                                style={{
                                  background: '#0a0a0a',
                                  border: '1px solid #2a2a2a',
                                  color: '#ccc',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '2px',
                                  fontSize: '0.7rem',
                                  fontWeight: '700',
                                  letterSpacing: '0.04em'
                                }}
                              >
                                {sheetName}
                              </span>
                            ))
                          ) : (
                            <span style={{ color: '#555', fontSize: '0.7rem', fontStyle: 'italic' }}>None</span>
                          )}
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td style={{ padding: '0.9rem 1.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(dev)}
                            disabled={isLocked}
                            title={isLocked ? 'Locked while automation is running' : 'Edit device'}
                            style={{
                              padding: '0.35rem 0.65rem',
                              background: 'transparent',
                              border: '1px solid #333',
                              color: isLocked ? '#444' : '#bbb',
                              fontSize: '0.7rem',
                              fontWeight: '700',
                              borderRadius: '2px',
                              cursor: isLocked ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseOver={(e) => {
                              if (!isLocked) {
                                e.currentTarget.style.color = '#fff';
                                e.currentTarget.style.borderColor = '#555';
                                e.currentTarget.style.background = '#222';
                              }
                            }}
                            onMouseOut={(e) => {
                              if (!isLocked) {
                                e.currentTarget.style.color = '#bbb';
                                e.currentTarget.style.borderColor = '#333';
                                e.currentTarget.style.background = 'transparent';
                              }
                            }}
                          >
                            <Edit2 size={12} />
                            <span>EDIT</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenDelete(dev)}
                            disabled={isLocked}
                            title={isLocked ? 'Locked while automation is running' : 'Delete device'}
                            style={{
                              padding: '0.35rem 0.65rem',
                              background: 'transparent',
                              border: '1px solid #333',
                              color: isLocked ? '#444' : '#888',
                              fontSize: '0.7rem',
                              fontWeight: '700',
                              borderRadius: '2px',
                              cursor: isLocked ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseOver={(e) => {
                              if (!isLocked) {
                                e.currentTarget.style.color = '#f87171';
                                e.currentTarget.style.borderColor = '#7f1d1d';
                                e.currentTarget.style.background = '#1a0d0d';
                              }
                            }}
                            onMouseOut={(e) => {
                              if (!isLocked) {
                                e.currentTarget.style.color = '#888';
                                e.currentTarget.style.borderColor = '#333';
                                e.currentTarget.style.background = 'transparent';
                              }
                            }}
                          >
                            <Trash2 size={12} />
                            <span>DELETE</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* ADD / EDIT DEVICE MODAL                                        */}
      {/* ============================================================== */}
      {modalMode && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.82)',
          zIndex: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '580px',
            background: '#141414',
            border: '1px solid #333',
            borderRadius: '4px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '92vh',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.75rem',
              borderBottom: '1px solid #222',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#1a1a1a'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Network size={18} color="#fff" />
                <h3 style={{ fontSize: '0.85rem', fontWeight: '900', letterSpacing: '0.1em', margin: 0, textTransform: 'uppercase', color: '#fff' }}>
                  {modalMode === 'add' ? 'ADD BIOMETRIC DEVICE' : `EDIT DEVICE // ${editingOriginalName}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={submitting}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#888',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmitForm} style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
              {/* Device Name Field */}
              <div>
                <label className="input-label" htmlFor="device_name_input">
                  DEVICE NAME <span style={{ color: '#f87171' }}>*</span>
                </label>
                <input
                  id="device_name_input"
                  type="text"
                  className="input-tech"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (formErrors.name) setFormErrors({ ...formErrors, name: null });
                  }}
                  placeholder="e.g. II CSE A or III AIML A&B"
                  style={{
                    backgroundColor: '#0a0a0a',
                    borderColor: formErrors.name ? '#7f1d1d' : '#222'
                  }}
                />
                {formErrors.name && (
                  <span style={{ color: '#f87171', fontSize: '0.65rem', fontWeight: '700', marginTop: '0.35rem', display: 'block' }}>
                    {formErrors.name}
                  </span>
                )}
                {modalMode === 'edit' && formData.name.trim() !== editingOriginalName && (
                  <span style={{ color: '#fbbf24', fontSize: '0.65rem', fontWeight: '700', marginTop: '0.35rem', display: 'block' }}>
                    NOTE: Renaming will update device name while referencing &quot;{editingOriginalName}&quot;.
                  </span>
                )}
              </div>

              {/* IP Address and Port Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                {/* IP Address */}
                <div>
                  <label className="input-label" htmlFor="device_ip_input">
                    IP ADDRESS <span style={{ color: '#f87171' }}>*</span>
                  </label>
                  <input
                    id="device_ip_input"
                    type="text"
                    className="input-tech"
                    value={formData.ip}
                    onChange={(e) => {
                      setFormData({ ...formData, ip: e.target.value });
                      setConnectionResult(null);
                      if (formErrors.ip) setFormErrors({ ...formErrors, ip: null });
                    }}
                    placeholder="172.16.31.108"
                    style={{
                      backgroundColor: '#0a0a0a',
                      fontFamily: 'monospace',
                      borderColor: formErrors.ip ? '#7f1d1d' : '#222'
                    }}
                  />
                  {formErrors.ip && (
                    <span style={{ color: '#f87171', fontSize: '0.65rem', fontWeight: '700', marginTop: '0.35rem', display: 'block' }}>
                      {formErrors.ip}
                    </span>
                  )}
                </div>

                {/* Port */}
                <div>
                  <label className="input-label" htmlFor="device_port_input">
                    PORT <span style={{ color: '#f87171' }}>*</span>
                  </label>
                  <input
                    id="device_port_input"
                    type="number"
                    min="1"
                    max="65535"
                    className="input-tech"
                    value={formData.port}
                    onChange={(e) => {
                      setFormData({ ...formData, port: e.target.value });
                      setConnectionResult(null);
                      if (formErrors.port) setFormErrors({ ...formErrors, port: null });
                    }}
                    placeholder="4370"
                    style={{
                      backgroundColor: '#0a0a0a',
                      fontFamily: 'monospace',
                      borderColor: formErrors.port ? '#7f1d1d' : '#222'
                    }}
                  />
                  {formErrors.port && (
                    <span style={{ color: '#f87171', fontSize: '0.65rem', fontWeight: '700', marginTop: '0.35rem', display: 'block' }}>
                      {formErrors.port}
                    </span>
                  )}
                </div>
              </div>

              {/* Connection Test Section */}
              <div style={{
                background: '#0a0a0a',
                border: '1px solid #222',
                padding: '0.85rem 1rem',
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {testingConnection ? (
                    <RefreshCw className="animate-spin" size={15} color="#888" />
                  ) : connectionResult ? (
                    connectionResult.online ? (
                      <Wifi size={15} color="#4ade80" />
                    ) : (
                      <WifiOff size={15} color="#f87171" />
                    )
                  ) : (
                    <Activity size={15} color="#666" />
                  )}

                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    color: connectionResult
                      ? connectionResult.online ? '#4ade80' : '#f87171'
                      : '#888',
                    letterSpacing: '0.04em'
                  }}>
                    {testingConnection
                      ? 'TESTING CONNECTION...'
                      : connectionResult
                        ? connectionResult.message
                        : 'TEST REACHABILITY BEFORE SAVING'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection || !formData.ip.trim()}
                  style={{
                    padding: '0.4rem 0.85rem',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    color: '#fff',
                    fontSize: '0.65rem',
                    fontWeight: '800',
                    letterSpacing: '0.08em',
                    borderRadius: '2px',
                    cursor: testingConnection || !formData.ip.trim() ? 'not-allowed' : 'pointer',
                    opacity: testingConnection || !formData.ip.trim() ? 0.5 : 1
                  }}
                  onMouseOver={(e) => { if (!testingConnection && formData.ip.trim()) e.currentTarget.style.background = '#252525'; }}
                  onMouseOut={(e) => { if (!testingConnection && formData.ip.trim()) e.currentTarget.style.background = '#1a1a1a'; }}
                >
                  TEST CONNECTION
                </button>
              </div>

              {/* Mapped Classes Multi-Select Section */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <label className="input-label" style={{ margin: 0 }}>
                    MAPPED CLASS / CLASSES <span style={{ color: '#f87171' }}>*</span>
                  </label>
                  <span style={{ fontSize: '0.65rem', color: '#888', fontWeight: '700' }}>
                    {formData.selectedSheets.length} SELECTED
                  </span>
                </div>

                {/* Selected Classes Chips Area */}
                <div style={{
                  minHeight: '44px',
                  background: '#0a0a0a',
                  border: `1px solid ${formErrors.sheets ? '#7f1d1d' : '#222'}`,
                  padding: '0.5rem',
                  borderRadius: '2px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.4rem',
                  alignItems: 'center',
                  marginBottom: '0.75rem'
                }}>
                  {formData.selectedSheets.length > 0 ? (
                    formData.selectedSheets.map((s) => (
                      <span
                        key={s}
                        style={{
                          background: '#1a1a1a',
                          border: '1px solid #333',
                          color: '#fff',
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '2px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        {s}
                        <button
                          type="button"
                          onClick={() => handleRemoveClass(s)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#888',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title={`Remove ${s}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span style={{ color: '#555', fontSize: '0.7rem', fontStyle: 'italic', paddingLeft: '0.25rem' }}>
                      No classes selected yet. Choose one or more from the list below.
                    </span>
                  )}
                </div>

                {formErrors.sheets && (
                  <span style={{ color: '#f87171', fontSize: '0.65rem', fontWeight: '700', marginBottom: '0.5rem', display: 'block' }}>
                    {formErrors.sheets}
                  </span>
                )}

                {/* Class Sheet Search Filter */}
                <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                  <Search size={14} color="#666" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    className="input-tech"
                    value={classFilterQuery}
                    onChange={(e) => setClassFilterQuery(e.target.value)}
                    placeholder="Filter available classes..."
                    style={{
                      paddingLeft: '2.25rem',
                      paddingTop: '0.45rem',
                      paddingBottom: '0.45rem',
                      fontSize: '0.75rem',
                      backgroundColor: '#0f0f0f',
                      borderColor: '#222'
                    }}
                  />
                </div>

                {/* Scrollable Class List */}
                <div style={{
                  maxHeight: '160px',
                  overflowY: 'auto',
                  background: '#0a0a0a',
                  border: '1px solid #222',
                  borderRadius: '2px',
                  padding: '0.4rem',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.35rem'
                }}>
                  {filteredClassSheets.length > 0 ? (
                    filteredClassSheets.map((sheetName) => {
                      const isSelected = formData.selectedSheets.includes(sheetName);
                      return (
                        <button
                          key={sheetName}
                          type="button"
                          onClick={() => handleToggleClass(sheetName)}
                          style={{
                            padding: '0.3rem 0.55rem',
                            background: isSelected ? '#fff' : '#141414',
                            border: isSelected ? '1px solid #fff' : '1px solid #262626',
                            color: isSelected ? '#000' : '#888',
                            fontSize: '0.7rem',
                            fontWeight: '700',
                            borderRadius: '2px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {isSelected ? `✓ ${sheetName}` : `+ ${sheetName}`}
                        </button>
                      );
                    })
                  ) : (
                    <div style={{ color: '#555', fontSize: '0.7rem', padding: '0.75rem', width: '100%', textAlign: 'center' }}>
                      {classSheets.length === 0 ? 'Loading available classes...' : 'No matching class sheets.'}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'flex-end',
                paddingTop: '1rem',
                borderTop: '1px solid #222'
              }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  style={{
                    padding: '0.65rem 1.25rem',
                    background: 'transparent',
                    border: '1px solid #333',
                    color: '#bbb',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    borderRadius: '2px',
                    cursor: submitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  CANCEL
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-solid"
                  style={{
                    padding: '0.65rem 1.75rem',
                    background: '#fff',
                    color: '#000',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: '900',
                    letterSpacing: '0.05em',
                    borderRadius: '2px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {submitting && <RefreshCw className="animate-spin" size={14} />}
                  <span>
                    {submitting
                      ? modalMode === 'add' ? 'SAVING...' : 'UPDATING...'
                      : modalMode === 'add' ? 'ADD DEVICE' : 'SAVE CHANGES'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DELETE CONFIRMATION MODAL                                      */}
      {/* ============================================================== */}
      {deletingDevice && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          zIndex: 70,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '500px',
            background: '#160d0d',
            border: '1px solid #7f1d1d',
            borderRadius: '4px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.95)',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
              <AlertTriangle size={24} color="#f87171" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '900', color: '#f87171', margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  REMOVE BIOMETRIC DEVICE?
                </h3>
                <div style={{
                  background: '#0a0a0a',
                  border: '1px solid #331a1a',
                  padding: '0.75rem 1rem',
                  borderRadius: '2px',
                  marginTop: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem'
                }}>
                  <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '800' }}>
                    {deletingDevice.name}
                  </div>
                  <div style={{ color: '#bbb', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                    {deletingDevice.ip}:{deletingDevice.port || 4370}
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: '#ccc', marginTop: '1rem', lineHeight: '1.5' }}>
                  This device will no longer participate in future BIOSYNC attendance pulls.
                </div>
                <div style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: '700', marginTop: '0.4rem', lineHeight: '1.5' }}>
                  ✓ Existing attendance records and historical reports will NOT be deleted.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid #331a1a' }}>
              <button
                type="button"
                onClick={() => setDeletingDevice(null)}
                disabled={deleting}
                style={{
                  padding: '0.6rem 1.25rem',
                  background: 'transparent',
                  border: '1px solid #444',
                  color: '#bbb',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  borderRadius: '2px',
                  cursor: deleting ? 'not-allowed' : 'pointer'
                }}
              >
                CANCEL
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                style={{
                  padding: '0.6rem 1.5rem',
                  background: '#b91c1c',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontWeight: '900',
                  letterSpacing: '0.05em',
                  borderRadius: '2px',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {deleting && <RefreshCw className="animate-spin" size={14} />}
                <span>{deleting ? 'DELETING...' : 'DELETE DEVICE'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
