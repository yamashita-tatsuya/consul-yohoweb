import { Box, Container, Typography, Button, Paper, Stack, Divider } from '@mui/material'
import { CheckCircle, Send } from '@mui/icons-material'

const ITEM_NUMS = ['①', '②', '③', '④', '⑤']

export default function SuccessPage({ formData, onReset }) {
  const items = formData.items || []
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
            <Row label="法人名・園名" value={formData.companyName} />
            <Row label="ご担当者様名" value={formData.contactName} />
            <Row label="返信先" value={formData.email} />
            {formData.desiredDate && <Row label="更新希望日" value={formData.desiredDate} />}
            {formData.note && <Row label="備考" value={formData.note} />}
          </Stack>

          {items.map((item, idx) => (
            <Box key={idx} sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
                修正内容{ITEM_NUMS[idx]}
              </Typography>
              <Stack spacing={1} divider={<Divider />}>
                <Row label="対象URL" value={item.siteUrl} />
                <Row label="内容" value={item.description} />
                {item.files?.length > 0 && (
                  <Row label="添付" value={item.files.map((f) => f.name).join(', ')} />
                )}
              </Stack>
            </Box>
          ))}
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
