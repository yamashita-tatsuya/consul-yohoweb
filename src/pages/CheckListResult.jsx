import { useEffect } from 'react'
import { Box, Container, Typography, Paper, Stack, Divider, LinearProgress, CircularProgress, Button } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CloseIcon from '@mui/icons-material/Close'
import ReplayIcon from '@mui/icons-material/Replay'
import { Link as RouterLink } from 'react-router-dom'
import { useCheckList } from '../contexts/CheckListContext'
import { CHECK_PAGES, PAGE_ORDER } from '../data/checkListData'
import { PageHeader } from '../components/render'

export default function CheckListResult() {
  const { isChecked, reset } = useCheckList()

  // 結果ページ表示時はページ最上部から表示する
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [])

  const summarize = (pageKey) => {
    const page = CHECK_PAGES[pageKey]
    const items = page.groups.flatMap((g, gIdx) =>
      g.items.map((item, iIdx) => ({
        text: item,
        groupTitle: g.title,
        checked: isChecked(pageKey, gIdx, iIdx),
      }))
    )
    const total = items.length
    const done = items.filter((x) => x.checked).length
    return { items, total, done }
  }

  // パーセンテージに応じた色（30%以下:赤 / 70%以下:オレンジ / 70%超:緑）
  const colorForPct = (pct) => {
    if (pct <= 30) return '#d32f2f'
    if (pct <= 70) return '#f7894b'
    return '#2e9e5b'
  }

  // 全ページ合計の総合結果
  const overall = PAGE_ORDER.reduce(
    (acc, pageKey) => {
      const { total, done } = summarize(pageKey)
      acc.total += total
      acc.done += done
      return acc
    },
    { total: 0, done: 0 }
  )
  const overallPct = overall.total > 0 ? Math.round((overall.done / overall.total) * 100) : 0
  const overallColor = colorForPct(overallPct)

  // パーセンテージに応じた総合コメント（99%以下と100%は共に緑）
  const adviceForPct = (pct) => {
    if (pct <= 30)
      return {
        title: '早めの見直しを推奨します',
        body: '秋の募集前に、WEBサイト・Googleマップ・SNSの優先改修をおすすめします。',
      }
    if (pct <= 70)
      return {
        title: '一部見直しが必要です',
        body: '改善余地のある項目を優先的に対応することで、募集の強化につながります。',
      }
    if (pct <= 99)
      return {
        title: '概ね整っています',
        body: '秋の募集に向けた基盤は良好です。細部をさらに磨きましょう。',
      }
    return {
      title: 'WEB集客は完璧です',
      body: '秋の募集に向けた基盤は良好です。細部をさらに磨きましょう。',
    }
  }
  const advice = adviceForPct(overallPct)

  return (
    <Container maxWidth="md" sx={{ py: 5, flex: 1 }}>
      <PageHeader title="WEB集客診断結果" description="診断結果に基づいて、改善点を確認しましょう。" />

      <Box
        sx={{
          mb: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          <CircularProgress
            variant="determinate"
            value={100}
            size={180}
            thickness={5}
            sx={{ color: 'grey.200' }}
          />
          <CircularProgress
            variant="determinate"
            value={overallPct}
            size={180}
            thickness={5}
            sx={{
              color: overallColor,
              position: 'absolute',
              left: 0,
              '& .MuiCircularProgress-circle': { strokeLinecap: 'round' },
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h3" fontWeight={700} sx={{ color: overallColor, lineHeight: 1 }}>
              {overallPct}%
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {overall.done} / {overall.total} 項目
            </Typography>
          </Box>
        </Box>
      </Box>

      <Paper
        elevation={0}
        sx={{ p: { xs: 2, sm: 2.5 }, mb: 3, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}
      >
        <Typography variant="subtitle1" sx={{ color: overallColor, fontWeight: 700, fontSize: '1.35rem', mb: 0.25 }}>
          {advice.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {advice.body}
        </Typography>
      </Paper>

      <Stack spacing={3}>
        {PAGE_ORDER.map((pageKey) => {
          const page = CHECK_PAGES[pageKey]
          const { items, total, done } = summarize(pageKey)
          const pct = total > 0 ? Math.round((done / total) * 100) : 0
          const undone = items.filter((x) => !x.checked)

          return (
            <Paper
              key={pageKey}
              elevation={0}
              sx={{ p: { xs: 3, sm: 4 }, border: '1px solid', borderColor: 'divider' }}
            >
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                {page.sectionTitle}
              </Typography>

              {total === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  （項目を準備中です）
                </Typography>
              ) : (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    <Typography variant="body2" fontWeight={700} sx={{ minWidth: 80, textAlign: 'right' }}>
                      {done} / {total}（{pct}%）
                    </Typography>
                  </Box>

                  {undone.length > 0 && (
                    <>
                      <Typography variant="body2" fontWeight={700} sx={{ mb: 1, color: '#d32f2f' }}>
                        未対応の項目
                      </Typography>
                      <Stack divider={<Divider />}>
                        {undone.map((it, i) => (
                          <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, py: 1 }}>
                            <CloseIcon sx={{ color: '#d32f2f', fontSize: 20, mt: '2px' }} />
                            <Typography variant="body2">{it.text}</Typography>
                          </Box>
                        ))}
                      </Stack>
                    </>
                  )}

                  {undone.length === 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleIcon sx={{ color: 'success.main' }} />
                      <Typography variant="body2">すべての項目に対応されています。</Typography>
                    </Box>
                  )}
                </>
              )}
            </Paper>
          )
        })}
      </Stack>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 4 },
          mt: 3,
          border: '1px solid',
          borderColor: '#41a3a1',
          textAlign: 'center',
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1.35rem', mb: 1 }}>
          プロの目線で改善点を整理します
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          貴園のホームページ・Googleビジネスプロフィール・SNS導線を拝見し、<br />
          秋の募集前に優先して見直すべき点を簡易レポートでご案内します。
        </Typography>
        <Button
          variant="contained"
          size="large"
          sx={{
            bgcolor: '#f7894b',
            color: '#fff',
            fontSize: '1.05rem',
            fontWeight: 700,
            px: 8,
            py: 1.5,
            '&:hover': { bgcolor: '#e0773b' },
          }}
        >
          → ゆびすいに無料相談
        </Button>
        <Typography variant="subtitle1" sx={{ color: '#f7894b', fontSize: '1.35rem', mt: 2 }}>
          WEBサイト制作・改修／Googleマップ整備／SNS導線設計
        </Typography>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Button
          component={RouterLink}
          to="/checklist"
          onClick={reset}
          variant="outlined"
          size="large"
          startIcon={<ReplayIcon />}
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
          もう一度診断する
        </Button>
      </Box>
    </Container>
  )
}
