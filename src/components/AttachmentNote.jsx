import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Link } from '@mui/material'

const SUPPORT_EMAIL = 'hp-support@yubisui.co.jp'

const NOTES = [
  '1つの添付ファイルにつきファイルサイズは1GBまでです。',
  <>
    容量を超える場合は、別途{' '}
    <Link href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</Link>
    {' '}までお送りください。
  </>,
  'メール件名には、法人名または園名をご記入ください。',
  'どの修正内容に対する資料か分かるよう、説明の記載やファイル名の整理をお願いいたします。',
  '画像は、可能な範囲でリサイズ・圧縮のうえお送りください。',
  '複数ファイルをまとめる場合は、フォルダにまとめて圧縮ファイルにして添付してください。',
]

export default function AttachmentNote({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>ファイル添付について</DialogTitle>
      <DialogContent dividers>
        <Box component="ul" sx={{ mt: 0, mb: 0, pl: 3 }}>
          {NOTES.map((note, i) => (
            <Typography component="li" variant="body2" key={i} sx={{ mb: 0.75 }}>
              {note}
            </Typography>
          ))}
        </Box>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" fontWeight={700}>
            ※圧縮ファイル作成方法（Windowsの場合）
          </Typography>
          <Typography variant="body2">
            フォルダを右クリック →「送る」→「圧縮（zip形式）フォルダー」
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>× 閉じる</Button>
      </DialogActions>
    </Dialog>
  )
}
