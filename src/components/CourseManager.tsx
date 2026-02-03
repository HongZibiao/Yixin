import React, { useState } from 'react'

interface Course {
  id: string
  name: string
  description: string
  totalHours: number
  completedHours: number
  remainingHours: number
  timeSlot: string
  students: any[]
  attendanceRecords: any[]
}

interface CourseManagerProps {
  courses: Course[]
  onAddCourse: (courseData: Omit<Course, 'id' | 'students' | 'attendanceRecords' | 'completedHours' | 'remainingHours'>) => void
  onDeleteCourse: (courseId: string) => void
  onSelectCourse: (course: Course | null) => void
  onUpdateCourse: (course: Course) => void
  currentCourse: Course | null
}

const CourseManager: React.FC<CourseManagerProps> = ({
  courses,
  onAddCourse,
  onDeleteCourse,
  onSelectCourse,
  onUpdateCourse,
  currentCourse
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    timeSlot: ''
  })
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name) {
      if (editingCourse) {
        // 编辑现有课程
        const updatedCourse = {
          ...editingCourse,
          name: formData.name,
          description: formData.description,
          timeSlot: formData.timeSlot
        }
        onUpdateCourse(updatedCourse)
        setEditingCourse(null)
      } else {
        // 添加新课程
        onAddCourse({
          name: formData.name,
          description: formData.description,
          timeSlot: formData.timeSlot,
          totalHours: 0 // 默认为0，由学生自己设置
        })
      }
      setFormData({
        name: '',
        description: '',
        timeSlot: ''
      })
    }
  }

  const startEditCourse = (course: Course) => {
    setEditingCourse(course)
    setFormData({
      name: course.name,
      description: course.description,
      timeSlot: course.timeSlot
    })
  }

  const cancelEdit = () => {
    setEditingCourse(null)
    setFormData({
      name: '',
      description: '',
      timeSlot: ''
    })
  }

  return (
    <div className="course-manager">
      <h2>课程管理</h2>
      
      <form onSubmit={handleSubmit} className="course-form">
        <h3>{editingCourse ? '编辑课程' : '添加课程'}</h3>
        <div className="form-group">
          <label htmlFor="name">课程名称</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="请输入课程名称"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">课程描述</label>
          <input
            type="text"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="请输入课程描述"
          />
        </div>
        <div className="form-group">
          <label htmlFor="timeSlot">时间段</label>
          <input
            type="text"
            id="timeSlot"
            name="timeSlot"
            value={formData.timeSlot}
            onChange={handleInputChange}
            placeholder="例如：周一 14:00-16:00"
          />
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button type="submit" className="btn btn-primary flex-1">
            {editingCourse ? '保存修改' : '添加课程'}
          </button>
          {editingCourse && (
            <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
              取消
            </button>
          )}
        </div>
      </form>

      <h3>课程列表</h3>
      <div className="course-list">
        {courses.map(course => (
          <div
            key={course.id}
            className={`course-item ${currentCourse?.id === course.id ? 'active' : ''}`}
            onClick={() => onSelectCourse(course)}
          >
            <h3>{course.name}</h3>
            <p>时间段: {course.timeSlot}</p>
            <p>总课时: {course.totalHours} | 已上: {course.completedHours} | 剩余: {course.remainingHours}</p>
            <div className="course-item-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={(e) => {
                  e.stopPropagation()
                  startEditCourse(course)
                }}
              >
                编辑
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={(e) => {
                  e.stopPropagation()
                  if (window.confirm('确定要删除这门课程吗？')) {
                    onDeleteCourse(course.id)
                  }
                }}
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CourseManager