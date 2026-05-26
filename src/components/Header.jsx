import { AppBar, Toolbar, Typography, Box } from '@mui/material'
import { BusinessCenter } from '@mui/icons-material'

export default function Header() {
  return (
    <AppBar position="static" elevation={0} sx={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
      <Toolbar sx={{ py: 1 }}>
        <BusinessCenter sx={{ mr: 1.5, fontSize: 28 }} />
        <Box>
          <Typography variant="h6" component="div" lineHeight={1.2}>
            株式会社ゆびすいコンサルティング
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8, letterSpacing: 0.5 }}>
            Webサイト修正依頼フォーム
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
