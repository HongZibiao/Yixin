import { useState, useEffect } from 'react'
import CourseManager from './components/CourseManager'
import AttendanceTable from './components/AttendanceTable'
import './App.css'

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

function App() {
  const [courses, setCourses] = useState<Course[]>([])
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null)

  // 从localStorage加载课程数据
  useEffect(() => {
    const savedCourses = localStorage.getItem('courses')
    if (savedCourses) {
      setCourses(JSON.parse(savedCourses))
    }
  }, [])

  // 移除自动保存，避免与其他组件的手动保存冲突
  // 所有数据保存操作都在各自的函数中手动执行

  const addCourse = (courseData: Omit<Course, 'id' | 'students' | 'attendanceRecords' | 'completedHours' | 'remainingHours'>) => {
    const newCourse: Course = {
      ...courseData,
      id: Date.now().toString(),
      students: [],
      attendanceRecords: [],
      completedHours: 0,
      remainingHours: courseData.totalHours
    }
    const updatedCourses = [...courses, newCourse]
    setCourses(updatedCourses)
    // 立即保存到localStorage，确保数据不会丢失
    localStorage.setItem('courses', JSON.stringify(updatedCourses))
  }

  const updateCourse = (updatedCourse: Course) => {
    const updatedCourses = courses.map(course => course.id === updatedCourse.id ? updatedCourse : course)
    setCourses(updatedCourses)
    if (currentCourse?.id === updatedCourse.id) {
      setCurrentCourse(updatedCourse)
    }
    // 立即保存到localStorage，确保数据不会丢失
    localStorage.setItem('courses', JSON.stringify(updatedCourses))
  }

  const deleteCourse = (courseId: string) => {
    const updatedCourses = courses.filter(course => course.id !== courseId)
    setCourses(updatedCourses)
    if (currentCourse?.id === courseId) {
      setCurrentCourse(null)
    }
    // 立即保存到localStorage，确保数据不会丢失
    localStorage.setItem('courses', JSON.stringify(updatedCourses))
  }

  const addStudentToCourse = (courseId: string, studentName: string) => {
    const updatedCourses = courses.map(course => {
      if (course.id === courseId) {
        const newStudent: Student = {
          id: Date.now().toString(),
          name: studentName,
          totalHours: course.totalHours,
          completedHours: 0,
          remainingHours: course.totalHours
        }
        return {
          ...course,
          students: [...course.students, newStudent]
        }
      }
      return course
    })
    setCourses(updatedCourses)
    if (currentCourse?.id === courseId) {
      const updatedCourse = updatedCourses.find(c => c.id === courseId)
      if (updatedCourse) {
        setCurrentCourse(updatedCourse)
      }
    }
    // 立即保存到localStorage，确保数据不会丢失
    localStorage.setItem('courses', JSON.stringify(updatedCourses))
  }

  const recordAttendance = (courseId: string, date: string, studentId: string, status: 'present' | 'absent' | 'late') => {
    const updatedCourses = courses.map(course => {
      if (course.id === courseId) {
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

        return {
          ...course,
          attendanceRecords: updatedRecords,
          students: updatedStudents
        }
      }
      return course
    })

    setCourses(updatedCourses)
    if (currentCourse?.id === courseId) {
      const updatedCourse = updatedCourses.find(c => c.id === courseId)
      if (updatedCourse) {
        setCurrentCourse(updatedCourse)
      }
    }
    // 立即保存到localStorage，确保数据不会丢失
    localStorage.setItem('courses', JSON.stringify(updatedCourses))
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>学生考勤系统</h1>
      </header>
      <main className="app-main">
        <CourseManager
          courses={courses}
          onAddCourse={addCourse}
          onDeleteCourse={deleteCourse}
          onSelectCourse={setCurrentCourse}
          onUpdateCourse={updateCourse}
          currentCourse={currentCourse}
        />
        {currentCourse && (
          <AttendanceTable
            course={currentCourse}
            onAddStudent={(studentName) => addStudentToCourse(currentCourse!.id, studentName)}
            onAddStudentsBatch={(students) => {
              const updatedCourses = courses.map(course => {
                if (course.id === currentCourse!.id) {
                  const newStudents: Student[] = students
                    .filter(student => student.name.trim())
                    .map(student => ({
                      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                      name: student.name.trim(),
                      totalHours: student.hours > 0 ? student.hours : course.totalHours,
                      completedHours: 0,
                      remainingHours: student.hours > 0 ? student.hours : course.totalHours
                    }))
                  return {
                    ...course,
                    students: [...course.students, ...newStudents]
                  }
                }
                return course
              })
              setCourses(updatedCourses)
              if (currentCourse) {
                const updatedCourse = updatedCourses.find(c => c.id === currentCourse.id)
                if (updatedCourse) {
                  setCurrentCourse(updatedCourse)
                }
              }
              // 立即保存到localStorage，确保数据不会丢失
              localStorage.setItem('courses', JSON.stringify(updatedCourses))
            }}
            onRecordAttendance={(date, studentId, status) => recordAttendance(currentCourse!.id, date, studentId, status)}
            onBatchSetAttendance={(date, status) => {
              const updatedCourses = courses.map(course => {
                if (course.id === currentCourse!.id) {
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
                  return {
                    ...course,
                    attendanceRecords: updatedRecords,
                    students: updatedStudents
                  }
                }
                return course
              })
              
              setCourses(updatedCourses)
              if (currentCourse) {
                const updatedCourse = updatedCourses.find(c => c.id === currentCourse.id)
                if (updatedCourse) {
                  setCurrentCourse(updatedCourse)
                }
              }
              // 立即保存到localStorage，确保数据不会丢失
              localStorage.setItem('courses', JSON.stringify(updatedCourses))
            }}
            onUpdateCourse={updateCourse}
            onUpdateStudentTotalHours={(studentId, totalHours) => {
              const updatedCourse = {
                ...currentCourse!,
                students: currentCourse!.students.map(student => {
                  if (student.id === studentId) {
                    return {
                      ...student,
                      totalHours,
                      remainingHours: Math.max(0, totalHours - student.completedHours)
                    }
                  }
                  return student
                })
              }
              updateCourse(updatedCourse)
            }}
            onDeleteStudents={(studentIds) => {
              const updatedCourses = courses.map(course => {
                if (course.id === currentCourse!.id) {
                  // 1. 从学生列表中移除选中的学生
                  const updatedStudents = course.students.filter(student => !studentIds.includes(student.id))
                  
                  // 2. 从考勤记录中移除选中学生的记录
                  const updatedRecords = course.attendanceRecords.filter(record => !studentIds.includes(record.studentId))
                  
                  // 3. 更新课程
                  return {
                    ...course,
                    students: updatedStudents,
                    attendanceRecords: updatedRecords
                  }
                }
                return course
              })
              
              setCourses(updatedCourses)
              if (currentCourse) {
                const updatedCourse = updatedCourses.find(c => c.id === currentCourse.id)
                if (updatedCourse) {
                  setCurrentCourse(updatedCourse)
                }
              }
              // 立即保存到localStorage，确保数据不会丢失
              localStorage.setItem('courses', JSON.stringify(updatedCourses))
            }}
            onDeleteDates={(dates) => {
              const updatedCourses = courses.map(course => {
                if (course.id === currentCourse!.id) {
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
                  return {
                    ...course,
                    attendanceRecords: updatedRecords,
                    students: updatedStudents
                  }
                }
                return course
              })
              
              setCourses(updatedCourses)
              if (currentCourse) {
                const updatedCourse = updatedCourses.find(c => c.id === currentCourse.id)
                if (updatedCourse) {
                  setCurrentCourse(updatedCourse)
                }
              }
              // 立即保存到localStorage，确保数据不会丢失
              localStorage.setItem('courses', JSON.stringify(updatedCourses))
            }}
          />
        )}
      </main>
    </div>
  )
}

export default App