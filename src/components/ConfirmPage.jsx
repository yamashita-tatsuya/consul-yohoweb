import { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  Divider,
  Alert,
  Button,
  CircularProgress,
} from '@mui/material'
import { InsertDriveFile } from '@mui/icons-material'
import { PrimaryButton } from './render'

const ITEM_NUMS = ['①', '②', '③', '④', '⑤']

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
  })
}

export default function ConfirmPage({ formData, onBack, onSubmitted }) {
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState(null)

  const handleSubmit = async () => {
    setLoading(true)
    setApiError(null)
    try {
      const payload = {
        companyName: formData.companyName,
        contactName: formData.contactName,
        email: formData.email,
        phone: formData.phone,
        desiredDate: formData.desiredDate,
        note: formData.note,
        items: await Promise.all(
          (formData.items || []).map(async (it) => ({
            siteUrl: it.siteUrl,
            description: it.description,
            attachments:
              it.files?.length > 0
                ? await Promise.all(
                    it.files.map(async (f) => ({
                      name: f.name,
                      type: f.type,
                      data: await fileToBase64(f),
                    }))
                  )
                : [],
          }))
        ),
      }

      const endpoint = import.meta.env.VITE_API_ENDPOINT
      if (!endpoint) throw new Error('API エンドポイントが設定されていません（.env を確認してください）')

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.text().catch(() => '')
        throw new Error(`送信エラー (${res.status})${body ? ': ' + body : ''}`)
      }

      onSubmitted(formData)
    } catch (err) {
      setApiError(err.message || '送信に失敗しました。しばらくたってから再試行してください。')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 5, flex: 1 }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3, textAlign: 'center' }}>
        送信内容の確認
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
        以下の内容で送信します。よろしければ「送信する」ボタンを押してください。
      </Typography>

      {apiError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setApiError(null)}>
          {apiError}
        </Alert>
      )}

      <Paper elevation={0} sx={{ p: { xs: 3, sm: 4.5 }, mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          依頼者情報
        </Typography>
        <Stack spacing={1} divider={<Divider />}>
          <Row label="法人名・園名" value={formData.companyName} />
          <Row label="ご担当者様名" value={formData.contactName} />
          <Row label="メールアドレス" value={formData.email} />
          {formData.phone && <Row label="電話番号" value={formData.phone} />}
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: { xs: 3, sm: 4.5 }, mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          依頼内容
        </Typography>
        {(formData.items || []).map((item, idx) => (
          <Box key={idx} sx={{ mb: 2.5, p: 2, border: '1px solid', borderColor: 'grey.400', borderRadius: 1 }}>
            <Typography fontWeight={700} sx={{ mb: 1 }}>
              修正内容{ITEM_NUMS[idx]}
            </Typography>
            <Stack spacing={1} divider={<Divider />}>
              <Row label="対象ページのURL" value={item.siteUrl} />
              <Row label="修正箇所・変更内容" value={item.description} />
              {item.files?.length > 0 && <AttachmentRow files={item.files} />}
            </Stack>
          </Box>
        ))}

        <Stack spacing={1} divider={<Divider />} sx={{ mt: 2 }}>
          {formData.desiredDate && <Row label="更新希望日" value={formData.desiredDate} />}
          {formData.note && <Row label="備考" value={formData.note} />}
        </Stack>
      </Paper>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          size="large"
          onClick={onBack}
          disabled={loading}
          sx={{ px: 4, bgcolor: '#fff', '&:hover': { bgcolor: '#fff' } }}
        >
          戻って修正する
        </Button>
        <PrimaryButton
          onClick={handleSubmit}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
          disabled={loading}
        >
          {loading ? '送信中...' : 'この内容で送信する'}
        </PrimaryButton>
      </Box>
    </Container>
  )
}

function Row({ label, value }) {
  return (
    <Box sx={{ display: 'flex', gap: 2, py: 0.5 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500} sx={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap', flex: 1 }}>
        {value}
      </Typography>
    </Box>
  )
}

const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|bmp|svg)$/i

const isImageFile = (f) => f.type?.startsWith('image/') || IMAGE_EXT_RE.test(f.name)

function AttachmentRow({ files }) {
  // 画像ファイルはサムネイル用のプレビューURLを生成。
  // StrictModeのeffect二重実行に対応するため、URL生成・破棄はeffect内で完結させる。
  const [urls, setUrls] = useState({})

  useEffect(() => {
    const created = {}
    files.forEach((f, i) => {
      if (isImageFile(f)) created[i] = URL.createObjectURL(f)
    })
    setUrls(created)
    return () => {
      Object.values(created).forEach((url) => URL.revokeObjectURL(url))
    }
  }, [files])

  return (
    <Box sx={{ display: 'flex', gap: 2, py: 0.5 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
        添付資料
      </Typography>
      <Stack spacing={1} sx={{ flex: 1 }}>
        {files.map((f, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {urls[i] ? (
              <Box
                component="img"
                src={urls[i]}
                alt={f.name}
                sx={{
                  width: 56,
                  height: 56,
                  objectFit: 'cover',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'grey.300',
                  flexShrink: 0,
                }}
              />
            ) : (
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'grey.300',
                  bgcolor: 'grey.100',
                  color: 'text.secondary',
                  flexShrink: 0,
                }}
              >
                <InsertDriveFile fontSize="small" />
              </Box>
            )}
            <Typography variant="body2" fontWeight={500} sx={{ wordBreak: 'break-all' }}>
              {f.name}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  )
}
