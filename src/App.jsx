import { Routes, Route, Navigate } from 'react-router-dom'
import { Box, Typography } from '@mui/material'
import Header from './components/Header'
import RequestFormPage from './pages/RequestFormPage'
import CheckListPage from './components/CheckListPage'
import CheckListResult from './pages/CheckListResult'
import { CheckListProvider } from './contexts/CheckListContext'

export default function App() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <CheckListProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/update-request" replace />} />
          <Route path="/update-request" element={<RequestFormPage />} />
          <Route path="/web-check" element={<CheckListPage pageKey="web" />} />
          <Route path="/web-check/google" element={<CheckListPage pageKey="google" />} />
          <Route path="/web-check/sns" element={<CheckListPage pageKey="sns" />} />
          <Route path="/web-check/result" element={<CheckListResult />} />
        </Routes>
      </CheckListProvider>

      <Box
        component="footer"
        sx={{ py: 2, textAlign: 'center', borderTop: '1px solid', borderColor: 'divider' }}
      >
        <Typography variant="caption" color="text.secondary">
          © {new Date().getFullYear()} 株式会社ゆびすいコンサルティング
        </Typography>
      </Box>
    </Box>
  )
}
