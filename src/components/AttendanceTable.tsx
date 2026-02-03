import React, { useState, useEffect } from 'react'

interface Student {
  id: string
  name: string
  totalHours: number
  completedHours: number
  remainingHours: number
}

interface AttendanceRecord {
  date: string
  studentId: string
  status: 'present' | 'absent' | 'late'
}

interface Course {
  id: string
  name: string
  description: string
  totalHours: number
  completedHours: number
  remainingHours: number
  timeSlot: string
  students: Student[]
  attendanceRecords: AttendanceRecord[]
}

interface StudentWithHours {
  name: string
  hours: number
}

interface AttendanceTableProps {
  course: Course
  onAddStudent: (studentName: string) => void
  onAddStudentsBatch: (students: StudentWithHours[]) => void
  onRecordAttendance: (date: string, studentId: string, status: 'present' | 'absent' | 'late') => void
  onBatchSetAttendance: (date: string, status: 'present' | 'absent' | 'late') => void
  onUpdateCourse: (course: Course) => void
  onUpdateStudentTotalHours: (studentId: string, totalHours: number) => void
  onDeleteStudents: (studentIds: string[]) => void
  onDeleteDates: (dates: string[]) => void
}

const AttendanceTable: React.FC<AttendanceTableProps> = ({
  course,
  onAddStudent,
  onAddStudentsBatch,
  onRecordAttendance,
  onBatchSetAttendance,
  onUpdateStudentTotalHours,
  onDeleteStudents,
  onDeleteDates
}) => {
  const [studentName, setStudentName] = useState('')
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0])
  const [uniqueDates, setUniqueDates] = useState<string[]>([])
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null)
  const [editingTotalHours, setEditingTotalHours] = useState<number>(0)
  const [batchStudents, setBatchStudents] = useState('')
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [selectedDates, setSelectedDates] = useState<string[]>([])

  // 调试代码：检查course数据
  console.log('AttendanceTable received course:', course)
  console.log('Course students:', course.students)
  console.log('Students length:', course.students.length)
  console.log('Students is array:', Array.isArray(course.students))

  useEffect(() => {
    // 提取所有唯一的考勤日期
    const dates = [...new Set(course.attendanceRecords.map(record => record.date))]
    setUniqueDates(dates.sort())
  }, [course.attendanceRecords])

  const handleAddStudent = () => {
    if (studentName.trim()) {
      onAddStudent(studentName.trim())
      setStudentName('')
    }
  }

  const handleAttendanceChange = (studentId: string, date: string, status: 'present' | 'absent' | 'late') => {
    onRecordAttendance(date, studentId, status)
  }

  const getAttendanceStatus = (studentId: string, date: string) => {
    const record = course.attendanceRecords.find(
      r => r.studentId === studentId && r.date === date
    )
    return record?.status || null
  }

  const handleAddAttendanceDate = () => {
    if (attendanceDate && !uniqueDates.includes(attendanceDate)) {
      setUniqueDates([...uniqueDates, attendanceDate].sort())
    }
  }

  const startEditTotalHours = (student: Student) => {
    setEditingStudentId(student.id)
    setEditingTotalHours(student.totalHours)
  }

  const saveEditTotalHours = (student: Student) => {
    if (editingStudentId === student.id) {
      onUpdateStudentTotalHours(student.id, editingTotalHours)
      setEditingStudentId(null)
    }
  }

  const handleBatchAddStudents = () => {
    if (batchStudents.trim()) {
      // 按逗号分割，每个学生用逗号分隔
      const lines = batchStudents.split(',').map(line => line.trim()).filter(line => line)
      const studentsWithHours = lines.map(line => {
        // 解析"姓名:课时"格式
        const match = line.match(/^(.+?):(\d+)$/)
        if (match) {
          return {
            name: match[1].trim(),
            hours: parseInt(match[2]) || 0
          }
        } else {
          // 如果没有课时信息，使用默认值
          return {
            name: line.trim(),
            hours: 0
          }
        }
      }).filter(student => student.name)
      
      console.log('批量添加学生:', studentsWithHours)
      // 使用批量添加方法，避免状态更新竞态条件
      onAddStudentsBatch(studentsWithHours)
      setBatchStudents('')
    }
  }

  const handleBatchSetAttendance = (status: 'present' | 'absent' | 'late') => {
    if (attendanceDate) {
      console.log('批量设置出勤状态:', status, '日期:', attendanceDate)
      console.log('学生数量:', course.students.length)
      // 使用批量设置方法，避免状态更新竞态条件
      onBatchSetAttendance(attendanceDate, status)
    }
  }

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId)
      } else {
        return [...prev, studentId]
      }
    })
  }

  const handleDateSelect = (date: string) => {
    setSelectedDates(prev => {
      if (prev.includes(date)) {
        return prev.filter(d => d !== date)
      } else {
        return [...prev, date]
      }
    })
  }

  const handleDeleteSelectedStudents = () => {
    if (selectedStudents.length > 0 && window.confirm('确定要删除选中的学生吗？')) {
      onDeleteStudents(selectedStudents)
      setSelectedStudents([])
    }
  }

  const handleDeleteSelectedDates = () => {
    if (selectedDates.length > 0 && window.confirm('确定要删除选中的日期吗？')) {
      onDeleteDates(selectedDates)
      setSelectedDates([])
    }
  }

  return (
    <div className="attendance-table">
      <h2>考勤管理</h2>
      
      <div className="course-info">
        <h3>{course.name}</h3>
        {course.description && <p>课程描述: {course.description}</p>}
        <p>时间段: {course.timeSlot}</p>
      </div>

      <div className="student-management">
        <input
          type="text"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          placeholder="请输入学生姓名"
          onKeyPress={(e) => e.key === 'Enter' && handleAddStudent()}
        />
        <button className="btn btn-primary" onClick={handleAddStudent}>
          添加学生
        </button>
      </div>

      <div className="student-management" style={{ marginBottom: '1.5rem' }}>
        <textarea
          value={batchStudents}
          onChange={(e) => setBatchStudents(e.target.value)}
          placeholder="批量添加学生，格式：姓名:课时，用逗号分隔，例如：张三:15,李四:12,王五:15"
          style={{ flex: 1, minHeight: '100px', padding: '0.75rem', border: '1px solid #ced4da', borderRadius: '8px', fontSize: '1rem' }}
        />
        <button className="btn btn-secondary" onClick={handleBatchAddStudents} style={{ minWidth: '100px' }}>
          批量添加
        </button>
      </div>

      <div className="student-management">
        <input
          type="date"
          value={attendanceDate}
          onChange={(e) => setAttendanceDate(e.target.value)}
        />
        <button className="btn btn-secondary" onClick={handleAddAttendanceDate}>
          添加考勤日期
        </button>
      </div>

      {uniqueDates.length > 0 && (
        <div className="batch-attendance-container" style={{ marginBottom: '1.5rem', padding: '1.5rem', backgroundColor: '#f8f9fa', borderRadius: '12px', border: '1px solid #e9ecef' }}>
          <h4 style={{ marginTop: 0, marginBottom: '1rem', color: '#333' }}>批量操作</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => handleBatchSetAttendance('present')}
              style={{ 
                padding: '0.75rem 1.5rem', 
                borderRadius: '8px', 
                fontSize: '1rem',
                fontWeight: '500',
                transition: 'all 0.3s ease'
              }}
            >
              <span style={{ marginRight: '0.5rem' }}>👥</span> 全部出勤
            </button>
            <button 
              className="btn btn-danger" 
              onClick={() => handleBatchSetAttendance('absent')}
              style={{ 
                padding: '0.75rem 1.5rem', 
                borderRadius: '8px', 
                fontSize: '1rem',
                fontWeight: '500',
                transition: 'all 0.3s ease'
              }}
            >
              <span style={{ marginRight: '0.5rem' }}>🚫</span> 全部缺勤
            </button>
            <button 
              className="btn btn-warning" 
              onClick={() => handleBatchSetAttendance('late')}
              style={{ 
                padding: '0.75rem 1.5rem', 
                borderRadius: '8px', 
                fontSize: '1rem',
                fontWeight: '500',
                transition: 'all 0.3s ease'
              }}
            >
              <span style={{ marginRight: '0.5rem' }}>⏰</span> 全部迟到
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <button 
              className="btn btn-danger" 
              onClick={handleDeleteSelectedStudents}
              disabled={selectedStudents.length === 0}
              style={{ 
                padding: '0.75rem 1.5rem', 
                borderRadius: '8px', 
                fontSize: '1rem',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                opacity: selectedStudents.length === 0 ? 0.6 : 1,
                cursor: selectedStudents.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              <span style={{ marginRight: '0.5rem' }}>🗑️</span> 删除选中学生 ({selectedStudents.length})
            </button>
            <button 
              className="btn btn-danger" 
              onClick={handleDeleteSelectedDates}
              disabled={selectedDates.length === 0}
              style={{ 
                padding: '0.75rem 1.5rem', 
                borderRadius: '8px', 
                fontSize: '1rem',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                opacity: selectedDates.length === 0 ? 0.6 : 1,
                cursor: selectedDates.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              <span style={{ marginRight: '0.5rem' }}>🗑️</span> 删除选中日期 ({selectedDates.length})
            </button>
          </div>
        </div>
      )}

      {!Array.isArray(course.students) || course.students.length === 0 ? (
        <div className="empty-state">
          <p>请先添加学生到课程中</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '20px' }}>
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStudents(course.students.map(s => s.id))
                      } else {
                        setSelectedStudents([])
                      }
                    }}
                    checked={course.students.length > 0 && selectedStudents.length === course.students.length}
                  />
                </th>
                <th>学生姓名</th>
                {uniqueDates.map(date => (
                  <th key={date} style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        onChange={() => handleDateSelect(date)}
                        checked={selectedDates.includes(date)}
                      />
                      <span>{date}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {course.students.map(student => {
                // 确保student对象有正确的结构
                if (!student || typeof student !== 'object' || !student.id || !student.name) {
                  return null
                }
                return (
                  <tr key={student.id}>
                    <td>
                      <input
                        type="checkbox"
                        onChange={() => handleStudentSelect(student.id)}
                        checked={selectedStudents.includes(student.id)}
                      />
                    </td>
                    <td>
                      <div>
                        <strong>{typeof student.name === 'string' ? student.name : String(student.name)}</strong>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                        {editingStudentId === student.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                              type="number"
                              min="0"
                              value={editingTotalHours}
                              onChange={(e) => setEditingTotalHours(parseInt(e.target.value) || 0)}
                              style={{ width: '60px', fontSize: '0.8rem' }}
                            />
                            <button
                              onClick={() => saveEditTotalHours(student)}
                              style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                            >
                              保存
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>总课时: {student.totalHours}</span>
                            <button
                              onClick={() => startEditTotalHours(student)}
                              style={{ fontSize: '0.7rem', padding: '0.1rem 0.3rem', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: '3px' }}
                            >
                              编辑
                            </button>
                            <span> | 已上: {student.completedHours} | 剩余: {student.remainingHours}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    {uniqueDates.map(date => {
                      const status = getAttendanceStatus(student.id, date)
                      return (
                        <td key={date}>
                          <select
                            className="status-select"
                            value={status || ''}
                            onChange={(e) => {
                              const newStatus = e.target.value as 'present' | 'absent' | 'late'
                              handleAttendanceChange(student.id, date, newStatus)
                            }}
                          >
                            <option value="">请选择</option>
                            <option value="present">出勤</option>
                            <option value="absent">缺勤</option>
                            <option value="late">迟到</option>
                          </select>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AttendanceTable