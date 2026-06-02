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
          <Route path="/" element={<Navigate to="/requestform" replace />} />
          <Route path="/requestform" element={<RequestFormPage />} />
          <Route path="/checklist" element={<CheckListPage pageKey="web" />} />
          <Route path="/checklist/google" element={<CheckListPage pageKey="google" />} />
          <Route path="/checklist/sns" element={<CheckListPage pageKey="sns" />} />
          <Route path="/checklist/result" element={<CheckListResult />} />
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
