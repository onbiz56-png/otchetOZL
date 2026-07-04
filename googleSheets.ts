:root {
  --accent: #0a5043;
  --accent-light: #e4efec;
  --danger: #c0392b;
  --warning-bg: #fff4e5;
  --warning-text: #8a5300;
  --radius: 14px;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Manrope", "Segoe UI", sans-serif;
  background: var(--tg-theme-bg-color, #f5f6f7);
  color: var(--tg-theme-text-color, #1a1a1a);
  padding-bottom: 96px;
}

.page {
  max-width: 640px;
  margin: 0 auto;
  padding: 16px;
}

.pageTitle {
  font-size: 20px;
  font-weight: 700;
  margin: 4px 0 4px;
}

.pageSubtitle {
  font-size: 13px;
  color: var(--tg-theme-hint-color, #8a8a8a);
  margin-bottom: 16px;
}

.block {
  background: var(--tg-theme-secondary-bg-color, #fff);
  border-radius: var(--radius);
  margin-bottom: 12px;
  overflow: hidden;
  border: 1px solid rgba(10, 80, 67, 0.08);
}

.blockHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  color: var(--accent);
  user-select: none;
}

.blockHeaderRight {
  display: flex;
  align-items: center;
  gap: 8px;
}

.blockBadge {
  font-size: 11px;
  font-weight: 500;
  color: var(--tg-theme-hint-color, #8a8a8a);
}

.chevron {
  transition: transform 0.15s ease;
  color: var(--tg-theme-hint-color, #8a8a8a);
}

.chevronOpen {
  transform: rotate(180deg);
}

.blockBody {
  padding: 0 12px 12px;
}

.fieldCard {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.fieldLabel {
  font-size: 13px;
  line-height: 1.35;
  flex: 1;
}

.fieldFilledDot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  margin-right: 6px;
}

.fieldInput {
  width: 84px;
  flex-shrink: 0;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  font-size: 14px;
  text-align: right;
  background: var(--tg-theme-bg-color, #fff);
  color: var(--tg-theme-text-color, #1a1a1a);
}

.fieldInput:focus {
  outline: 2px solid var(--accent);
  border-color: var(--accent);
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--tg-theme-bg-color, #fff);
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
  display: flex;
  gap: 8px;
  max-width: 640px;
  margin: 0 auto;
}

.button {
  flex: 1;
  padding: 13px;
  border-radius: 12px;
  border: none;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.buttonPrimary {
  background: var(--accent);
  color: #fff;
}

.buttonSecondary {
  background: var(--accent-light);
  color: var(--accent);
}

.buttonPrimary:disabled,
.buttonSecondary:disabled {
  opacity: 0.5;
  cursor: default;
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 50;
}

.sheet {
  background: var(--tg-theme-bg-color, #fff);
  width: 100%;
  max-width: 640px;
  border-radius: 18px 18px 0 0;
  padding: 20px 18px calc(20px + env(safe-area-inset-bottom));
}

.sheetTitle {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 12px;
}

.sheetRow {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.sheetActions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.warningBanner {
  background: var(--warning-bg);
  color: var(--warning-text);
  font-size: 13px;
  font-weight: 600;
  border-radius: 10px;
  padding: 10px 12px;
  margin: 10px 0 4px;
}

.toast {
  position: fixed;
  bottom: 90px;
  left: 50%;
  transform: translateX(-50%);
  background: #1a1a1a;
  color: #fff;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 13px;
  z-index: 60;
}
