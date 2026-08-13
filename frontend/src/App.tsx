import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import HistoryPage from './pages/HistoryPage';
import ListDetailPage from './pages/ListDetailPage';
import ListsPage from './pages/ListsPage';
import { RegisterPage } from './pages/RegisterPage';
import TodayPage from './pages/TodayPage';

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/today" element={<TodayPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/lists" element={<ListsPage />} />
        <Route path="/lists/:listId" element={<ListDetailPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
export default App;