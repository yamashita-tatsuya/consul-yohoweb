import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Box, Typography } from '@mui/material'
import Header from './components/Header'
import RequestFormPage from './pages/RequestFormPage'
import CheckListPage from './components/CheckListPage'
import CheckListResult from './pages/CheckListResult'
import { CheckListProvider } from './contexts/CheckListContext'

export default function App() {
  const location = useLocation()

  useEffect(() => {
    const title = location.pathname.startsWith('/web-check')
      ? 'WEB活用診断'
      : 'サイト修正依頼フォーム'
    document.title = title
  }, [location.pathname])

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
        sx={{
          py: 3,
          px: 2,
          textAlign: 'center',
          bgcolor: '#fff',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.8 }}>
            問い合わせ窓口：株式会社ゆびすいコンサルティング　ホームページサポート
            <br />
            <Box component="span" sx={{ wordBreak: 'break-all' }}>hp-support@yubisui.co.jp</Box>
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.8 }}>
            受付時間：平日 10:00～17:00
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          © {new Date().getFullYear()} 株式会社ゆびすいコンサルティング
        </Typography>
      </Box>
    </Box>
  )
}
