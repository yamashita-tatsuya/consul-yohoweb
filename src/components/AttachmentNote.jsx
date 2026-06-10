import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material'

const NOTES = [
  '1つの添付ファイルにつきファイルサイズは1GBまでです。',
  '画像は、可能な範囲でリサイズ・圧縮のうえお送りください。',
  '容量を超える場合や、添付がうまくいかない場合は、別途担当者までお問い合わせください。',
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>× 閉じる</Button>
      </DialogActions>
    </Dialog>
  )
}
