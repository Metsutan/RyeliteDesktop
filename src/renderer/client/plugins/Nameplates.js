// src/Nameplates.ts
import { Vector3 } from "@babylonjs/core/Maths/math.js";
import { Plugin } from "@ryelite/core";
import { SettingsTypes } from "@ryelite/core";
import { UIManager, UIManagerScope } from "@ryelite/core";
import { NotificationManager } from "@ryelite/core";
import { SoundManager } from "@ryelite/core";
var Nameplates = class extends Plugin {
  pluginName = "Nameplates";
  author = "Highlite";
  DOMElement = null;
  // Priority system properties
  altKeyPressed = false;
  uiManager;
  // Alert system properties
  notificationManager = new NotificationManager();
  soundManager = new SoundManager();
  trackedGroundItems = /* @__PURE__ */ new Set();
  // Track seen ground items to detect new ones
  constructor() {
    super();
    this.uiManager = new UIManager();
    this.settings.playerNameplates = {
      text: "Player Nameplates",
      type: SettingsTypes.checkbox,
      value: true,
      callback: () => {
      }
    };
    this.settings.npcNameplates = {
      text: "NPC Nameplates",
      type: SettingsTypes.checkbox,
      value: true,
      callback: () => {
      }
    };
    this.settings.youNameplate = {
      text: "You Nameplate",
      type: SettingsTypes.checkbox,
      value: true,
      callback: () => {
      }
    };
    this.settings.groundItemNameplates = {
      text: "Ground Item Nameplates",
      type: SettingsTypes.checkbox,
      value: true,
      callback: () => {
      }
    };
    this.settings.playerNameplateSize = {
      text: "Player Nameplate Text Size",
      type: SettingsTypes.range,
      value: 12,
      min: 2,
      max: 32,
      callback: () => this.updateAllFontSizes(),
      validation: (value) => {
        const numValue = value;
        return numValue >= 8 && numValue <= 24;
      }
    };
    this.settings.npcNameplateSize = {
      text: "NPC Nameplate Text Size",
      type: SettingsTypes.range,
      value: 12,
      min: 2,
      max: 32,
      callback: () => this.updateAllFontSizes(),
      validation: (value) => {
        const numValue = value;
        return numValue >= 8 && numValue <= 24;
      }
    };
    this.settings.youNameplateSize = {
      text: "You Nameplate Text Size",
      type: SettingsTypes.range,
      value: 12,
      min: 2,
      max: 32,
      callback: () => this.updateAllFontSizes(),
      validation: (value) => {
        const numValue = value;
        return numValue >= 8 && numValue <= 24;
      }
    };
    this.settings.groundItemNameplateSize = {
      text: "Ground Item Nameplate Text Size",
      type: SettingsTypes.range,
      value: 12,
      min: 2,
      max: 32,
      callback: () => this.updateAllFontSizes(),
      validation: (value) => {
        const numValue = value;
        return numValue >= 8 && numValue <= 24;
      }
    };
    this.settings.enableTheming = {
      text: "Enable Enhanced Theming",
      type: SettingsTypes.checkbox,
      value: true,
      callback: () => this.updateAllElementThemes()
    };
    this.settings.showBackgrounds = {
      text: "Show Background Colors",
      type: SettingsTypes.checkbox,
      value: true,
      callback: () => this.updateAllElementThemes()
    };
    this.settings.showBorders = {
      text: "Show Borders",
      type: SettingsTypes.checkbox,
      value: true,
      callback: () => this.updateAllElementThemes()
    };
    this.settings.showShadows = {
      text: "Show Text Shadows",
      type: SettingsTypes.checkbox,
      value: true,
      callback: () => this.updateAllElementThemes()
    };
    this.settings.maxNPCStack = {
      text: "Max NPC Stack Display",
      type: SettingsTypes.range,
      value: 5,
      min: 1,
      max: 32,
      callback: () => this.updateStackLimits(),
      validation: (value) => {
        const numValue = value;
        return numValue >= 0 && numValue <= 20;
      }
    };
    this.settings.maxPlayerStack = {
      text: "Max Player Stack Display",
      type: SettingsTypes.range,
      value: 5,
      min: 1,
      max: 128,
      callback: () => this.updateStackLimits(),
      validation: (value) => {
        const numValue = value;
        return numValue >= 0 && numValue <= 20;
      }
    };
    this.settings.maxGroundItemStack = {
      text: "Max Ground Item Stack Display",
      type: SettingsTypes.range,
      value: 8,
      min: 1,
      max: 128,
      callback: () => this.updateStackLimits(),
      validation: (value) => {
        const numValue = value;
        return numValue >= 0 && numValue <= 50;
      }
    };
    this.settings.itemPriorities = {
      text: "Item Priorities (item:level,item:level)",
      type: SettingsTypes.text,
      value: "",
      callback: () => this.updateAllGroundItemElements()
    };
    this.settings.priorityItemCustomColor = {
      text: "Priority Item Custom Color",
      type: SettingsTypes.color,
      value: "#ff0000",
      callback: () => this.updateAllGroundItemElements()
    };
    this.settings.priorityItemAlerts = {
      text: "Enable Priority Item Alerts",
      type: SettingsTypes.checkbox,
      value: true,
      callback: () => {
      }
      //NOOP
    };
    this.settings.priorityItemNotifications = {
      text: "Priority Item Notifications",
      type: SettingsTypes.checkbox,
      value: false,
      callback: () => {
      }
      //NOOP
    };
    this.settings.priorityItemSounds = {
      text: "Priority Item Sounds",
      type: SettingsTypes.checkbox,
      value: true,
      callback: () => {
      }
      //NOOP
    };
    this.settings.priorityItemAlertVolume = {
      text: "Priority Item Alert Volume",
      type: SettingsTypes.range,
      value: 50,
      min: 0,
      max: 100,
      callback: () => {
      },
      //NOOP
      validation: (value) => {
        const numValue = value;
        return numValue >= 0 && numValue <= 100;
      }
    };
  }
  NPCDomElements = {};
  PlayerDomElements = {};
  GroundItemDomElements = {};
  positionTracker = /* @__PURE__ */ new Map();
  init() {
    this.log("Initializing");
    this.setupKeyboardListeners();
  }
  start() {
    this.log("Started");
    if (this.settings.enable.value) {
      this.setupAllElements();
    }
  }
  stop() {
    this.log("Stopped");
    this.cleanupAllElements();
  }
  SocketManager_loggedIn() {
    if (this.settings.enable.value) {
      this.setupAllElements();
    }
  }
  SocketManager_handleLoggedOut() {
    this.cleanupAllElements();
    this.trackedGroundItems.clear();
  }
  setupKeyboardListeners() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Alt") {
        this.altKeyPressed = true;
        this.updatePriorityButtonsVisibility();
        this.disableScreenMaskPointerEvents();
      }
    });
    document.addEventListener("keyup", (e) => {
      if (e.key === "Alt") {
        this.resetAltState();
      }
    });
    window.addEventListener("blur", () => {
      if (this.altKeyPressed) {
        this.resetAltState();
      }
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.altKeyPressed) {
        this.resetAltState();
      }
    });
  }
  resetAltState() {
    this.altKeyPressed = false;
    this.updatePriorityButtonsVisibility();
    setTimeout(() => {
      this.enableScreenMaskPointerEvents();
    }, 200);
  }
  updatePriorityButtonsVisibility() {
    const buttons = document.querySelectorAll(".priority-button");
    buttons.forEach((button) => {
      if (this.altKeyPressed) {
        button.style.display = "inline-block";
      } else {
        button.style.display = "none";
      }
    });
    this.updateIgnoredItemsVisibility();
  }
  disableScreenMaskPointerEvents() {
    const screenMask = document.getElementById("hs-screen-mask");
    if (screenMask) {
      screenMask.style.pointerEvents = "none";
    }
  }
  enableScreenMaskPointerEvents() {
    const screenMask = document.getElementById("hs-screen-mask");
    if (screenMask) {
      screenMask.style.pointerEvents = "auto";
    }
  }
  updateIgnoredItemsVisibility() {
    const ignoredItems = this.getIgnoredItemsSet();
    const maxGroundItemStack = this.settings.maxGroundItemStack.value;
    for (const key in this.GroundItemDomElements) {
      const element = this.GroundItemDomElements[key].element;
      const itemContainers = element.children;
      const existingIndicators = element.querySelectorAll(
        ".ground-stack-indicator"
      );
      existingIndicators.forEach((indicator) => indicator.remove());
      let visibleItemCount = 0;
      let hiddenItemCount = 0;
      let stackIndicatorAdded = false;
      for (let i = 0; i < itemContainers.length; i++) {
        const container = itemContainers[i];
        const textSpan = container.querySelector("span");
        if (!textSpan) continue;
        const itemName = textSpan.innerText.split(" [x")[0];
        if (ignoredItems.has(itemName)) {
          if (this.altKeyPressed) {
            container.style.display = "flex";
            textSpan.style.color = "gray";
            textSpan.style.fontStyle = "italic";
            visibleItemCount++;
            this.log(`Showing ignored item: ${itemName}`);
          } else {
            container.style.display = "none";
            this.log(`Hiding ignored item: ${itemName}`);
          }
        } else {
          if (!this.altKeyPressed && visibleItemCount >= maxGroundItemStack) {
            container.style.display = "none";
            hiddenItemCount++;
            if (!stackIndicatorAdded && visibleItemCount === maxGroundItemStack) {
              this.addGroundItemStackIndicator(
                element,
                hiddenItemCount
              );
              stackIndicatorAdded = true;
            }
          } else {
            container.style.display = "flex";
            visibleItemCount++;
          }
        }
      }
    }
    for (const key in this.GroundItemDomElements) {
      this.applyGroundItemElementTheme(
        this.GroundItemDomElements[key].element
      );
    }
  }
  injectCSSVariables() {
    if (!this.DOMElement) return;
    try {
      const screenMask = document.getElementById("hs-screen-mask");
      if (!screenMask) return;
      const computedStyle = getComputedStyle(screenMask);
      const cssVariables = [
        "--hs-color-cmbt-lvl-diff-pos-10",
        "--hs-color-cmbt-lvl-diff-pos-9",
        "--hs-color-cmbt-lvl-diff-pos-8",
        "--hs-color-cmbt-lvl-diff-pos-7",
        "--hs-color-cmbt-lvl-diff-pos-6",
        "--hs-color-cmbt-lvl-diff-pos-5",
        "--hs-color-cmbt-lvl-diff-pos-4",
        "--hs-color-cmbt-lvl-diff-pos-3",
        "--hs-color-cmbt-lvl-diff-pos-2",
        "--hs-color-cmbt-lvl-diff-pos-1",
        "--hs-color-cmbt-lvl-diff-pos-0",
        "--hs-color-cmbt-lvl-diff-neg-1",
        "--hs-color-cmbt-lvl-diff-neg-2",
        "--hs-color-cmbt-lvl-diff-neg-3",
        "--hs-color-cmbt-lvl-diff-neg-4",
        "--hs-color-cmbt-lvl-diff-neg-5",
        "--hs-color-cmbt-lvl-diff-neg-6",
        "--hs-color-cmbt-lvl-diff-neg-7",
        "--hs-color-cmbt-lvl-diff-neg-8",
        "--hs-color-cmbt-lvl-diff-neg-9",
        "--hs-color-cmbt-lvl-diff-neg-10"
      ];
      let styleString = "";
      cssVariables.forEach((variable) => {
        const value = computedStyle.getPropertyValue(variable);
        if (value) {
          styleString += `${variable}: ${value}; `;
        }
      });
      if (styleString) {
        this.DOMElement.style.cssText += styleString;
      }
    } catch (error) {
      this.error("Error injecting CSS variables:", error);
    }
  }
  getItemPriorities() {
    const prioritiesStr = this.settings.itemPriorities.value;
    const priorities = /* @__PURE__ */ new Map();
    if (!prioritiesStr) return priorities;
    const entries = prioritiesStr.split(",").map((entry) => entry.trim()).filter((entry) => entry.length > 0);
    for (const entry of entries) {
      const [itemName, levelStr] = entry.split(":");
      if (itemName && levelStr) {
        const level = parseInt(levelStr);
        if (!isNaN(level) && level >= -1 && level <= 1) {
          priorities.set(itemName.trim(), level);
        }
      }
    }
    return priorities;
  }
  getPriorityItemsSet() {
    const priorities = this.getItemPriorities();
    const priorityItems = /* @__PURE__ */ new Set();
    for (const [itemName, level] of priorities) {
      if (level === 1) {
        priorityItems.add(itemName);
      }
    }
    return priorityItems;
  }
  getIgnoredItemsSet() {
    const priorities = this.getItemPriorities();
    const ignoredItems = /* @__PURE__ */ new Set();
    for (const [itemName, level] of priorities) {
      if (level === -1) {
        ignoredItems.add(itemName);
      }
    }
    return ignoredItems;
  }
  toggleItemPriority(itemName) {
    const priorities = this.getItemPriorities();
    const currentLevel = priorities.get(itemName) || 0;
    const newLevel = currentLevel === 1 ? 0 : currentLevel + 1;
    priorities.set(itemName, newLevel);
    this.settings.itemPriorities.value = Array.from(priorities.entries()).map(([item, level]) => `${item}:${level}`).join(", ");
    this.updateAllGroundItemElements();
  }
  toggleItemIgnored(itemName) {
    const priorities = this.getItemPriorities();
    const currentLevel = priorities.get(itemName) || 0;
    const newLevel = currentLevel === -1 ? 0 : currentLevel - 1;
    priorities.set(itemName, newLevel);
    this.settings.itemPriorities.value = Array.from(priorities.entries()).map(([item, level]) => `${item}:${level}`).join(", ");
    this.updateAllGroundItemElements();
  }
  updateAllGroundItemElements() {
    for (const key in this.GroundItemDomElements) {
      this.disposeElementFromCollection(this.GroundItemDomElements, key);
    }
  }
  getPriorityColor() {
    if (this.settings.priorityItemCustomColor && this.settings.priorityItemCustomColor.value) {
      return this.settings.priorityItemCustomColor.value;
    }
    return "#ff0000";
  }
  checkForNewPriorityItems(GroundItems) {
    if (!this.settings.priorityItemAlerts?.value) {
      return;
    }
    const priorityItems = this.getPriorityItemsSet();
    if (priorityItems.size === 0) {
      return;
    }
    const currentGroundItems = /* @__PURE__ */ new Set();
    for (const [key, groundItem] of GroundItems) {
      const itemKey = `${key}_${groundItem._def._nameCapitalized}`;
      currentGroundItems.add(itemKey);
      if (!this.trackedGroundItems.has(itemKey)) {
        const itemName = groundItem._def._nameCapitalized;
        if (priorityItems.has(itemName)) {
          this.alertPriorityItemDropped(itemName);
        }
      }
    }
    this.trackedGroundItems = currentGroundItems;
  }
  alertPriorityItemDropped(itemName) {
    this.log(`Priority item detected: ${itemName}`);
    if (this.settings.priorityItemNotifications?.value) {
      this.notificationManager.createNotification(
        `Priority item dropped: ${itemName}!`
      );
    }
    if (this.settings.priorityItemSounds?.value) {
      const volume = this.settings.priorityItemAlertVolume?.value / 100;
      this.soundManager.playSound(
        "https://cdn.pixabay.com/download/audio/2024/02/19/audio_e4043ea6be.mp3",
        volume
      );
    }
  }
  GameLoop_draw() {
    const NPCS = this.gameHooks.EntityManager.Instance._npcs;
    const Players = this.gameHooks.EntityManager.Instance._players;
    const MainPlayer = this.gameHooks.EntityManager.Instance.MainPlayer;
    const GroundItems = this.gameHooks.GroundItemManager.Instance.GroundItems;
    const playerFriends = this.gameHooks.ChatManager.Instance._friends;
    if (!this.settings.enable.value) {
      this.cleanupAllElements();
      return;
    }
    this.resetPositionTracker();
    if (!NPCS || !Players || !MainPlayer || !GroundItems) {
      this.log(
        "Missing required game entities, skipping nameplate rendering."
      );
      return;
    }
    this.cleanupStaleEntities(NPCS, Players, MainPlayer);
    this.processNPCs(NPCS, MainPlayer);
    this.processPlayers(Players, MainPlayer, playerFriends);
    this.checkForNewPriorityItems(GroundItems);
    this.processGroundItems(GroundItems);
  }
  cleanupStaleEntities(NPCS, Players, MainPlayer) {
    for (const key in this.NPCDomElements) {
      if (!NPCS.has(parseInt(key))) {
        this.disposeElementFromCollection(this.NPCDomElements, key);
      }
    }
    for (const key in this.PlayerDomElements) {
      const exists = Players.some((p) => p?._entityId === parseInt(key)) || MainPlayer && MainPlayer._entityId === parseInt(key);
      if (!exists) {
        this.disposeElementFromCollection(this.PlayerDomElements, key);
      }
    }
  }
  processNPCs(NPCS, MainPlayer) {
    if (!this.settings.npcNameplates.value) {
      this.cleanupElementCollection(this.NPCDomElements);
      return;
    }
    for (const [key, npc] of NPCS) {
      if (!this.NPCDomElements[key]) {
        this.createNPCElement(key, npc, MainPlayer._combatLevel);
      }
      const worldPos = this.getEntityWorldPosition(npc, "npc");
      if (worldPos) {
        this.NPCDomElements[key].position = worldPos;
        const positionKey = this.getPositionKey(worldPos);
        const currentCount = this.positionTracker.get(positionKey) || 0;
        this.positionTracker.set(positionKey, currentCount + 1);
      }
      const npcMesh = npc._appearance._haloNode;
      try {
        this.updateElementPosition(npcMesh, this.NPCDomElements[key]);
      } catch (e) {
        this.log("Error updating NPC element position: ", e);
      }
    }
  }
  processPlayers(Players, MainPlayer, playerFriends) {
    if (this.settings.playerNameplates.value) {
      for (const player of Players) {
        if (!player) continue;
        if (!this.PlayerDomElements[player._entityId]) {
          this.createPlayerElement(player._entityId, player, false);
        }
        const isFriend = playerFriends.includes(player._nameLowerCase);
        const element = this.PlayerDomElements[player._entityId].element;
        const isMainPlayer = element.id.includes(
          `player-${MainPlayer._entityId}`
        );
        element.style.color = isFriend ? "lightgreen" : isMainPlayer ? "cyan" : "white";
        this.applyPlayerElementTheme(element, isMainPlayer);
        const worldPos = this.getEntityWorldPosition(player, "player");
        if (worldPos) {
          this.PlayerDomElements[player._entityId].position = worldPos;
          const positionKey = this.getPositionKey(worldPos);
          const currentCount = this.positionTracker.get(positionKey) || 0;
          this.positionTracker.set(positionKey, currentCount + 1);
        }
        const playerMesh = player._appearance._haloNode;
        try {
          this.updateElementPosition(
            playerMesh,
            this.PlayerDomElements[player._entityId]
          );
        } catch (e) {
          this.log("Error updating Player element position: ", e);
        }
      }
    } else {
      for (const key in this.PlayerDomElements) {
        if (MainPlayer && parseInt(key) !== MainPlayer._entityId) {
          this.disposeElementFromCollection(
            this.PlayerDomElements,
            key
          );
        }
      }
    }
    if (this.settings.youNameplate.value && MainPlayer) {
      if (!this.PlayerDomElements[MainPlayer._entityId]) {
        this.createPlayerElement(
          MainPlayer._entityId,
          MainPlayer,
          true
        );
      }
      const worldPos = this.getEntityWorldPosition(MainPlayer, "player");
      if (worldPos) {
        this.PlayerDomElements[MainPlayer._entityId].position = worldPos;
        const positionKey = this.getPositionKey(worldPos);
        const currentCount = this.positionTracker.get(positionKey) || 0;
        this.positionTracker.set(positionKey, currentCount + 1);
      }
      const playerMesh = MainPlayer._appearance._haloNode;
      try {
        this.updateElementPosition(
          playerMesh,
          this.PlayerDomElements[MainPlayer._entityId]
        );
      } catch (e) {
        this.log("Error updating Player element position: ", e);
      }
    } else if (!this.settings.youNameplate.value && MainPlayer && this.PlayerDomElements[MainPlayer._entityId]) {
      this.disposeElementFromCollection(
        this.PlayerDomElements,
        MainPlayer._entityId
      );
    }
  }
  processGroundItems(GroundItems) {
    if (!this.settings.groundItemNameplates.value) {
      this.cleanupElementCollection(this.GroundItemDomElements);
      return;
    }
    const maxGroundItemStack = this.settings.maxGroundItemStack.value;
    if (maxGroundItemStack === 0) {
      this.cleanupElementCollection(this.GroundItemDomElements);
      return;
    }
    const positionGroups = this.groupGroundItemsByPosition(GroundItems);
    this.cleanupUnusedGroundItemElements(positionGroups);
    for (const [positionKey, positionGroup] of positionGroups) {
      const representativeKey = positionGroup.firstKey;
      const existingElement = this.GroundItemDomElements[representativeKey];
      const needsUpdate = !existingElement || existingElement.quantity !== positionGroup.totalItems || existingElement.itemName !== `${positionGroup.items.size} types`;
      if (needsUpdate) {
        if (existingElement) {
          this.disposeElementFromCollection(
            this.GroundItemDomElements,
            representativeKey
          );
        }
        this.createGroundItemElement(
          representativeKey,
          positionGroup,
          positionKey
        );
      }
      const firstItem = Array.from(positionGroup.items.values())[0].items[0];
      const worldPos = this.getEntityWorldPosition(
        firstItem.item,
        "grounditem"
      );
      if (worldPos) {
        this.GroundItemDomElements[representativeKey].position = worldPos;
        const stackingPositionKey = this.getPositionKey(worldPos);
        const currentCount = this.positionTracker.get(stackingPositionKey) || 0;
        this.positionTracker.set(stackingPositionKey, currentCount + 1);
      }
      const groundItemMesh = firstItem.item._appearance._billboardMesh;
      try {
        this.updateElementPosition(
          groundItemMesh,
          this.GroundItemDomElements[representativeKey]
        );
      } catch (e) {
        this.log("Error updating Ground Item element position: ", e);
      }
    }
  }
  createNPCElement(key, npc, playerCombatLevel) {
    const element = document.createElement("div");
    element.id = `highlite-nameplates-npc-${key}`;
    element.style.position = "absolute";
    element.style.pointerEvents = "none";
    element.style.zIndex = "1000";
    element.style.display = "flex";
    element.style.flexDirection = "column";
    element.style.justifyContent = "center";
    element.style.fontSize = `${this.settings.npcNameplateSize.value}px`;
    const nameSpan = document.createElement("div");
    nameSpan.style.color = "yellow";
    nameSpan.style.textAlign = "center";
    nameSpan.style.fontSize = `${this.settings.npcNameplateSize.value}px`;
    nameSpan.innerText = npc._name;
    element.appendChild(nameSpan);
    if (npc._combatLevel != 0) {
      const lvlSpan = document.createElement("div");
      lvlSpan.style.textAlign = "center";
      lvlSpan.style.fontSize = `${this.settings.npcNameplateSize.value}px`;
      lvlSpan.innerText = `Lvl. ${npc._combatLevel}`;
      lvlSpan.style.color = "gray";
      if (npc._def._combat._isAggressive && !npc._def._combat._isAlwaysAggro) {
        lvlSpan.innerText += " \u{1F620}";
      } else if (!npc._def._combat._isAggressive && !npc._def._combat._isAlwaysAggro) {
        lvlSpan.innerText += " \u{1F610}";
      } else if (npc._def._combat._isAlwaysAggro) {
        lvlSpan.innerText += " \u{1F47F}";
      }
      element.appendChild(lvlSpan);
    }
    this.applyNPCElementTheme(element);
    this.NPCDomElements[key] = {
      element,
      position: Vector3.ZeroReadOnly
    };
    document.getElementById("highlite-nameplates")?.appendChild(element);
  }
  createPlayerElement(entityId, player, isMainPlayer) {
    const element = document.createElement("div");
    element.id = `highlite-nameplates-player-${entityId}`;
    element.style.position = "absolute";
    element.style.pointerEvents = "none";
    element.style.zIndex = "1000";
    element.style.color = isMainPlayer ? "cyan" : "white";
    element.style.fontSize = isMainPlayer ? `${this.settings.youNameplateSize.value}px` : `${this.settings.playerNameplateSize.value}px`;
    element.innerHTML = player._name;
    this.applyPlayerElementTheme(element, isMainPlayer);
    this.PlayerDomElements[entityId] = {
      element,
      position: Vector3.ZeroReadOnly
    };
    document.getElementById("highlite-nameplates")?.appendChild(element);
  }
  createGroundItemElement(representativeKey, positionGroup, positionKey) {
    const element = document.createElement("div");
    element.id = `highlite-nameplates-grounditem-${representativeKey}`;
    element.style.position = "absolute";
    element.style.pointerEvents = "none";
    element.style.zIndex = "1000";
    element.style.display = "flex";
    element.style.flexDirection = "column";
    element.style.justifyContent = "center";
    element.style.fontSize = `${this.settings.groundItemNameplateSize.value}px`;
    const entries = Array.from(positionGroup.items.entries());
    const priorityItems = this.getPriorityItemsSet();
    const ignoredItems = this.getIgnoredItemsSet();
    entries.sort(([a, aGroup], [b, bGroup]) => {
      const aIsPriority = priorityItems.has(a);
      const bIsPriority = priorityItems.has(b);
      if (aIsPriority && !bIsPriority) return -1;
      if (!aIsPriority && bIsPriority) return 1;
      return a.localeCompare(b);
    });
    const maxGroundItemStack = this.settings.maxGroundItemStack.value;
    let visibleItemCount = 0;
    let hiddenItemCount = 0;
    let stackIndicatorAdded = false;
    for (const [itemName, itemGroup] of entries) {
      const itemDiv = document.createElement("div");
      itemDiv.style.textAlign = "center";
      itemDiv.style.fontSize = `${this.settings.groundItemNameplateSize.value}px`;
      const itemText = itemGroup.count > 1 ? `${itemName} [x${itemGroup.count}]` : itemName;
      const itemContainer = document.createElement("div");
      itemContainer.style.display = "flex";
      itemContainer.style.alignItems = "center";
      itemContainer.style.justifyContent = "center";
      itemContainer.style.gap = "4px";
      itemContainer.style.pointerEvents = "auto";
      itemContainer.style.position = "relative";
      itemContainer.style.zIndex = "1002";
      const textSpan = document.createElement("span");
      textSpan.innerText = itemText;
      if (ignoredItems.has(itemName)) {
        textSpan.style.color = "gray";
        textSpan.style.fontStyle = "italic";
        itemContainer.style.display = this.altKeyPressed ? "flex" : "none";
      } else if (priorityItems.has(itemName)) {
        textSpan.style.color = this.getPriorityColor();
        textSpan.style.fontWeight = "bold";
        if (this.settings.showBorders?.value) {
          itemContainer.style.border = "1px solid " + this.getPriorityColor();
          itemContainer.style.borderRadius = "2px";
          itemContainer.style.padding = "1px 2px";
        }
      } else {
        textSpan.style.color = "orange";
      }
      itemContainer.appendChild(textSpan);
      const priorityBtn = document.createElement("button");
      priorityBtn.className = "priority-button";
      priorityBtn.innerText = "+";
      priorityBtn.style.display = this.altKeyPressed ? "inline-block" : "none";
      const currentLevel = this.getItemPriorities().get(itemName) || 0;
      priorityBtn.style.background = currentLevel === 1 ? "orange" : "transparent";
      priorityBtn.style.color = currentLevel === 1 ? "white" : "orange";
      priorityBtn.style.border = "1px solid orange";
      priorityBtn.style.borderRadius = "2px";
      priorityBtn.style.padding = "1px 4px";
      priorityBtn.style.fontSize = "10px";
      priorityBtn.style.cursor = "pointer";
      priorityBtn.style.fontWeight = "bold";
      priorityBtn.style.pointerEvents = "auto";
      priorityBtn.style.zIndex = "1001";
      priorityBtn.style.userSelect = "none";
      priorityBtn.title = currentLevel === 1 ? "Remove Priority" : "Add Priority";
      this.uiManager.bindOnClickBlockHsMask(priorityBtn, () => {
        this.toggleItemPriority(itemName);
      });
      const ignoreBtn = document.createElement("button");
      ignoreBtn.className = "priority-button";
      ignoreBtn.innerText = "-";
      ignoreBtn.style.display = this.altKeyPressed ? "inline-block" : "none";
      ignoreBtn.style.background = currentLevel === -1 ? "orange" : "transparent";
      ignoreBtn.style.color = currentLevel === -1 ? "white" : "orange";
      ignoreBtn.style.border = "1px solid orange";
      ignoreBtn.style.borderRadius = "2px";
      ignoreBtn.style.padding = "1px 4px";
      ignoreBtn.style.fontSize = "10px";
      ignoreBtn.style.cursor = "pointer";
      ignoreBtn.style.fontWeight = "bold";
      ignoreBtn.style.pointerEvents = "auto";
      ignoreBtn.style.zIndex = "1001";
      ignoreBtn.style.userSelect = "none";
      ignoreBtn.title = currentLevel === -1 ? "Un-ignore Item" : "Hide Item";
      this.uiManager.bindOnClickBlockHsMask(ignoreBtn, () => {
        this.toggleItemIgnored(itemName);
      });
      itemContainer.appendChild(priorityBtn);
      itemContainer.appendChild(ignoreBtn);
      const isIgnored = ignoredItems.has(itemName);
      const shouldShowIgnored = this.altKeyPressed;
      if (isIgnored && !shouldShowIgnored) {
        itemContainer.style.display = "none";
        hiddenItemCount++;
      } else {
        if (!this.altKeyPressed && visibleItemCount >= maxGroundItemStack) {
          itemContainer.style.display = "none";
          hiddenItemCount++;
          if (!stackIndicatorAdded && visibleItemCount === maxGroundItemStack) {
            this.addGroundItemStackIndicator(
              element,
              hiddenItemCount
            );
            stackIndicatorAdded = true;
          }
        } else {
          itemContainer.style.display = "flex";
          visibleItemCount++;
        }
      }
      element.appendChild(itemContainer);
    }
    this.applyGroundItemElementTheme(element);
    this.GroundItemDomElements[representativeKey] = {
      element,
      position: Vector3.ZeroReadOnly,
      itemName: `${positionGroup.items.size} types`,
      quantity: positionGroup.totalItems,
      positionKey
    };
    document.getElementById("highlite-nameplates")?.appendChild(element);
  }
  groupGroundItemsByPosition(GroundItems) {
    const positionGroups = /* @__PURE__ */ new Map();
    const tolerance = 0.5;
    for (const [key, groundItem] of GroundItems) {
      const worldPos = this.getEntityWorldPosition(
        groundItem,
        "grounditem"
      );
      if (!worldPos) continue;
      let foundGroup = false;
      let groupKey = "";
      for (const [existingKey, existingGroup] of positionGroups) {
        const [existingX, existingZ] = existingKey.split("_").map(Number);
        const distance = Math.sqrt(
          Math.pow(worldPos.x - existingX, 2) + Math.pow(worldPos.z - existingZ, 2)
        );
        if (distance <= tolerance) {
          groupKey = existingKey;
          foundGroup = true;
          break;
        }
      }
      if (!foundGroup) {
        groupKey = `${Math.round(worldPos.x * 2) / 2}_${Math.round(worldPos.z * 2) / 2}`;
        positionGroups.set(groupKey, {
          items: /* @__PURE__ */ new Map(),
          firstKey: String(key),
          totalItems: 0
        });
      }
      const positionGroup = positionGroups.get(groupKey);
      const itemName = groundItem._def._nameCapitalized;
      if (!positionGroup.items.has(itemName)) {
        positionGroup.items.set(itemName, { items: [], count: 0 });
      }
      positionGroup.items.get(itemName).items.push({ key: String(key), item: groundItem });
      positionGroup.items.get(itemName).count++;
      positionGroup.totalItems++;
    }
    return positionGroups;
  }
  cleanupUnusedGroundItemElements(positionGroups) {
    const activeRepresentativeKeys = /* @__PURE__ */ new Set();
    for (const [, positionGroup] of positionGroups) {
      activeRepresentativeKeys.add(positionGroup.firstKey);
    }
    for (const key in this.GroundItemDomElements) {
      if (!activeRepresentativeKeys.has(key)) {
        this.disposeElementFromCollection(
          this.GroundItemDomElements,
          key
        );
      }
    }
  }
  getEntityWorldPosition(entity, entityType) {
    if (!entity || !entity._appearance) {
      return null;
    }
    if (entityType === "grounditem") {
      return entity._appearance._billboardMesh?.getAbsolutePosition() || null;
    } else {
      return entity._appearance._haloNode?.getAbsolutePosition() || null;
    }
  }
  resetPositionTracker() {
    this.positionTracker.clear();
  }
  getPositionKey(worldPosition) {
    const roundedX = Math.round(worldPosition.x);
    const roundedZ = Math.round(worldPosition.z);
    return `${roundedX}_${roundedZ}`;
  }
  updateElementPosition(entityMesh, domElement) {
    const translationCoordinates = Vector3.Project(
      Vector3.ZeroReadOnly,
      entityMesh.getWorldMatrix(),
      this.gameHooks.GameEngine.Instance.Scene.getTransformMatrix(),
      this.gameHooks.GameCameraManager.Camera.viewport.toGlobal(
        this.gameHooks.GameEngine.Instance.Engine.getRenderWidth(1),
        this.gameHooks.GameEngine.Instance.Engine.getRenderHeight(1)
      )
    );
    const camera = this.gameHooks.GameCameraManager.Camera;
    const isInFrustrum = camera.isInFrustum(entityMesh);
    const stackingResult = this.calculateStackingOffset(domElement);
    if (!isInFrustrum) {
      domElement.element.style.visibility = "hidden";
      return;
    }
    if (!stackingResult.shouldShow) {
      domElement.element.style.visibility = "hidden";
      return;
    } else {
      domElement.element.style.visibility = "visible";
    }
    this.updateStackIndicator(domElement, stackingResult.stackInfo);
    domElement.element.style.transform = `translate3d(calc(${this.pxToRem(translationCoordinates.x)}rem - 50%), calc(${this.pxToRem(translationCoordinates.y - 30 - stackingResult.offset)}rem - 50%), 0px)`;
  }
  calculateStackingOffset(domElement) {
    if (!domElement.position) {
      return { offset: 0, shouldShow: true };
    }
    const positionKey = this.getPositionKey(domElement.position);
    const elementsAtPosition = [];
    for (const [key, npcElement] of Object.entries(this.NPCDomElements)) {
      if (npcElement.position && this.getPositionKey(npcElement.position) === positionKey) {
        elementsAtPosition.push({
          element: npcElement.element,
          id: `npc_${key}`,
          type: "npc"
        });
      }
    }
    for (const [key, playerElement] of Object.entries(
      this.PlayerDomElements
    )) {
      if (playerElement.position && this.getPositionKey(playerElement.position) === positionKey) {
        elementsAtPosition.push({
          element: playerElement.element,
          id: `player_${key}`,
          type: "player"
        });
      }
    }
    for (const [key, groundElement] of Object.entries(
      this.GroundItemDomElements
    )) {
      if (groundElement.position && this.getPositionKey(groundElement.position) === positionKey) {
        elementsAtPosition.push({
          element: groundElement.element,
          id: `ground_${key}`,
          type: "ground"
        });
      }
    }
    if (elementsAtPosition.length <= 1) {
      return { offset: 0, shouldShow: true };
    }
    elementsAtPosition.sort((a, b) => {
      const typePriority = { ground: 0, npc: 1, player: 2 };
      const priorityDiff = typePriority[a.type] - typePriority[b.type];
      if (priorityDiff !== 0) return priorityDiff;
      const isMainPlayerA = a.type === "player" && this.gameHooks.EntityManager.Instance.MainPlayer && a.id.includes(
        `player-${this.gameHooks.EntityManager.Instance.MainPlayer._entityId}`
      );
      const isMainPlayerB = b.type === "player" && this.gameHooks.EntityManager.Instance.MainPlayer && b.id.includes(
        `player-${this.gameHooks.EntityManager.Instance.MainPlayer._entityId}`
      );
      if (isMainPlayerA && !isMainPlayerB) return -1;
      if (!isMainPlayerA && isMainPlayerB) return 1;
      return a.id.localeCompare(b.id);
    });
    const currentElementId = domElement.element.id;
    const index = elementsAtPosition.findIndex(
      (el) => el.element.id === currentElementId
    );
    const elementType = domElement.element.id.includes("npc") ? "npc" : domElement.element.id.includes("player") ? "player" : "ground";
    const isMainPlayer = elementType === "player" && this.gameHooks.EntityManager.Instance.MainPlayer && domElement.element.id.includes(
      `player-${this.gameHooks.EntityManager.Instance.MainPlayer._entityId}`
    );
    if (isMainPlayer) {
      return { offset: 50, shouldShow: true };
    }
    const maxStack = elementType === "npc" ? this.settings.maxNPCStack.value : elementType === "player" ? this.settings.maxPlayerStack.value : this.settings.maxGroundItemStack.value;
    let effectiveIndex = index;
    let effectiveTotal = elementsAtPosition.length;
    if (elementType === "ground") {
      const groundElementsAtPosition = elementsAtPosition.filter(
        (el) => el.type === "ground"
      );
      const groundIndex = groundElementsAtPosition.findIndex(
        (el) => el.element.id === currentElementId
      );
      effectiveIndex = groundIndex;
      effectiveTotal = groundElementsAtPosition.length;
    }
    if (effectiveIndex >= maxStack) {
      return {
        offset: 0,
        shouldShow: false,
        stackInfo: {
          total: effectiveTotal,
          hidden: effectiveTotal - maxStack,
          type: elementType
        }
      };
    }
    if (effectiveIndex === maxStack - 1 && effectiveTotal > maxStack) {
      return {
        offset: index * 25,
        shouldShow: true,
        stackInfo: {
          total: effectiveTotal,
          hidden: effectiveTotal - maxStack,
          type: elementType
        }
      };
    }
    return { offset: index * 25, shouldShow: true };
  }
  addGroundItemStackIndicator(element, hiddenCount) {
    const itemContainers = Array.from(element.children);
    const lastVisibleContainer = itemContainers.find(
      (container) => container.style.display !== "none"
    );
    if (lastVisibleContainer) {
      const stackIndicator = document.createElement("div");
      stackIndicator.className = "ground-stack-indicator";
      stackIndicator.style.position = "absolute";
      stackIndicator.style.top = "-12px";
      stackIndicator.style.left = "50%";
      stackIndicator.style.transform = "translateX(-50%)";
      stackIndicator.style.fontSize = "8px";
      stackIndicator.style.fontWeight = "600";
      stackIndicator.style.color = "#FFA500";
      stackIndicator.style.textShadow = "0 0 3px rgba(255, 165, 0, 0.8)";
      stackIndicator.style.letterSpacing = "0.3px";
      stackIndicator.style.textTransform = "uppercase";
      stackIndicator.style.zIndex = "1003";
      stackIndicator.style.pointerEvents = "none";
      stackIndicator.style.background = "rgba(0, 0, 0, 0.4)";
      stackIndicator.style.padding = "1px 3px";
      stackIndicator.style.borderRadius = "2px";
      stackIndicator.style.backdropFilter = "blur(1px)";
      if (hiddenCount === 1) {
        stackIndicator.textContent = "+1";
      } else if (hiddenCount < 10) {
        stackIndicator.textContent = `+${hiddenCount}`;
      } else {
        stackIndicator.textContent = `+${hiddenCount}+`;
      }
      lastVisibleContainer.appendChild(stackIndicator);
    }
  }
  updateStackIndicator(domElement, stackInfo) {
    if (!stackInfo || stackInfo.hidden <= 0) {
      const existingIndicator = domElement.element.querySelector(".stack-indicator");
      if (existingIndicator) {
        existingIndicator.remove();
      }
      return;
    }
    let stackIndicator = domElement.element.querySelector(".stack-indicator");
    if (!stackIndicator) {
      stackIndicator = document.createElement("div");
      stackIndicator.className = "stack-indicator";
      stackIndicator.style.position = "absolute";
      stackIndicator.style.top = "-16px";
      stackIndicator.style.left = "50%";
      stackIndicator.style.transform = "translateX(-50%)";
      stackIndicator.style.fontSize = "9px";
      stackIndicator.style.fontWeight = "600";
      stackIndicator.style.zIndex = "1001";
      stackIndicator.style.pointerEvents = "none";
      stackIndicator.style.letterSpacing = "0.5px";
      stackIndicator.style.textTransform = "uppercase";
      const elementType = domElement.element.id.includes("npc") ? "npc" : domElement.element.id.includes("player") ? "player" : "ground";
      if (elementType === "npc") {
        stackIndicator.style.color = "#FFD700";
        stackIndicator.style.textShadow = "0 0 4px rgba(255, 215, 0, 0.8)";
      } else if (elementType === "player") {
        stackIndicator.style.color = "#87CEEB";
        stackIndicator.style.textShadow = "0 0 4px rgba(135, 206, 235, 0.8)";
      } else {
        stackIndicator.style.color = "#FFA500";
        stackIndicator.style.textShadow = "0 0 4px rgba(255, 165, 0, 0.8)";
      }
      stackIndicator.style.background = "rgba(0, 0, 0, 0.3)";
      stackIndicator.style.padding = "1px 4px";
      stackIndicator.style.borderRadius = "2px";
      stackIndicator.style.backdropFilter = "blur(2px)";
      domElement.element.appendChild(stackIndicator);
    }
    const count = stackInfo.hidden;
    if (count === 1) {
      stackIndicator.textContent = "+1";
    } else if (count < 10) {
      stackIndicator.textContent = `+${count}`;
    } else {
      stackIndicator.textContent = `+${count}+`;
    }
  }
  pxToRem(px) {
    return px / 16;
  }
  updateAllFontSizes() {
    for (const key in this.NPCDomElements) {
      const element = this.NPCDomElements[key].element;
      element.style.fontSize = `${this.settings.npcNameplateSize.value}px`;
      const childElements = element.children;
      for (let i = 0; i < childElements.length; i++) {
        const childElement = childElements[i];
        childElement.style.fontSize = `${this.settings.npcNameplateSize.value}px`;
      }
    }
    for (const key in this.PlayerDomElements) {
      const element = this.PlayerDomElements[key].element;
      const isMainPlayer = element.style.color === "cyan";
      const fontSize = isMainPlayer ? this.settings.youNameplateSize.value : this.settings.playerNameplateSize.value;
      element.style.fontSize = `${fontSize}px`;
    }
    for (const key in this.GroundItemDomElements) {
      const element = this.GroundItemDomElements[key].element;
      element.style.fontSize = `${this.settings.groundItemNameplateSize.value}px`;
      const childElements = element.children;
      for (let i = 0; i < childElements.length; i++) {
        const childElement = childElements[i];
        childElement.style.fontSize = `${this.settings.groundItemNameplateSize.value}px`;
      }
    }
  }
  updateStackLimits() {
    for (const key in this.GroundItemDomElements) {
      this.disposeElementFromCollection(this.GroundItemDomElements, key);
    }
    this.log("Stack limits updated, forcing ground item recreation");
  }
  updateAllElementThemes() {
    for (const key in this.NPCDomElements) {
      this.applyNPCElementTheme(this.NPCDomElements[key].element);
    }
    for (const key in this.PlayerDomElements) {
      const element = this.PlayerDomElements[key].element;
      const isMainPlayer = element.style.color === "cyan";
      this.applyPlayerElementTheme(element, isMainPlayer);
    }
    for (const key in this.GroundItemDomElements) {
      this.applyGroundItemElementTheme(
        this.GroundItemDomElements[key].element
      );
    }
  }
  applyNPCElementTheme(element) {
    if (!this.settings.enableTheming?.value) {
      element.style.background = "transparent";
      element.style.border = "none";
      element.style.borderRadius = "0";
      element.style.padding = "0";
      element.style.boxShadow = "none";
      element.style.textShadow = "none";
      return;
    }
    if (this.settings.showBackgrounds?.value) {
      element.style.background = "rgba(0, 0, 0, 0.8)";
      element.style.borderRadius = "4px";
      element.style.padding = "2px 6px";
    } else {
      element.style.background = "transparent";
      element.style.borderRadius = "0";
      element.style.padding = "0";
    }
    if (this.settings.showBorders?.value) {
      element.style.border = "1px solid rgba(255, 255, 0, 0.6)";
    } else {
      element.style.border = "none";
    }
    if (this.settings.showShadows?.value) {
      element.style.textShadow = "1px 1px 2px rgba(0, 0, 0, 0.8)";
      element.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.3)";
    } else {
      element.style.textShadow = "none";
      element.style.boxShadow = "none";
    }
    const childElements = element.children;
    for (let i = 0; i < childElements.length; i++) {
      const childElement = childElements[i];
      if (this.settings.showShadows?.value) {
        childElement.style.textShadow = "1px 1px 2px rgba(0, 0, 0, 0.8)";
      } else {
        childElement.style.textShadow = "none";
      }
    }
  }
  applyPlayerElementTheme(element, isMainPlayer) {
    if (!this.settings.enableTheming?.value) {
      element.style.background = "transparent";
      element.style.border = "none";
      element.style.borderRadius = "0";
      element.style.padding = "0";
      element.style.boxShadow = "none";
      element.style.textShadow = "none";
      return;
    }
    const isFriend = element.style.color === "lightgreen";
    const isMainPlayerElement = element.style.color === "cyan";
    if (this.settings.showBackgrounds?.value) {
      if (isMainPlayerElement) {
        element.style.background = "rgba(0, 255, 255, 0.2)";
      } else if (isFriend) {
        element.style.background = "rgba(144, 238, 144, 0.2)";
      } else {
        element.style.background = "rgba(255, 255, 255, 0.1)";
      }
      element.style.borderRadius = "4px";
      element.style.padding = "2px 6px";
    } else {
      element.style.background = "transparent";
      element.style.borderRadius = "0";
      element.style.padding = "0";
    }
    if (this.settings.showBorders?.value) {
      if (isMainPlayerElement) {
        element.style.border = "1px solid rgba(0, 255, 255, 0.6)";
      } else if (isFriend) {
        element.style.border = "1px solid rgba(144, 238, 144, 0.6)";
      } else {
        element.style.border = "1px solid rgba(255, 255, 255, 0.3)";
      }
    } else {
      element.style.border = "none";
    }
    if (this.settings.showShadows?.value) {
      element.style.textShadow = "1px 1px 2px rgba(0, 0, 0, 0.8)";
      element.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.3)";
    } else {
      element.style.textShadow = "none";
      element.style.boxShadow = "none";
    }
  }
  applyGroundItemElementTheme(element) {
    if (!this.settings.enableTheming?.value) {
      element.style.background = "transparent";
      element.style.border = "none";
      element.style.borderRadius = "0";
      element.style.padding = "0";
      element.style.boxShadow = "none";
      element.style.textShadow = "none";
      return;
    }
    const hasVisibleItems = this.hasVisibleGroundItems(element);
    if (!hasVisibleItems) {
      element.style.background = "transparent";
      element.style.border = "none";
      element.style.borderRadius = "0";
      element.style.padding = "0";
      element.style.boxShadow = "none";
      element.style.textShadow = "none";
      return;
    }
    if (this.settings.showBackgrounds?.value) {
      element.style.background = "rgba(255, 165, 0, 0.15)";
      element.style.borderRadius = "4px";
      element.style.padding = "2px 6px";
    } else {
      element.style.background = "transparent";
      element.style.borderRadius = "0";
      element.style.padding = "0";
    }
    if (this.settings.showBorders?.value) {
      element.style.border = "1px solid rgba(255, 165, 0, 0.4)";
    } else {
      element.style.border = "none";
    }
    if (this.settings.showShadows?.value) {
      element.style.textShadow = "1px 1px 2px rgba(0, 0, 0, 0.8)";
      element.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.3)";
    } else {
      element.style.textShadow = "none";
      element.style.boxShadow = "none";
    }
    const childElements = element.children;
    for (let i = 0; i < childElements.length; i++) {
      const childElement = childElements[i];
      if (this.settings.showShadows?.value) {
        childElement.style.textShadow = "1px 1px 2px rgba(0, 0, 0, 0.8)";
      } else {
        childElement.style.textShadow = "none";
      }
    }
  }
  hasVisibleGroundItems(element) {
    const ignoredItems = this.getIgnoredItemsSet();
    const itemContainers = element.children;
    for (let i = 0; i < itemContainers.length; i++) {
      const container = itemContainers[i];
      const textSpan = container.querySelector("span");
      if (!textSpan) continue;
      const itemName = textSpan.innerText.split(" [x")[0];
      if (!ignoredItems.has(itemName) || this.altKeyPressed) {
        return true;
      }
    }
    return false;
  }
  disposeElementFromCollection(collection, key) {
    if (collection[key]?.element) {
      collection[key].element.remove();
      delete collection[key];
    }
  }
  cleanupElementCollection(collection) {
    for (const key in collection) {
      if (collection[key]) {
        collection[key].element.remove();
        delete collection[key];
      }
    }
  }
  cleanupAllElements() {
    this.cleanupElementCollection(this.NPCDomElements);
    this.cleanupElementCollection(this.PlayerDomElements);
    this.cleanupElementCollection(this.GroundItemDomElements);
    this.NPCDomElements = {};
    this.PlayerDomElements = {};
    this.GroundItemDomElements = {};
    if (this.DOMElement) {
      this.DOMElement.remove();
      this.DOMElement = null;
    }
  }
  setupAllElements() {
    this.cleanupAllElements();
    this.DOMElement = this.uiManager.createElement(
      UIManagerScope.ClientRelative
    );
    if (this.DOMElement) {
      this.DOMElement.id = "highlite-nameplates";
      this.DOMElement.style.position = "absolute";
      this.DOMElement.style.pointerEvents = "none";
      this.DOMElement.style.zIndex = "1";
      this.DOMElement.style.overflow = "hidden";
      this.DOMElement.style.width = "100%";
      this.DOMElement.style.height = "calc(100% - var(--titlebar-height))";
      this.DOMElement.style.top = "var(--titlebar-height)";
      this.DOMElement.style.fontFamily = "Inter";
      this.DOMElement.style.fontSize = "12px";
      this.DOMElement.style.fontWeight = "bold";
      this.injectCSSVariables();
    }
  }
};
export {
  Nameplates as default
};
