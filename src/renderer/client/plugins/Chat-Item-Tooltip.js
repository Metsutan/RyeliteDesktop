// src/ChatItemTooltip.ts
import { Plugin, SettingsTypes, UIManager } from "@ryelite/core";
var ChatItemTooltip = class extends Plugin {
  constructor() {
    super();
    this.pluginName = "Chat Item Tooltip";
    this.author = "JayArrowz & Answerth";
    //TODO: Move all CSS to resources CSS file
    this.processedIds = /* @__PURE__ */ new Set();
    this.currentTooltip = null;
    this.isCtrlPressed = false;
    this.inventoryOverlays = [];
    this.overlaysCreated = false;
    this.uiManager = new UIManager();
    this.eventListeners = [];
    this.debugEl = null;
    this.settings.enabled = {
      text: "Enable Chat Item Tooltips",
      type: SettingsTypes.checkbox,
      value: true,
      callback: () => {
        if (this.settings.enabled.value) {
          this.initializePlugin();
        } else {
          this.disablePlugin();
        }
      }
    };
    this.settings.enableInventoryLinking = {
      text: "Enable Inventory Item Linking",
      type: SettingsTypes.checkbox,
      value: true,
      callback: () => {
      }
    };
    this.settings.showItemName = {
      text: "Show Item Names",
      type: SettingsTypes.checkbox,
      value: true,
      callback: () => {
      }
    };
    this.settings.showDebug = {
      text: "Tooltip Debug",
      type: SettingsTypes.checkbox,
      value: false,
      callback: () => {
        if (this.settings.showDebug.value) this.createDebug();
        else this.removeDebug();
      }
    };
  }
  start() {
    this.addCSSStyles();
    this.addEventListeners();
  }
  init() {
    this.log("ChatItemTooltip initialised");
  }
  SocketManager_loggedIn() {
    this.log("Player logged in - resetting chat tooltip state");
    this.processedIds.clear();
    const processedElements = document.querySelectorAll(
      "[data-chat-tooltip-processed]"
    );
    processedElements.forEach((element) => {
      element.removeAttribute("data-chat-tooltip-processed");
    });
    const existingLinks = document.querySelectorAll(".hs-item-link");
    existingLinks.forEach((link) => {
      if (link.parentNode) {
        const textNode = document.createTextNode(
          link.textContent || ""
        );
        link.parentNode.replaceChild(textNode, link);
      }
    });
    this.log("Chat tooltip state reset complete");
  }
  SocketManager_handleLoggedOut() {
    this.log("Player logged out - cleaning up chat tooltip state");
    this.processedIds.clear();
    this.hideTooltip();
    this.hideInventoryOverlays();
    this.isCtrlPressed = false;
    this.log("Chat tooltip cleanup complete");
  }
  GameLoop_draw() {
    if (!this.settings.enabled?.value) return;
    this.scanChat();
    this.updateDebug();
  }
  scanChat() {
    const chatList = this.gameHooks?.UIManager?._manager?._controller?._chatMenuController?._chatMenuQuadrant?.getChatMenu()?.getChatMessages();
    if (!chatList) return;
    for (const msgObj of chatList) {
      const id = msgObj._id;
      if (this.processedIds.has(id)) continue;
      this.processedIds.add(id);
      this.processMessage(msgObj);
    }
  }
  processMessage(msgObj) {
    const container = msgObj._container || msgObj._message?._span?.parentElement;
    if (!container) return;
    const regex = /\[(\d+)\]/g;
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null
    );
    const textNodes = [];
    while (walker.nextNode()) {
      const tn = walker.currentNode;
      if (regex.test(tn.data)) textNodes.push(tn);
    }
    textNodes.forEach((tn) => {
      const frag = document.createDocumentFragment();
      let lastIndex = 0;
      tn.data.replace(regex, (match, num, offset) => {
        if (offset > lastIndex) {
          frag.appendChild(
            document.createTextNode(
              tn.data.slice(lastIndex, offset)
            )
          );
        }
        const id = parseInt(num, 10);
        let displayText = match;
        try {
          const itemDef = this.gameHooks.ItemDefinitionManager._itemDefMap.get(
            id
          );
          if (itemDef && itemDef._name) {
            displayText = `[${itemDef._name}]`;
          }
        } catch (error) {
          this.log(`Error getting item name for ID ${id}: ${error}`);
        }
        const span = document.createElement("span");
        span.className = "hs-item-link";
        span.dataset.itemId = num;
        span.textContent = displayText;
        span.style.cursor = "pointer";
        span.style.color = "#4a9eff";
        span.style.textDecoration = "underline";
        span.style.textDecorationStyle = "dotted";
        span.addEventListener(
          "mouseenter",
          (e) => this.showTooltip(span, e)
        );
        span.addEventListener("mouseleave", () => this.hideTooltip());
        frag.appendChild(span);
        lastIndex = offset + match.length;
        return match;
      });
      if (lastIndex < tn.data.length) {
        frag.appendChild(
          document.createTextNode(tn.data.slice(lastIndex))
        );
      }
      tn.parentNode?.replaceChild(frag, tn);
    });
  }
  addCSSStyles() {
    const style = document.createElement("style");
    style.setAttribute("data-chat-tooltip", "true");
    style.textContent = `
            .hs-item-tooltip {
                background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
                border: 2px solid #4a9eff;
                border-radius: 8px;
                padding: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.7);
                font-family: 'Arial', sans-serif;
                font-size: 12px;
                max-width: 250px;
                min-width: 200px;
            }
            
            .hs-inventory-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(74, 158, 255, 0.3);
                border: 2px solid #4a9eff;
                border-radius: 4px;
                cursor: pointer;
                z-index: 1000;
                display: none;
                pointer-events: none;
            }
            
            .hs-inventory-overlay.show {
                display: block;
                pointer-events: all;
            }
            
            .hs-inventory-overlay:hover {
                background: rgba(74, 158, 255, 0.5);
            }
            
            .hs-inventory-overlay::after {
                content: '\u{1F517}';
                position: absolute;
                top: 2px;
                right: 2px;
                font-size: 12px;
                color: #4a9eff;
                text-shadow: 0 0 2px rgba(0, 0, 0, 0.8);
            }
            
            .hs-item-tooltip-header {
                display: flex;
                align-items: center;
                margin-bottom: 8px;
                gap: 8px;
            }
            
            .hs-item-tooltip-sprite {
                background-position: 0rem 0rem;
                background-repeat: no-repeat;
                background-size: var(--hs-url-inventory-items-width) var(--hs-url-inventory-items-height);
                background-image: var(--hs-url-inventory-items);
                height: var(--hs-inventory-item-size);
                width: var(--hs-inventory-item-size);
                border: 1px solid #555;
                border-radius: 4px;
                flex-shrink: 0;
            }
            
            .hs-item-tooltip-title {
                flex: 1;
            }
            
            .hs-item-tooltip-name {
                color: #ffffff;
                font-weight: bold;
                font-size: 14px;
                margin-bottom: 2px;
            }
            
            .hs-item-tooltip-id {
                color: #888;
                font-size: 10px;
            }
            
            .hs-item-tooltip-description {
                color: #cccccc;
                font-style: italic;
                margin-bottom: 6px;
                line-height: 1.3;
            }
            
            .hs-item-tooltip-section {
                margin-bottom: 4px;
                font-size: 11px;
            }
            
            .hs-item-tooltip-label {
                color: #aaaaaa;
                font-weight: bold;
            }
            
            .hs-item-tooltip-value {
                color: #ffffff;
            }
            
            .hs-item-tooltip-cost {
                color: #ffd700;
                font-weight: bold;
            }
            
            .hs-item-tooltip-requirement {
                color: #ff6b6b;
                font-size: 10px;
            }
            
            .hs-item-tooltip-effect {
                color: #4ecdc4;
                font-size: 10px;
            }
            
            .hs-item-tooltip-tags {
                display: flex;
                gap: 4px;
                flex-wrap: wrap;
                margin-top: 6px;
            }
            
            .hs-item-tooltip-tag {
                background: #333;
                color: #ccc;
                padding: 2px 4px;
                border-radius: 3px;
                font-size: 9px;
            }
            
            .hs-item-tooltip-tag.members {
                background: #4a9eff;
                color: white;
            }
            
            .hs-item-tooltip-tag.stackable {
                background: #2ecc71;
                color: white;
            }
            
            .hs-item-tooltip-tag.tradeable {
                background: #f39c12;
                color: white;
            }
            
            .hs-item-tooltip-tag.iou {
                background: #ffd700;
                color: black;
            }
            
            .hs-item-link:hover {
                color: #66b3ff !important;
                text-shadow: 0 0 2px #4a9eff;
            }
        `;
    document.head.appendChild(style);
  }
  showTooltip(anchor, event) {
    const idStr = anchor.dataset.itemId;
    if (!idStr) return;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) return;
    let x = 0;
    let y = 0;
    if (event) {
      x = event.clientX;
      y = event.clientY;
    } else {
      const rect = anchor.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top;
    }
    if (this.currentTooltip) {
      this.currentTooltip.hide();
    }
    try {
      this.currentTooltip = this.uiManager.drawItemTooltip(id, x, y);
    } catch (error) {
      this.log(`Error showing tooltip: ${error}`);
    }
  }
  hideTooltip() {
    if (this.currentTooltip) {
      this.currentTooltip.hide();
      this.currentTooltip = null;
    }
  }
  stop() {
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners = [];
    this.hideTooltip();
    this.removeDebug();
    this.cleanupInventoryOverlays();
  }
  createDebug() {
    if (this.debugEl) return;
    this.debugEl = document.createElement("div");
    Object.assign(this.debugEl.style, {
      position: "fixed",
      bottom: "10px",
      left: "10px",
      background: "rgba(0, 0, 0, 0.8)",
      color: "#00ff00",
      padding: "8px",
      fontSize: "11px",
      fontFamily: "monospace",
      zIndex: "30000",
      borderRadius: "4px",
      border: "1px solid #333",
      maxWidth: "250px"
    });
    document.body.appendChild(this.debugEl);
  }
  removeDebug() {
    if (this.debugEl) {
      this.debugEl.remove();
      this.debugEl = null;
    }
  }
  updateDebug() {
    if (!this.debugEl) return;
    const chatList = this.gameHooks?.UIManager?._manager?._controller?._chatMenuController?._chatMenuQuadrant?.getChatMenu()?.getChatMessages();
    let currentItemInfo = "none";
    try {
      const uiManager = this.gameHooks?.UIManager;
      const currentTooltipItemId = uiManager?.getCurrentItemTooltipId();
      if (currentTooltipItemId) {
        const itemDef = this.gameHooks.ItemDefinitionManager._itemDefMap.get(
          currentTooltipItemId
        );
        if (itemDef) {
          currentItemInfo = `${currentTooltipItemId} (${itemDef._nameCapitalized || itemDef._name})`;
        } else {
          currentItemInfo = `${currentTooltipItemId} (not found)`;
        }
      }
    } catch (error) {
    }
    let inventoryItemCount = 0;
    try {
      const inventoryItems = this.gameHooks?.EntityManager?.Instance?.MainPlayer?.Inventory?.Items;
      if (inventoryItems) {
        inventoryItemCount = inventoryItems.filter(
          (item) => item && item._def
        ).length;
      }
    } catch (error) {
    }
    const debugInfo = [
      `ChatItemTooltip Debug`,
      `Enabled: ${this.settings.enabled?.value}`,
      `Inventory Linking: ${this.settings.enableInventoryLinking?.value}`,
      `Ctrl Pressed: ${this.isCtrlPressed}`,
      `Overlays Created: ${this.overlaysCreated}`,
      `Inventory Items: ${inventoryItemCount}`,
      `Active Overlays: ${this.inventoryOverlays.length}`,
      `Chat Messages: ${chatList?.length || 0}`,
      `Processed IDs: ${this.processedIds.size}`,
      `Current Item: ${currentItemInfo}`,
      `Item Tooltip Active: ${this.currentTooltip !== null}`
    ].join("\n");
    this.debugEl.textContent = debugInfo;
  }
  addEventListeners() {
    const keydownHandler = (e) => {
      const keyEvent = e;
      if (keyEvent.key === "Control" && this.settings.enableInventoryLinking?.value && !this.isCtrlPressed) {
        this.isCtrlPressed = true;
        this.showInventoryOverlays();
      }
    };
    const keyupHandler = (e) => {
      const keyEvent = e;
      if (keyEvent.key === "Control" && this.isCtrlPressed) {
        this.isCtrlPressed = false;
        this.hideInventoryOverlays();
      }
    };
    const blurHandler = () => {
      if (this.isCtrlPressed) {
        this.isCtrlPressed = false;
        this.hideInventoryOverlays();
      }
    };
    const visibilityHandler = () => {
      if (document.hidden && this.isCtrlPressed) {
        this.isCtrlPressed = false;
        this.hideInventoryOverlays();
      }
    };
    document.addEventListener("keydown", keydownHandler);
    document.addEventListener("keyup", keyupHandler);
    window.addEventListener("blur", blurHandler);
    document.addEventListener("visibilitychange", visibilityHandler);
    this.eventListeners = [
      { element: document, event: "keydown", handler: keydownHandler },
      { element: document, event: "keyup", handler: keyupHandler },
      { element: window, event: "blur", handler: blurHandler },
      {
        element: document,
        event: "visibilitychange",
        handler: visibilityHandler
      }
    ];
  }
  showInventoryOverlays() {
    if (this.overlaysCreated) return;
    this.overlaysCreated = true;
    const inventoryCells = document.querySelectorAll(
      ".hs-item-table__cell[data-slot]"
    );
    inventoryCells.forEach((cell) => {
      const slotAttr = cell.getAttribute("data-slot");
      if (slotAttr === null) return;
      const slotIndex = parseInt(slotAttr, 10);
      if (isNaN(slotIndex)) return;
      try {
        const inventoryItems = document.highlite.gameHooks.EntityManager.Instance.MainPlayer.Inventory.Items;
        const item = inventoryItems[slotIndex];
        if (item && item._def) {
          this.createInventoryOverlay(cell, slotIndex);
        }
      } catch (error) {
      }
    });
  }
  hideInventoryOverlays() {
    this.cleanupInventoryOverlays();
    this.overlaysCreated = false;
  }
  createInventoryOverlay(inventoryCell, slotIndex) {
    const overlay = document.createElement("div");
    overlay.className = "hs-inventory-overlay show";
    overlay.style.position = "absolute";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.right = "0";
    overlay.style.bottom = "0";
    overlay.style.zIndex = "1000";
    overlay.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleInventoryItemClick(slotIndex);
    });
    const cellStyle = getComputedStyle(inventoryCell);
    if (cellStyle.position === "static") {
      inventoryCell.style.position = "relative";
    }
    inventoryCell.appendChild(overlay);
    this.inventoryOverlays.push(overlay);
  }
  handleInventoryItemClick(slotIndex) {
    try {
      const inventoryItems = document.highlite.gameHooks.EntityManager.Instance.MainPlayer.Inventory.Items;
      const item = inventoryItems[slotIndex];
      if (!item || !item._def) {
        return;
      }
      const itemId = item._def._id;
      this.addItemToChatInput(itemId);
    } catch (error) {
    }
  }
  addItemToChatInput(itemId) {
    try {
      const chatController = this.gameHooks.UIManager._manager._controller._chatMenuController;
      const chatInput = chatController._chatMenuQuadrant.getChatMenu().getChatInputMenu().getChatInput();
      const currentValue = chatInput.getInputValue();
      const newValue = currentValue + (currentValue ? " " : "") + `[${itemId}]`;
      chatInput.setInputValue(newValue);
    } catch (error) {
      this.log(`Error adding item to chat input: ${error}`);
      if (error instanceof Error) {
        this.log(`Error stack:`, error.stack);
      }
    }
  }
  cleanupInventoryOverlays() {
    this.inventoryOverlays.forEach((overlay) => {
      if (overlay && overlay.parentElement) {
        overlay.parentElement.removeChild(overlay);
      }
    });
    this.inventoryOverlays = [];
  }
  initializePlugin() {
    this.processedIds.clear();
    if (!document.querySelector("style[data-chat-tooltip]")) {
      this.addCSSStyles();
    }
  }
  disablePlugin() {
    this.hideTooltip();
    this.hideInventoryOverlays();
    this.removeDebug();
  }
};
var ChatItemTooltip_default = ChatItemTooltip;
export {
  ChatItemTooltip,
  ChatItemTooltip_default as default
};
