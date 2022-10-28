import React, { useCallback, useEffect, useRef, useState } from "react"
import ReactDOM from "react-dom/client"
import {
  MaterialSymbolsChevronLeftRounded,
  MaterialSymbolsChevronRightRounded,
  MaterialSymbolsKeyboardDoubleArrowLeftRounded,
  MaterialSymbolsKeyboardDoubleArrowRightRounded,
} from "./icons"

type MoveType = "left" | "right" | "start" | "end" | number

const useTabController = () => {
  const [activeTabId, setActiveTabId] = useState<number | null>(null)
  const [activeTabIndex, setActiveTabIndex] = useState<number>(-1)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const init = async () => {
      const [activeTab] = await chrome.tabs.query({
        currentWindow: true,
        active: true,
      })
      if (!activeTab?.id) {
        setError(new Error("no active tab"))
        return
      }
      setActiveTabIndex(activeTab.index)
      setActiveTabId(activeTab.id)
      chrome.tabs.onMoved.addListener((tabId, moveInfo) => {
        if (tabId === activeTab.id) {
          setActiveTabIndex(moveInfo.toIndex)
        }
      })
    }
    init()
  }, [])

  const move = useCallback(
    async function _move(type: MoveType) {
      if (!activeTabId) return
      let index = 0
      switch (type) {
        case "left":
          index = activeTabIndex - 1
          break
        case "right":
          index = activeTabIndex + 1
          break
        case "start":
          index = 0
          break
        case "end":
          index = -1
          break
        default:
          index = type
      }
      chrome.tabs.move(activeTabId, {
        index,
      })
    },
    [activeTabIndex, activeTabId]
  )

  return {
    activeTabIndex,
    activeTabId,
    error,
    move,
  }
}

function App() {
  const inputRef = useRef<HTMLInputElement>(null)
  const { move, error, activeTabIndex, activeTabId } = useTabController()

  useEffect(() => {
    if (!inputRef.current) return
    if (activeTabIndex !== +inputRef.current.value) {
      inputRef.current.value = activeTabIndex + ""
    }
  }, [activeTabIndex])

  if (error) return <div>Error: {error.message}</div>
  if (!activeTabId) return null

  return (
    <div className="controller">
      <button onClick={() => move("start")}>
        <MaterialSymbolsKeyboardDoubleArrowLeftRounded />
      </button>
      <button onClick={() => move("left")}>
        <MaterialSymbolsChevronLeftRounded />
      </button>
      <input
        ref={inputRef}
        type="number"
        onKeyDown={(e) => {
          if (!inputRef.current) return
          if (e.key === "Enter") {
            move(+inputRef.current.value)
          }
        }}
      ></input>
      <button onClick={() => move("right")}>
        <MaterialSymbolsChevronRightRounded />
      </button>
      <button onClick={() => move("end")}>
        <MaterialSymbolsKeyboardDoubleArrowRightRounded />
      </button>
    </div>
  )
}

const root = ReactDOM.createRoot(document.getElementById("root")!)
root.render(<App />)
