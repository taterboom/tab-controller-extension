chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  if (request.type === "MOVE_TABS_TO_NEW_WINDOW") {
    const tabIds = request.payload?.tabIds
    const activeTabId = request.payload?.activeTabId
    const dir = request.payload?.dir
    const newWindow = await chrome.windows.create({ tabId: activeTabId })
    if (dir === 0) return
    if (tabIds.length === 0) return
    if (dir === -1) {
      chrome.tabs.move(tabIds, { windowId: newWindow.id, index: 0 })
    }
    if (dir === 1) {
      chrome.tabs.move(tabIds, { windowId: newWindow.id, index: 1 })
    }
  }
})
