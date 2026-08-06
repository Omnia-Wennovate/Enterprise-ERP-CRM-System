'use client'

import { useState } from 'react'
import { Clock, Calendar, CheckCircle } from 'lucide-react'

interface AttendanceRecord {
  id: string
  name: string
  date: string
  clockIn: string
  clockOut: string
  totalHours: number
  status: 'present' | 'absent' | 'late' | 'leave'
}

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const attendanceRecords: AttendanceRecord[] = [
    {
      id: '1',
      name: 'John Smith',
      date: selectedDate,
      clockIn: '08:15',
      clockOut: '17:30',
      totalHours: 9.25,
      status: 'present',
    },
    {
      id: '2',

      name: 'Sarah Johnson',
      date: selectedDate,
      clockIn: '08:00',
      clockOut: '17:00',
      totalHours: 9,
      status: 'present',
    },
    {
      id: '3',
      name: 'Mike Davis',
      date: selectedDate,
      clockIn: '08:45',
      clockOut: '17:45',
      totalHours: 9,
      status: 'late',
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'late':
        return <Clock className="w-5 h-5 text-yellow-600" />
      case 'absent':
        return <div className="w-5 h-5 bg-red-600 rounded-full"></div>
      default:
        return <Calendar className="w-5 h-5 text-blue-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-700'
      case 'late':
        return 'bg-yellow-100 text-yellow-700'
      case 'absent':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-blue-100 text-blue-700'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Attendance</h1>
          <p className="text-muted-foreground mt-1">Track employee attendance and working hours</p>
        </div>

        {/* Date Selector */}
        <div className="bg-card rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-semibold text-foreground mb-2">Select Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-teal-600"
          />
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Present', count: 2, color: 'bg-green-50' },
            { label: 'Late', count: 1, color: 'bg-yellow-50' },
            { label: 'Absent', count: 0, color: 'bg-red-50' },
            { label: 'On Leave', count: 0, color: 'bg-blue-50' },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.color} rounded-lg p-4`}>
              <p className="text-muted-foreground text-sm font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stat.count}</p>
            </div>
          ))}
        </div>

        {/* Attendance Table */}
        <div className="bg-card rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-foreground">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-foreground">Clock In</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-foreground">Clock Out</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-foreground">Total Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {attendanceRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 font-semibold text-foreground">{record.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{record.clockIn}</td>
                    <td className="px-6 py-4 text-muted-foreground">{record.clockOut}</td>
                    <td className="px-6 py-4 text-muted-foreground">{record.totalHours} hrs</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(record.status)}
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
