import { Box, Container, Typography, Button, Paper, Stack, Divider } from '@mui/material'
import { CheckCircle, Send } from '@mui/icons-material'

const REQUEST_TYPE_LABELS = {
  bug: 'バグ修正',
  design: 'デザイン変更',
  content: 'コンテンツ更新',
  feature: '機能追加',
  other: 'その他',
}

const PRIORITY_LABELS = {
  high: '高',
  medium: '中',
  low: '低',
}

export default function SuccessPage({ formData, onReset }) {
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
        <CheckCircle sx={{ fontSize: 72, color: 'success.main', mb: 2 }} />

        <Typography variant="h5" gutterBottom>
          送信が完了しました
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {formData.contactName} 様、ご依頼ありがとうございます。
          <br />
          内容を確認の上、担当者よりご連絡いたします。
        </Typography>

        <Paper
          variant="outlined"
          sx={{ p: 2.5, mb: 3, textAlign: 'left', bgcolor: 'background.default' }}
        >
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5, fontWeight: 600 }}>
            受付内容
          </Typography>
          <Stack spacing={1} divider={<Divider />}>
            <Row label="会社名" value={formData.companyName} />
            <Row label="担当者名" value={formData.contactName} />
            <Row label="返信先" value={formData.email} />
            <Row label="対象URL" value={formData.siteUrl} />
            <Row label="修正種別" value={REQUEST_TYPE_LABELS[formData.requestType] ?? formData.requestType} />
            <Row label="優先度" value={PRIORITY_LABELS[formData.priority] ?? formData.priority} />
          </Stack>
        </Paper>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          ご登録のメールアドレス（{formData.email}）に確認メールが届きます。
        </Typography>

        <Button variant="outlined" startIcon={<Send />} onClick={onReset}>
          新しい依頼を送信する
        </Button>
      </Paper>
    </Container>
  )
}

function Row({ label, value }) {
  return (
    <Box sx={{ display: 'flex', gap: 2, py: 0.5 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500} sx={{ wordBreak: 'break-all' }}>
        {value}
      </Typography>
    </Box>
  )
}
