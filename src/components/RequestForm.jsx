import { useState, useRef } from 'react'
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  Stack,
  Chip,
  FormHelperText,
} from '@mui/material'
import {
  Send,
  AttachFile,
  Close,
  Business,
  Person,
  Email,
  Phone,
  Language,
  Build,
  PriorityHigh,
  Description,
} from '@mui/icons-material'

const REQUEST_TYPES = [
  { value: 'bug', label: 'バグ修正' },
  { value: 'design', label: 'デザイン変更' },
  { value: 'content', label: 'コンテンツ更新' },
  { value: 'feature', label: '機能追加' },
  { value: 'other', label: 'その他' },
]

const PRIORITIES = [
  { value: 'high', label: '高（早急な対応が必要）' },
  { value: 'medium', label: '中（通常対応）' },
  { value: 'low', label: '低（余裕があるときに）' },
]

const INITIAL_FORM = {
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  siteUrl: '',
  requestType: '',
  priority: 'medium',
  description: '',
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
  })
}

function SectionTitle({ icon, children }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 1 }}>
      <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
      <Typography variant="subtitle1" fontWeight={600} color="primary.main">
        {children}
      </Typography>
    </Box>
  )
}

export default function RequestForm({ onSubmitSuccess }) {
  const [form, setForm] = useState(INITIAL_FORM)
  const [files, setFiles] = useState([])
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState(null)
  const fileInputRef = useRef(null)

  const validate = () => {
    const e = {}
    if (!form.companyName.trim()) e.companyName = '会社名を入力してください'
    if (!form.contactName.trim()) e.contactName = '担当者名を入力してください'
    if (!form.email.trim()) {
      e.email = 'メールアドレスを入力してください'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = '正しいメールアドレスを入力してください'
    }
    if (!form.siteUrl.trim()) e.siteUrl = '対象サイトURLを入力してください'
    if (!form.requestType) e.requestType = '修正種別を選択してください'
    if (!form.description.trim()) e.description = '依頼内容を入力してください'
    return e
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleFileAdd = (e) => {
    const added = Array.from(e.target.files)
    setFiles((prev) => [...prev, ...added])
    e.target.value = ''
  }

  const handleFileRemove = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setLoading(true)
    setApiError(null)

    try {
      const payload = { ...form }

      if (files.length > 0) {
        payload.attachments = await Promise.all(
          files.map(async (f) => ({
            name: f.name,
            type: f.type,
            data: await fileToBase64(f),
          }))
        )
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

      onSubmitSuccess(form)
    } catch (err) {
      setApiError(err.message || '送信に失敗しました。しばらくたってから再試行してください。')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      {apiError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setApiError(null)}>
          {apiError}
        </Alert>
      )}

      {/* 顧客情報 */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <SectionTitle icon={<Business />}>顧客情報</SectionTitle>
        <Stack spacing={2.5}>
          <TextField
            label="会社名"
            name="companyName"
            value={form.companyName}
            onChange={handleChange}
            error={!!errors.companyName}
            helperText={errors.companyName}
            required
            fullWidth
            placeholder="例：株式会社〇〇"
          />
          <TextField
            label="担当者名"
            name="contactName"
            value={form.contactName}
            onChange={handleChange}
            error={!!errors.contactName}
            helperText={errors.contactName}
            required
            fullWidth
            placeholder="例：山田 太郎"
          />
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="メールアドレス"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              required
              fullWidth
              sx={{ flex: '1 1 260px' }}
              placeholder="例：taro@example.co.jp"
            />
            <TextField
              label="電話番号"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              fullWidth
              sx={{ flex: '1 1 200px' }}
              placeholder="例：06-1234-5678"
            />
          </Box>
        </Stack>
      </Paper>

      {/* 依頼内容 */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <SectionTitle icon={<Build />}>依頼内容</SectionTitle>
        <Stack spacing={2.5}>
          <TextField
            label="対象サイトURL"
            name="siteUrl"
            value={form.siteUrl}
            onChange={handleChange}
            error={!!errors.siteUrl}
            helperText={errors.siteUrl}
            required
            fullWidth
            placeholder="例：https://www.example.co.jp"
          />

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl
              error={!!errors.requestType}
              required
              size="small"
              sx={{ flex: '1 1 220px' }}
            >
              <InputLabel>修正種別</InputLabel>
              <Select
                name="requestType"
                value={form.requestType}
                label="修正種別"
                onChange={handleChange}
              >
                {REQUEST_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.requestType && (
                <FormHelperText>{errors.requestType}</FormHelperText>
              )}
            </FormControl>

            <FormControl sx={{ flex: '1 1 300px' }}>
              <FormLabel
                sx={{ fontSize: '0.75rem', mb: 0.5, color: 'text.secondary' }}
              >
                優先度 <span style={{ color: 'red' }}>*</span>
              </FormLabel>
              <RadioGroup
                row
                name="priority"
                value={form.priority}
                onChange={handleChange}
              >
                {PRIORITIES.map((p) => (
                  <FormControlLabel
                    key={p.value}
                    value={p.value}
                    control={<Radio size="small" />}
                    label={
                      <Typography variant="body2">
                        {p.value === 'high' ? '高' : p.value === 'medium' ? '中' : '低'}
                      </Typography>
                    }
                  />
                ))}
              </RadioGroup>
              <Typography variant="caption" color="text.secondary">
                {PRIORITIES.find((p) => p.value === form.priority)?.label}
              </Typography>
            </FormControl>
          </Box>

          <TextField
            label="依頼内容"
            name="description"
            value={form.description}
            onChange={handleChange}
            error={!!errors.description}
            helperText={
              errors.description ||
              '修正箇所・現状・希望する状態をできるだけ詳しくご記入ください'
            }
            required
            fullWidth
            multiline
            minRows={5}
            placeholder="例：トップページのバナー画像が崩れて表示されています。&#10;対象ページ：https://...&#10;発生環境：Chrome / Windows 11&#10;希望対応：正しく表示されるよう修正してほしい"
          />
        </Stack>
      </Paper>

      {/* ファイル添付 */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, border: '1px solid', borderColor: 'divider' }}>
        <SectionTitle icon={<AttachFile />}>ファイル添付（任意）</SectionTitle>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          スクリーンショット・参考資料などを添付できます
        </Typography>

        <Button
          variant="outlined"
          size="small"
          startIcon={<AttachFile />}
          onClick={() => fileInputRef.current?.click()}
          sx={{ mb: 2 }}
        >
          ファイルを選択
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          multiple
          style={{ display: 'none' }}
          onChange={handleFileAdd}
          accept="image/*,.pdf,.xlsx,.xls,.docx,.doc,.txt"
        />

        {files.length > 0 && (
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {files.map((f, i) => (
              <Chip
                key={i}
                label={f.name}
                size="small"
                onDelete={() => handleFileRemove(i)}
                deleteIcon={<Close />}
                variant="outlined"
              />
            ))}
          </Stack>
        )}
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          type="submit"
          variant="contained"
          size="large"
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Send />}
          disabled={loading}
          sx={{ px: 6, py: 1.5, fontSize: '1rem' }}
        >
          {loading ? '送信中...' : '送信する'}
        </Button>
      </Box>
    </Box>
  )
}
