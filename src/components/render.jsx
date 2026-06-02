import { Box, Button, Typography } from '@mui/material'

export function PageHeader({ title, description }) {
  return (
    <Box sx={{ mb: 4, textAlign: 'center' }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3, lineHeight: 1.6 }}>
        {title}
      </Typography>
      {description && (
        <Typography color="text.secondary">{description}</Typography>
      )}
    </Box>
  )
}

export function SectionTitle({ icon, step, children }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
      {step != null && (
        <Box
          sx={{
            bgcolor: 'primary.main',
            color: '#fff',
            px: 1.5,
            py: 0.25,
            borderRadius: 1,
            fontWeight: 700,
            fontSize: '0.875rem',
            letterSpacing: 0.5,
          }}
        >
          STEP{step}
        </Box>
      )}
      <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
      <Typography variant="subtitle1" fontWeight={900} color="primary.main" sx={{ fontSize: '1.25rem' }}>
        {children}
      </Typography>
    </Box>
  )
}

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