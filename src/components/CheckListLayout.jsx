import { Container } from '@mui/material'
import CheckListProgress from './CheckListProgress'
import { PageHeader } from './render'

export default function CheckListLayout({ children }) {
  return (
    <Container maxWidth="md" sx={{ py: 5, flex: 1 }}>
      <PageHeader
        title="WEB集客対応チェックリスト"
        description="ホームページ・Googleマップ・SNSの現状を確認し、園児募集に対応できているか確認しましょう。"
      />
      <CheckListProgress />
      {children}
    </Container>
  )
}
