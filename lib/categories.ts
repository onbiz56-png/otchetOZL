// Полная структура ежедневного отчёта.
// row — номер строки в листе месяца (проверено на вкладках Июнь/Май/Апрель 2026,
// структура одинаковая во всех месяцах, поэтому переносится "как есть" на новые месяцы).

export type FieldType = "number" | "money" | "boolean";

export interface FieldDef {
  id: string;
  label: string;
  row: number;
  type: FieldType;
  // если true — нулевое значение при отправке отчёта считается предупреждением
  warnIfZero?: boolean;
}

export interface BlockDef {
  id: string;
  title: string;
  headerRow: number;
  fields: FieldDef[];
}

export const BLOCKS: BlockDef[] = [
  {
    id: "new_items",
    title: "Передано новых товаров в закупки",
    headerRow: 10,
    fields: [
      { id: "received_from_support", label: "Кол-во новых товаров, полученных за день от сопровождения", row: 11, type: "number" },
      { id: "no_stock_new_order", label: "Отсутствие товара у поставщика по новому заказу (кол-во)", row: 12, type: "number" },
      { id: "bought_same_day", label: "Выкуплено новых товаров в день получения", row: 13, type: "number" },
      { id: "bought_previous_days", label: "Выкуплено новых товаров с предыдущих дней", row: 14, type: "number" },
      { id: "not_bought_today_deadline", label: "Не выкуплено до конца смены за текущий день (дедлайн 1 сутки)", row: 15, type: "number" },
      { id: "not_bought_previous_day", label: "Не выкуплено до конца смены за предыдущий день", row: 16, type: "number" },
    ],
  },
  {
    id: "buyouts",
    title: "Выкупы товаров",
    headerRow: 18,
    fields: [
      { id: "primary_buyouts_count", label: "Сделано выкупов первичных (оплата проведена, товар в работе у поставщика)", row: 19, type: "number" },
      { id: "primary_buyout_amount", label: "Сумма, потраченная на первичный выкуп за день", row: 20, type: "money" },
      { id: "not_bought_in_work", label: "Не выкуплено товаров, полученных в работу за день", row: 21, type: "number" },
      { id: "buyout_delay_count", label: "Кол-во товаров с задержкой выкупа по плановым срокам", row: 22, type: "number" },
      { id: "replacement_offered_no_stock", label: "Предложено замен сопровождению при отсутствии товара (кол-во)", row: 23, type: "number" },
    ],
  },
  {
    id: "rebuyouts",
    title: "Перевыкупы товаров",
    headerRow: 25,
    fields: [
      { id: "sent_to_rebuy", label: "Кол-во товаров, отправленных на перевыкуп", row: 26, type: "number" },
      { id: "rebuy_overdue", label: "Из них с просроченным сроком получения на склад", row: 27, type: "number" },
      { id: "rebuy_done_same_day", label: "Товар найден и перевыкуп выполнен в день получения заявки", row: 28, type: "number" },
      { id: "rebuy_extra_payment", label: "Сумма доплаты с учётом ранее внесённых сумм за товары", row: 29, type: "money" },
    ],
  },
  {
    id: "payments_total",
    title: "Итого проведено оплат за текущий день",
    headerRow: 31,
    fields: [
      { id: "paid_items_count", label: "Количество оплаченных товаров", row: 32, type: "number", warnIfZero: true },
      { id: "paid_items_amount", label: "Сумма оплаченных товаров (в юанях)", row: 33, type: "money" },
      { id: "entered_into_table", label: "Внесено в таблицу (кол-во)", row: 34, type: "number" },
      { id: "receipts_uploaded_chat", label: "Выгружено чеков в чат (кол-во)", row: 35, type: "number" },
      { id: "awaiting_payment_count", label: "Количество товаров в ожидании оплат", row: 36, type: "number" },
      { id: "unpaid_amount", label: "Сумма по неоплаченным заказам (в юанях, все выкупленные)", row: 37, type: "money" },
    ],
  },
  {
    id: "deadlines_control",
    title: "Контроль сроков",
    headerRow: 39,
    fields: [
      { id: "overdue_buyout_risk", label: "Просрочен срок выкупа/получения на складе (риск возврата ДС)", row: 40, type: "number", warnIfZero: false },
      { id: "defect_twice_plus", label: "Товары, полученные с браком 2 раза и более", row: 41, type: "number" },
      { id: "items_in_progress", label: "Кол-во товаров в работе", row: 42, type: "number" },
    ],
  },
  {
    id: "warehouse_arrival_control",
    title: "Контроль прихода товаров на склады",
    headerRow: 44,
    fields: [
      { id: "tracks_received", label: "Получено треков об отправке от поставщиков", row: 45, type: "number" },
      { id: "tracks_uploaded_warehouse", label: "Выгружено треков на склад", row: 46, type: "number" },
      { id: "status_should_be_warehouse", label: "Переведено в статус «Должен быть на складе»", row: 47, type: "number" },
      { id: "warehouse_confirmed_24h", label: "Из них выгружено складом с отметкой «Пришло на склад» в течение суток", row: 48, type: "number" },
    ],
  },
  {
    id: "qc_failed",
    title: "Не прошёл контроль качества",
    headerRow: 50,
    fields: [
      { id: "qc_status_on_date", label: "Кол-во товаров в статусе на дату", row: 51, type: "number" },
      { id: "qc_taken_in_work", label: "Кол-во товаров, взятых в работу за день", row: 52, type: "number" },
      { id: "qc_closed_decision", label: "Закрыто вопросов по товарам / принято решение", row: 53, type: "number" },
      { id: "qc_not_processed", label: "Не обработаны в день получения информации о браке", row: 54, type: "number" },
      { id: "qc_confirmed_defect", label: "Подтверждённое кол-во брака", row: 55, type: "number" },
      { id: "qc_confirmed_flaw", label: "Подтверждённое кол-во дефектов", row: 56, type: "number" },
    ],
  },
  {
    id: "defects",
    title: "Брак",
    headerRow: 58,
    fields: [
      { id: "defect_received", label: "Получено с браком на складах", row: 59, type: "number" },
      { id: "flaw_received", label: "Получено с дефектами на складах", row: 60, type: "number" },
      { id: "wrong_size_received", label: "Получено не того размера", row: 61, type: "number" },
      { id: "mismatched_received", label: "Получено не соответствующих заказанному", row: 62, type: "number" },
      { id: "sent_replace_defect", label: "Отправлено на замену по браку (согласовано с поставщиком)", row: 63, type: "number" },
      { id: "sent_replace_size", label: "Отправлено на замену размера (согласовано с поставщиком)", row: 64, type: "number" },
    ],
  },
  {
    id: "send_to_suppliers",
    title: "Отправить поставщикам",
    headerRow: 66,
    fields: [
      { id: "agreed_send_to_factory", label: "Согласовано и передано в команду для отправки на фабрику", row: 67, type: "number" },
      { id: "warehouse_sent_on_time", label: "Склад отправил вовремя (дедлайн 1 сутки)", row: 68, type: "number" },
      { id: "not_sent_on_time", label: "Не отправлено вовремя", row: 69, type: "number" },
    ],
  },
  {
    id: "replacements",
    title: "Замены",
    headerRow: 71,
    fields: [
      { id: "sent_to_support_replacement", label: "Передано на замену в сопровождение за день", row: 72, type: "number" },
    ],
  },
  {
    id: "channel_requests",
    title: "Канал запросы",
    headerRow: 74,
    fields: [
      { id: "new_requests_received", label: "Получено новых запросов", row: 75, type: "number" },
      { id: "new_requests_closed", label: "Закрыто новых запросов", row: 76, type: "number" },
      { id: "closed_from_previous", label: "Закрыто с предыдущего периода", row: 77, type: "number" },
      { id: "in_progress_end_of_day", label: "Осталось в работе на конец дня", row: 78, type: "number" },
      { id: "not_closed_no_answer", label: "Не закрыто на конец смены (нет ответа от поставщиков)", row: 79, type: "number" },
      { id: "overdue_answer", label: "Просрочен ответ", row: 80, type: "number" },
      { id: "not_found_anywhere", label: "Из них не нашли / нет ни у кого", row: 81, type: "number" },
    ],
  },
  {
    id: "refunds",
    title: "Возврат ДС от поставщиков",
    headerRow: 84,
    fields: [
      { id: "pending_refund_count", label: "На контроле — не вернули ДС", row: 85, type: "number" },
      { id: "pending_refund_amount", label: "Сумма у поставщиков, которую нужно вернуть", row: 86, type: "money" },
      { id: "refunds_received_count", label: "Получено возвратов ДС на дату (шт.)", row: 87, type: "number" },
      { id: "refunds_received_amount", label: "Сумма полученных возвратов", row: 88, type: "money" },
    ],
  },
];

export const REPORT_SUBMITTED_ROW = 90;

export const ALL_FIELDS: FieldDef[] = BLOCKS.flatMap((b) => b.fields);

export function findField(id: string): FieldDef | undefined {
  return ALL_FIELDS.find((f) => f.id === id);
}

// Ключевые показатели для сводки в финальном отчёте
export const KEY_REPORT_FIELD_IDS: string[] = [
  "received_from_support",
  "bought_same_day",
  "primary_buyout_amount",
  "sent_to_rebuy",
  "paid_items_count", // если 0 — предупреждение "Пополнения сегодня не было !!!"
  "overdue_buyout_risk",
  "defect_received",
];
