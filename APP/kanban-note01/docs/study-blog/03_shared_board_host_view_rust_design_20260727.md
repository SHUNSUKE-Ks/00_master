# Rust共有資料: Shared Board Host View

## 重要度

重要書類。Note Studyで参照する共有Boardの画面・Component・状態契約として保管する。

## 目的

PCをホスト端末にして、AndroidとiPadの参加状況、付箋、タスク接続、セッション状態を一画面で管理する共有BoardのUI仕様。

## Rustの位置づけ

- 現資料はRustコードではなく、Rust側が扱う状態・イベント・保存境界を決める画面契約である。
- Rust側の候補責務は、Board状態、付箋・リンクの更新、セッション状態、端末同期、将来のシミュレーション処理。
- UI側はTopBar、Sidebar、Canvas、Inspector、StatusBarをComponentとして分離する。
- WebSocket、保存、認証などのBackend実装はこの資料の範囲外。画面モックとイベント名を先に固定する。

## 重要な設計要素

| 要素 | 内容 |
| --- | --- |
| 画面 | `/board/:boardId`、1440x900を基準にしたPCホスト画面 |
| 構成 | TopBar / 左Sidebar / BoardCanvas / 右Inspector / 下StatusBar |
| 状態 | Server、Connected Devices、Board Version、StickyNote、Link、選択対象 |
| 操作 | 付箋作成、接続、招待、保存、Property編集、Tab切替 |
| 将来 | TRPGのGM画面、Android/iPad Player、Rust側State管理 |

## 実装境界

1. まずJSONを読み取り、完成UIモックとして表示する。
2. ボタンはModal、Popover、Tab、console eventまでを検証する。
3. 次にSolidJSのStateとRust側のデータ契約を接続する。
4. 最後にWebSocketや永続保存を接続する。

## 原文JSON

出典: `C:\Users\enjoy\.codex\attachments\23db537f-7e09-4240-9bc0-ff558b546a64\pasted-text.txt`

