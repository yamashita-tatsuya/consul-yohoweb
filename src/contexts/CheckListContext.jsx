import { createContext, useContext, useState } from 'react'

const CheckListContext = createContext(null)

export function CheckListProvider({ children }) {
  const [checked, setChecked] = useState({})

  const keyOf = (pageKey, gIdx, iIdx) => `${pageKey}-${gIdx}-${iIdx}`

  const isChecked = (pageKey, gIdx, iIdx) => !!checked[keyOf(pageKey, gIdx, iIdx)]

  const toggle = (pageKey, gIdx, iIdx) => {
    const k = keyOf(pageKey, gIdx, iIdx)
    setChecked((prev) => ({ ...prev, [k]: !prev[k] }))
  }

  const reset = () => setChecked({})

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
