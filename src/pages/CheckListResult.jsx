import { useEffect, useState } from 'react'
import { Box, Container, Typography, Paper, Stack, Divider, LinearProgress, CircularProgress, Button, Collapse, TextField } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CloseIcon from '@mui/icons-material/Close'
import ReplayIcon from '@mui/icons-material/Replay'
import { Link as RouterLink } from 'react-router-dom'
import { useCheckList } from '../contexts/CheckListContext'
import { CHECK_PAGES, PAGE_ORDER } from '../data/checkListData'
import { PRIVACY_POLICY_INTRO, PRIVACY_POLICY_SECTIONS } from '../data/privacyPolicy'
import { PageHeader, CtaButton } from '../components/render'
import { isValidEmail } from '../utils/validation'

export default function CheckListResult() {
  const { isChecked, reset } = useCheckList()
  const [downloadOpen, setDownloadOpen] = useState(false)
  const [dlForm, setDlForm] = useState({ companyName: '', email: '' })
  const [dlErrors, setDlErrors] = useState({})
  const [dlLoading, setDlLoading] = useState(false)
  const [dlError, setDlError] = useState(null)

  const handleDlChange = (e) => {
    const { name, value } = e.target
    setDlForm((prev) => ({ ...prev, [name]: value }))
    if (dlErrors[name]) setDlErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleDownload = async () => {
    const e = {}
    if (!dlForm.companyName.trim()) e.companyName = '法人名・園名を入力してください'
    if (!dlForm.email.trim()) {
      e.email = 'メールアドレスを入力してください'
    } else if (!isValidEmail(dlForm.email)) {
      e.email = '正しいメールアドレスを入力してください'
    }
    if (Object.keys(e).length > 0) {
      setDlErrors(e)
      return
    }

    setDlError(null)
    setDlLoading(true)
    try {
      // PDF生成ライブラリはクリック時に動的importしてメインバンドルを軽量に保つ
      const { generateResultPdfBlob } = await import('../utils/generateResultPdf')
      const pdfData = {
        companyName: dlForm.companyName.trim(),
        email: dlForm.email.trim(),
        date: new Date().toLocaleDateString('ja-JP'),
        overall: { done: overall.done, total: overall.total, pct: overallPct, color: overallColor },
        advice,
        pages: PAGE_ORDER.map((pageKey) => {
          const page = CHECK_PAGES[pageKey]
          const { items, total, done } = summarize(pageKey)
          const pct = total > 0 ? Math.round((done / total) * 100) : 0
          return {
            title: page.sectionTitle,
            done,
            total,
            pct,
            undone: items.filter((x) => !x.checked).map((x) => x.text),
          }
        }),
      }
      // フォント読み込み等で稀に処理が返らないケースに備えた安全策
      const blob = await Promise.race([
        generateResultPdfBlob(pdfData),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT')), 30000)
        ),
      ])
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'WEB集客診断結果.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF generation failed:', err)
      setDlError('PDFの生成に失敗しました。お手数ですが時間をおいて再度お試しください。')
    } finally {
      setDlLoading(false)
    }
  }

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

      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 5 }}>
        <CtaButton
          color="orange"
          onClick={() => setDownloadOpen((open) => !open)}
          sx={{ width: { xs: '100%', sm: 340 }, px: 0 }}
        >
          → 診断結果をダウンロード
        </CtaButton>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
          ※ダウンロードには貴法人名とメールアドレスの入力が必要です。
        </Typography>
      </Box>

      <Collapse in={downloadOpen}>
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
            診断結果のダウンロード
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            下記にご入力のうえ、ダウンロードへお進みください。（メールアドレスにも診断結果が送信されます。）
          </Typography>
          <Stack spacing={2} sx={{ maxWidth: 420, mx: 'auto', mb: 3 }}>
            <TextField
              label="法人名・園名"
              name="companyName"
              value={dlForm.companyName}
              onChange={handleDlChange}
              error={!!dlErrors.companyName}
              helperText={dlErrors.companyName}
              fullWidth
              placeholder="例：株式会社〇〇"
            />
            <TextField
              label="メールアドレス"
              name="email"
              type="email"
              value={dlForm.email}
              onChange={handleDlChange}
              error={!!dlErrors.email}
              helperText={dlErrors.email}
              fullWidth
              placeholder="例：taro@example.co.jp"
            />
          </Stack>

          {/* 個人情報の取り扱いについて */}
          <Box sx={{ textAlign: 'left', mb: 3 }}>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              color="primary.main"
              sx={{ fontSize: '1.05rem', textAlign: 'center', mb: 2 }}
            >
              個人情報の取り扱いについて
            </Typography>
            <Box
              sx={{
                maxHeight: 180,
                overflowY: 'auto',
                p: 2,
                border: '1px solid',
                borderColor: 'grey.400',
                borderRadius: 1,
                bgcolor: '#f5f6f7',
                '& .MuiTypography-root': { fontSize: '0.8125rem' },
              }}
            >
              <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
                {PRIVACY_POLICY_INTRO}
              </Typography>
              {PRIVACY_POLICY_SECTIONS.map((section, i) => (
                <Box key={i} sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                    {section.heading}
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                    {section.body}
                  </Typography>
                  {section.bullets && (
                    <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 3 }}>
                      {section.bullets.map((b, bi) => (
                        <Typography component="li" variant="body2" key={bi}>
                          {b}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>
              ))}
            </Box>

            <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
              ご提供いただく個人情報は、「個人情報の取り扱いについて」にもとづき適切に取り扱わせていただきます。
              <br />
              上記内容をご同意の上、フォームにご入力ください。
            </Typography>
          </Box>

          <CtaButton
            color="orange"
            onClick={handleDownload}
            disabled={!dlForm.companyName.trim() || !dlForm.email.trim() || dlLoading}
            startIcon={dlLoading ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ width: { xs: '100%', sm: 260 }, px: 0, py: 1.25, fontSize: '0.95rem' }}
          >
            {dlLoading ? 'PDFを生成中...' : '→ ダウンロードする'}
          </CtaButton>

          {dlError && (
            <Typography variant="body2" sx={{ mt: 1.5, color: '#d32f2f', fontWeight: 700 }}>
              {dlError}
            </Typography>
          )}
        </Paper>
      </Collapse>

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
        <CtaButton
          color="blue"
          component="a"
          href="https://yubisui.site/contact/"
          target="_blank"
          rel="noopener noreferrer"
          sx={{ width: { xs: '100%', sm: 340 }, px: 0 }}
        >
          → ゆびすいに無料相談
        </CtaButton>
        <Typography variant="subtitle1" sx={{ color: '#41a3a1', fontSize: '1.35rem', mt: 2 }}>
          WEBサイト制作・改修／Googleマップ整備／SNS導線設計
        </Typography>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Button
          component={RouterLink}
          to="/web-check"
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
