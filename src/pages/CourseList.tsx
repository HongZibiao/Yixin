import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import CourseManager from '../components/CourseManager'
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

const CourseList: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([])
  const navigate = useNavigate()
  const location = useLocation()

  // 从localStorage加载课程数据
  useEffect(() => {
    const savedCourses = localStorage.getItem('courses')
    if (savedCourses) {
      try {
        setCourses(JSON.parse(savedCourses))
      } catch (error) {
        console.error('Error parsing courses:', error)
        // 数据解析错误，但不清空localStorage，避免数据丢失
        // 尝试使用默认空数组
        setCourses([])
      }
    } else {
      // 如果localStorage中没有数据，使用空数组
      setCourses([])
    }
  }, [])

  // 监听localStorage变化，确保数据同步
  useEffect(() => {
    const handleStorageChange = () => {
      const savedCourses = localStorage.getItem('courses')
      if (savedCourses) {
        try {
          setCourses(JSON.parse(savedCourses))
        } catch (error) {
          console.error('Error parsing courses:', error)
        }
      }
    }

    // 监听storage事件
    window.addEventListener('storage', handleStorageChange)

    // 组件卸载时移除监听器
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  // 监听路由变化，当从其他页面返回时重新加载数据
  useEffect(() => {
    // 从localStorage重新加载数据
    const savedCourses = localStorage.getItem('courses')
    if (savedCourses) {
      try {
        setCourses(JSON.parse(savedCourses))
      } catch (error) {
        console.error('Error parsing courses:', error)
        // 数据解析错误，但不清空localStorage，避免数据丢失
        // 尝试使用默认空数组
        setCourses([])
      }
    } else {
      // 如果localStorage中没有数据，使用空数组
      setCourses([])
    }
  }, [location])

  // 移除自动保存，避免覆盖手动保存的数据
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
    setCourses([...courses, newCourse])
    // 立即保存到localStorage，确保数据不会丢失
    localStorage.setItem('courses', JSON.stringify([...courses, newCourse]))
  }

  const deleteCourse = (courseId: string) => {
    const updatedCourses = courses.filter(course => course.id !== courseId)
    setCourses(updatedCourses)
    // 立即保存到localStorage，确保数据不会丢失
    localStorage.setItem('courses', JSON.stringify(updatedCourses))
  }

  const selectCourse = (course: Course | null) => {
    if (course) {
      navigate(`/course/${course.id}`)
    }
  }

  const updateCourse = (updatedCourse: Course) => {
    const updatedCourses = courses.map(course => course.id === updatedCourse.id ? updatedCourse : course)
    setCourses(updatedCourses)
    // 立即保存到localStorage，确保数据不会丢失
    localStorage.setItem('courses', JSON.stringify(updatedCourses))
  }

  const resetData = () => {
    if (window.confirm('确定要清空所有课程数据吗？此操作不可恢复。')) {
      // 完全清空localStorage
      localStorage.clear()
      setCourses([])
      alert('数据已清空，请重新添加课程。')
    }
  }

  return (
    <div className="course-list-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>课程管理</h1>
        <button 
          className="btn btn-danger" 
          onClick={resetData}
          style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
        >
          重置数据
        </button>
      </div>
      <CourseManager
        courses={courses}
        onAddCourse={addCourse}
        onDeleteCourse={deleteCourse}
        onSelectCourse={selectCourse}
        onUpdateCourse={updateCourse}
        currentCourse={null}
      />
    </div>
  )
}

export default CourseList