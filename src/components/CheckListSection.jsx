import { Box, Paper, Typography, Stack, Divider, Switch, FormControlLabel, Button } from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Link as RouterLink } from 'react-router-dom'
import { SectionTitle, CtaButton } from './render'

export default function CheckListSection({
  title,
  icon,
  step,
  groups,
  pageKey,
  isChecked,
  onToggle,
  nextTo,
  prevTo,
  nextLabel = '次の項目へ',
  nextVariant = 'blue',
}) {
  return (
    <>
    <Paper elevation={0} sx={{ p: { xs: 3, sm: 4.5 }, mb: 3, border: '1px solid', borderColor: 'divider' }}>
      <SectionTitle icon={icon} step={step}>{title}</SectionTitle>

      {groups.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          （項目を準備中です）
        </Typography>
      ) : (
        <Stack spacing={3}>
          {groups.map((group, gIdx) => (
            <Box
              key={gIdx}
              sx={{
                border: '1px solid',
                borderColor: '#41a3a1',
                borderRadius: 1,
                overflow: 'hidden',
              }}
            >
              {group.title && (
                <Box sx={{ bgcolor: '#41a3a1', color: '#fff', px: 2, py: 1 }}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {group.title}
                  </Typography>
                </Box>
              )}
              <Stack divider={<Divider />}>
                {group.items.map((item, iIdx) => (
                  <FormControlLabel
                    key={iIdx}
                    control={
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          height: 24,
                          flexShrink: 0,
                          ml: { xs: 2, sm: 3 },
                        }}
                      >
                        <Typography
                          variant="body2"
                          color={isChecked(pageKey, gIdx, iIdx) ? 'text.disabled' : 'text.secondary'}
                          sx={{ lineHeight: 1, fontSize: '0.75rem' }}
                        >
                          NO
                        </Typography>
                        <Switch
                          size="small"
                          checked={isChecked(pageKey, gIdx, iIdx)}
                          onChange={() => onToggle(pageKey, gIdx, iIdx)}
                          sx={{ mx: 0.75 }}
                        />
                        <Typography
                          variant="body2"
                          color={isChecked(pageKey, gIdx, iIdx) ? 'primary.main' : 'text.disabled'}
                          fontWeight={isChecked(pageKey, gIdx, iIdx) ? 700 : 400}
                          sx={{ lineHeight: 1, fontSize: '0.75rem' }}
                        >
                          YES
                        </Typography>
                      </Box>
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            flexShrink: 0,
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            bgcolor: isChecked(pageKey, gIdx, iIdx) ? '#41a3a1' : 'grey.300',
                            color: isChecked(pageKey, gIdx, iIdx) ? '#fff' : 'text.secondary',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8125rem',
                            fontWeight: 700,
                            transition: 'background-color 0.15s, color 0.15s',
                          }}
                        >
                          {iIdx + 1}
                        </Box>
                        <Typography variant="body1">{item}</Typography>
                      </Box>
                    }
                    labelPlacement="start"
                    sx={{
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      mr: 0,
                      ml: 0,
                      px: { xs: 2, sm: 2.5 },
                      py: 1.25,
                      transition: 'background-color 0.15s',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  />
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
    </Paper>

      {(prevTo || nextTo) && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: prevTo ? 'space-between' : 'flex-end',
            mt: 1,
            mb: 2,
          }}
        >
          {prevTo && (
            <Button
              component={RouterLink}
              to={prevTo}
              variant="outlined"
              size="large"
              startIcon={<ArrowBackIcon />}
              sx={{
                bgcolor: '#fff',
                color: '#41a3a1',
                borderColor: '#41a3a1',
                fontSize: '1.05rem',
                fontWeight: 700,
                px: 4,
                py: 1.5,
                '&:hover': { bgcolor: '#eef7f7', borderColor: '#368a88' },
              }}
            >
              戻る
            </Button>
          )}
          {nextTo && (
            <CtaButton
              component={RouterLink}
              to={nextTo}
              color={nextVariant}
              startIcon={<ArrowForwardIcon />}
            >
              {nextLabel}
            </CtaButton>
          )}
        </Box>
      )}
    </>
  )
}
