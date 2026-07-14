import { useState } from 'react'
import { Box, Container, Typography } from '@mui/material'
import RequestForm from '../components/RequestForm'
import ConfirmPage from '../components/ConfirmPage'
import SuccessPage from '../components/SuccessPage'

export default function RequestFormPage() {
  const [step, setStep] = useState('form')
  const [formData, setFormData] = useState(null)

  const handleConfirm = (data) => {
    setFormData(data)
    setStep('confirm')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBack = () => {
    setStep('form')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmitted = (data) => {
    setFormData(data)
    setStep('success')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleReset = () => {
    setFormData(null)
    setStep('form')
  }

  if (step === 'success') return <SuccessPage formData={formData} onReset={handleReset} />
  if (step === 'confirm')
    return <ConfirmPage formData={formData} onBack={handleBack} onSubmitted={handleSubmitted} />

  return (
    <Container maxWidth="md" sx={{ py: 5, flex: 1 }}>
      {/* ページ説明 */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 3, lineHeight: 1.6 }}>
          ウェブサイト保守運用プラン ご契約者様専用
          <br />
          修正依頼フォーム
        </Typography>
        <Typography color="text.secondary">
          ホームページの修正・更新依頼を受け付けております。必要事項をご入力のうえ送信してください。
        </Typography>
      </Box>

      {/* 注意枠 */}
      <Box
        sx={{
          mb: 4,
          p: { xs: 2, sm: 3 },
          bgcolor: '#ffffff',
          border: '2px solid',
          borderColor: '#d32f2f',
          borderRadius: 2,
          color: '#d32f2f',
        }}
      >
        <Typography fontWeight={700} sx={{ mb: 1 }}>
          【！ご依頼前にご確認ください！】
        </Typography>
        <Typography variant="body2">
          お知らせページの投稿、各種資料ページの資料アップロードは、お客様ご自身で更新いただける仕様です。
          公開時にお渡ししているマニュアルをご確認のうえ、まずはお客様にてご対応をお願いいたします。{' '}
          <Box
            component="a"
            href="/manual.pdf"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              fontWeight: 400,
              fontSize: '0.8125rem',
              color: '#000000',
              textDecoration: 'underline',
              whiteSpace: 'nowrap',
              '&:hover': { color: '#41a3a1' },
            }}
          >
            →マニュアルはこちら
          </Box>
          <br />
          ご不明な点がある場合や、その他の修正について、本フォームよりご依頼ください。
        </Typography>
      </Box>

      <RequestForm onConfirm={handleConfirm} initialData={formData} />
    </Container>
  )
}
