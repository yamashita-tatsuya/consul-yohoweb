import { Button } from '@mui/material'

export function PrimaryButton({ sx, children, ...props }) {
  return (
    <Button
      variant="contained"
      size="large"
      sx={{
        px: 6,
        py: 1.5,
        fontSize: '1.125rem',
        color: '#fff',
        '&:hover': { bgcolor: '#41a3a1' },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Button>
  )
}

export function SecondaryButton({ sx, children, ...props }) {
  return (
    <Button
      variant="contained"
      size="medium"
      sx={{
        px: 3,
        py: 1,
        fontSize: '0.875rem',
        color: '#fff',
        bgcolor: '#41a3a1',
        '&:hover': { bgcolor: '#f7894b' },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Button>
  )
}