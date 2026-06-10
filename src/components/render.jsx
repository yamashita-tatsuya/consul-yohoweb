import { Box, Button, Typography } from '@mui/material'

// ブランドカラー。塗りつぶしボタンはオレンジ⇔青でホバー時に色が反転する
export const BRAND_ORANGE = '#f7894b'
export const BRAND_BLUE = '#41a3a1'

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
        '&:hover': { bgcolor: BRAND_BLUE },
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
        bgcolor: BRAND_BLUE,
        '&:hover': { bgcolor: BRAND_ORANGE },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Button>
  )
}

// オレンジ⇔青でホバー時に色が反転する塗りつぶしCTAボタン。
// color="orange": オレンジ→ホバー青 / color="blue": 青→ホバーオレンジ
export function CtaButton({ color = 'orange', sx, children, ...props }) {
  const base = color === 'blue' ? BRAND_BLUE : BRAND_ORANGE
  const hover = color === 'blue' ? BRAND_ORANGE : BRAND_BLUE
  return (
    <Button
      variant="contained"
      size="large"
      sx={{
        bgcolor: base,
        color: '#fff',
        fontSize: '1.05rem',
        fontWeight: 700,
        px: 4,
        py: 1.5,
        '&:hover': { bgcolor: hover },
        '&.Mui-disabled': { bgcolor: 'grey.400', color: '#fff' },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Button>
  )
}