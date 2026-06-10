import MonitorIcon from '@mui/icons-material/Monitor'
import PlaceIcon from '@mui/icons-material/Place'
import CampaignIcon from '@mui/icons-material/Campaign'
import CheckListLayout from './CheckListLayout'
import CheckListSection from './CheckListSection'
import { useCheckList } from '../contexts/CheckListContext'
import { CHECK_PAGES, PAGE_ORDER } from '../data/checkListData'

const RESULT_ROUTE = '/web-check/result'

// 各STEPのアイコン・STEP番号・ルートをここに集約（追加・並び替えはこの1か所で完結）
const PAGE_META = {
  web: { icon: <MonitorIcon />, step: 1, route: '/web-check' },
  google: { icon: <PlaceIcon />, step: 2, route: '/web-check/google' },
  sns: {
    icon: <CampaignIcon />,
    step: 3,
    route: '/web-check/sns',
    nextLabel: '診断結果を確認する',
    nextColor: '#f7894b',
    nextHoverColor: '#41a3a1',
  },
}

export default function CheckListPage({ pageKey }) {
  const { isChecked, toggle } = useCheckList()
  const { sectionTitle, groups } = CHECK_PAGES[pageKey]
  const meta = PAGE_META[pageKey]

  // 前/次の遷移先は PAGE_ORDER の並びから自動導出
  const idx = PAGE_ORDER.indexOf(pageKey)
  const prevTo = idx > 0 ? PAGE_META[PAGE_ORDER[idx - 1]].route : undefined
  const nextTo = idx < PAGE_ORDER.length - 1 ? PAGE_META[PAGE_ORDER[idx + 1]].route : RESULT_ROUTE

  return (
    <CheckListLayout>
      <CheckListSection
        title={sectionTitle}
        icon={meta.icon}
        step={meta.step}
        groups={groups}
        pageKey={pageKey}
        isChecked={isChecked}
        onToggle={toggle}
        prevTo={prevTo}
        nextTo={nextTo}
        nextLabel={meta.nextLabel}
        nextColor={meta.nextColor}
        nextHoverColor={meta.nextHoverColor}
      />
    </CheckListLayout>
  )
}
