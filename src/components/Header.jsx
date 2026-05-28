import { AppBar, Toolbar, Box } from '@mui/material'

export default function Header() {
  return (
    <AppBar position="static" elevation={0} sx={{ bgcolor: '#fff', borderBottom: '1px solid', borderColor: 'divider' }}>
      <Toolbar sx={{ py: 1 }}>
        <Box
          component="img"
          src="/logo.png"
          alt="ゆびすい公益法人ホームページ制作サービス"
          sx={{ height: { xs: 40, sm: 48 }, width: 'auto' }}
        />
      </Toolbar>
    </AppBar>
  )
}
