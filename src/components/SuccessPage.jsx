import { Box, Container, Typography, Button, Paper, Stack, Divider, Link } from '@mui/material'
import { CheckCircle, Send } from '@mui/icons-material'

const ITEM_NUMS = ['①', '②', '③', '④', '⑤']

export default function SuccessPage({ formData, onReset }) {
  const items = formData.items || []
  return (
    <Container maxWidth="md" sx={{ py: 5, flex: 1 }}>
      {/* 完了メッセージ（チェックマーク・見出しはそのまま） */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <CheckCircle sx={{ fontSize: 72, color: 'success.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          送信が完了しました
        </Typography>
        <Typography color="text.secondary">
          {formData.contactName} 様、ご依頼ありがとうございます。
          <br />
          内容を確認の上、担当者よりご連絡いたします。
        </Typography>
      </Box>

      {/* ご依頼内容についての注意枠 */}
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
          【ご依頼について】
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 3 }}>
          <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
            通常の更新対応の目安は、受付日の翌営業日～5営業日程度です。
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
            複数依頼につきましては、修正内容により完了日が前後する場合がございます。
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
            上記期間を過ぎても連絡や更新がない場合は、お手数ですが{' '}
            <Link href="mailto:hp-support@yubisui.co.jp" sx={{ color: 'inherit' }}>
              hp-support@yubisui.co.jp
            </Link>
            までお問い合わせください。
          </Typography>
          <Typography component="li" variant="body2">
            土日祝日・休業日・平日17:00以降は営業日に含まれませんのでご了承ください。
          </Typography>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ p: { xs: 3, sm: 4.5 }, mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          依頼者情報
        </Typography>
        <Stack spacing={1} divider={<Divider />}>
          <Row label="法人名・園名" value={formData.companyName} />
          <Row label="ご担当者様名" value={formData.contactName} />
          <Row label="メールアドレス" value={formData.email} />
          {formData.phone && <Row label="電話番号" value={formData.phone} />}
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: { xs: 3, sm: 4.5 }, mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          依頼内容
        </Typography>
        {items.map((item, idx) => (
          <Box key={idx} sx={{ mb: 2.5, p: 2, border: '1px solid', borderColor: 'grey.400', borderRadius: 1 }}>
            <Typography fontWeight={700} sx={{ mb: 1 }}>
              修正内容{ITEM_NUMS[idx]}
            </Typography>
            <Stack spacing={1} divider={<Divider />}>
              <Row label="対象ページのURL" value={item.siteUrl} />
              <Row label="修正箇所・変更内容" value={item.description} />
              {item.files?.length > 0 && (
                <Row label="添付資料" value={item.files.map((f) => f.name).join(', ')} />
              )}
            </Stack>
          </Box>
        ))}

        <Stack spacing={1} divider={<Divider />} sx={{ mt: 2 }}>
          {formData.desiredDate && <Row label="更新希望日" value={formData.desiredDate} />}
          {formData.note && <Row label="備考" value={formData.note} />}
        </Stack>
      </Paper>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
        ご登録のメールアドレス（{formData.email}）に確認メールが届きます。
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="outlined"
          size="large"
          startIcon={<Send />}
          onClick={onReset}
          sx={{ px: 4, bgcolor: '#fff', '&:hover': { bgcolor: '#fff' } }}
        >
          新しい依頼を送信する
        </Button>
      </Box>
    </Container>
  )
}

function Row({ label, value }) {
  return (
    <Box sx={{ display: 'flex', gap: 2, py: 0.5 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500} sx={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap', flex: 1 }}>
        {value}
      </Typography>
    </Box>
  )
}
