import { useState, useRef } from 'react'
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Stack,
  Chip,
} from '@mui/material'
import { PrimaryButton, SecondaryButton, SectionTitle } from './render'
import AttentionExample from './AttentionExample'
import { REQUEST_PRIVACY_NOTICE } from '../data/privacyPolicy'
import { isValidEmail } from '../utils/validation'
import { isClosedDate } from '../data/formClosedDates'
import dayjs from 'dayjs'
import 'dayjs/locale/ja'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { PickerDay } from '@mui/x-date-pickers/PickerDay'
import * as holiday_jp from '@holiday-jp/holiday_jp'
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

const MAX_ITEMS = 5
const ITEM_NUMS = ['①', '②', '③', '④', '⑤']
const MAX_FILE_SIZE = 1024 * 1024 * 1024 // 1GB

const INITIAL_FORM = {
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  desiredDate: '',
  note: '',
}

const createItem = () => ({ siteUrl: '', description: '', files: [] })

const getMinDesiredDate = () => {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// 土曜=6・日曜=0・祝日・休業日 を判定（dayjs オブジェクトを受け取る）
const isHolidayDate = (d) => holiday_jp.isHoliday(d.toDate())
const isDisabledDate = (d) => {
  const dow = d.day()
  return dow === 0 || dow === 6 || isHolidayDate(d) || isClosedDate(d)
}

// カレンダーの日セル：日曜・祝日・休業日=赤、土曜=青で表示（選択不可日も色で識別できるように）
function ColoredDay(props) {
  const { day } = props
  const dow = day.day()
  const color =
    dow === 0 || isHolidayDate(day) || isClosedDate(day)
      ? '#d32f2f'
      : dow === 6
        ? '#1565c0'
        : undefined
  return (
    <PickerDay
      {...props}
      sx={{
        ...(color ? { color, '&.Mui-disabled': { color, opacity: 0.5 } } : {}),
        // 選択時：薄い青の丸＋濃い文字で見やすく
        '&.Mui-selected': {
          backgroundColor: '#d9edec',
          color: '#2f2725',
          '&:hover, &:focus': { backgroundColor: '#c5e2e0' },
        },
      }}
    />
  )
}

export default function RequestForm({ onConfirm, initialData }) {
  const [form, setForm] = useState(() => {
    if (!initialData) return INITIAL_FORM
    const { items: _items, ...rest } = initialData
    return { ...INITIAL_FORM, ...rest }
  })
  const [items, setItems] = useState(() =>
    initialData?.items?.length ? initialData.items : [createItem()]
  )
  const [errors, setErrors] = useState({})
  const [exampleOpen, setExampleOpen] = useState(false)
  const [fileErrors, setFileErrors] = useState({})
  const fileInputRef = useRef(null)
  const activeItemIdxRef = useRef(0)

  const validate = () => {
    const e = {}
    if (!form.companyName.trim()) e.companyName = '法人名・園名を入力してください'
    if (!form.contactName.trim()) e.contactName = 'ご担当者様名を入力してください'
    if (!form.email.trim()) {
      e.email = 'メールアドレスを入力してください'
    } else if (!isValidEmail(form.email)) {
      e.email = '正しいメールアドレスを入力してください'
    }
    if (form.desiredDate) {
      if (form.desiredDate < getMinDesiredDate()) {
        e.desiredDate = '本日より1週間後以降の日付をご指定ください'
      } else if (isDisabledDate(dayjs(form.desiredDate))) {
        e.desiredDate = '土日・祝日・休業日は指定できません'
      }
    }
    const itemErrors = items.map((item) => {
      const ie = {}
      if (!item.siteUrl.trim()) ie.siteUrl = '対象ページのURLを入力してください'
      if (!item.description.trim()) ie.description = '修正箇所・変更内容を入力してください'
      return ie
    })
    if (itemErrors.some((ie) => Object.keys(ie).length > 0)) e.items = itemErrors
    return e
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleDateChange = (value) => {
    const next = value && value.isValid() ? value.format('YYYY-MM-DD') : ''
    setForm((prev) => ({ ...prev, desiredDate: next }))
    if (errors.desiredDate) setErrors((prev) => ({ ...prev, desiredDate: '' }))
  }

  const handleItemChange = (idx, e) => {
    const { name, value } = e.target
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [name]: value } : it)))
    if (errors.items?.[idx]?.[name]) {
      setErrors((prev) => {
        const nextItems = prev.items ? [...prev.items] : []
        nextItems[idx] = { ...(nextItems[idx] || {}), [name]: '' }
        return { ...prev, items: nextItems }
      })
    }
  }

  const handleAddItem = () => {
    setItems((prev) => (prev.length >= MAX_ITEMS ? prev : [...prev, createItem()]))
  }

  const handleRemoveItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx))
    setErrors((prev) => {
      if (!prev.items) return prev
      const nextItems = prev.items.filter((_, i) => i !== idx)
      return { ...prev, items: nextItems }
    })
    setFileErrors((prev) => {
      const next = {}
      Object.keys(prev).forEach((k) => {
        const i = Number(k)
        if (i < idx) next[i] = prev[k]
        else if (i > idx) next[i - 1] = prev[k]
      })
      return next
    })
  }

  const openFilePicker = (idx) => {
    activeItemIdxRef.current = idx
    fileInputRef.current?.click()
  }

  const handleFileAdd = (e) => {
    const selected = Array.from(e.target.files)
    const idx = activeItemIdxRef.current
    const accepted = selected.filter((f) => f.size <= MAX_FILE_SIZE)
    const rejected = selected.filter((f) => f.size > MAX_FILE_SIZE)
    if (accepted.length > 0) {
      setItems((prev) =>
        prev.map((it, i) => (i === idx ? { ...it, files: [...it.files, ...accepted] } : it))
      )
    }
    setFileErrors((prev) => ({
      ...prev,
      [idx]:
        rejected.length > 0
          ? `1ファイルあたり1GBまでです。次のファイルは添付できません：${rejected
              .map((f) => f.name)
              .join('、')}`
          : '',
    }))
    e.target.value = ''
  }

  const handleFileRemove = (itemIdx, fileIdx) => {
    setItems((prev) =>
      prev.map((it, i) =>
        i === itemIdx ? { ...it, files: it.files.filter((_, fi) => fi !== fileIdx) } : it
      )
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    onConfirm({ ...form, items })
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      {/* 依頼者情報 */}
      <Paper elevation={0} sx={{ p: { xs: 3, sm: 4.5 }, mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <SectionTitle icon={<Business />}>依頼者情報</SectionTitle>
        <Stack spacing={2.5}>
          <TextField
            label="法人名・園名"
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
            label="ご担当者様名"
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
            <Box sx={{ flex: '1 1 260px' }}>
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
                placeholder="例：taro@example.co.jp"
              />
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.primary' }}>
                ※受付完了の自動返信、および更新完了のご連絡をお送りします。
              </Typography>
            </Box>
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
      <Paper elevation={0} sx={{ p: { xs: 3, sm: 4.5 }, mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <SectionTitle icon={<Build />}>依頼内容</SectionTitle>
        <Box
          sx={{
            mb: 2.5,
            p: 2,
            border: '2px solid',
            borderColor: '#41a3a1',
            borderRadius: 1,
          }}
        >
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            <Box component="span" sx={{ fontWeight: 700 }}>● ご依頼時のお願い</Box>
            <br />
            修正箇所・変更内容は、「どのページ（URL）の」「どの部分を」「どのように変更したいか」が分かるよう、具体的にご入力ください。ページを跨ぐ場合は、「＋修正内容を追加」ボタンより、別修正としてご入力ください。
            <br />
            <Box
              component="span"
              onClick={() => setExampleOpen(true)}
              sx={{
                color: 'primary.main',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontWeight: 700,
                fontSize: '0.8125rem',
                '&:hover': { color: '#41a3a1' },
              }}
            >
              →記載例をみる
            </Box>
          </Typography>
          <Typography variant="body2">
            <Box component="span" sx={{ fontWeight: 700 }}>● 写真差し替え・追加時のお願い</Box>
            <br />
            写真の差し替え・追加をご希望の場合は、<Box component="span" sx={{ color: '#d32f2f' }}>掲載許可をご確認いただいたうえで、お写真をご提供ください。</Box>なお、掲載可否の確認は事前にお客様自身でお願いいたします。
            <br />
            ※1GBを超えるファイルを添付したい場合は、こちらで添付せずに備考欄にその旨をご記載ください。別途、共有方法についてご案内いたします。
          </Typography>
        </Box>

        <Stack spacing={2}>
          {items.map((item, idx) => {
            const itemError = errors.items?.[idx] || {}
            return (
              <Box
                key={idx}
                sx={{
                  p: { xs: 2, sm: 2.5 },
                  border: '1px solid',
                  borderColor: 'grey.400',
                  borderRadius: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    修正内容{ITEM_NUMS[idx]}
                  </Typography>
                  {idx > 0 && (
                    <Typography
                      component="span"
                      onClick={() => handleRemoveItem(idx)}
                      sx={{
                        color: '#d52b15',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        '&:hover': { color: '#f7894b' },
                      }}
                    >
                      － この修正内容を削除
                    </Typography>
                  )}
                </Box>
                <Stack spacing={2.5}>
                  <TextField
                    label="対象ページのURL"
                    name="siteUrl"
                    value={item.siteUrl}
                    onChange={(e) => handleItemChange(idx, e)}
                    error={!!itemError.siteUrl}
                    helperText={itemError.siteUrl}
                    required
                    fullWidth
                    placeholder="例：https://www.example.co.jp"
                  />

                  <Box>
                    <TextField
                      label="修正箇所・変更内容"
                      name="description"
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, e)}
                      error={!!itemError.description}
                      helperText={itemError.description}
                      required
                      fullWidth
                      multiline
                      minRows={5}
                      placeholder={
                        '例：園の紹介ページの一番下の写真を、添付した写真に差し替えたい\n\n' +
                        '※画像・参考資料など必要がありましたら添付資料に添付してください。\n' +
                        '※画像が複数枚ある場合は、「＋修正内容を追加」ボタンより修正内容を追加し、それぞれの箇所へ添付いただくか、同ページ内なら複数添付も可能です。複数添付する場合は、HPのどこの画像か分かるように、変更内容欄への説明やデータのタイトルを変更するなど、分かる形でご共有ください。'
                      }
                      sx={{ '& textarea::placeholder': { fontSize: '0.75rem', opacity: 0.7 } }}
                    />
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.primary' }}>
                      ※具体的にご記入ください。
                    </Typography>
                  </Box>

                  {/* ファイル添付 */}
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                      添付資料（任意）
                    </Typography>

                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AttachFile />}
                      onClick={() => openFilePicker(idx)}
                    >
                      ファイルを選択
                    </Button>
                    <Box sx={{ mb: 1.5 }} />

                    {fileErrors[idx] && (
                      <Typography variant="caption" sx={{ display: 'block', mb: 1.5, color: '#d32f2f', fontWeight: 700 }}>
                        {fileErrors[idx]}
                      </Typography>
                    )}

                    {item.files.length > 0 && (
                      <Stack direction="row" flexWrap="wrap" gap={1}>
                        {item.files.map((f, fi) => (
                          <Chip
                            key={fi}
                            label={f.name}
                            size="small"
                            onDelete={() => handleFileRemove(idx, fi)}
                            deleteIcon={<Close />}
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    )}
                  </Box>
                </Stack>
              </Box>
            )
          })}
        </Stack>

        <input
          type="file"
          ref={fileInputRef}
          multiple
          style={{ display: 'none' }}
          onChange={handleFileAdd}
          accept="image/*,.pdf,.xlsx,.xls,.docx,.doc,.txt"
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <SecondaryButton onClick={handleAddItem} disabled={items.length >= MAX_ITEMS}>
            ＋ 修正内容を追加
          </SecondaryButton>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            更新希望日（任意）
          </Typography>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ja">
            <DatePicker
              value={form.desiredDate ? dayjs(form.desiredDate) : null}
              onChange={handleDateChange}
              minDate={dayjs(getMinDesiredDate())}
              shouldDisableDate={isDisabledDate}
              format="YYYY/MM/DD"
              slots={{ day: ColoredDay }}
              slotProps={{
                textField: {
                  name: 'desiredDate',
                  error: !!errors.desiredDate,
                  helperText: errors.desiredDate,
                  sx: { width: { xs: '100%', sm: 240 } },
                },
              }}
            />
          </LocalizationProvider>
          <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: 'text.primary' }}>
            ※ご希望がある場合のみご入力ください。ご希望がない場合は、受付日の翌営業日～5営業日程度を目安に更新いたします。
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.primary' }}>
            ※希望日は本日より1週間以降の日付をご指定ください。大きな修正など、内容によってご希望に沿えない場合もありますのでご了承ください。
            <br />
            ※土日、祝日、夏季休業、年末年始は対応できませんのでご了承ください。
          </Typography>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            備考
          </Typography>
          <TextField
            name="note"
            value={form.note}
            onChange={handleChange}
            fullWidth
            multiline
            minRows={4}
          />
        </Box>
      </Paper>

      {/* 個人情報の取り扱いについて */}
      <Paper elevation={0} sx={{ p: { xs: 3, sm: 4.5 }, mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <SectionTitle icon={<Person />}>個人情報の取り扱いについて</SectionTitle>
        <Box
          sx={{
            p: 2,
            border: '1px solid',
            borderColor: 'grey.400',
            borderRadius: 1,
            bgcolor: '#f5f6f7',
            '& .MuiTypography-root': { fontSize: '0.8125rem' },
          }}
        >
          <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
            {REQUEST_PRIVACY_NOTICE}
          </Typography>
        </Box>

        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
          ご提供いただく個人情報は、「個人情報の取り扱いについて」にもとづき適切に取り扱わせていただきます。
          <br />
          上記内容をご同意の上、フォームにご記入ください。
        </Typography>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <PrimaryButton type="submit">送信内容の確認</PrimaryButton>
      </Box>

      <AttentionExample open={exampleOpen} onClose={() => setExampleOpen(false)} />
    </Box>
  )
}