```json
{
  "screen": {
    "screenId": "SCREEN_BOARD_HOST_001",
    "screenName": "Shared Board Host View",
    "screenType": "desktop",
    "route": "/board/:boardId",
    "viewport": {
      "width": 1440,
      "height": 900,
      "minWidth": 1024
    },
    "purpose": "PCをホスト端末として使用する共有ホワイトボード画面。AndroidとiPadの参加状況、付箋、タスク接続、セッション状態を一画面で管理する。",
    "designIntent": [
      "ゲームロビーとホワイトボード管理画面の中間",
      "情報量は多いが作業領域を最優先",
      "将来TRPGのGM画面へ拡張可能",
      "機能未実装でも完成イメージが伝わる",
      "各パーツを独立Componentとして差し替え可能にする"
    ]
  },
  "layout": {
    "layoutType": "threeColumnWorkspace",
    "areas": [
      {
        "areaId": "AREA_TOPBAR",
        "position": "top",
        "height": 64,
        "componentId": "COMP_TOPBAR"
      },
      {
        "areaId": "AREA_LEFT_SIDEBAR",
        "position": "left",
        "width": 260,
        "componentId": "COMP_LEFT_SIDEBAR"
      },
      {
        "areaId": "AREA_MAIN_CANVAS",
        "position": "center",
        "componentId": "COMP_BOARD_CANVAS"
      },
      {
        "areaId": "AREA_RIGHT_PANEL",
        "position": "right",
        "width": 320,
        "componentId": "COMP_RIGHT_INSPECTOR"
      },
      {
        "areaId": "AREA_BOTTOM_STATUS",
        "position": "bottom",
        "height": 32,
        "componentId": "COMP_STATUS_BAR"
      }
    ]
  },
  "theme": {
    "themeId": "THEME_CONTROL_ROOM_LIGHT",
    "mode": "light",
    "keywords": [
      "control room",
      "clean dashboard",
      "modern board game lobby",
      "soft neutral",
      "subtle grid",
      "professional tool"
    ],
    "colors": {
      "background": "#F4F5F7",
      "surface": "#FFFFFF",
      "surfaceSubtle": "#F8F9FB",
      "border": "#D9DEE7",
      "textPrimary": "#1F2937",
      "textSecondary": "#667085",
      "accent": "#4F6EF7",
      "success": "#22A06B",
      "warning": "#E59A1F",
      "danger": "#D64545",
      "noteYellow": "#FFF1A8",
      "noteBlue": "#CFE8FF",
      "noteGreen": "#D9F5D0",
      "notePink": "#FFD8E8"
    },
    "radius": {
      "small": 6,
      "medium": 10,
      "large": 16
    },
    "shadow": {
      "panel": "0 2px 12px rgba(20, 30, 50, 0.08)",
      "floating": "0 8px 24px rgba(20, 30, 50, 0.14)"
    }
  },
  "components": [
    {
      "componentId": "COMP_TOPBAR",
      "componentType": "TopBar",
      "role": "セッション全体の状態と主要操作を表示する",
      "layout": {
        "display": "flex",
        "align": "center",
        "justify": "space-between",
        "paddingX": 20
      },
      "children": [
        {
          "componentId": "COMP_APP_IDENTITY",
          "componentType": "AppIdentity",
          "props": {
            "icon": "network-board",
            "title": "Local Shared Board",
            "subtitle": "BOARD_001"
          }
        },
        {
          "componentId": "COMP_SESSION_STATUS",
          "componentType": "StatusGroup",
          "props": {
            "items": [
              {
                "label": "Server",
                "value": "Online",
                "status": "success"
              },
              {
                "label": "Devices",
                "value": "3 Connected",
                "status": "success"
              },
              {
                "label": "State",
                "value": "v42",
                "status": "neutral"
              }
            ]
          }
        },
        {
          "componentId": "COMP_TOP_ACTIONS",
          "componentType": "ActionGroup",
          "children": [
            {
              "componentId": "BTN_INVITE",
              "componentType": "Button",
              "props": {
                "label": "端末を招待",
                "icon": "qr-code",
                "variant": "secondary"
              },
              "interaction": {
                "type": "openModal",
                "targetId": "MODAL_INVITE_DEVICE"
              }
            },
            {
              "componentId": "BTN_SAVE",
              "componentType": "Button",
              "props": {
                "label": "保存",
                "icon": "save",
                "variant": "primary"
              },
              "interaction": {
                "type": "consoleLog",
                "message": "SAVE_BOARD clicked"
              }
            },
            {
              "componentId": "BTN_MORE",
              "componentType": "IconButton",
              "props": {
                "icon": "more-horizontal",
                "ariaLabel": "その他"
              },
              "interaction": {
                "type": "openPopover",
                "targetId": "POPOVER_BOARD_MENU"
              }
            }
          ]
        }
      ]
    },
    {
      "componentId": "COMP_LEFT_SIDEBAR",
      "componentType": "Sidebar",
      "role": "ボード、ビュー、参加端末、テンプレートを切り替える",
      "sections": [
        {
          "sectionId": "SECTION_VIEWS",
          "title": "VIEWS",
          "items": [
            {
              "itemId": "NAV_BOARD",
              "label": "ホワイトボード",
              "icon": "layout",
              "active": true
            },
            {
              "itemId": "NAV_TASK_LIST",
              "label": "タスクリスト",
              "icon": "list-check",
              "active": false
            },
            {
              "itemId": "NAV_FLOW",
              "label": "接続フロー",
              "icon": "git-branch",
              "active": false
            },
            {
              "itemId": "NAV_LOG",
              "label": "作業ログ",
              "icon": "history",
              "active": false
            }
          ]
        },
        {
          "sectionId": "SECTION_MEMBERS",
          "title": "CONNECTED DEVICES",
          "items": [
            {
              "deviceId": "DEVICE_PC_001",
              "label": "Host PC",
              "deviceType": "desktop",
              "role": "Host",
              "status": "online",
              "avatar": "PC"
            },
            {
              "deviceId": "DEVICE_ANDROID_001",
              "label": "Pixel 6a",
              "deviceType": "android",
              "role": "Player",
              "status": "online",
              "avatar": "A"
            },
            {
              "deviceId": "DEVICE_IPAD_001",
              "label": "iPad",
              "deviceType": "tablet",
              "role": "Player",
              "status": "online",
              "avatar": "I"
            }
          ]
        },
        {
          "sectionId": "SECTION_TEMPLATES",
          "title": "TEMPLATES",
          "items": [
            {
              "itemId": "TPL_EMPTY",
              "label": "空のボード",
              "icon": "square"
            },
            {
              "itemId": "TPL_TASK_CHAIN",
              "label": "タスク接続",
              "icon": "link"
            },
            {
              "itemId": "TPL_TRPG",
              "label": "TRPGセッション",
              "icon": "dice"
            }
          ]
        }
      ],
      "footer": {
        "componentId": "COMP_USER_PROFILE",
        "componentType": "UserProfile",
        "props": {
          "name": "Host",
          "role": "Administrator",
          "status": "online"
        }
      }
    },
    {
      "componentId": "COMP_BOARD_CANVAS",
      "componentType": "BoardCanvas",
      "role": "付箋と接続線を表示するメイン作業領域",
      "props": {
        "gridVisible": true,
        "gridSize": 24,
        "zoom": 100,
        "panEnabled": true,
        "selectionEnabled": true,
        "backgroundPattern": "dotGrid"
      },
      "toolbar": {
        "componentId": "COMP_CANVAS_TOOLBAR",
        "componentType": "FloatingToolbar",
        "position": "top-center",
        "children": [
          {
            "componentId": "TOOL_SELECT",
            "componentType": "ToolButton",
            "props": {
              "label": "選択",
              "icon": "mouse-pointer",
              "active": true
            }
          },
          {
            "componentId": "TOOL_NOTE",
            "componentType": "ToolButton",
            "props": {
              "label": "付箋",
              "icon": "sticky-note"
            },
            "interaction": {
              "type": "consoleLog",
              "message": "CREATE_NOTE tool selected"
            }
          },
          {
            "componentId": "TOOL_LINK",
            "componentType": "ToolButton",
            "props": {
              "label": "接続",
              "icon": "link"
            },
            "interaction": {
              "type": "consoleLog",
              "message": "CONNECT_NOTES tool selected"
            }
          },
          {
            "componentId": "TOOL_TEXT",
            "componentType": "ToolButton",
            "props": {
              "label": "テキスト",
              "icon": "type"
            }
          },
          {
            "componentId": "TOOL_FRAME",
            "componentType": "ToolButton",
            "props": {
              "label": "グループ",
              "icon": "frame"
            }
          }
        ]
      },
      "nodes": [
        {
          "nodeId": "NOTE_001",
          "componentType": "StickyNote",
          "position": {
            "x": 130,
            "y": 140
          },
          "size": {
            "width": 220,
            "height": 150
          },
          "props": {
            "color": "yellow",
            "title": "敵AIルール",
            "text": "勝利条件と行動優先度をRust側で定義する",
            "status": "doing",
            "ownerId": "DEVICE_PC_001",
            "tags": [
              "Rust",
              "AI"
            ]
          },
          "interaction": {
            "type": "selectComponent",
            "targetId": "NOTE_001"
          }
        },
        {
          "nodeId": "NOTE_002",
          "componentType": "StickyNote",
          "position": {
            "x": 470,
            "y": 330
          },
          "size": {
            "width": 220,
            "height": 150
          },
          "props": {
            "color": "blue",
            "title": "100回シミュレーション",
            "text": "画面描画なしで勝率と行動ログを検証する",
            "status": "todo",
            "ownerId": "DEVICE_PC_001",
            "tags": [
              "Test",
              "Simulation"
            ]
          }
        },
        {
          "nodeId": "NOTE_003",
          "componentType": "StickyNote",
          "position": {
            "x": 780,
            "y": 170
          },
          "size": {
            "width": 220,
            "height": 150
          },
          "props": {
            "color": "green",
            "title": "端末同期",
            "text": "PC・Android・iPadへStateを配信する",
            "status": "todo",
            "ownerId": "DEVICE_ANDROID_001",
            "tags": [
              "WebSocket"
            ]
          }
        },
        {
          "nodeId": "NOTE_004",
          "componentType": "StickyNote",
          "position": {
            "x": 750,
            "y": 520
          },
          "size": {
            "width": 220,
            "height": 150
          },
          "props": {
            "color": "pink",
            "title": "TRPG発展",
            "text": "PCをGM、AndroidとiPadをPlayerとして使用",
            "status": "future",
            "ownerId": "DEVICE_IPAD_001",
            "tags": [
              "TRPG",
              "Future"
            ]
          }
        }
      ],
      "links": [
        {
          "linkId": "LINK_001",
          "fromNodeId": "NOTE_001",
          "toNodeId": "NOTE_002",
          "relation": "next",
          "label": "実装後に検証",
          "style": "solidArrow"
        },
        {
          "linkId": "LINK_002",
          "fromNodeId": "NOTE_002",
          "toNodeId": "NOTE_003",
          "relation": "depends_on",
          "label": "Game Core安定後",
          "style": "solidArrow"
        },
        {
          "linkId": "LINK_003",
          "fromNodeId": "NOTE_003",
          "toNodeId": "NOTE_004",
          "relation": "next",
          "label": "同期基盤を流用",
          "style": "dashedArrow"
        }
      ],
      "floatingControls": [
        {
          "componentId": "CTRL_ZOOM",
          "componentType": "ZoomControl",
          "position": "bottom-left",
          "props": {
            "value": 100,
            "min": 25,
            "max": 200
          }
        },
        {
          "componentId": "BTN_ADD_NOTE_FLOAT",
          "componentType": "FloatingActionButton",
          "position": "bottom-right",
          "props": {
            "icon": "plus",
            "label": "付箋を追加"
          },
          "interaction": {
            "type": "openModal",
            "targetId": "MODAL_CREATE_NOTE"
          }
        }
      ]
    },
    {
      "componentId": "COMP_RIGHT_INSPECTOR",
      "componentType": "InspectorPanel",
      "role": "選択中の付箋またはボード全体の情報を編集する",
      "props": {
        "selectedTargetId": "NOTE_001"
      },
      "tabs": [
        {
          "tabId": "TAB_PROPERTIES",
          "label": "プロパティ",
          "active": true,
          "content": {
            "componentId": "FORM_NOTE_PROPERTIES",
            "componentType": "PropertyForm",
            "fields": [
              {
                "fieldId": "FIELD_NOTE_TITLE",
                "fieldType": "text",
                "label": "タイトル",
                "value": "敵AIルール"
              },
              {
                "fieldId": "FIELD_NOTE_TEXT",
                "fieldType": "textarea",
                "label": "内容",
                "value": "勝利条件と行動優先度をRust側で定義する"
              },
              {
                "fieldId": "FIELD_NOTE_STATUS",
                "fieldType": "select",
                "label": "ステータス",
                "value": "doing",
                "options": [
                  "todo",
                  "doing",
                  "review",
                  "done",
                  "future"
                ]
              },
              {
                "fieldId": "FIELD_NOTE_OWNER",
                "fieldType": "select",
                "label": "担当",
                "value": "DEVICE_PC_001",
                "options": [
                  "DEVICE_PC_001",
                  "DEVICE_ANDROID_001",
                  "DEVICE_IPAD_001"
                ]
              },
              {
                "fieldId": "FIELD_NOTE_COLOR",
                "fieldType": "colorSelect",
                "label": "カラー",
                "value": "yellow",
                "options": [
                  "yellow",
                  "blue",
                  "green",
                  "pink"
                ]
              }
            ],
            "actions": [
              {
                "componentId": "BTN_APPLY_PROPERTIES",
                "componentType": "Button",
                "props": {
                  "label": "変更を適用",
                  "variant": "primary"
                },
                "interaction": {
                  "type": "consoleLog",
                  "message": "APPLY_NOTE_PROPERTIES clicked"
                }
              },
              {
                "componentId": "BTN_DELETE_NOTE",
                "componentType": "Button",
                "props": {
                  "label": "付箋を削除",
                  "variant": "danger"
                },
                "interaction": {
                  "type": "openModal",
                  "targetId": "MODAL_DELETE_NOTE"
                }
              }
            ]
          }
        },
        {
          "tabId": "TAB_ACTIVITY",
          "label": "履歴",
          "active": false,
          "content": {
            "componentId": "COMP_ACTIVITY_LIST",
            "componentType": "ActivityList",
            "items": [
              {
                "time": "14:31",
                "actor": "Host PC",
                "action": "付箋を作成"
              },
              {
                "time": "14:34",
                "actor": "Pixel 6a",
                "action": "内容を編集"
              },
              {
                "time": "14:36",
                "actor": "Host PC",
                "action": "ステータスをdoingへ変更"
              }
            ]
          }
        },
        {
          "tabId": "TAB_CONNECTIONS",
          "label": "接続",
          "active": false,
          "content": {
            "componentId": "COMP_CONNECTION_LIST",
            "componentType": "ConnectionList",
            "items": [
              {
                "linkId": "LINK_001",
                "targetId": "NOTE_002",
                "relation": "next",
                "label": "100回シミュレーション"
              }
            ]
          }
        }
      ]
    },
    {
      "componentId": "COMP_STATUS_BAR",
      "componentType": "StatusBar",
      "children": [
        {
          "componentId": "STATUS_WEBSOCKET",
          "componentType": "StatusItem",
          "props": {
            "icon": "wifi",
            "label": "WebSocket Connected",
            "status": "success"
          }
        },
        {
          "componentId": "STATUS_AUTOSAVE",
          "componentType": "StatusItem",
          "props": {
            "icon": "cloud-check",
            "label": "Last saved 14:36",
            "status": "neutral"
          }
        },
        {
          "componentId": "STATUS_BOARD_INFO",
          "componentType": "StatusItem",
          "props": {
            "label": "4 Notes / 3 Links / 3 Devices"
          }
        }
      ]
    }
  ],
  "overlays": [
    {
      "overlayId": "MODAL_INVITE_DEVICE",
      "overlayType": "Modal",
      "title": "端末を招待",
      "openByDefault": false,
      "content": {
        "description": "同じWi-Fiに接続した端末から以下のURLを開いてください。",
        "url": "http://192.168.1.20:8770",
        "qrCodePlaceholder": true,
        "actions": [
          {
            "label": "URLをコピー",
            "interaction": {
              "type": "consoleLog",
              "message": "COPY_INVITE_URL clicked"
            }
          },
          {
            "label": "閉じる",
            "interaction": {
              "type": "closeOverlay"
            }
          }
        ]
      }
    },
    {
      "overlayId": "MODAL_CREATE_NOTE",
      "overlayType": "Modal",
      "title": "新しい付箋",
      "openByDefault": false,
      "content": {
        "fields": [
          {
            "fieldId": "NEW_NOTE_TITLE",
            "fieldType": "text",
            "label": "タイトル",
            "placeholder": "タスク名"
          },
          {
            "fieldId": "NEW_NOTE_TEXT",
            "fieldType": "textarea",
            "label": "内容",
            "placeholder": "付箋の内容を入力"
          },
          {
            "fieldId": "NEW_NOTE_COLOR",
            "fieldType": "colorSelect",
            "label": "カラー",
            "value": "yellow"
          }
        ],
        "actions": [
          {
            "label": "作成",
            "variant": "primary",
            "interaction": {
              "type": "consoleLog",
              "message": "CREATE_NOTE submitted"
            }
          },
          {
            "label": "キャンセル",
            "interaction": {
              "type": "closeOverlay"
            }
          }
        ]
      }
    },
    {
      "overlayId": "MODAL_DELETE_NOTE",
      "overlayType": "ConfirmDialog",
      "title": "付箋を削除しますか？",
      "openByDefault": false,
      "content": {
        "description": "この操作は接続されているリンクにも影響します。",
        "actions": [
          {
            "label": "削除",
            "variant": "danger",
            "interaction": {
              "type": "consoleLog",
              "message": "DELETE_NOTE confirmed"
            }
          },
          {
            "label": "キャンセル",
            "interaction": {
              "type": "closeOverlay"
            }
          }
        ]
      }
    },
    {
      "overlayId": "POPOVER_BOARD_MENU",
      "overlayType": "Popover",
      "openByDefault": false,
      "items": [
        {
          "label": "ボード設定",
          "interaction": {
            "type": "consoleLog",
            "message": "OPEN_BOARD_SETTINGS clicked"
          }
        },
        {
          "label": "JSONを書き出す",
          "interaction": {
            "type": "consoleLog",
            "message": "EXPORT_BOARD_JSON clicked"
          }
        },
        {
          "label": "TRPGモードへ切替",
          "interaction": {
            "type": "consoleLog",
            "message": "SWITCH_TRPG_MODE clicked"
          }
        }
      ]
    }
  ],
  "interactionRules": [
    {
      "ruleId": "RULE_CONSOLE_ONLY",
      "description": "未実装の操作はconsole.logでイベント名を表示する"
    },
    {
      "ruleId": "RULE_MODAL_DEMO",
      "description": "Modal、Popover、Tabのみデモ動作させる"
    },
    {
      "ruleId": "RULE_NO_BACKEND",
      "description": "サーバー接続やデータ保存は実装せず、見た目と操作感のみ再現する"
    },
    {
      "ruleId": "RULE_RESPONSIVE_PREVIEW",
      "description": "PC画面を基準にしつつ、1024pxまではレイアウトを維持する"
    }
  ],
  "componentNamingRules": {
    "screenPrefix": "SCREEN_",
    "areaPrefix": "AREA_",
    "componentPrefix": "COMP_",
    "buttonPrefix": "BTN_",
    "modalPrefix": "MODAL_",
    "popoverPrefix": "POPOVER_",
    "fieldPrefix": "FIELD_",
    "notePrefix": "NOTE_",
    "linkPrefix": "LINK_"
  },
  "claudeDesignInstructions": [
    "このJSONを基準に、完成度の高いデスクトップUIモックを作成する",
    "ReactまたはHTML/CSSで描画してよいが、データ構造はComponent単位で分離する",
    "Canvas領域を最も広く取る",
    "左Sidebarと右Inspectorは固定幅にする",
    "付箋と接続線はダミーデータで表示する",
    "ドラッグ操作は実装不要",
    "ボタンはModal、Popover、console.logのみ実装する",
    "TopBar、Sidebar、Canvas、Inspector、StatusBarを個別Componentにする",
    "画面全体を一枚の完成UIとして見せる",
    "ゲーム管理画面へ発展できる雰囲気を残す",
    "過度にカラフルにせず、付箋だけ色を使う"
  ]
}
```
