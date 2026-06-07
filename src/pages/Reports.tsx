import { useState, useEffect } from 'react';
import { FileSpreadsheet, Printer } from 'lucide-react';
import { fetchAttendance, fetchStudents, fetchClasses, fetchDepartments } from '../lib/db';
import type { Attendance, Student, Class, Department } from '../lib/db';
import { toast } from 'sonner';

export default function Reports() {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Filter States
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedDept, setSelectedDept] = useState('all');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14); // 2 weeks back
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  // Filtered Results preview
  const [reportRows, setReportRows] = useState<any[]>([]);

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    const s = await fetchStudents();
    const a = await fetchAttendance();
    const c = await fetchClasses();
    const d = await fetchDepartments();
    
    setStudents(s);
    setAttendance(a);
    setClasses(c);
    setDepartments(d);
  };

  // Compile report matching active parameters
  useEffect(() => {
    let rows = attendance.map(att => {
      const stud = students.find(s => s.id === att.student_id);
      return {
        ...att,
        studentName: stud ? stud.name : 'Unknown Student',
        studentReg: stud ? stud.register_number : '',
        studentEmail: stud ? stud.email : '',
        classId: stud ? stud.class_id : '',
        deptId: stud ? stud.department_id : ''
      };
    });

    // Apply Filters
    if (selectedClass !== 'all') {
      rows = rows.filter(r => r.classId === selectedClass);
    }
    if (selectedDept !== 'all') {
      rows = rows.filter(r => r.deptId === selectedDept);
    }
    if (selectedStatus !== 'all') {
      rows = rows.filter(r => r.status === selectedStatus);
    }
    
    // Date filter
    rows = rows.filter(r => r.date >= startDate && r.date <= endDate);

    // Sort by Date & Time descending
    rows.sort((a, b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime());

    setReportRows(rows);
  }, [selectedClass, selectedDept, startDate, endDate, selectedStatus, attendance, students]);

  // Export CSV
  const handleExportCSV = () => {
    if (reportRows.length === 0) {
      toast.warning('No matching records found to export');
      return;
    }

    // Header row
    const headers = ['Date', 'Arrival Time', 'Register ID', 'Student Name', 'Student Email', 'Department', 'Class', 'Match Score', 'Method', 'Status'];
    
    const csvRows = [
      headers.join(','), // CSV header
      ...reportRows.map(row => {
        const dName = departments.find(d => d.id === row.deptId)?.name || 'Unassigned';
        const cName = classes.find(c => c.id === row.classId)?.name || 'Unassigned';
        
        return [
          row.date,
          row.time,
          `"${row.studentReg}"`,
          `"${row.studentName}"`,
          `"${row.studentEmail}"`,
          `"${dName}"`,
          `"${cName}"`,
          row.confidence_score > 0 ? `${Math.round(row.confidence_score * 100)}%` : 'Manual',
          row.verification_method,
          row.status
        ].join(',');
      })
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FaceTrack_Report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported CSV containing ${reportRows.length} attendance records`);
  };

  // Print Report PDF
  const handlePrintPDF = () => {
    if (reportRows.length === 0) {
      toast.warning('No matching records found to print');
      return;
    }
    window.print();
  };

  const getClassName = (id: string) => classes.find(c => c.id === id)?.name || 'Class';
  const getDeptName = (id: string) => departments.find(d => d.id === id)?.name || 'Department';

  return (
    <div className="space-y-6 print:p-0">
      
      {/* Header - Hidden on browser print layout */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 print:hidden">
        <div>
          <h1 className="text-2xl font-bold font-display">Reports Center</h1>
          <p className="text-xs text-gray-400 mt-1">Compile attendance registries, extract analytics summaries, and download spreadsheets.</p>
        </div>

        <div className="flex space-x-3 w-full md:w-auto">
          <button 
            onClick={handleExportCSV}
            className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-4 py-2.5 border border-white/10 bg-slate-900/40 hover:bg-white/5 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          
          <button 
            onClick={handlePrintPDF}
            className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Filter Options box - Hidden on browser print layout */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 grid grid-cols-1 md:grid-cols-5 gap-4 print:hidden">
        
        {/* Class Filter */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5 font-mono">Class Section</label>
          <select 
            value={selectedClass} 
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-xl text-xs py-2 px-3 focus:outline-none"
          >
            <option value="all">All Classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Department Filter */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5 font-mono">Department</label>
          <select 
            value={selectedDept} 
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-xl text-xs py-2 px-3 focus:outline-none"
          >
            <option value="all">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5 font-mono">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-xl text-xs py-1.5 px-3 focus:outline-none"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5 font-mono">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-xl text-xs py-1.5 px-3 focus:outline-none"
          />
        </div>

        {/* Status Category */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5 font-mono">Status</label>
          <select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-xl text-xs py-2 px-3 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
          </select>
        </div>

      </div>

      {/* Printable Report Document Sheet */}
      <div className="glass-panel rounded-2xl border border-white/5 p-6 md:p-8 bg-slate-950/20 shadow-xl print:bg-transparent print:border-none print:shadow-none">
        
        {/* Printable Header */}
        <div className="border-b-2 border-white/10 pb-6 mb-6 flex justify-between items-end">
          <div className="space-y-1">
            <h2 className="text-xl font-bold font-display tracking-tight text-white print:text-black">FaceTrack AI Reports</h2>
            <p className="text-xs text-gray-400 print:text-gray-600">Attendance Registry Sheet</p>
          </div>
          <div className="text-right text-xs text-gray-400 font-mono print:text-gray-600 space-y-0.5">
            <div>Range: {startDate} to {endDate}</div>
            <div>Compiled: {new Date().toISOString().split('T')[0]}</div>
          </div>
        </div>

        {/* Print Summary KPIs */}
        <div className="grid grid-cols-3 gap-4 mb-8 text-xs font-semibold">
          <div className="p-3 bg-white/5 rounded-xl border border-white/5 print:border-gray-300 print:text-black text-center space-y-0.5">
            <span className="text-[10px] text-gray-500 block">Records Selected</span>
            <strong className="text-sm font-display text-primary">{reportRows.length} Rows</strong>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/5 print:border-gray-300 print:text-black text-center space-y-0.5">
            <span className="text-[10px] text-gray-500 block">Overall Presence</span>
            <strong className="text-sm font-display text-emerald-400">
              {reportRows.length > 0 
                ? `${Math.round((reportRows.filter(r => r.status === 'present' || r.status === 'late').length / reportRows.length) * 100)}%` 
                : '100%'}
            </strong>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/5 print:border-gray-300 print:text-black text-center space-y-0.5">
            <span className="text-[10px] text-gray-500 block">Average Confidence</span>
            <strong className="text-sm font-display text-accent">
              {reportRows.length > 0 
                ? `${Math.round((reportRows.reduce((acc, val) => acc + (val.confidence_score || 0.9), 0) / reportRows.length) * 100)}%`
                : '94%'}
            </strong>
          </div>
        </div>

        {/* Tabular logs list */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-white/10 text-[10px] text-gray-500 uppercase font-bold print:text-gray-700 print:border-black">
                <th className="pb-3">Date</th>
                <th className="pb-3">Arrival</th>
                <th className="pb-3">Register Number</th>
                <th className="pb-3">Student Name</th>
                <th className="pb-3">Department & Class</th>
                <th className="pb-3">Verification</th>
                <th className="pb-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[11px] print:divide-gray-200">
              {reportRows.length > 0 ? (
                reportRows.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-white/5 print:text-black">
                    <td className="py-3 font-medium">{row.date}</td>
                    <td className="py-3 font-mono text-gray-400 print:text-black">{row.time}</td>
                    <td className="py-3 font-mono">{row.studentReg}</td>
                    <td className="py-3 font-semibold">{row.studentName}</td>
                    <td className="py-3">
                      <div className="text-[10px] text-gray-400 print:text-black">
                        {getDeptName(row.deptId)} | {getClassName(row.classId)}
                      </div>
                    </td>
                    <td className="py-3 capitalize">
                      {row.verification_method} ({row.confidence_score > 0 ? `${Math.round(row.confidence_score * 100)}%` : 'Manual'})
                    </td>
                    <td className="py-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase print:bg-transparent print:border print:px-1.5 ${
                        row.status === 'present' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 print:border-emerald-500 print:text-emerald-600' :
                        row.status === 'late' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 print:border-amber-500 print:text-amber-600' :
                        'bg-red-500/10 text-red-400 border border-red-500/20 print:border-red-500 print:text-red-600'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500 font-semibold print:text-black">
                    No matching attendance logs found in date scope.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
