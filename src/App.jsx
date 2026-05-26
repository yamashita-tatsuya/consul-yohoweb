import { useState } from 'react'
import { Box, Container, Typography, Paper } from '@mui/material'
import Header from './components/Header'
import RequestForm from './components/RequestForm'
import SuccessPage from './components/SuccessPage'

export default function App() {
  const [submitted, setSubmitted] = useState(false)
  const [submittedData, setSubmittedData] = useState(null)

  const handleSubmitSuccess = (data) => {
    setSubmittedData(data)
    setSubmitted(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleReset = () => {
    setSubmitted(false)
    setSubmittedData(null)
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <Header />

      {submitted ? (
        <SuccessPage formData={submittedData} onReset={handleReset} />
      ) : (
        <Container maxWidth="md" sx={{ py: 5, flex: 1 }}>
          {/* ページ説明 */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Webサイト修正依頼フォーム
            </Typography>
            <Typography color="text.secondary">
              運営サイトの修正・変更のご依頼はこちらからお送りください。
              <br />
              内容を確認次第、担当者よりご連絡いたします。
            </Typography>
          </Box>

          <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 }, border: '1px solid', borderColor: 'divider' }}>
            <RequestForm onSubmitSuccess={handleSubmitSuccess} />
          </Paper>
        </Container>
      )}

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
