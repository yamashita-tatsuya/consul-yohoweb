import { createContext, useContext, useEffect, useState } from 'react'

const CheckListContext = createContext(null)

// タブを閉じるまで（リロード・タブ復元をまたいで）チェック状態を保持するためのキー
const STORAGE_KEY = 'web-check-checked'

// sessionStorage から初期状態を復元（存在しない・壊れている場合は空）
function loadChecked() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function CheckListProvider({ children }) {
  const [checked, setChecked] = useState(loadChecked)

  // checked の変更を sessionStorage に同期（ブラウザのタブ破棄→復帰時の 0% 表示を防ぐ）
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(checked))
    } catch {
      // ストレージ不可（プライベートモード等）でも診断自体は継続できるよう握りつぶす
    }
  }, [checked])

  const keyOf = (pageKey, gIdx, iIdx) => `${pageKey}-${gIdx}-${iIdx}`

  const isChecked = (pageKey, gIdx, iIdx) => !!checked[keyOf(pageKey, gIdx, iIdx)]

  const toggle = (pageKey, gIdx, iIdx) => {
    const k = keyOf(pageKey, gIdx, iIdx)
    setChecked((prev) => ({ ...prev, [k]: !prev[k] }))
  }

  // 再診断時は state と sessionStorage の両方をクリア（古い回答の復活を防ぐ）
  const reset = () => {
    setChecked({})
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // ストレージ不可でも state のリセットは行われる
    }
  }

  return (
    <CheckListContext.Provider value={{ checked, isChecked, toggle, reset }}>
      {children}
    </CheckListContext.Provider>
  )
}

export function useCheckList() {
  const ctx = useContext(CheckListContext)
  if (!ctx) throw new Error('useCheckList must be used within CheckListProvider')
  return ctx
}
