import React, { useCallback, useEffect, useRef, useState } from "react"
import ReactDOM from "react-dom/client"
import {
  MaterialSymbolsChevronLeftRounded,
  MaterialSymbolsChevronRightRounded,
  MaterialSymbolsKeyboardDoubleArrowLeftRounded,
  MaterialSymbolsKeyboardDoubleArrowRightRounded,
  MdiCreditCardMultiple,
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

  const moveToNewWindow = useCallback(
    async (dir: -1 | 0 | 1) => {
      if (!activeTabId) return
      const tabs = await chrome.tabs.query({ currentWindow: true })
      let toBeMoved: chrome.tabs.Tab[] = []
      switch (dir) {
        case -1:
          toBeMoved = tabs.filter((tab) => tab.index < activeTabIndex)
          break
        case 1:
          toBeMoved = tabs.filter((tab) => tab.index > activeTabIndex)
          break
        case 0:
        // toBeMoved = tabs.filter((tab) => tab.index === activeTabIndex)
        default:
          break
      }
      // move tab in popup will not work when the activeTab is moving.
      // move tab in background will be ok.
      chrome.runtime.sendMessage({
        type: "MOVE_TABS_TO_NEW_WINDOW",
        payload: { tabIds: toBeMoved.map((item) => item.id!), dir, activeTabId },
      })
    },
    [activeTabId]
  )

  return {
    activeTabIndex,
    activeTabId,
    error,
    move,
    moveToNewWindow,
  }
}

function App() {
  const inputRef = useRef<HTMLInputElement>(null)
  const { move, moveToNewWindow, error, activeTabIndex, activeTabId } = useTabController()

  useEffect(() => {
    if (!inputRef.current) return
    if (activeTabIndex !== +inputRef.current.value) {
      inputRef.current.value = activeTabIndex + ""
    }
  }, [activeTabIndex])

  if (error) return <div>Error: {error.message}</div>
  if (!activeTabId) return null

  return (
    <div className="container">
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
      <div className="controller">
        <button onClick={() => moveToNewWindow(-1)}>
          <MaterialSymbolsChevronLeftRounded />
          <MdiCreditCardMultiple />
        </button>
        <button
          onClick={() => moveToNewWindow(0)}
          style={{ boxSizing: "content-box", paddingLeft: "1em", paddingRight: "1em" }}
        >
          <MdiCreditCardMultiple />
        </button>
        <button onClick={() => moveToNewWindow(1)}>
          <MdiCreditCardMultiple />
          <MaterialSymbolsChevronRightRounded />
        </button>
      </div>
    </div>
  )
}

const root = ReactDOM.createRoot(document.getElementById("root")!)
root.render(<App />)
