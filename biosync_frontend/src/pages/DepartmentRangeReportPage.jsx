import React, { useState, useMemo, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { Calendar as CalendarIcon, Filter, Layers, User, AlertTriangle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../utils/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function DepartmentRangeReportPage() {
  const [department, setDepartment] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);
  
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const [selectedClass, setSelectedClass] = useState('');

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!department || !startDate || !endDate) return;
    
    setIsGenerating(true);
    setError(null);
    setReportData(null);

    try {
      const response = await api.post('/department/range-report', {
        department,
        start_date: startDate,
        end_date: endDate
      });
      setReportData(response);
    } catch (err) {
      setError(err.message || 'Failed to generate report.');
    } finally {
      setIsGenerating(false);
    }
  };

  const monthlyData = useMemo(() => {
    if (!reportData || !reportData.daily_trend) return [];
    
    const groups = {};
    reportData.daily_trend.forEach(item => {
      let label = "Unknown Date";
      if (item.date) {
        // e.g. "2026-03-01"
        const parts = item.date.split('-');
        if (parts.length >= 2) {
           const year = parts[0];
           const monthInt = parseInt(parts[1], 10);
           const monthNames = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
           const mName = monthNames[monthInt] || "Unknown";
           label = `${mName} ${year}`;
        } else {
           label = item.date;
        }
      }
      
      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(item);
    });
    
    return Object.entries(groups).map(([label, data]) => ({ label, data }));
  }, [reportData]);

  useEffect(() => {
    setCurrentMonthIndex(0);
  }, [monthlyData]);

  useEffect(() => {
    if (reportData?.student_breakdown) {
      const classes = Object.keys(reportData.student_breakdown);
      if (classes.length > 0) {
        setSelectedClass(classes[0]);
      } else {
        setSelectedClass('');
      }
    }
  }, [reportData]);

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#222',
        titleColor: '#fff',
        bodyColor: '#aaa',
        borderColor: '#444',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context) => `Attendance: ${context.parsed.y}%`
        }
      }
    },
    scales: {
      x: { grid: { color: '#222', drawBorder: false }, ticks: { color: '#888', font: { size: 10 } } },
      y: { grid: { color: '#222', drawBorder: false }, ticks: { color: '#888', font: { size: 10 }, stepSize: 20 }, max: 100 }
    }
  };

  const classAvgData = reportData ? {
    labels: reportData.class_comparison.map(c => c.class_name),
    datasets: [{
      label: 'Average %',
      data: reportData.class_comparison.map(c => c.attendance_percentage),
      backgroundColor: '#60a5fa',
      borderRadius: 4,
    }]
  } : null;

  const activeMonth = monthlyData[currentMonthIndex];

  const trendData = activeMonth ? {
    labels: activeMonth.data.map(t => t.date),
    datasets: [{
      label: 'Daily Attendance %',
      data: activeMonth.data.map(t => t.attendance_percentage),
      borderColor: '#fbbf24',
      backgroundColor: 'rgba(251, 191, 36, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.3,
      pointBackgroundColor: '#141414',
      pointBorderColor: '#fbbf24',
      pointBorderWidth: 2,
      pointRadius: 4,
    }]
  } : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', animation: 'fadeIn 0.5s ease-out' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fff', margin: '0 0 0.5rem 0' }}>
          Range Attendance Analytics
        </h2>
        <p style={{ color: '#888', margin: 0, fontSize: '0.875rem' }}>
          Analyze departmental performance over a given period
        </p>
      </div>

      {/* Controls */}
      <div style={{
        background: '#141414',
        border: '1px solid #222',
        borderRadius: '4px',
        padding: '1.5rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <form onSubmit={handleGenerate} style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-end' }}>
          
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', color: '#888', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '600' }}>
              Department
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                value={department}
                onChange={(e) => setDepartment(e.target.value.toUpperCase())}
                placeholder="e.g., CSE"
                style={{
                  width: '100%',
                  background: '#0f0f0f',
                  border: '1px solid #333',
                  color: '#fff',
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  borderRadius: '2px',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase'
                }}
                required
              />
              <User size={16} color="#666" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', color: '#888', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '600' }}>
              Start Date
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  width: '100%',
                  background: '#0f0f0f',
                  border: '1px solid #333',
                  color: '#fff',
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  borderRadius: '2px',
                  fontSize: '0.875rem'
                }}
                required
              />
              <CalendarIcon size={16} color="#666" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>
          
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', color: '#888', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '600' }}>
              End Date
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  width: '100%',
                  background: '#0f0f0f',
                  border: '1px solid #333',
                  color: '#fff',
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  borderRadius: '2px',
                  fontSize: '0.875rem'
                }}
                required
              />
              <CalendarIcon size={16} color="#666" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div style={{ flex: '0 1 auto' }}>
            <button 
              type="submit" 
              disabled={isGenerating}
              style={{
                background: '#fff',
                color: '#000',
                border: 'none',
                padding: '0 2rem',
                height: '42px',
                borderRadius: '2px',
                fontWeight: '800',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: isGenerating ? 0.7 : 1
              }}
            >
              {isGenerating ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Filter size={16} />}
              {isGenerating ? 'Processing...' : 'Generate Report'}
            </button>
          </div>
        </form>
      </div>

      {/* Error state */}
      {error && !reportData && (
        <div style={{ padding: '1.5rem', background: '#2a0000', border: '1px solid #ff4444', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '1rem', animation: 'fadeIn 0.3s ease-out' }}>
          <AlertTriangle size={24} color="#ff4444" />
          <div>
            <h4 style={{ color: '#fff', margin: '0 0 0.25rem 0', fontWeight: '700' }}>Report Generation Failed</h4>
            <p style={{ color: '#ffaaaa', margin: 0, fontSize: '0.875rem' }}>{error}</p>
          </div>
        </div>
      )}

      {/* Report Content */}
      {reportData && !isGenerating && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', animation: 'fadeIn 0.5s ease-out' }}>
          
          {/* Summary Card */}
          <div style={{
            background: '#141414',
            border: '1px solid #222',
            borderLeft: '4px solid #60a5fa',
            borderRadius: '4px',
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: '350px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <div>
              <p style={{ color: '#888', fontSize: '0.7rem', textTransform: 'uppercase', margin: '0 0 0.5rem 0', fontWeight: '600' }}>
                Overall Range Average
              </p>
              <h3 style={{ color: '#fff', fontSize: '2rem', fontWeight: '800', margin: 0 }}>
                {reportData.overall_average}%
              </h3>
            </div>
            <div style={{ background: '#1a1a1a', padding: '1rem', borderRadius: '4px', border: '1px solid #222' }}>
              <Layers size={24} color="#60a5fa" />
            </div>
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
            
            {/* Class-wise Chart */}
            <div style={{ background: '#141414', border: '1px solid #222', borderRadius: '4px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
              <h4 style={{ color: '#fff', margin: '0 0 1.5rem 0', fontSize: '1rem' }}>Class-wise Average</h4>
              <div style={{ height: '250px' }}>
                {classAvgData && <Bar data={classAvgData} options={commonOptions} />}
              </div>
            </div>

            {/* Date-wise Trend Chart */}
            <div style={{ background: '#141414', border: '1px solid #222', borderRadius: '4px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h4 style={{ color: '#fff', margin: 0, fontSize: '1rem' }}>Overall Attendance Trend</h4>
                {monthlyData.length > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#0a0a0a', border: '1px solid #222', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                    <button 
                      type="button"
                      onClick={() => setCurrentMonthIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentMonthIndex === 0}
                      style={{ background: 'none', border: 'none', color: currentMonthIndex === 0 ? '#444' : '#fff', cursor: currentMonthIndex === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', padding: '0.25rem' }}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span style={{ color: '#fbbf24', fontSize: '0.75rem', fontWeight: '700', minWidth: '90px', textAlign: 'center' }}>
                      {activeMonth?.label}
                    </span>
                    <button 
                      type="button"
                      onClick={() => setCurrentMonthIndex(prev => Math.min(monthlyData.length - 1, prev + 1))}
                      disabled={currentMonthIndex === monthlyData.length - 1}
                      style={{ background: 'none', border: 'none', color: currentMonthIndex === monthlyData.length - 1 ? '#444' : '#fff', cursor: currentMonthIndex === monthlyData.length - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', padding: '0.25rem' }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
                {monthlyData.length === 1 && (
                  <span style={{ color: '#fbbf24', fontSize: '0.75rem', fontWeight: '700', padding: '0.25rem 0.5rem', background: '#0a0a0a', border: '1px solid #222', borderRadius: '4px' }}>
                    {activeMonth?.label}
                  </span>
                )}
              </div>
              <div style={{ height: '250px' }}>
                {trendData && <Line data={trendData} options={commonOptions} />}
              </div>
            </div>

          </div>

          {/* Class Table */}
          <div style={{ background: '#141414', border: '1px solid #222', borderRadius: '4px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #222' }}>
              <h4 style={{ color: '#fff', margin: 0, fontSize: '1rem' }}>Class Breakdown</h4>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#0a0a0a' }}>
                    <th style={{ padding: '1rem 1.5rem', color: '#666', fontSize: '0.7rem', textTransform: 'uppercase', borderBottom: '1px solid #222' }}>Class Name</th>
                    <th style={{ padding: '1rem 1.5rem', color: '#666', fontSize: '0.7rem', textTransform: 'uppercase', borderBottom: '1px solid #222' }}>Total Students</th>
                    <th style={{ padding: '1rem 1.5rem', color: '#666', fontSize: '0.7rem', textTransform: 'uppercase', borderBottom: '1px solid #222' }}>Present (Avg)</th>
                    <th style={{ padding: '1rem 1.5rem', color: '#666', fontSize: '0.7rem', textTransform: 'uppercase', borderBottom: '1px solid #222' }}>Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.class_breakdown.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #222', transition: 'background 0.2s' }}>
                      <td style={{ padding: '1rem 1.5rem', color: '#fff', fontSize: '0.875rem', fontWeight: '600' }}>{row.class_name}</td>
                      <td style={{ padding: '1rem 1.5rem', color: '#aaa', fontSize: '0.875rem' }}>{row.total_students}</td>
                      <td style={{ padding: '1rem 1.5rem', color: '#aaa', fontSize: '0.875rem' }}>{row.present_average}</td>
                      <td style={{ padding: '1rem 1.5rem', color: '#4ade80', fontSize: '0.875rem', fontWeight: '800' }}>{row.attendance_percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Student-wise Attendance Analytics */}
          {reportData.student_breakdown && Object.keys(reportData.student_breakdown).length > 0 && (
            <div style={{ background: '#141414', border: '1px solid #222', borderRadius: '4px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid #222', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h4 style={{ color: '#fff', margin: 0, fontSize: '1rem' }}>Student-wise Attendance Analytics</h4>
                
                {/* Class Switcher */}
                <div className="hide-scroll" style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {Object.keys(reportData.student_breakdown).map((className) => (
                    <button
                      key={className}
                      type="button"
                      onClick={() => setSelectedClass(className)}
                      style={{
                        padding: '0.5rem 1.25rem',
                        background: selectedClass === className ? '#fff' : '#0a0a0a',
                        color: selectedClass === className ? '#000' : '#888',
                        border: '1px solid ' + (selectedClass === className ? '#fff' : '#333'),
                        borderRadius: '24px',
                        fontSize: '0.75rem',
                        fontWeight: selectedClass === className ? '800' : '600',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s ease',
                        letterSpacing: '0.05em'
                      }}
                    >
                      {className}
                    </button>
                  ))}
                </div>
              </div>

              {/* Student Table */}
              <div style={{ overflowX: 'auto' }}>
                {selectedClass && reportData.student_breakdown[selectedClass]?.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#0a0a0a' }}>
                        <th style={{ padding: '1rem 1.5rem', color: '#666', fontSize: '0.7rem', textTransform: 'uppercase', borderBottom: '1px solid #222', whiteSpace: 'nowrap' }}>Reg No</th>
                        <th style={{ padding: '1rem 1.5rem', color: '#666', fontSize: '0.7rem', textTransform: 'uppercase', borderBottom: '1px solid #222', whiteSpace: 'nowrap' }}>Student Name</th>
                        <th style={{ padding: '1rem 1.5rem', color: '#666', fontSize: '0.7rem', textTransform: 'uppercase', borderBottom: '1px solid #222', whiteSpace: 'nowrap' }}>Total Days</th>
                        <th style={{ padding: '1rem 1.5rem', color: '#666', fontSize: '0.7rem', textTransform: 'uppercase', borderBottom: '1px solid #222', whiteSpace: 'nowrap' }}>Present Days</th>
                        <th style={{ padding: '1rem 1.5rem', color: '#666', fontSize: '0.7rem', textTransform: 'uppercase', borderBottom: '1px solid #222', whiteSpace: 'nowrap' }}>Absent Days</th>
                        <th style={{ padding: '1rem 1.5rem', color: '#666', fontSize: '0.7rem', textTransform: 'uppercase', borderBottom: '1px solid #222', whiteSpace: 'nowrap' }}>Attendance %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.student_breakdown[selectedClass].map((student, idx) => (
                        <tr key={idx} className="student-row" style={{ borderBottom: '1px solid #222', transition: 'background 0.2s' }}>
                          <td style={{ padding: '1rem 1.5rem', color: '#aaa', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>{student.reg_no}</td>
                          <td style={{ padding: '1rem 1.5rem', color: '#fff', fontSize: '0.875rem', fontWeight: '600', whiteSpace: 'nowrap' }}>{student.student_name}</td>
                          <td style={{ padding: '1rem 1.5rem', color: '#aaa', fontSize: '0.875rem' }}>{student.total_days}</td>
                          <td style={{ padding: '1rem 1.5rem', color: '#aaa', fontSize: '0.875rem' }}>{student.present_days}</td>
                          <td style={{ padding: '1rem 1.5rem', color: '#aaa', fontSize: '0.875rem' }}>{student.absent_days}</td>
                          <td style={{ 
                            padding: '1rem 1.5rem', 
                            color: student.attendance_percentage >= 75 ? '#4ade80' : 
                                   student.attendance_percentage >= 60 ? '#fbbf24' : '#ef4444', 
                            fontSize: '0.875rem', 
                            fontWeight: '800' 
                          }}>
                            {student.attendance_percentage}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <AlertTriangle size={32} color="#444" />
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#888' }}>
                      No student data available for {selectedClass || 'this class'}.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          opacity: 0.5;
          cursor: pointer;
        }
        .hide-scroll::-webkit-scrollbar {
          display: none;
        }
        .student-row:hover {
          background-color: #1a1a1a !important;
        }
      ` }} />
    </div>
  );
}
