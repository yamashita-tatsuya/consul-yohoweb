import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: {
      main: '#f7894b',
      light: '#4a70b5',
      dark: '#0d2d5e',
    },
    secondary: {
      main: '#41a3a1',
    },
    background: {
      default: '#d9edec',
      paper: '#ffffff',
    },
    text: {
      primary: '#2f2725',
    },
  },
  typography: {
    fontFamily:
      '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Meiryo", "Yu Gothic", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, textTransform: 'none', fontWeight: 600 },
        containedPrimary: { boxShadow: '0 2px 8px rgba(26,71,136,0.3)' },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
  },
})

export default theme
