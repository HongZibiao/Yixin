import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AttendanceTable from '../components/AttendanceTable'
import '../App.css'

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

const AttendancePage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [course, setCourse] = useState<Course | null>(null)
  const navigate = useNavigate()

  // 从localStorage加载课程数据
  useEffect(() => {
    if (id) {
      const savedCourses = localStorage.getItem('courses')
      if (savedCourses) {
        try {
          const courses = JSON.parse(savedCourses)
          console.log('Loaded courses:', courses)
          const foundCourse = courses.find((c: Course) => c.id === id)
          if (foundCourse) {
            console.log('Found course:', foundCourse)
            console.log('Course students:', foundCourse.students)
            // 确保students数组是有效的
            if (!Array.isArray(foundCourse.students)) {
              foundCourse.students = []
              console.log('Fixed students array')
            }
            setCourse(foundCourse)
          } else {
            // 课程不存在，返回课程列表页面
            console.log('Course not found, redirecting to /')
            navigate('/')
          }
        } catch (error) {
          console.error('Error parsing courses:', error)
          // 数据解析错误，但不清空localStorage，避免数据丢失
          // 直接返回课程列表页面
          navigate('/')
        }
      }
    }
  }, [id, navigate])

  // 保存课程数据到localStorage
  const saveCourseToStorage = (updatedCourse: Course) => {
    const savedCourses = localStorage.getItem('courses')
    if (savedCourses) {
      const courses = JSON.parse(savedCourses)
      const updatedCourses = courses.map((c: Course) => c.id === updatedCourse.id ? updatedCourse : c)
      localStorage.setItem('courses', JSON.stringify(updatedCourses))
    } else {
      // 如果localStorage中没有数据，直接保存当前课程
      localStorage.setItem('courses', JSON.stringify([updatedCourse]))
    }
  }

  // 单个添加学生
  const addStudent = (studentName: string) => {
    if (course) {
      // 确保studentName是字符串类型
      const studentNameStr = typeof studentName === 'string' ? studentName.trim() : String(studentName).trim()
      if (studentNameStr) {
        const newStudent: Student = {
          id: Date.now().toString(),
          name: studentNameStr,
          totalHours: course.totalHours,
          completedHours: 0,
          remainingHours: course.totalHours
        }
        // 确保students是数组
        const studentsArray = Array.isArray(course.students) ? course.students : []
        const updatedCourse = {
          ...course,
          students: [...studentsArray, newStudent]
        }
        setCourse(updatedCourse)
        saveCourseToStorage(updatedCourse)
      }
    }
  }

  // 批量添加学生，支持为每个学生设置不同的课时
  const addStudentsBatch = (students: { name: string; hours: number }[]) => {
    if (course && students.length > 0) {
      // 确保students是数组
      const studentsArray = Array.isArray(course.students) ? course.students : []
      const newStudents: Student[] = students
        .filter(student => student.name.trim())
        .map(student => ({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // 确保ID唯一
          name: student.name.trim(),
          totalHours: student.hours > 0 ? student.hours : course.totalHours,
          completedHours: 0,
          remainingHours: student.hours > 0 ? student.hours : course.totalHours
        }))
      
      console.log('批量添加学生:', newStudents)
      const updatedCourse = {
        ...course,
        students: [...studentsArray, ...newStudents]
      }
      setCourse(updatedCourse)
      saveCourseToStorage(updatedCourse)
    }
  }

  // 批量设置出勤状态
  const batchSetAttendance = (date: string, status: 'present' | 'absent' | 'late') => {
    if (course) {
      console.log('批量设置出勤状态开始:', status, '日期:', date)
      
      // 1. 批量更新考勤记录
      let updatedRecords = [...course.attendanceRecords]
      course.students.forEach(student => {
        const existingRecordIndex = updatedRecords.findIndex(
          record => record.date === date && record.studentId === student.id
        )
        if (existingRecordIndex >= 0) {
          updatedRecords[existingRecordIndex] = { date, studentId: student.id, status }
        } else {
          updatedRecords.push({ date, studentId: student.id, status })
        }
      })
      
      // 2. 批量更新学生的课时信息
      const updatedStudents = course.students.map(student => {
        // 计算该学生的已上课时（只计算出勤状态）
        const studentAttendanceRecords = updatedRecords.filter(
          record => record.studentId === student.id && record.status === 'present'
        )
        const uniqueDates = new Set(studentAttendanceRecords.map(record => record.date))
        const completedHours = uniqueDates.size
        const remainingHours = Math.max(0, student.totalHours - completedHours)

        return {
          ...student,
          completedHours,
          remainingHours
        }
      })
      
      // 3. 更新课程状态
      const updatedCourse = {
        ...course,
        attendanceRecords: updatedRecords,
        students: updatedStudents
      }
      
      console.log('批量设置出勤状态完成，更新学生数量:', updatedStudents.length)
      setCourse(updatedCourse)
      saveCourseToStorage(updatedCourse)
    }
  }

  const recordAttendance = (date: string, studentId: string, status: 'present' | 'absent' | 'late') => {
    if (course) {
      const existingRecordIndex = course.attendanceRecords.findIndex(
        record => record.date === date && record.studentId === studentId
      )

      let updatedRecords
      if (existingRecordIndex >= 0) {
        updatedRecords = [...course.attendanceRecords]
        updatedRecords[existingRecordIndex] = { date, studentId, status }
      } else {
        updatedRecords = [...course.attendanceRecords, { date, studentId, status }]
      }

      // 更新学生的课时信息
      const updatedStudents = course.students.map(student => {
        if (student.id === studentId) {
          // 计算该学生的已上课时（只计算出勤状态）
          const studentAttendanceRecords = updatedRecords.filter(
            record => record.studentId === student.id && record.status === 'present'
          )
          const uniqueDates = new Set(studentAttendanceRecords.map(record => record.date))
          const completedHours = uniqueDates.size
          const remainingHours = Math.max(0, student.totalHours - completedHours)

          return {
            ...student,
            completedHours,
            remainingHours
          }
        }
        return student
      })

      const updatedCourse = {
        ...course,
        attendanceRecords: updatedRecords,
        students: updatedStudents
      }

      setCourse(updatedCourse)
      saveCourseToStorage(updatedCourse)
    }
  }

  const updateCourse = (updatedCourse: Course) => {
    setCourse(updatedCourse)
    saveCourseToStorage(updatedCourse)
  }

  const updateStudentTotalHours = (studentId: string, totalHours: number) => {
    if (course) {
      const updatedStudents = course.students.map(student => {
        if (student.id === studentId) {
          const completedHours = student.completedHours
          const remainingHours = Math.max(0, totalHours - completedHours)
          return {
            ...student,
            totalHours,
            remainingHours
          }
        }
        return student
      })

      const updatedCourse = {
        ...course,
        students: updatedStudents
      }

      setCourse(updatedCourse)
      saveCourseToStorage(updatedCourse)
    }
  }

  if (!course) {
    return <div className="loading">加载中...</div>
  }

  // 删除选中的学生
  const deleteStudents = (studentIds: string[]) => {
    if (course && studentIds.length > 0) {
      // 1. 从学生列表中移除选中的学生
      const updatedStudents = course.students.filter(student => !studentIds.includes(student.id))
      
      // 2. 从考勤记录中移除选中学生的记录
      const updatedRecords = course.attendanceRecords.filter(record => !studentIds.includes(record.studentId))
      
      // 3. 更新课程
      const updatedCourse = {
        ...course,
        students: updatedStudents,
        attendanceRecords: updatedRecords
      }
      
      setCourse(updatedCourse)
      saveCourseToStorage(updatedCourse)
    }
  }

  // 删除选中的日期
  const deleteDates = (dates: string[]) => {
    if (course && dates.length > 0) {
      // 1. 从考勤记录中移除选中日期的记录
      const updatedRecords = course.attendanceRecords.filter(record => !dates.includes(record.date))
      
      // 2. 更新学生的课时信息
      const updatedStudents = course.students.map(student => {
        // 计算该学生的已上课时（只计算出勤状态）
        const studentAttendanceRecords = updatedRecords.filter(
          record => record.studentId === student.id && record.status === 'present'
        )
        const uniqueDates = new Set(studentAttendanceRecords.map(record => record.date))
        const completedHours = uniqueDates.size
        const remainingHours = Math.max(0, student.totalHours - completedHours)

        return {
          ...student,
          completedHours,
          remainingHours
        }
      })
      
      // 3. 更新课程
      const updatedCourse = {
        ...course,
        attendanceRecords: updatedRecords,
        students: updatedStudents
      }
      
      setCourse(updatedCourse)
      saveCourseToStorage(updatedCourse)
    }
  }

  return (
    <div className="attendance-page">
      <AttendanceTable
        course={course}
        onAddStudent={addStudent}
        onAddStudentsBatch={addStudentsBatch}
        onRecordAttendance={recordAttendance}
        onBatchSetAttendance={batchSetAttendance}
        onUpdateCourse={updateCourse}
        onUpdateStudentTotalHours={updateStudentTotalHours}
        onDeleteStudents={deleteStudents}
        onDeleteDates={deleteDates}
      />
    </div>
  )
}

export default AttendancePage