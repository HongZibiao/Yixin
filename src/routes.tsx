import { createBrowserRouter } from 'react-router-dom'
import Layout from './components/Layout'
import CourseList from './pages/CourseList'
import AttendancePage from './pages/AttendancePage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <CourseList />
      },
      {
        path: '/course/:id',
        element: <AttendancePage />
      }
    ]
  }
])

export default router