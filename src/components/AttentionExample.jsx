import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material'

const GOOD_EXAMPLES = [
  '入園案内の募集要項の○年度を△年度に変更したい',
  '園の紹介ページの一番下の写真を、添付した写真に差し替えたい',
  '職員募集ページの「勤務時間 8:00～17:00」を「7:30～18:30のうちシフト制」に修正したい',
]

const BAD_EXAMPLES = [
  { text: '添付資料の内容に修正してください', note: '（変更点が不明で、どこの何を修正したらよいのか明確でない）' },
  { text: '添付の告知をしたいです', note: '（具体的な内容がなく、掲載文章の提供がない）' },
  { text: '前に送った内容でお願いします', note: '（いつの何か明確でない）' },
]

export default function AttentionExample({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>修正箇所・変更内容の記載例</DialogTitle>
      <DialogContent dividers>
        <Typography fontWeight={700} sx={{ mb: 1 }}>
          〇良い例：
        </Typography>
        <Box component="ul" sx={{ mt: 0, mb: 2, pl: 3 }}>
          {GOOD_EXAMPLES.map((ex, i) => (
            <Typography component="li" variant="body2" key={i} sx={{ mb: 0.5 }}>
              {ex}
            </Typography>
          ))}
        </Box>
        <Typography fontWeight={700} sx={{ mb: 1, color: '#d32f2f' }}>
          ×悪い例：
        </Typography>
        <Box component="ul" sx={{ mt: 0, pl: 3 }}>
          {BAD_EXAMPLES.map((ex, i) => (
            <Typography component="li" variant="body2" key={i} sx={{ mb: 0.5 }}>
              {ex.text}
              <Box component="span" sx={{ color: '#d32f2f' }}>{ex.note}</Box>
            </Typography>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>× 閉じる</Button>
      </DialogActions>
    </Dialog>
  )
}
