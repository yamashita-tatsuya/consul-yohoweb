import { useEffect, useRef } from 'react'
import { Box, LinearProgress, Typography } from '@mui/material'
import { useLocation } from 'react-router-dom'
import { PAGE_ORDER } from '../data/checkListData'

// 現在表示中のページ（何ページ目か）で進捗を表す
const CURRENT_BY_PATH = {
  '/web-check': 1,
  '/web-check/google': 2,
  '/web-check/sns': 3,
  '/web-check/result': PAGE_ORDER.length,
}

export default function CheckListProgress() {
  const { pathname } = useLocation()

  const total = PAGE_ORDER.length
  const current = CURRENT_BY_PATH[pathname] ?? 1
  const value = total === 0 ? 0 : (current / total) * 100

  // ページ切り替え時のスクロール
  // 最初のページ（/checklist）はヘッダーから、それ以外は「n/3ページ・進捗バー」の位置から表示する
  const rootRef = useRef(null)
  useEffect(() => {
    if (pathname === '/web-check') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [pathname])

  return (
    <Box ref={rootRef} sx={{ mb: 4, scrollMarginTop: 16 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mb: 1 }}>
        <Typography variant="body2" fontWeight={700} color="primary.main">
          {current}/{total}ページ
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={value}
        sx={{ height: 10, borderRadius: 5 }}
      />
    </Box>
  )
}
