import { NextRequest, NextResponse } from "next/server";
import { verifyTelegramInitData, getTelegramUserId } from "./telegram";

/**
 * Проверяет заголовок X-Telegram-Init-Data. Возвращает null если всё ок,
 * либо готовый NextResponse с ошибкой, который нужно сразу вернуть из роута.
 */
export function requireTelegramAuth(req: NextRequest): NextResponse | null {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const allowedUserId = process.env.ALLOWED_TELEGRAM_USER_ID;
  const initData = req.headers.get("x-telegram-init-data");

  if (!botToken) {
    return NextResponse.json({ error: "Сервер не настроен (нет TELEGRAM_BOT_TOKEN)" }, { status: 500 });
  }
  if (!initData) {
    return NextResponse.json({ error: "Нет данных авторизации Telegram" }, { status: 401 });
  }
  if (!verifyTelegramInitData(initData, botToken)) {
    return NextResponse.json({ error: "Подпись Telegram недействительна" }, { status: 401 });
  }
  if (allowedUserId) {
    const userId = getTelegramUserId(initData);
    if (String(userId) !== String(allowedUserId)) {
      return NextResponse.json({ error: "Доступ разрешён только владельцу" }, { status: 403 });
    }
  }
  return null;
}
