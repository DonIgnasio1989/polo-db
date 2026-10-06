/* ============================================================
   VW Polo/Caddy 6N — База Мастера · app.js
   ============================================================ */

/* ============ СПРАВОЧНИКИ ============ */
const BASE_CATS = [
    { id: 'All', label: 'Все системы', icon: '📦' },

    // ─── Сервис ──────────────────────────────
    { id: 'Maintenance', label: 'Регламент ТО', icon: '🔧' },
    { id: 'RoadKit', label: 'С собой в дорогу', icon: '🎒' },

    // ─── Силовой агрегат ─────────────────────
    { id: 'Engine', label: 'Двигатель', icon: '⚙️' },
    { id: 'Cooling', label: 'Охлаждение', icon: '❄️', parent: 'Engine' },
    { id: 'Ignition', label: 'Зажигание', icon: '🔥', parent: 'Engine' },
    { id: 'Fuel', label: 'Топливная система', icon: '⛽' },
    { id: 'Exhaust', label: 'Выпуск ОГ', icon: '💨', parent: 'Fuel' },
    { id: 'Transmission', label: 'Трансмиссия', icon: '🔄' },

    // ─── Ходовая часть ───────────────────────
    { id: 'Suspension', label: 'Подвеска', icon: '🌀' },
    { id: 'Steering', label: 'Рулевое управление', icon: '⎈', parent: 'Suspension' },
    { id: 'Brakes', label: 'Тормозная система', icon: '🛑' },
    { id: 'RearAxle', label: 'Задняя ось', icon: '🔗' },
    { id: 'Controls', label: 'Приводы управления', icon: '🎛️' },

    // ─── Кузов и салон ───────────────────────
    { id: 'Body', label: 'Кузов', icon: '🚗' },
    { id: 'Interior', label: 'Салон', icon: '🪑' },

    // ─── Электрика и климат ──────────────────
    { id: 'Electrical', label: 'Электрика', icon: '⚡' },
    { id: 'Bulbs', label: 'Освещение', icon: '💡', parent: 'Electrical' },
    { id: 'Heating', label: 'Отопление / Климат', icon: '🌡️' },

    // ─── Расходники ──────────────────────────
    { id: 'Fluids', label: 'Жидкости', icon: '🛢️' },
    { id: 'Tires', label: 'Шины и давление', icon: '🛞' }
];
let CATS = BASE_CATS.slice();

const ENGINES = {
    'AER': { v: '1.0', hp: 50, f: 'P' }, 'ALL': { v: '1.0', hp: 50, f: 'P' }, 'AEV': { v: '1.0', hp: 50, f: 'P' },
    'ALD': { v: '1.0', hp: 50, f: 'P' }, 'ANV': { v: '1.0', hp: 50, f: 'P' }, 'AUC': { v: '1.0', hp: 50, f: 'P' },
    'AEX': { v: '1.4', hp: 60, f: 'P' }, 'APQ': { v: '1.4', hp: 60, f: 'P' }, 'AKV': { v: '1.4', hp: 60, f: 'P' },
    'ANX': { v: '1.4', hp: 60, f: 'P' }, 'AKK': { v: '1.4', hp: 60, f: 'P' }, 'ANW': { v: '1.4', hp: 60, f: 'P' },
    'AUD': { v: '1.4', hp: 60, f: 'P' }, 'APE': { v: '1.4 16V', hp: 75, f: 'P' }, 'AUA': { v: '1.4 16V', hp: 75, f: 'P' },
    'AEE': { v: '1.6', hp: 75, f: 'P' }, 'ALM': { v: '1.6', hp: 75, f: 'P' }, 'AUR': { v: '1.6', hp: 75, f: 'P' },
    'AFT': { v: '1.6', hp: 100, f: 'P' }, '1F': { v: '1.6', hp: 75, f: 'P' }, 'ADZ': { v: '1.8', hp: 90, f: 'P' },
    'AKW': { v: '1.7 SDI', hp: 60, f: 'D' }, 'AHB': { v: '1.7 SDI', hp: 60, f: 'D' },
    'AEY': { v: '1.9 SDI', hp: 64, f: 'D' }, 'AGP': { v: '1.9 D', hp: 68, f: 'D' }, 'AQM': { v: '1.9 SDI', hp: 68, f: 'D' },
    'AYQ': { v: '1.9 SDI', hp: 64, f: 'D' }, 'ASV': { v: '1.9 SDI', hp: 110, f: 'D' }, '1Y': { v: '1.9 D', hp: 64, f: 'D' },
    'AFN': { v: '1.9 TDI', hp: 110, f: 'D' }, 'AHU': { v: '1.9 TDI', hp: 90, f: 'D' }, 'ALE': { v: '1.9 TDI', hp: 90, f: 'D' },
    'AGR': { v: '1.9 TDI', hp: 90, f: 'D' }, 'ALH': { v: '1.9 TDI', hp: 90, f: 'D' },
    'ADX': { v: '1.3', hp: 55, f: 'P' }, 'AEA': { v: '1.6', hp: 75, f: 'P' }, 'AHS': { v: '1.6', hp: 75, f: 'P' },
    'AFH': { v: '1.4 16V', hp: 100, f: 'P' }, 'AJV': { v: '1.6 16V', hp: 120, f: 'P' }, 'AHW': { v: '1.4 16V', hp: 75, f: 'P' },
    'AKL': { v: '1.6', hp: 100, f: 'P' }, 'AHT': { v: '1.4', hp: 75, f: 'P' }, 'ABU': { v: '1.4', hp: 60, f: 'P' },
    'AKQ': { v: '1.4 16V', hp: 75, f: 'P' }, 'AFK': { v: '1.4 16V', hp: 75, f: 'P' }, 'ANM': { v: '1.4 16V', hp: 75, f: 'P' },
    'AKU': { v: '1.7 SDI', hp: 57, f: 'D' }, 'AHG': { v: '1.7 SDI', hp: 57, f: 'D' },
    'AGD': { v: '1.9 SDI', hp: 64, f: 'D' }, 'AEF': { v: '1.9 SDI', hp: 64, f: 'D' }
};
const BODIES = {
    '3d': 'Hatchback 3д', '5d': 'Hatchback 5д', 'classic': 'Polo Classic (седан)',
    'estate': 'Polo Estate (универсал)', 'caddy-van': 'Caddy Van',
    'caddy-kombi': 'Caddy Kombi', 'caddy-pickup': 'Caddy Pickup'
};
const TRANSMISSIONS = {
    '085': 'МКПП 085 (5-ст)', '020': 'МКПП 020 (5-ст)', '02K': 'МКПП 02K (5-ст)',
    '01M': 'АКПП 01M (4-ст)', '01N': 'АКПП 01N (4-ст)'
};
const GENERATIONS = {
    '6N1': '6N1 — дорестайл (1994–1999)',
    '6N2': '6N2 — рестайлинг (1999–2001)'
};
const TRIMS = ['Base', 'CL', 'GL', 'Trendline', 'Comfortline', 'Highline', 'Open Air'];

/* ============ АЛИАСЫ ПОДКАТЕГОРИЙ (по категориям) ============ */
const SUB_ALIASES = {
    _all: {
        '': 'Прочее',
        'Разное': 'Прочее',
        'Прочее': 'Прочее',
        'Крепёж': 'Крепёж',
        'Крепёж и прокладки': 'Крепёж',
        'Болты и гайки': 'Крепёж',
    },

    Engine: {
        'Двигатель в сборе': 'Двигатель в сборе и блок цилиндров',
        'Блок цилиндров в сборе': 'Двигатель в сборе и блок цилиндров',
        'Блок цилиндров — детали': 'Двигатель в сборе и блок цилиндров',
        'Блок цилиндров и поршневая': 'Двигатель в сборе и блок цилиндров',
        'Поршни': 'Двигатель в сборе и блок цилиндров',
        'Шатуны': 'Двигатель в сборе и блок цилиндров',
        'Вкладыши': 'Двигатель в сборе и блок цилиндров',
        'ГБЦ': 'ГБЦ и клапаны',
        'ГБЦ и клапанный механизм': 'ГБЦ и клапаны',
        'Клапаны': 'ГБЦ и клапаны',
        'Распредвал': 'ГБЦ и клапаны',
        'Пружины и тарелки': 'ГБЦ и клапаны',
        'Направляющие втулки': 'ГБЦ и клапаны',
        'Маслосъёмные колпачки': 'ГБЦ и клапаны',
        'ГРМ и приводы': 'ГРМ',
        'Привод ГРМ': 'ГРМ',
        'Система смазки': 'Смазка и охлаждение',
        'Система охлаждения': 'Смазка и охлаждение',
        'Фильтры': 'Воздух и топливо',
        'Форсунки': 'Воздух и топливо',
        'Бак / Насос': 'Воздух и топливо',
        'Экология': 'Воздух и топливо',
        'Система впрыска': 'Воздух и топливо',
        'Система впрыска и зажигания': 'Зажигание и датчики',
        'Впускной коллектор': 'Воздух и топливо',
        'Свечи': 'Зажигание и датчики',
        'Катушка': 'Зажигание и датчики',
        'Провода': 'Зажигание и датчики',
        'Трамблёр': 'Зажигание и датчики',
        'Датчики': 'Зажигание и датчики',
        'Система зажигания': 'Зажигание и датчики',
        'Навесное': 'Навесное оборудование',
        'Гидроусилитель руля (опция)': 'Навесное оборудование',
        'Насос ГУР и приводной ремень': 'Навесное оборудование',
        'Навесное оборудование и приводы': 'Навесное оборудование',
        'Опоры двигателя': 'Опоры и сцепление',
        'Прокладки': 'Прокладки и крепёж',
        'Сальники': 'Прокладки и крепёж',
        'Крепёж и прокладки': 'Прокладки и крепёж',
    },

    Fuel: {
        'Форсунки': 'Форсунки',
        'Бак / Насос': 'Бак и насос',
        'Экология': 'Экология (EVAP)',
        'Датчики': 'Датчики',
        'Система впрыска': 'Форсунки',
        'Система впрыска и зажигания': 'Форсунки',
    },

    Ignition: {
        'Свечи': 'Свечи',
        'Катушка': 'Катушка',
        'Провода': 'Провода',
        'Трамблёр': 'Трамблёр',
        'Датчики': 'Датчики',
        'Система зажигания': 'Прочее',
    },

    Cooling: {
        'Термостат / Помпа': 'Помпа и термостат',
        'Помпа': 'Помпа и термостат',
        'Радиатор': 'Радиатор',
        'Датчики': 'Датчики',
        'Патрубки': 'Патрубки и шланги',
        'Шланги ОЖ': 'Патрубки и шланги',
        'Трубопроводы': 'Патрубки и шланги',
        'Фитинги': 'Патрубки и шланги',
        'Хомуты': 'Патрубки и шланги',
        'Вентилятор': 'Вентилятор',
        'Расширительный бачок': 'Расширительный бачок',
        'Система охлаждения': 'Прочее',
        'Кондиционер': 'Кондиционер',
    },

    Heating: {
        'Радиатор печки': 'Радиатор печки',
        'Резистор': 'Резистор и моторчик',
        'Моторчик': 'Резистор и моторчик',
    },

    Brakes: {
        'Передние': 'Передние тормоза',
        'Передние тормоза': 'Передние тормоза',
        'Передний суппорт': 'Передние тормоза',
        'Задние': 'Задние тормоза',
        'Задние тормоза': 'Задние тормоза',
        'ГТЦ': 'ГТЦ и ВУТ',
        'ГТЦ и ВУТ': 'ГТЦ и ВУТ',
        'ABS': 'ABS',
        'Тормозная система с ABS': 'ABS',
        'Шланги': 'Шланги и трубки',
        'Шланги и трубки': 'Шланги и трубки',
        'Трубки и штуцеры': 'Шланги и трубки',
    },

    Suspension: {
        'Передняя': 'Передняя подвеска',
        'Передняя подвеска': 'Передняя подвеска',
        'Рычаги': 'Передняя подвеска',
        'Стабилизатор': 'Передняя подвеска',
        'Задняя': 'Задняя подвеска',
        'Задняя подвеска': 'Задняя подвеска',
        'Ступица': 'Ступица',
        'ШРУС': 'Приводы и ШРУС',
        'Крепёж подвески': 'Крепёж подвески',
        'Болты и гайки': 'Крепёж подвески',
        'Инструмент': 'Инструмент',
        'Рулевое': 'ПЕРЕКИНУТЬ→Steering',
        'Рулевое управление': 'ПЕРЕКИНУТЬ→Steering',
    },

    Steering: {
        'Рулевое': 'Рейка и тяги',
        'Рулевое управление': 'Рейка и тяги',
        'Рейка': 'Рейка и тяги',
        'Тяги': 'Рейка и тяги',
        'ГУР': 'ГУР',
    },

    RearAxle: {
        'Балка': 'Балка',
        'Сайлентблоки': 'Сайлентблоки',
        'Пружины': 'Пружины',
        'Амортизаторы': 'Амортизаторы',
        'Ступица': 'Ступица',
        'Барабаны / Колодки': 'Барабаны и колодки',
        'Ремкомплект': 'Ремкомплект',
        'Тросы / Шланги': 'Тросы и шланги',
    },

    Transmission: {
        'Сцепление': 'Сцепление',
        'КПП / Масла': 'КПП и масла',
        'КПП': 'КПП и масла',
        'Первичный вал': 'Валы и подшипники',
        'Вторичный вал': 'Валы и подшипники',
        'Валы': 'Валы и подшипники',
        'Дифференциал': 'Дифференциал',
        'Шток переключения': 'Кулиса',
        'Тяги и шарниры': 'Кулиса',
        'Трос КПП': 'Кулиса',
        'Кольца': 'Синхронизаторы',
        'Стопорные кольца': 'Синхронизаторы',
        'Прокладки': 'Прокладки и крепёж',
        'Приводы': 'Приводы и ШРУС',
        'ШРУС': 'Приводы и ШРУС',
    },

    Exhaust: {
        'Глушитель': 'Глушитель',
        'Крепёж': 'Крепёж',
        'Выхлопная система': 'Глушитель',
    },

    Electrical: {
        'Питание': 'Питание',
        'Генератор': 'Генератор и стартер',
        'Стартер': 'Генератор и стартер',
        'Генератор и стартер': 'Генератор и стартер',
        'Замок': 'Замок зажигания',
        'Датчики': 'Датчики',
        'Реле': 'Реле и предохранители',
        'Реле и предохранители': 'Реле и предохранители',
        'Приборная панель': 'Приборная панель',
        'Стеклоподъёмники': 'Стеклоподъёмники',
        'Центральный замок': 'Центральный замок',
        'Подогрев сидений': 'Подогрев сидений',
        'Бортовой компьютер': 'Бортовой компьютер',
        'Иммобилайзер': 'Иммобилайзер',
        'Магнитола': 'Магнитола и динамики',
        'Динамики': 'Магнитола и динамики',
        'Обогрев стёкол': 'Обогрев стёкол',
        'Сигнализация': 'Сигнализация',
        'Прикуриватель': 'Прикуриватель',
        'Освещение': 'Освещение',
    },

    Bulbs: {
        'Освещение': 'Лампы',
        'Оптика': 'Оптика',
    },

    Body: {
        'Обвес GTI': 'Обвес',
        'Зеркала': 'Зеркала',
        'Стёкла': 'Стёкла',
        'Капот / Двери': 'Наружные панели',
        'Решётка радиатора': 'Наружные панели',
        'Крылья': 'Наружные панели',
        'Бампер': 'Наружные панели',
        'Передняя часть': 'Наружные панели',
        'Задняя часть': 'Наружные панели',
        'Боковая часть': 'Наружные панели',
        'Кузовные элементы': 'Наружные панели',
        'Замки': 'Замки и ручки',
        'Уплотнители': 'Уплотнители',
        'Двери': 'Двери',
        'Люк (сдвижной верх)': 'Люк',
        'Люк (универсальный)': 'Люк',
        'Тюнинг/аксессуары': 'Аксессуары',
        'ВАЗ-совместимость': 'ВАЗ-совместимость',
        'Электрические зеркала': 'Зеркала',
        'Крепёж и декор': 'Крепёж',
    },

    Interior: {
        'Сиденья': 'Сиденья',
        'Обшивка': 'Обшивка дверей',
        'Обшивка дверей': 'Обшивка дверей',
        'Освещение': 'Освещение салона',
        'Руль': 'Руль',
        'Прочее': 'Прочее',
        'Безопасность': 'Безопасность',
        'Накладки и консоль': 'Панель и консоль',
        'Панель приборов': 'Панель и консоль',
        'Бардачок и вещевые ящики': 'Панель и консоль',
        'Пепельница': 'Панель и консоль',
        'Консоль': 'Панель и консоль',
        'Каркас и направляющие': 'Сиденья',
        'Обивка и накладки': 'Сиденья',
        'Накладки': 'Сиденья',
        'Ручки и замки': 'Ручки и замки',
        'Плафоны': 'Освещение салона',
        'Выключатели': 'Освещение салона',
        'Потолок': 'Потолок',
        'Ручки': 'Потолок',
        'Петли и крепления': 'Потолок',
        'Ковры и накладки': 'Ковры',
        'Аксессуары': 'Аксессуары',
    },

    Maintenance: {
        'Фильтры': 'Фильтры',
        'Регламент': 'Регламент ТО',
        'Жидкости': 'Жидкости',
        'Прокачка': 'Жидкости',
        'Шины': 'Шины',
        'Моторные масла': 'Моторные масла',
        'Смазки': 'Смазки',
        'Стеклоочиститель': 'Стеклоочиститель',
    },

    Fluids: {
        'Моторные масла': 'Моторные масла',
        'Антифриз': 'Антифриз',
        'Смазки': 'Смазки',
        'Кондиционер': 'Фреон и масло кондиционера',
        'Гидроусилитель руля': 'Жидкость ГУР',
        'Тормозная жидкость': 'Тормозная жидкость',
    },

    RoadKit: {
        'Аварийный набор': 'Аварийный набор',
    },

    Tires: {
        'Шины — Хэтчбек 3d/5d': 'Хэтчбек 3d/5d',
        'Шины — Classic (седан)': 'Classic (седан)',
        'Шины — Estate / Variant (универсал)': 'Estate / Variant',
        'Шины — Caddy Van / Kombi': 'Caddy Van / Kombi',
        'Шины — Сводная таблица': 'Сводная таблица',
        'Шины': 'Общее',
    },

    Controls: {
        'Педаль газа': 'Педаль газа',
        'Трос газа': 'Трос газа',
        'Педаль сцепления': 'Педаль сцепления',
        'Трос сцепления': 'Трос сцепления',
        'Кронштейн педалей': 'Кронштейн педалей',
        'Кулиса КПП': 'Кулиса КПП',
        'Трос КПП': 'Кулиса КПП',
        'Выключатель': 'Выключатели',
    },
};
const BASE_EK = {
    Maintenance: { g: 'Регламент ТО', s: 'Обслуживание' },
    RoadKit: { g: 'С собой в дорогу', s: 'Аварийный набор' },
    Engine: { g: 'Двигатель', s: 'Разное' },
    Fuel: { g: 'Топливная', s: 'Подача / Фильтры' },
    Ignition: { g: 'Зажигание', s: 'Свечи / Катушки' },
    Cooling: { g: 'Охлаждение', s: 'Радиатор / Термостат' },
    Heating: { g: 'Отопление', s: 'Печка / Климат' },
    Suspension: { g: 'Подвеска', s: 'Передняя / Задняя' },
    Steering: { g: 'Рулевое', s: 'Рейка и тяги' },
    Brakes: { g: 'Тормоза', s: 'Передние / Задние' },
    Transmission: { g: 'Трансмиссия', s: 'КПП / Привод' },
    Exhaust: { g: 'Выхлоп', s: 'Глушитель' },
    Electrical: { g: 'Электрика', s: 'Генератор / Стартер' },
    Bulbs: { g: 'Лампы', s: 'Освещение' },
    Body: { g: 'Кузов', s: 'Наружные панели' },
    Interior: { g: 'Интерьер', s: 'Панель / Сиденья' },
    Tires: { g: 'Колёса', s: 'Шины и давление' },
    Fluids: { g: 'Жидкости', s: 'Эксплуатационные' },
    RearAxle: { g: 'Задняя ось', s: 'Балка и ступица' },
    Controls: { g: 'Управление', s: 'Педали и кулиса' },
};

/* ============================================================
   ГРУППЫ КАТЕГОРИЙ — порядок и состав блоков в сайдбаре
   ============================================================ */
const CAT_GROUPS = [
    {
        id: 'service',
        label: 'Сервис',
        cats: ['Maintenance', 'RoadKit']
    },
    {
        id: 'powertrain',
        label: 'Силовой агрегат',
        cats: ['Engine', 'Fuel', 'Transmission']
    },
    {
        id: 'chassis',
        label: 'Ходовая часть',
        cats: ['Suspension', 'Steering', 'Brakes', 'RearAxle', 'Controls']
    },
    {
        id: 'body',
        label: 'Кузов и салон',
        cats: ['Body', 'Interior']
    },
    {
        id: 'electro',
        label: 'Электрика и климат',
        cats: ['Electrical', 'Heating']
    },
    {
        id: 'consumables',
        label: 'Расходники',
        cats: ['Fluids', 'Tires']
    },
    {
        id: 'refs',
        label: 'Справочники',
        cats: ['Torque', 'Diagnostics', 'Workshops', 'Log'],
        virtual: true
    }
];

let EK = Object.assign({}, BASE_EK);

const IL = { s: 'СПЕЦИФИКАЦИЯ', t: 'ИНСТРУМЕНТ', p: 'ПРОЦЕДУРА', w: 'ВНИМАНИЕ', n: 'ЗАМЕТКА', r: 'РЕКОМЕНДАЦИЯ' };
const IC = { s: 'ts', t: 'tt', p: 'tp2', w: 'tw', n: 'tn', r: 'tr' };
const IM = { spec: 's', tool: 't', proc: 'p', warn: 'w', note: 'n', recommendation: 'r' };
const MI = { s: 'spec', t: 'tool', p: 'proc', w: 'warn', n: 'note', r: 'recommendation' };

const SH = {
    ex: n => 'https://www.exist.ru/Price/?pcode=' + n,
    ad: n => 'https://www.autodoc.ru/price/657/' + n,
    av: (n, name) => {
        const cleanOem = String(n || '').replace(/\s+/g, '');
        const cleanName = String(name || '')
            .replace(/\b(?:vw|volkswagen)\s+polo\b/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        const q = (cleanName ? cleanName + ' ' : '') + 'VW Polo ' + cleanOem;
        return 'https://www.avito.ru/rossiya/zapchasti_i_aksessuary?q=' + encodeURIComponent(q);
    }
};

const shopH = (o, name) => {
    if (!o) return '';
    const c = o.replace(/\s/g, '');
    if (!c) return '';
    return '<div class="pr">'
        + '<a class="psl ex" target="_blank" rel="noopener noreferrer" href="' + SH.ex(c) + '" title="Поиск Exist">🛒 Exist</a>'
        + '<a class="psl ad" target="_blank" rel="noopener noreferrer" href="' + SH.ad(c) + '" title="Поиск Autodoc">🛒 Autodoc</a>'
        + '<a class="psl av" target="_blank" rel="noopener noreferrer" href="' + SH.av(o, name) + '" title="Поиск Avito">🛒 Avito</a>'
        + '</div>';
};
const ONLINE_CATALOGS = {
    emex: oem => 'https://emex.ru/f?detailNum=' + encodeURIComponent(oem) + '&packet=-1',
    zzap: oem => 'https://www.zzap.ru/public/search.aspx#rawdata=' + encodeURIComponent(oem)
};

const getPurchaseHtml = p => {
    const av = (typeof gAV === 'function') ? gAV() : null;
    const prs = fP(p.price, p.currency);
    const su = p.shopUrl || '';
    const hh = (p.priceHistory && p.priceHistory.length)
        ? '<span class="hi" title="История цен">📊 ' + p.priceHistory.length + '</span>' : '';
    let h = '';
    h += '<div class="prow">';
    h += prs ? '<span class="price-tag">' + esc(prs) + '</span>' : '<span style="color:var(--mu);font-size:.7rem">цена не указана</span>';
    h += hh;
    if (su) h += '<a class="sl" href="' + escA(su) + '" target="_blank" rel="noopener noreferrer">🛒 Свой магазин</a>';
    h += '</div>';
    if (p.oem) h += '<div class="prow">' + shopH(p.oem, p.name) + '</div>';
    if (p.oem) {
        const c = p.oem.replace(/\s+/g, '');
        h += '<div class="prow op-b">';
        h += '<a class="psl op1" target="_blank" rel="noopener noreferrer" href="' + ONLINE_CATALOGS.emex(c) + '" title="Поиск в Emex по артикулу">Emex</a>';
        h += '<a class="psl op7" target="_blank" rel="noopener noreferrer" href="' + ONLINE_CATALOGS.zzap(c) + '" title="Поиск в ZZap по артикулу">ZZap</a>';
        h += '</div>';
    }
    return h;
};

/* ============ КЛЮЧИ ХРАНИЛИЩА ============ */
const UK = 'vw_polo_ui_v186', PK = 'vw_polo_db_v181', WK = 'vw_polo_workshops_v181',
    VK = 'vw_polo_vincario_key_v18', GK = 'vw_polo_garage_v181', DN = 'vw_polo_v181', DV = 2,
    SP = 'parts', SW = 'workshops', METAKEY = 'vw_polo_meta_v1', TOKEY = 'vw_polo_to_v1',
    LICKEY = 'vw_polo_license_v1', UPKEY = 'vw_polo_update_url_v1', PROFKEY = 'vw_polo_profile_v1',
    LOGKEY = 'vw_polo_logs_v1',
    WNKEY = 'vw_polo_last_seen_version_v1';

const THEMES = [
    { id: 'light', label: 'Светлая', icon: '☀️', cls: 'theme-light', preview: '#f3f5f9' },
    { id: 'dark', label: 'Тёмная', icon: '🌙', cls: 'theme-dark', preview: 'linear-gradient(135deg, #0e1525 0%, #131a28 100%)' },
    { id: 'aurora', label: 'Аврора', icon: '🌌', cls: 'theme-aurora', preview: 'linear-gradient(135deg, #0e1525 0%, #14b8a6 60%, #8b5cf6 100%)' },
    { id: 'cyberpunk', label: 'Киберпанк', icon: '🌸', cls: 'theme-cyberpunk', preview: 'linear-gradient(135deg, #100a1c 0%, #ec4899 55%, #22d3ee 100%)' },
    { id: 'sunset', label: 'Закат', icon: '🌅', cls: 'theme-sunset', preview: 'linear-gradient(135deg, #1a0a14 0%, #ec4899 40%, #f59e0b 100%)' },
    { id: 'cosmos', label: 'Космос', icon: '🌠', cls: 'theme-cosmos', preview: 'linear-gradient(135deg, #0d0a24 0%, #6366f1 60%, #38bdf8 100%)' },
    { id: 'paper', label: 'Крафт', icon: '📜', cls: 'theme-paper', preview: 'linear-gradient(135deg, #ece2cc 0%, #b45f2e 55%, #3a2a18 100%)' }
];

/* ============ СОСТОЯНИЕ ============ */
const DB = [];
let D = [], W = [], G = [], LOG = [];
let SV = {
    activeCat: 'All', activeSub: null, searchQuery: '', statusFilter: 'all', engineFilter: 'all',
    bodyFilter: 'all', trimFilter: 'all', transFilter: 'all', genFilter: 'all',
    sidebarCollapsed: false,
    theme: 'aurora', sortBy: 'default', view: 'grid', activeVinId: null,
    groupBySub: false, vinStrictFilter: false, expandedCats: {}
};
let USER = { name: '', email: '', city: '', initials: '', color: '#00b0f0' };
let CUSTOM = { categories: [], sections: {} };
let TO = { km: null, lastDate: null, interval: 15000 };

let APP_VERSION = '1.2.5';
let licAppReady = false;
let edId = null, ewId = null, pPh = null, pPhCl = false;
let useIDB = true, vk = '', pGV = null, dbr = null;
let vinEdId = null, shopPick = new Set(), partmoId = null;
let tt = null, tuT = null, usT = null, rcT = null;
let pPhs = [];
let _lbPhotos = [], _lbIdx = 0;
let _confirmCb = null;
let _changelogCache = [];
let _logByOem = new Map();
let _visibleLimit = 40, _lastRenderSig = '';

const PAGE_SIZE = 40;

/* ============ ИНДЕКС ЛОГОВ ============ */
function _rebuildLogIndex() {
    _logByOem.clear();
    for (const e of LOG) {
        const items = Array.isArray(e.items) ? e.items : [];
        for (const it of items) {
            const key = nz(it);
            if (!key) continue;
            const prev = _logByOem.get(key);
            if (!prev || (e.date || '') > (prev.date || '')) {
                _logByOem.set(key, e);
            }
        }
    }
}

/* ============ УТИЛИТЫ ============ */
const $ = id => document.getElementById(id);
const uid = () => 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
const nz = s => (s == null ? '' : String(s)).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const esc = t => { if (t == null) return ''; const d = document.createElement('div'); d.textContent = String(t); return d.innerHTML; };
const escA = t => esc(t).replace(/"/g, '&quot;');
const sImg = d => typeof d === 'string' && /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(d) ? d : '';
const sUrl = u => {
    if (typeof u !== 'string') return '';
    const t = u.trim();
    if (!t) return '';
    if (/^\s*(javascript|data|vbscript):/i.test(t)) return '';
    return t;
};
const fP = (p, c) => {
    if (p == null || p === '' || isNaN(p)) return '';
    const n = Number(p);
    if (!isFinite(n)) return '';
    const s = { RUB: '₽', USD: '$', EUR: '€', BYN: 'Br', KZT: '₸', UAH: '₴' };
    return n.toLocaleString('ru-RU', { maximumFractionDigits: 2 }) + ' ' + (s[c] || c || '');
};
const fD = ts => { try { return new Date(ts).toLocaleDateString('ru-RU'); } catch (e) { return ''; } };
const sl = v => String(v || '').split(',').map(s => s.trim()).filter(Boolean);
const csvE = v => {
    if (v == null) return '';
    const s = String(v);
    if (/[",\r\n;]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
};

/* ============ ЛОГИЧЕСКИЙ ПОРЯДОК ТО ============ */
const MAINT_ORDER = [
    'масло мотор', 'масло двс', 'масло двигател', 'масло в двигател',
    'фильтр маслян', 'масляный фильтр', 'фильтр масл',
    'воздушный фильтр', 'фильтр воздушн',
    'салонн', 'фильтр салон',
    'топливный фильтр', 'фильтр топливн',
    'свеч', 'свечи зажиган', 'катушк', 'провод высоковольт', 'провода зажиган',
    'ремень грм', 'грм', 'ролик грм', 'натяжитель грм',
    'ремень генератор', 'ремень поликлин', 'ремень приводн', 'ремень кондиц',
    'антифриз', 'охлаждающ', 'жидкость охлажд',
    'тормозн жидк', 'жидкость тормозн', 'жидкость тормоз',
    'жидкость гур', 'жидкость гидроусил',
    'масло кпп', 'масло акпп', 'масло трансмисс', 'масло коробк',
    'омывател', 'жидкость омыв',
    'колодк', 'колодки',
    'тормозн диск', 'диск тормозн',
    'тормозн барабан', 'барабан',
    'суппорт', 'шланг тормозн',
    'амортизатор', 'стойк',
    'пыльник', 'шрус', 'шаров', 'наконечник', 'тяга рулев',
    'сайлентблок', 'втулк стабилиз',
    'аккумулятор', 'акб',
    'щетк', 'щётк', 'дворник', 'стеклоочист',
    'предохранит', 'лампочк', 'лампы',
    'сажев', 'катализатор', 'лямбда', 'датчик кислород'
];

function _maintWeight(p) {
    const n = nz(p.name || '');
    if (!n) return 9999999;
    let m = n.match(/(?:^|\s)то[\s\-–—]*(\d+)/i);
    if (m) {
        const num = parseInt(m[1], 10);
        if (!isNaN(num) && num > 0) return num;
    }
    m = n.match(/(\d[\d\s]{2,})\s*км/);
    if (m) {
        const km = parseInt(m[1].replace(/\s/g, ''), 10);
        if (!isNaN(km) && km > 0) return 1000 + km;
    }
    if (/(?:раз в год|ежегодн|каждый год)/.test(n)) return 500000;
    if (/(?:^|\s)зим/.test(n)) return 900000;
    if (/(?:^|\s)лет/.test(n)) return 901000;
    if (/(?:^|\s)весн/.test(n)) return 902000;
    if (/(?:^|\s)осен/.test(n)) return 903000;
    for (let i = 0; i < MAINT_ORDER.length; i++) {
        if (n.includes(MAINT_ORDER[i])) return 950000 + i;
    }
    return 9999999;
}

function fmtDate(d) {
    if (!d) return '';
    const s = String(d);
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return m[3] + '.' + m[2] + '.' + m[1];
    return s;
}
const openM = id => $(id).classList.add('show');
const closeM = id => $(id).classList.remove('show');

/* ============ КАСТОМНЫЙ CONFIRM ============ */
function askConfirm(msg, onYes, opts) {
    opts = opts || {};
    $('confirm_title').textContent = opts.title || '⚠️ Подтверждение';
    $('confirm_msg').textContent = msg;
    $('confirm_yes').textContent = opts.yes || 'Да';
    $('confirm_no').textContent = opts.no || 'Нет';
    const exp = $('confirm_export');
    if (exp) exp.style.display = opts.showExport ? '' : 'none';
    _confirmCb = onYes || null;
    openM('confirmmo');
}
function cConfirm(ok) {
    closeM('confirmmo');
    const cb = _confirmCb;
    _confirmCb = null;
    if (ok && typeof cb === 'function') {
        try {
            const r = cb();
            if (r && typeof r.catch === 'function') {
                r.catch(e => toast('Ошибка: ' + ((e && e.message) || e), 'danger'));
            }
        } catch (e) {
            toast('Ошибка: ' + ((e && e.message) || e), 'danger');
        }
    }
}

/* ============ ЛИЦЕНЗИЯ ============ */
function checkLicense() {
    let st = '';
    try { st = localStorage.getItem(LICKEY) || ''; } catch (e) { }
    if (st === 'accepted') {
        init().then(() => rSz()).catch(e => { console.error(e); toast('Ошибка инициализации', 'danger'); });
    } else if (st === 'declined') {
        $('declined').classList.add('show');
    } else {
        $('licgate').classList.add('show');
    }
}
function licAccept() {
    try { localStorage.setItem(LICKEY, 'accepted'); } catch (e) { }
    $('licgate').classList.remove('show');
    init().then(() => rSz()).catch(e => { console.error(e); toast('Ошибка инициализации', 'danger'); });
}
function licDecline() {
    try { localStorage.setItem(LICKEY, 'declined'); } catch (e) { }
    $('licgate').classList.remove('show');
    $('declined').classList.add('show');
}
function licReset() {
    try { localStorage.removeItem(LICKEY); } catch (e) { }
    $('declined').classList.remove('show');
    $('aboutmo').classList.remove('show');
    $('licgate').classList.add('show');
}

/* ============ IndexedDB ============ */
function oDB() {
    if (dbr) return dbr;
    dbr = new Promise((res, rej) => {
        if (!('indexedDB' in window)) { rej(new Error('IDB')); return; }
        const r = indexedDB.open(DN, DV);
        r.onupgradeneeded = () => {
            const db = r.result;
            if (!db.objectStoreNames.contains(SP)) db.createObjectStore(SP, { keyPath: 'id' });
            if (!db.objectStoreNames.contains(SW)) db.createObjectStore(SW, { keyPath: 'id' });
            if (!db.objectStoreNames.contains('logs')) db.createObjectStore('logs', { keyPath: 'id' });
        };
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
    });
    return dbr;
}
const iAll = async s => {
    const db = await oDB();
    return new Promise((res, rej) => {
        const tx = db.transaction(s, 'readonly');
        const r = tx.objectStore(s).getAll();
        r.onsuccess = () => res(r.result || []);
        r.onerror = () => rej(r.error);
    });
};
const iPut = async (s, i) => {
    const db = await oDB();
    return new Promise((res, rej) => {
        const tx = db.transaction(s, 'readwrite');
        tx.objectStore(s).put(i);
        tx.oncomplete = () => res();
        tx.onerror = () => rej(tx.error);
    });
};
const iMany = async (s, arr) => {
    const db = await oDB();
    return new Promise((res, rej) => {
        const tx = db.transaction(s, 'readwrite');
        const st = tx.objectStore(s);
        arr.forEach(it => st.put(it));
        tx.oncomplete = () => res();
        tx.onerror = () => rej(tx.error);
    });
};
const iDel = async (s, id) => {
    const db = await oDB();
    return new Promise((res, rej) => {
        const tx = db.transaction(s, 'readwrite');
        tx.objectStore(s).delete(id);
        tx.oncomplete = () => res();
        tx.onerror = () => rej(tx.error);
    });
};
const iClr = async s => {
    const db = await oDB();
    return new Promise((res, rej) => {
        const tx = db.transaction(s, 'readwrite');
        tx.objectStore(s).clear();
        tx.oncomplete = () => res();
        tx.onerror = () => rej(tx.error);
    });
};

/* ============ НОРМАЛИЗАТОРЫ ============ */
function nP(p) {
    if (!p || typeof p !== 'object') return null;
    const cat = (typeof p.cat === 'string' && CATS.some(x => x.id === p.cat)) ? p.cat : 'Engine';
    const ALL_ENGINES = Object.keys(ENGINES);
    const ALL_BODIES = Object.keys(BODIES);
    const ALL_TRANS = Object.keys(TRANSMISSIONS);

    let rawName = String(p.n || p.name || '');
    if (cat === 'Maintenance') {
        rawName = rawName
            .replace(/\bкаждые\b\s*/gi, '')
            .replace(/\s{2,}/g, ' ')
            .replace(/\(\s+/g, '(')
            .replace(/\s+\)/g, ')')
            .trim();
    }

    let inst;
    if (Array.isArray(p.inst)) {
        inst = p.inst.filter(i => i && i.text).map(i => ({ type: MI[IM[i.type]] || i.type, text: String(i.text) }));
    } else if (Array.isArray(p.i)) {
        inst = p.i.map(x => ({ type: MI[x[0]] || 'note', text: String(x[1] || '') })).filter(x => x.text);
    } else inst = [];

    const eng = Array.isArray(p.engines) ? p.engines.filter(x => ALL_ENGINES.includes(x)) : [];
    const bdy = Array.isArray(p.bodies) ? p.bodies.filter(x => ALL_BODIES.includes(x)) : [];
    const trn = Array.isArray(p.transmissions) ? p.transmissions.filter(x => ALL_TRANS.includes(x)) : [];
    const trm = Array.isArray(p.trims) ? p.trims.filter(x => TRIMS.includes(x)) : [];
    const ALL_GENS = Object.keys(GENERATIONS);
    const gens = Array.isArray(p.gens) ? p.gens.filter(x => ALL_GENS.includes(x)) : [];

    const rawSub = String(p.sub || p.subcategory || '').trim();
    const catMap = SUB_ALIASES[cat] || {};
    const globMap = SUB_ALIASES._all || {};
    const mapped = catMap[rawSub] || globMap[rawSub] || rawSub;

    let finalCat = cat;
    let sub = mapped;
    if (typeof mapped === 'string' && mapped.startsWith('ПЕРЕКИНУТЬ→')) {
        finalCat = mapped.split('→')[1];
        sub = rawSub;
    }

    return {
        id: p.id || uid(),
        cat: finalCat,
        sub,
        name: rawName,
        oem: String(p.o || p.oem || ''),
        verified: !!(p.v || p.verified),
        analogs: Array.isArray(p.a || p.analogs) ? (p.a || p.analogs).map(String).filter(Boolean) : [],
        donors: Array.isArray(p.d || p.donors) ? (p.d || p.donors).map(String).filter(Boolean) : [],
        engines: eng, bodies: bdy, transmissions: trn, trims: trm, gens,
        price: (p.price == null || p.price === '') ? null : (isFinite(Number(p.price)) ? Number(p.price) : null),
        currency: p.currency || 'RUB',
        status: ['want', 'bought', 'installed'].includes(p.status) ? p.status : '',
        favorite: !!p.favorite,
        notes: String(p.notes || ''),
        shopUrl: sUrl(p.shopUrl || ''),
        photos: (() => {
            const arr = [];
            if (Array.isArray(p.photos)) {
                for (const x of p.photos) { const s = sImg(x); if (s) arr.push(s); }
            }
            if (!arr.length && p.photo) {
                const s = sImg(p.photo);
                if (s) arr.push(s);
            }
            return arr.slice(0, 12);
        })(),
        parts: Array.isArray(p.parts) ? p.parts
            .filter(x => x && (x.oem || x.o || x.name || x.n))
            .slice(0, 40)
            .map(x => ({
                name: String(x.name || x.n || ''),
                oem: String(x.oem || x.o || ''),
                note: String(x.note || x.note2 || '')
            })) : [],
        inst,
        priceHistory: Array.isArray(p.priceHistory)
            ? p.priceHistory.filter(h => h && typeof h === 'object' && h.ts && h.price != null).slice(-50)
            : []
    };
}
const nW = w => !w || typeof w !== 'object' ? null : {
    id: w.id || ('w_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7)),
    name: String(w.name || ''),
    phone: String(w.phone || ''),
    address: String(w.address || ''),
    spec: String(w.spec || ''),
    rating: Math.max(0, Math.min(5, Number(w.rating) || 0)),
    note: String(w.note || '')
};

/* ============ VIN-ДЕКОДЕР ============ */
const VY = { 'A': 1980, 'B': 1981, 'C': 1982, 'D': 1983, 'E': 1984, 'F': 1985, 'G': 1986, 'H': 1987, 'J': 1988, 'K': 1989, 'L': 1990, 'M': 1991, 'N': 1992, 'P': 1993, 'R': 1994, 'S': 1995, 'T': 1996, 'V': 1997, 'W': 1998, 'X': 1999, 'Y': 2000, '1': 2001, '2': 2002, '3': 2003, '4': 2004, '5': 2005, '6': 2006, '7': 2007, '8': 2008, '9': 2009 };
const VP = { 'A': ['Ingolstadt', 'DE'], 'B': ['Bruxelles', 'BE'], 'D': ['Dresden', 'DE'], 'E': ['Emden', 'DE'], 'H': ['Hannover', 'DE'], 'K': ['Osnabrück', 'DE'], 'M': ['Mexico', 'MX'], 'N': ['Neckarsulm', 'DE'], 'P': ['Pamplona', 'ES'], 'R': ['Moskau', 'RU'], 'S': ['Salzgitter', 'DE'], 'V': ['Westmoreland', 'US'], 'W': ['Wolfsburg', 'DE'], 'X': ['Poznań', 'PL'], 'Z': ['Zwickau', 'DE'] };
const vV = v => typeof v === 'string' && v.length === 17 && /^[A-HJ-NPR-Z0-9]{17}$/i.test(v);

function vD(v) {
    const x = String(v || '').toUpperCase();
    if (!vV(x)) return { ok: false, error: 'VIN должен быть 17 символов (без I, O, Q)' };
    const w = x.slice(0, 3), yc = x[9], pc = x[10], sr = x.slice(11);
    let brand = 'Неизвестно', country = '—';
    if (w === 'WVW') { brand = 'Volkswagen'; country = 'Германия'; }
    else if (w === 'WV1') { brand = 'Volkswagen (коммер.)'; country = 'Германия'; }
    else if (w === 'WV2') { brand = 'Volkswagen'; country = 'Германия'; }
    else if (w.startsWith('9BW') || w.startsWith('9BV')) { brand = 'VW do Brasil'; country = 'Бразилия'; }
    else if (w === '3VW') { brand = 'VW Mexico'; country = 'Мексика'; }
    let vp = x.slice(6, 9);
    if (!/^[0-9A-Z]{3}$/.test(vp) || /^ZZZ$/.test(vp)) vp = x.slice(3, 6);
    let model = '—', body = '—', gen = '';
    if (/^6N/.test(vp)) {
        model = 'Polo/Caddy (6N)';
        if (vp === '6N1') { body = 'Hatchback'; gen = '6N1'; }
        else if (vp === '6N2') { body = 'Hatchback'; gen = '6N2'; }
        else if (vp === '6NF') body = 'Variant';
        else if (vp === '6NH') body = 'Classic Sedan';
        else if (vp === '6NX') body = 'Van';
        else body = 'Hatchback';
    }
    else if (/^9N/.test(vp)) { model = 'Polo (9N)'; body = 'Hatchback'; }
    else if (/^6K/.test(vp)) { model = 'Polo (6K)'; body = 'Hatchback'; }
    else if (/^1J/.test(vp)) { model = 'Golf (1J)'; body = 'Hatchback'; }
    const year = VY[yc] || null, pl = VP[pc] || ['—', '—'];
    return {
        ok: true, vin: x, brand, country, model, body, year, gen,
        plant: pl[0], plantCountry: pl[1],
        engines: /^6N/.test(vp) ? Object.keys(ENGINES) : ['—'],
        serial: sr
    };
}
async function vR(v) { return vD(v); }

/* ============ ХРАНИЛИЩЕ ============ */
function lG() {
    try {
        const r = localStorage.getItem(GK);
        if (r) {
            const a = JSON.parse(r);
            if (Array.isArray(a)) {
                G = a.filter(x => x && x.vin && x.id).map(x => ({
                    id: x.id,
                    vin: String(x.vin).toUpperCase(),
                    brand: String(x.brand || ''),
                    model: String(x.model || ''),
                    year: x.year || null,
                    body: String(x.body || ''),
                    gen: String(x.gen || ''),
                    plant: String(x.plant || ''),
                    engines: Array.isArray(x.engines) ? x.engines : [],
                    prodDate: String(x.prodDate || ''),
                    engineCode: String(x.engineCode || ''),
                    transCode: String(x.transCode || ''),
                    equipCode: String(x.equipCode || ''),
                    bodyColor: String(x.bodyColor || ''),
                    roofColor: String(x.roofColor || ''),
                    addedAt: x.addedAt || Date.now()
                }));
            }
        }
    } catch (e) { }
}
const sG = () => { try { localStorage.setItem(GK, JSON.stringify(G)); } catch (e) { } };

function lMeta() {
    try {
        const r = localStorage.getItem(METAKEY); if (!r) return;
        const m = JSON.parse(r); if (!m || typeof m !== 'object') return;
        if (Array.isArray(m.categories)) {
            for (const c of m.categories) {
                if (!c || !c.id) continue;
                const ex = CATS.find(x => x.id === c.id);
                if (ex) { ex.label = c.label || ex.label; ex.icon = c.icon || ex.icon; }
                else CATS.push({ id: c.id, label: c.label || c.id, icon: c.icon || '📁' });
            }
        }
        if (m.sections && typeof m.sections === 'object') {
            CUSTOM.sections = Object.assign({}, m.sections);
            for (const sid of Object.keys(m.sections)) {
                const s = m.sections[sid]; if (!s) continue;
                const ex = CATS.find(x => x.id === sid);
                if (ex) {
                    ex.label = s.label || ex.label;
                    ex.icon = s.icon || ex.icon;
                    if (s.parent) ex.parent = s.parent;
                } else {
                    CATS.push({
                        id: sid,
                        label: s.label || sid,
                        icon: s.icon || '📋',
                        parent: s.parent || null
                    });
                }
            }
        }
    } catch (e) { }
}
function sMeta() { try { localStorage.setItem(METAKEY, JSON.stringify(CUSTOM)); } catch (e) { } }
function resetMeta() {
    CATS = BASE_CATS.slice();
    EK = Object.assign({}, BASE_EK);
    CUSTOM = { categories: [], sections: {} };
    try { localStorage.removeItem(METAKEY); } catch (e) { }
}

function lProfile() {
    try {
        const r = localStorage.getItem(PROFKEY);
        if (r) {
            const p = JSON.parse(r);
            if (p && typeof p === 'object') {
                USER = {
                    name: String(p.name || ''), email: String(p.email || ''),
                    city: String(p.city || ''), initials: String(p.initials || ''),
                    color: String(p.color || '#00b0f0')
                };
            }
        }
    } catch (e) { }
}
function sProfileStorage() { try { localStorage.setItem(PROFKEY, JSON.stringify(USER)); } catch (e) { } }

function lU() {
    try {
        const r = localStorage.getItem(UK);
        if (r) {
            const p = JSON.parse(r);
            SV = Object.assign(SV, p);
            if (!SV.expandedTree || typeof SV.expandedTree !== 'object') SV.expandedTree = {};
            if (!SV.expandedCats || typeof SV.expandedCats !== 'object') SV.expandedCats = {};
            if (!CATS.some(c => c.id === SV.activeCat) && !['Favorites', 'Workshops', 'Log'].includes(SV.activeCat)) SV.activeCat = 'All';
        }
    } catch (e) { }
}
const sU = () => { try { localStorage.setItem(UK, JSON.stringify(SV)); } catch (e) { } };

const sD = () => {
    if (useIDB) iMany(SP, D).catch(() => toast('Ошибка IndexedDB', 'danger'));
    else {
        try { localStorage.setItem(PK, JSON.stringify(D)); }
        catch (e) { toast('Хранилище переполнено', 'danger'); }
    }
};
const sLogs = () => {
    if (useIDB) iMany('logs', LOG).catch(() => { });
    else { try { localStorage.setItem(LOGKEY, JSON.stringify(LOG)); } catch (e) { } }
};
const sWk = () => {
    if (useIDB) iMany(SW, W).catch(() => { });
    else { try { localStorage.setItem(WK, JSON.stringify(W)); } catch (e) { } }
};

function lLS() {
    try {
        const r = localStorage.getItem(PK);
        if (r) { const a = JSON.parse(r); if (Array.isArray(a)) D = a.map(nP).filter(Boolean); }
    } catch (e) { }
    if (!D.length) D = DB.map(nP).filter(Boolean);
    try {
        const r = localStorage.getItem(WK);
        if (r) { const a = JSON.parse(r); if (Array.isArray(a)) W = a.map(nW).filter(Boolean); }
    } catch (e) { }
}

function lTO() {
    try {
        const r = localStorage.getItem(TOKEY);
        if (r) { const t = JSON.parse(r); TO = Object.assign(TO, t); }
    } catch (e) { }
}
function sTOStorage() { try { localStorage.setItem(TOKEY, JSON.stringify(TO)); } catch (e) { } }

async function lLogs() {
    try {
        const r = localStorage.getItem(LOGKEY);
        if (r) { const a = JSON.parse(r); if (Array.isArray(a)) LOG = a; }
    } catch (e) { }
    try {
        if (useIDB) {
            const db = await oDB();
            if (db.objectStoreNames.contains('logs')) {
                const lg = await iAll('logs');
                if (Array.isArray(lg) && lg.length) LOG = lg;
            }
        }
    } catch (e) { console.warn('logs load error', e); }
    _rebuildLogIndex();
}

/* ============ ТОСТ ============ */
function toast(m, k) {
    const kk = k === 'success' ? 's' : k === 'danger' ? 'd' : (k || '');
    const e = $('tt');
    clearTimeout(tuT);
    e.innerHTML = '';
    e.textContent = m;
    e.className = 'tst show' + (kk ? ' ' + kk : '');
    clearTimeout(tt);
    tt = setTimeout(() => e.classList.remove('show'), 5000);
}
function toastUndo(msg, onUndo) {
    const e = $('tt');
    e.innerHTML = esc(msg) + ' <button id="tt_undo">↶ Вернуть</button><div id="tt_progress"></div>';
    e.className = 'tst show d';
    clearTimeout(tuT);
    const btn = $('tt_undo');
    const bar = $('tt_progress');
    if (bar) {
        bar.style.transition = 'none';
        bar.style.width = '100%';
        requestAnimationFrame(() => {
            bar.style.transition = 'width 10s linear';
            bar.style.width = '0%';
        });
    }
    if (btn) btn.onclick = () => {
        clearTimeout(tuT);
        e.classList.remove('show');
        onUndo();
    };
    tuT = setTimeout(() => e.classList.remove('show'), 10000);
}
const sUS = () => { clearTimeout(usT); usT = setTimeout(sU, 300); };
const dRC = () => {
    clearTimeout(rcT);
    rcT = setTimeout(() => { rSB(); rC(); }, 120);
};

/* ============ ГАРАЖ ============ */
function gAV() {
    if (!SV.activeVinId) return null;
    const g = G.find(x => x.id === SV.activeVinId);
    return g ? Object.assign({ ok: true }, g) : null;
}

function pCompat(p) {
    const v = gAV(); if (!v || !v.ok) return null;
    const model = nz(v.model || '');
    const donors = (p.donors || []).map(nz).filter(Boolean);
    if (!donors.length) return { pct: 50, cls: 'u', label: 'нет данных' };
    const tokens = model.split(/[\s()/\-]+/).filter(t => t.length >= 2 && t !== 'vw' && t !== 'volkswagen' && t !== 'seat' && t !== 'skoda');
    if (!tokens.length) return { pct: 50, cls: 'u', label: 'нет данных' };
    let best = 0;
    for (const d of donors) {
        if (d === model || d.includes(model) || model.includes(d)) { best = 100; break; }
        let hit = 0;
        for (const t of tokens) { if (d.includes(t)) hit++; }
        const pct = Math.round(hit / tokens.length * 100);
        if (pct > best) best = pct;
    }
    let cls, label;
    if (best >= 80) { cls = 'y'; label = 'подходит'; }
    else if (best >= 40) { cls = 'u'; label = 'возможно подходит'; }
    else if (best > 0) { cls = 'n'; label = 'скорее не подходит'; }
    else { cls = 'n'; label = 'не подходит'; }
    return { pct: best, cls, label };
}

/* ============================================================
   VIN-индикатор — рендерится в #vinBar (внутри заголовка гаража)
   ============================================================ */
function rVinBar() {
    const box = $('vinBar');
    if (!box) return;

    const av = gAV();
    if (!av || !av.ok) { box.innerHTML = ''; return; }

    const strictMark = SV.vinStrictFilter
        ? '<span class="nd-vin-tag">строго</span>'
        : '';

    box.innerHTML =
        '<span class="nd-vin">' +
        '<span class="nd-vin-ic">🔒</span>' +
        '<span class="nd-vin-lb">VIN …' + esc(av.vin.slice(-6)) + '</span>' +
        strictMark +
        '<button class="nd-vin-x" type="button" title="Снять VIN-фильтр">✕</button>' +
        '</span>';

    const btn = box.querySelector('.nd-vin-x');
    if (btn) btn.onclick = (e) => {
        e.stopPropagation();
        SV.activeVinId = null;
        SV.vinStrictFilter = false;
        applyVinFilters();
        sU(); rGar(); rSB(); rC();
        toast('VIN-фильтр снят');
    };
}

function rGar() {
    const l = $('gl'), c = $('gc');
    if (!l) return;
    c.textContent = G.length ? '(' + G.length + ')' : '';

    if (!G.length) {
        l.innerHTML = '<div class="ge">Нет сохранённых машин</div>';
        rVinBar();
        return;
    }

    l.innerHTML = G.map(g => {
        const act = SV.activeVinId === g.id;
        const desc = [g.brand, g.model, g.year].filter(Boolean).join(' ');
        let h = '<div class="gi' + (act ? ' active' : '') + '" data-gid="' + escA(g.id) + '">';
        h += '<div class="gi-top">';
        h += '<div class="gii"><div class="giv">' + esc(g.vin) + '</div>'
            + '<div class="gid">' + esc(desc || '—') + '</div></div>';
        h += '<button class="gix" data-vact="delete" data-gid="' + escA(g.id) + '" title="Удалить">✕</button>';
        h += '</div>';
        if (act) {
            const rows = [
                ['Модель', g.model || '—'],
                ['Дата произв.', g.prodDate ? fmtDate(g.prodDate) : '—'],
                ['Модельный год', g.year || '—'],
                ['VIN', g.vin || '—'],
                ['Двигатель', g.engineCode || '—'],
                ['Код КПП', g.transCode || '—'],
                ['Код оснащения', g.equipCode || '—'],
                ['Цвет кузова', g.bodyColor || '—'],
                ['Цвет крыши', g.roofColor || '—']
            ];
            h += '<div class="gi-info">';
            h += rows.map(r =>
                '<div class="gi-info-row"><span class="gi-info-lb">' + esc(r[0]) + ':</span>'
                + '<span class="gi-info-val">' + esc(r[1]) + '</span></div>'
            ).join('');
            h += '<button class="veh-edit-btn" type="button" onclick="oVIN()">✎ Уточнить данные</button>';
            h += '</div>';
        }
        h += '</div>';
        return h;
    }).join('');

    rVinBar();
}

const VIN_BODY_MAP = {
    'Hatchback 3d': '3d',
    'Hatchback 5d': '5d',
    'Hatchback': '',
    'Variant': 'estate',
    'Classic Sedan': 'classic',
    'Van': 'caddy-van'
};

function applyVinFilters() {
    const fmtr = $('fmtr'), fbdy = $('fbdy'), ftr = $('ftr'), fgen = $('fgen');
    const av = gAV();
    if (!av) {
        SV.engineFilter = 'all';
        SV.bodyFilter = 'all';
        SV.transFilter = 'all';
        SV.genFilter = 'all';
    } else {
        SV.engineFilter = (av.engineCode && ENGINES[av.engineCode]) ? av.engineCode : 'all';
        SV.transFilter = (av.transCode && TRANSMISSIONS[av.transCode]) ? av.transCode : 'all';
        const bKey = VIN_BODY_MAP[av.body] || '';
        SV.bodyFilter = (bKey && BODIES[bKey]) ? bKey : 'all';
        SV.genFilter = (av.gen && GENERATIONS[av.gen]) ? av.gen : 'all';
    }
    if (fmtr) fmtr.value = SV.engineFilter;
    if (fbdy) fbdy.value = SV.bodyFilter;
    if (ftr) ftr.value = SV.transFilter;
    if (fgen) fgen.value = SV.genFilter;
    updateFilterStyling();
    sU();
}

function setAV(id) {
    const wasActive = !!SV.activeVinId;
    SV.activeVinId = SV.activeVinId === id ? null : id;

    if (!wasActive && SV.activeVinId) SV.vinStrictFilter = true;
    if (wasActive && !SV.activeVinId) SV.vinStrictFilter = false;

    applyVinFilters();
    sU(); rGar(); rSB(); rC();

    const info = gAV();
    const av = gAV();
    let extra = '';
    if (av) {
        const bits = [];
        if (SV.engineFilter !== 'all') bits.push('⚙️ ' + SV.engineFilter);
        if (SV.bodyFilter !== 'all') bits.push('🚗 ' + (BODIES[SV.bodyFilter] || SV.bodyFilter));
        if (SV.transFilter !== 'all') bits.push('🔄 ' + SV.transFilter);
        if (bits.length) extra = ' · ' + bits.join(' · ');
    }
    toast(info ? 'Активный VIN: …' + info.vin.slice(-6) + extra : 'VIN-фильтр снят');
}

function sGarV() {
    if (!pGV || !pGV.ok) return;
    if (G.some(g => g.vin === pGV.vin)) { toast('VIN уже в гараже', 'danger'); return; }
    const g = {
        id: 'g_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
        vin: pGV.vin,
        brand: pGV.brand || '',
        model: pGV.model || '',
        year: pGV.year || null,
        body: pGV.body || '',
        gen: pGV.gen || '',
        plant: pGV.plant || '',
        engines: Array.isArray(pGV.engines) ? pGV.engines : [],
        prodDate: '', engineCode: '', transCode: '',
        equipCode: '', bodyColor: '', roofColor: '',
        addedAt: Date.now()
    };
    G.push(g); sG(); SV.activeVinId = g.id;
    applyVinFilters();
    sU(); rGar(); rSB(); rC();
    cGM(); toast('VIN сохранён', 'success');
}

function remV(id) {
    const g = G.find(x => x.id === id); if (!g) return;
    if (!confirm('Удалить VIN ' + g.vin + '?')) return;
    G = G.filter(x => x.id !== id);
    if (SV.activeVinId === id) SV.activeVinId = null;
    applyVinFilters();
    sG(); sU(); rGar(); rSB(); rC();
    toast('VIN удалён', 'danger');
}

function oGM() {
    pGV = null;
    $('g_vi').value = '';
    $('g_re').style.display = 'none';
    $('g_re').innerHTML = '';
    $('g_sb').disabled = true;
    $('gmo').classList.add('show');
    setTimeout(() => $('g_vi').focus(), 50);
}
const cGM = () => { $('gmo').classList.remove('show'); pGV = null; };

async function decG() {
    const raw = $('g_vi').value.trim().toUpperCase(), re = $('g_re'), sb = $('g_sb');
    re.style.display = 'block';
    if (!raw) { re.innerHTML = '<span class="er">Введите VIN</span>'; sb.disabled = true; return; }
    if (!vV(raw)) { re.innerHTML = '<span class="er">Неверный VIN: 17 символов без I, O, Q</span>'; sb.disabled = true; return; }
    re.innerHTML = '<span class="ok">⏳ Декодируем…</span>';
    const btn = $('g_db'); btn.disabled = true;
    try {
        const info = await vR(raw);
        if (!info.ok) { re.innerHTML = '<span class="er">' + esc(info.error || 'Ошибка') + '</span>'; sb.disabled = true; return; }
        pGV = info;
        const L = [];
        L.push('<b>' + esc(info.brand) + '</b> ' + esc(info.model));
        if (info.year) L.push('Год: <b>' + info.year + '</b>');
        if (info.body && info.body !== '—') L.push('Кузов: ' + esc(info.body));
        if (info.plant) L.push('Завод: ' + esc(info.plant));
        if (info.engines && info.engines[0] !== '—') L.push('Двигатели: ' + esc(info.engines.slice(0, 8).join(', ')));
        re.innerHTML = L.join('<br>'); sb.disabled = false;
    } catch (e) {
        re.innerHTML = '<span class="er">Ошибка: ' + esc(e.message) + '</span>'; sb.disabled = true;
    } finally { btn.disabled = false; }
}

/* ============ ПРОФИЛЬ ============ */
function renderProfile() {
    const av = $('sft_avatar'), un = $('sft_username');
    if (!av || !un) return;
    const nm = USER.name.trim();
    const ini = (USER.initials || '').trim().toUpperCase().slice(0, 2) || (nm ? nm.slice(0, 2).toUpperCase() : '');
    av.textContent = ini || '👤';
    av.style.background = USER.color || 'linear-gradient(135deg,#00b0f0,#0091c9)';
    un.textContent = nm || 'Гость';
    un.title = nm ? nm + (USER.city ? ' · ' + USER.city : '') : 'Нажмите, чтобы заполнить профиль';
}
function oProfile() {
    $('pf_name').value = USER.name || '';
    $('pf_email').value = USER.email || '';
    $('pf_city').value = USER.city || '';
    $('pf_ini').value = USER.initials || '';
    renderColors();
    updateProfPreview();
    $('profmo').classList.add('show');
}
function oProfileSoon() { toast('👤 Раздел появится в будущих релизах (но это не точно)', 'info'); }
function cProfile() { $('profmo').classList.remove('show'); }
function sProfile() {
    USER.name = $('pf_name').value.trim().slice(0, 40);
    USER.email = $('pf_email').value.trim().slice(0, 80);
    USER.city = $('pf_city').value.trim().slice(0, 60);
    USER.initials = $('pf_ini').value.trim().toUpperCase().slice(0, 2);
    sProfileStorage();
    renderProfile();
    cProfile();
    toast('Профиль сохранён', 'success');
}
function resetProfile() {
    if (!confirm('Сбросить профиль?')) return;
    USER = { name: '', email: '', city: '', initials: '', color: '#00b0f0' };
    sProfileStorage();
    renderProfile();
    $('pf_name').value = ''; $('pf_email').value = ''; $('pf_city').value = ''; $('pf_ini').value = '';
    renderColors();
    updateProfPreview();
    toast('Профиль сброшен', 'danger');
}
const PROF_COLORS = ['#00b0f0', '#28a745', '#dc3545', '#9c27b0', '#f5a623', '#17a2b8', '#6c757d', '#ff6b00'];
function renderColors() {
    const c = $('pf_colors'); if (!c) return;
    c.innerHTML = PROF_COLORS.map(col =>
        '<button type="button" class="prof-color' + (USER.color === col ? ' sel' : '') + '" data-color="' + col + '" style="background:' + col + '" title="' + col + '"></button>'
    ).join('');
    c.querySelectorAll('.prof-color').forEach(b => {
        b.onclick = () => { USER.color = b.dataset.color; renderColors(); updateProfPreview(); };
    });
}
function updateProfPreview() {
    const big = $('prof_avatar_big'), nm = $('prof_name_view'), sub = $('prof_sub_view');
    if (!big || !nm || !sub) return;
    const name = $('pf_name').value.trim() || 'Гость';
    const ini = $('pf_ini').value.trim().toUpperCase().slice(0, 2) || name.slice(0, 2).toUpperCase();
    big.textContent = ini || '👤';
    big.style.background = USER.color || '#00b0f0';
    nm.textContent = name;
    const parts = [];
    if ($('pf_city').value.trim()) parts.push($('pf_city').value.trim());
    if ($('pf_email').value.trim()) parts.push($('pf_email').value.trim());
    sub.textContent = parts.length ? parts.join(' · ') : 'Локальный профиль · не синхронизируется';
}

/* ============ ДОНАТ / О ПРОГРАММЕ / БАГ ============ */
function oDonate() { $('donmo').classList.add('show'); }
function cDonate() { $('donmo').classList.remove('show'); }
const oAbout = () => { $('aboutmo').classList.add('show'); };
const cAbout = () => { $('aboutmo').classList.remove('show'); };
function oAPK() {
    openM('aboutmo');
    setTimeout(() => {
        const el = $('about_apk');
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const oldBg = el.style.background;
        const oldShadow = el.style.boxShadow;
        el.style.transition = 'all .3s ease';
        el.style.background = 'color-mix(in srgb, var(--a) 25%, transparent)';
        el.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--a) 30%, transparent)';
        setTimeout(() => {
            el.style.background = oldBg || '';
            el.style.boxShadow = oldShadow || '';
        }, 1200);
    }, 80);
}

const oBug = () => {
    const ml = $('bug_mailto');
    if (ml) ml.href = 'mailto:donignasio@vk.com?subject='
        + encodeURIComponent('База Мастера — баг-репорт')
        + '&body=' + encodeURIComponent(
            'Версия: ' + APP_VERSION + '\n' +
            'Устройство/браузер: \n' +
            'Что сделал: \n' +
            'Что ожидал: \n' +
            'Что получил: \n'
        );
    $('bugmo').classList.add('show');
};
const cBug = () => { $('bugmo').classList.remove('show'); };

/* ============ ИСТОРИЯ ВЕРСИЙ ============ */
async function fetchUpdateMeta() {
    const base = location.origin + location.pathname.replace(/[^/]*$/, '');
    const r = await fetch(base + 'data/update.json?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw new Error('update.json: ' + r.status);
    const lm = r.headers.get('Last-Modified');
    let fallbackDate = '';
    if (lm) {
        const d = new Date(lm);
        if (!isNaN(d.getTime())) {
            fallbackDate = d.toISOString().slice(0, 10);
        }
    }
    const m = await r.json();
    return {
        appVersion: m && m.appVersion ? String(m.appVersion) : '',
        changelog: m && Array.isArray(m.changelog) ? m.changelog : [],
        releasedAt: m && m.releasedAt ? String(m.releasedAt) : '',
        fallbackDate: (m && m.releasedAt) || fallbackDate
    };
}

function _cmpVer(a, b) {
    const pa = String(a || '').split('.').map(n => parseInt(n, 10) || 0);
    const pb = String(b || '').split('.').map(n => parseInt(n, 10) || 0);
    const len = Math.max(pa.length, pb.length);
    for (let i = 0; i < len; i++) {
        const x = pa[i] || 0, y = pb[i] || 0;
        if (x > y) return 1;
        if (x < y) return -1;
    }
    return 0;
}

function renderChangelog(list, currentVersion, fallbackDate) {
    const box = $('up_changelog');
    if (!box) return;
    if (!Array.isArray(list) || !list.length) {
        box.innerHTML = '<div class="cl-empty">Список изменений не опубликован.</div>';
        return;
    }
    const visible = list.filter(rel => rel && rel.version);
    if (!visible.length) {
        box.innerHTML = '<div class="cl-empty">Список изменений не опубликован.</div>';
        return;
    }
    let h = '';
    visible.forEach((rel, idx) => {
        const cmp = _cmpVer(rel.version, currentVersion);
        const isCurrent = cmp === 0;
        const dt = rel.date || (idx === 0 ? fallbackDate : '');
        const ch = Array.isArray(rel.changes) ? rel.changes : [];
        const head = '<div class="cl-head">'
            + '<span class="cl-ver">v' + esc(rel.version) + '</span>'
            + (dt ? '<span class="cl-date">' + esc(dt) + '</span>' : '')
            + '</div>';
        const body = ch.length
            ? '<ul class="cl-list">' + ch.map(c => '<li>' + esc(c) + '</li>').join('') + '</ul>'
            : '<div class="cl-empty">— без описания —</div>';
        if (isCurrent) {
            h += '<div class="cl-release current">' + head + body + '</div>';
        } else {
            h += '<details class="cl-release"><summary>' + head + '</summary>' + body + '</details>';
        }
    });
    box.innerHTML = h;
}

function oUp() {
    const u = $('up_url');
    if (u && !u.value) {
        let def = 'data/parts.json';
        try {
            const stored = localStorage.getItem(UPKEY);
            if (stored) {
                def = stored;
            } else if (location.protocol === 'http:' || location.protocol === 'https:') {
                def = location.origin +
                    location.pathname.replace(/[^/]*$/, '') +
                    'data/parts.json';
            }
        } catch (e) { }
        u.value = def;
    }
    const st = $('up_status'); if (st) st.innerHTML = '';
    const clBox = $('up_changelog');
    if (clBox) clBox.innerHTML = '<div class="cl-empty">⏳ Загружаем список изменений…</div>';
    $('upmo').classList.add('show');

    fetchUpdateMeta().then(meta => {
        renderChangelog(meta.changelog, APP_VERSION, meta.fallbackDate);
    }).catch(() => {
        renderChangelog(null, APP_VERSION, '');
    });
}

const cUp = () => { $('upmo').classList.remove('show'); window._upParts = null; };
function sUpUrl() {
    const u = $('up_url').value.trim();
    try { localStorage.setItem(UPKEY, u); } catch (e) { }
    toast(u ? 'URL сохранён' : 'URL очищен', 'success');
}

async function checkUpdate() {
    const st = $('up_status');
    st.innerHTML = '<div class="up-load">⏳ Проверяем сервер…</div>';
    const base = location.origin + location.pathname.replace(/[^/]*$/, '');
    let remoteVer = null;
    try {
        const r = await fetch(base + 'data/update.json?t=' + Date.now(), { cache: 'no-store' });
        if (r.ok) { const m = await r.json(); remoteVer = String(m.appVersion || ''); }
    } catch (e) { }

    const files = [
        'data/parts-01-engine-fuel-ignition.json',
        'data/parts-02-cooling-heating-brakes-suspension.json',
        'data/parts-03-trans-exh-elec-bulbs.json',
        'data/parts-04-body-interior-maint-fluids-roadkit.json',
        'data/parts-05-rear-axle-controls.json'
    ];
    let parts = [];
    for (const f of files) {
        try {
            const r = await fetch(f + '?t=' + Date.now(), { cache: 'no-store' });
            if (!r.ok) continue;
            const arr = await r.json();
            if (Array.isArray(arr)) parts = parts.concat(arr);
        } catch (e) { }
    }
    window._upParts = parts;

    const iKey = p => [
        p.cat || '',
        (p.sub || '').trim(),
        (p.oem || '').trim(),
        (p.name || '').trim()
    ].join('|');

    const seen = new Set(D.map(iKey));
    const serverSeen = new Set();
    let newCnt = 0;
    let dupCnt = 0;

    for (const raw of parts) {
        const p = nP(raw); if (!p) continue;
        const k = iKey(p);
        if (serverSeen.has(k)) { dupCnt++; continue; }
        serverSeen.add(k);
        if (!seen.has(k)) newCnt++;
    }

    const appNewer = remoteVer && remoteVer !== APP_VERSION;
    let h = '<div class="up-ok">';
    h += '<div style="font-weight:700;margin-bottom:8px">✓ Проверка завершена</div>';
    h += '<div style="margin-bottom:4px">Программа: <b>' + esc(APP_VERSION) + '</b>';
    if (appNewer) h += ' → <b style="color:var(--a)">' + esc(remoteVer) + '</b> — доступна новая';
    else h += ' — актуальна';
    h += '</div>';
    h += '<div style="margin-bottom:4px">У вас: <b>' + D.length + '</b> позиций · На сервере: <b>' + parts.length + '</b></div>';
    if (dupCnt > 0) {
        h += '<div style="margin-bottom:4px;font-size:.78rem;color:var(--mu)">'
            + 'В источнике <b>' + dupCnt + '</b> дубликатов (совпадают по категории+OEM+названию) — '
            + 'они не считаются новыми'
            + '</div>';
    }
    h += '<div style="margin-bottom:8px">Новых для добавления: <b>' + newCnt + '</b></div>';
    h += '<div class="up-actions">';
    h += '<button class="bn ok-btn" onclick="doFullUpdate()">🔄 Обновить всё</button>';
    if (newCnt) h += '<button class="bn p" onclick="applyUpMerge()">➕ Добавить новые (' + newCnt + ')</button>';
    h += '</div></div>';
    st.innerHTML = h;
}

function doFullUpdate() {
    toast('Загружаем свежую версию…', 'success');
    setTimeout(() => location.replace(location.pathname + '?v=' + Date.now()), 300);
}

function applyUpMerge() {
    const parts = window._upParts;
    if (!parts) { toast('Нет данных', 'danger'); return; }
    const cl = parts.map(nP).filter(Boolean);
    const seen = new Set(D.map(x => (x.oem || '') + '||' + (x.name || '')));
    let add = 0;
    for (const p of cl) {
        const k = (p.oem || '') + '||' + (p.name || '');
        if (!seen.has(k)) { D.push(p); seen.add(k); add++; }
    }
    useIDB ? iMany(SP, D).catch(() => { }) : sD();
    rSB(); rC(); cUp();
    toast('Добавлено: ' + add + ' из ' + cl.length, 'success');
}

/* ============ ЗАГРУЗКА ============ */
function _guessType(path) {
    const p = String(path || '').toLowerCase();
    if (/parts-\d|parts\.json|\/parts\//.test(p)) return 'parts';
    if (/categories\.json/.test(p)) return 'categories';
    if (/sections\.json|composition\.json/.test(p)) return 'sections';
    if (/workshops\.json/.test(p)) return 'workshops';
    return 'unknown';
}

async function lAll() {
    try {
        const p = await iAll(SP), w = await iAll(SW);
        D = p.map(nP).filter(Boolean);
        W = w.map(nW).filter(Boolean);
    } catch (e) { useIDB = false; lLS(); }

    const base = location.origin + location.pathname.replace(/[^/]*$/, '');
    let files = [];
    try {
        const r = await fetch(base + 'data/update.json?t=' + Date.now(), { cache: 'no-store' });
        if (r.ok) {
            const m = await r.json();
            if (Array.isArray(m.files) && m.files.length) files = m.files;
            if (Array.isArray(m.changelog)) _setChangelog(m.changelog);
        }
    } catch (e) { console.warn('update.json не загрузился', e); }
    if (!files.length) {
        files = [
            { path: 'data/parts-01-engine-fuel-ignition.json', type: 'parts' },
            { path: 'data/parts-02-cooling-heating-brakes-suspension.json', type: 'parts' },
            { path: 'data/parts-03-trans-exh-elec-bulbs.json', type: 'parts' },
            { path: 'data/parts-04-body-interior-maint-fluids-roadkit.json', type: 'parts' },
            { path: 'data/parts-05-rear-axle-controls.json', type: 'parts' },
            { path: 'data/parts-07-engine-composition.json', type: 'parts' },
            { path: 'data/parts-08-from-html.json', type: 'parts' },
            { path: 'data/categories.json', type: 'categories' },
            { path: 'data/sections.json', type: 'sections' },
            { path: 'data/workshops.json', type: 'workshops' }
        ];
    }

    let serverParts = [], cats = null, secs = null, wss = null;
    for (const item of files) {
        const f = typeof item === 'string' ? item : item.path;
        const type = typeof item === 'string' ? _guessType(f) : item.type;

        try {
            const r = await fetch(f + '?t=' + Date.now(), { cache: 'no-store' });
            if (!r.ok) { console.warn('Не найден:', f); continue; }
            const data = await r.json();

            switch (type) {
                case 'parts':
                    if (Array.isArray(data)) serverParts = serverParts.concat(data);
                    break;
                case 'categories':
                    if (Array.isArray(data)) cats = data;
                    break;
                case 'sections':
                    if (data && typeof data === 'object' && !Array.isArray(data)) {
                        secs = Object.assign(secs || {}, data);
                    }
                    break;
                case 'workshops':
                    if (Array.isArray(data)) wss = data;
                    break;
                default:
                    console.warn('Неизвестный тип файла:', f, '→', type);
            }
        } catch (e) { console.warn('Ошибка ' + f, e); }
    }

    if (serverParts.length) {
        const map = new Map(D.map(x => [(x.oem || '') + '||' + (x.name || ''), x]));
        let add = 0, upd = 0;
        for (const raw of serverParts) {
            const np = nP(raw); if (!np) continue;
            const k = (np.oem || '') + '||' + (np.name || '');
            if (!map.has(k)) { D.push(np); map.set(k, np); add++; }
            else {
                const old = map.get(k);
                const user = {
                    id: old.id,
                    status: old.status,
                    favorite: old.favorite,
                    notes: old.notes,
                    price: old.price,
                    currency: old.currency,
                    priceHistory: old.priceHistory,
                    shopUrl: old.shopUrl,
                    photos: old.photos
                };
                Object.assign(old, np, user);
                upd++;
            }
        }
        console.log('С сервера: +' + add + ', ~' + upd + ' | Итого:', D.length);
        if (useIDB) try { await iMany(SP, D); } catch (e) { }
        else sD();
    }

    if (cats) for (const c of cats) {
        if (!c || !c.id) continue;
        if (!CATS.find(x => x.id === c.id)) CATS.push({ id: c.id, label: c.label || c.id, icon: c.icon || '📁' });
    }

    if (secs) { CUSTOM.sections = Object.assign({}, secs); sMeta(); }

    if (wss && wss.length) {
        W = wss.map(nW).filter(Boolean);
        if (useIDB) await iMany(SW, W); else sWk();
    }

    lG(); lMeta(); lU(); lProfile(); lTO(); await lLogs();
    if (SV.activeVinId && !G.some(g => g.id === SV.activeVinId)) SV.activeVinId = null;
    try { vk = localStorage.getItem(VK) || ''; } catch (e) { }
}

/* ============ ТЕМА ============ */
function aTh() {
    THEMES.forEach(t => document.body.classList.remove(t.cls));
    const t = THEMES.find(x => x.id === SV.theme) || THEMES[2];
    document.body.classList.add(t.cls);
    document.body.style.colorScheme = (t.id === 'light' || t.id === 'paper') ? 'light' : 'dark';
}
function oTheme() { renderThemeGrid(); openM('thememmo'); }
const cTheme = () => closeM('thememmo');
function renderThemeGrid() {
    const g = $('themeGrid');
    if (!g) return;
    g.innerHTML = THEMES.map(t =>
        '<button type="button" class="th-card' + (SV.theme === t.id ? ' on' : '') + '" data-th="' + t.id + '">' +
        '<div class="th-preview" style="background:' + t.preview + '"></div>' +
        '<div class="th-label">' + t.icon + ' ' + esc(t.label) + '</div>' +
        '</button>'
    ).join('');
    g.querySelectorAll('[data-th]').forEach(b => { b.onclick = () => sTheme(b.dataset.th); });
}
function sTheme(id) {
    if (!THEMES.some(t => t.id === id)) return;
    SV.theme = id;
    aTh();
    sU();
    renderThemeGrid();
    const t = THEMES.find(x => x.id === id);
    toast('🎨 Тема: ' + t.label, 'success');
}

/* ============ UI / САЙДБАР / АДАПТИВ ============ */
function setV(v, s) {
    SV.view = v;
    if (!s) sU();
    const tg = $('viewToggle'), lb = $('vtLbl');
    if (tg) tg.checked = v === 'tree';
    if (lb) lb.textContent = v === 'tree' ? '🗂 Дерево' : '▦ Плитка';
    rC();
}
function aSS() {
    const m = window.innerWidth <= 900, sb = $('sb'), bd = document.body;
    if (!m && SV.sidebarCollapsed) { sb.classList.add('collapsed'); bd.classList.add('sidebar-collapsed'); }
    else { sb.classList.remove('collapsed'); bd.classList.remove('sidebar-collapsed'); }
}
function rSz() {
    aSS();
    const m = window.innerWidth <= 900;
    const mb = $('mob');
    if (mb) mb.style.display = m ? 'flex' : '';
    if (!m) cMM();
}
function tSB() {
    if (window.innerWidth <= 900) return;
    SV.sidebarCollapsed = !SV.sidebarCollapsed;
    aSS(); sU();
}
const oMM = () => { $('sb').classList.add('open-mobile'); $('ov').classList.add('show'); };
const cMM = () => { $('sb').classList.remove('open-mobile'); $('ov').classList.remove('show'); };
const tMM = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    $('sb').classList.contains('open-mobile') ? cMM() : oMM();
};

/* Виртуальные (не товарные) разделы — для сайдбара */
const VIRTUAL_CATS = {
    Workshops: { label: 'Мастерские/СТО', icon: '🔧' },
    Log: { label: 'Журнал обслуживания', icon: '📖' },
    Diagnostics: { label: 'Диагностика (OBD)', icon: '🩺' },
    Torque: { label: 'Моменты затяжки', icon: '🔩' },
};

/* ============================================================
   Отфильтрованный список для счётчиков в сайдбаре.
   ============================================================ */
function computeFilteredForSidebar() {
    const t = nz(SV.searchQuery).split(/\s+/).filter(Boolean);
    let f = D;

    if (SV.activeVinId && SV.vinStrictFilter) {
        f = f.filter(p => {
            if (!p.donors || !p.donors.length) return true;
            const cmp = pCompat(p);
            return !cmp || cmp.cls !== 'n';
        });
    }

    if (SV.statusFilter && SV.statusFilter !== 'all')
        f = f.filter(p => (p.status || '') === SV.statusFilter);

    if (SV.engineFilter && SV.engineFilter !== 'all')
        f = f.filter(p => {
            const arr = p.engines || [];
            return !arr.length || arr.includes(SV.engineFilter);
        });

    if (SV.bodyFilter && SV.bodyFilter !== 'all')
        f = f.filter(p => {
            const arr = p.bodies || [];
            return !arr.length || arr.includes(SV.bodyFilter);
        });

    if (SV.transFilter && SV.transFilter !== 'all')
        f = f.filter(p => {
            const arr = p.transmissions || [];
            return !arr.length || arr.includes(SV.transFilter);
        });

    if (SV.genFilter && SV.genFilter !== 'all')
        f = f.filter(p => {
            const arr = p.gens || [];
            return !arr.length || arr.includes(SV.genFilter);
        });

    if (t.length) f = f.filter(p => mP(p, t));
    return f;
}

function rSB() {
    const n = $('nl');
    if (!n) return;
    n.innerHTML = '';
    if (!SV.expandedCats || typeof SV.expandedCats !== 'object') SV.expandedCats = {};

    // ── Фильтрованный список + раскладка по категориям ────────
    const filtered = computeFilteredForSidebar();
    const byCat = {};
    let favCount = 0;
    for (const p of filtered) {
        byCat[p.cat] = (byCat[p.cat] || 0) + 1;
        if (p.favorite) favCount++;
    }

    // ── Счётчики ──────────────────────────────────────────────
    const cnt = id => {
        const sec = CUSTOM.sections && CUSTOM.sections[id];
        if (sec && Array.isArray(sec.rows)) return sec.rows.length;

        if (id === 'Workshops') return W.length;
        if (id === 'Log') return LOG.length;
        if (id === 'Diagnostics')
            return (CUSTOM.sections.Diagnostics && CUSTOM.sections.Diagnostics.rows || []).length;
        if (id === 'Torque')
            return (CUSTOM.sections.Torque && CUSTOM.sections.Torque.rows || []).length;

        if (id === 'All') return filtered.length;
        if (id === 'Favorites') return favCount;

        return byCat[id] || 0;
    };

    // ── Отрисовка плоского пункта ─────────────────────────────
    const addItem = (id, icon, label, count, cls, sub) => {
        const li = document.createElement('li');
        li.className = 'ni ' + (SV.activeCat === id && !SV.activeSub ? 'active ' : '') + (cls || '') + (sub ? ' sub' : '');
        li.setAttribute('tabindex', '-1');
        li.onclick = () => {
            SV.activeCat = id;
            SV.activeSub = null;
            sU(); rSB(); rC();
            if (window.innerWidth <= 900) cMM();
            $('ca').scrollTop = 0;
        };
        const dimStyle = (count === 0 && id !== 'All') ? ' style="opacity:.45"' : '';
        li.innerHTML =
            '<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'
            + icon + ' ' + esc(label) +
            '</span><span class="bdg"' + dimStyle + '>' + count + '</span>';
        n.appendChild(li);
    };

    // ── Заголовок группы ─────────────────────────────────────
    const addSection = label => {
        const li = document.createElement('li');
        li.className = 'nd-label';
        li.textContent = label;
        n.appendChild(li);
    };

    // ── Папка категории с подкатегориями и/или дочерними категориями ──
    const addCatFolder = (c) => {
        // 1. Собираем уникальные sub у деталей этой категории (из отфильтрованного списка)
        const subs = new Map();
        for (const p of filtered) {
            if (p.cat !== c.id) continue;
            const s = (p.sub || '').trim();
            if (!s) continue;
            subs.set(s, (subs.get(s) || 0) + 1);
        }
        const subList = Array.from(subs.entries())
            .sort((a, b) => a[0].localeCompare(b[0], 'ru'));

        // 2. Дочерние категории (по parent)
        const kids = CATS.filter(k => k.parent === c.id);

        // 3. Итоговый счётчик = своя категория + все дочерние
        const total = cnt(c.id) + kids.reduce((s, k) => s + cnt(k.id), 0);

        const expanded = !!SV.expandedCats[c.id];
        const isAllActive = SV.activeCat === c.id && !SV.activeSub;

        const li = document.createElement('li');
        li.className = 'ni folder' + (expanded ? ' open' : '') + (isAllActive ? ' active' : '');
        li.setAttribute('tabindex', '-1');
        li.innerHTML =
            '<span class="fold-arr">▶</span>' +
            '<span class="fold-lb">' + c.icon + ' ' + esc(c.label) + '</span>' +
            '<span class="bdg"' + (total === 0 ? ' style="opacity:.45"' : '') + '>' + total + '</span>';
        li.onclick = () => {
            SV.expandedCats[c.id] = !SV.expandedCats[c.id];
            sU(); rSB();
        };
        n.appendChild(li);

        if (!expanded) return;

        // Пункт «Все разделы» — сброс подкатегории
        const allLi = document.createElement('li');
        allLi.className = 'ni sub' + (isAllActive ? ' active' : '');
        allLi.setAttribute('tabindex', '-1');
        allLi.innerHTML =
            '<span style="flex:1;min-width:0">📦 Все разделы</span>' +
            '<span class="bdg">' + total + '</span>';
        allLi.onclick = (e) => {
            e.stopPropagation();
            SV.activeCat = c.id;
            SV.activeSub = null;
            sU(); rSB(); rC();
            if (window.innerWidth <= 900) cMM();
            $('ca').scrollTop = 0;
        };
        n.appendChild(allLi);

        // Сами подкатегории (sub)
        subList.forEach(([sub, count]) => {
            const subActive = SV.activeCat === c.id && SV.activeSub === sub;
            const sli = document.createElement('li');
            sli.className = 'ni sub' + (subActive ? ' active' : '');
            sli.setAttribute('tabindex', '-1');
            sli.innerHTML =
                '<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'
                + esc(sub) + '</span>' +
                '<span class="bdg"' + (count === 0 ? ' style="opacity:.45"' : '') + '>' + count + '</span>';
            sli.onclick = (e) => {
                e.stopPropagation();
                SV.activeCat = c.id;
                SV.activeSub = sub;
                sU(); rSB(); rC();
                if (window.innerWidth <= 900) cMM();
                $('ca').scrollTop = 0;
            };
            n.appendChild(sli);
        });

        // Дочерние категории (например, Cooling, Ignition внутри Engine)
        kids.forEach(k => {
            const kidActive = SV.activeCat === k.id && !SV.activeSub;
            const kli = document.createElement('li');
            kli.className = 'ni sub' + (kidActive ? ' active' : '');
            kli.setAttribute('tabindex', '-1');
            const kc = cnt(k.id);
            kli.innerHTML =
                '<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'
                + k.icon + ' ' + esc(k.label) + '</span>' +
                '<span class="bdg"' + (kc === 0 ? ' style="opacity:.45"' : '') + '>' + kc + '</span>';
            kli.onclick = (e) => {
                e.stopPropagation();
                SV.activeCat = k.id;
                SV.activeSub = null;
                sU(); rSB(); rC();
                if (window.innerWidth <= 900) cMM();
                $('ca').scrollTop = 0;
            };
            n.appendChild(kli);
        });
    };

    // ── ПИН-БЛОК (всегда сверху) ─────────────────
    addItem('Favorites', '⭐', 'Избранное', cnt('Favorites'), 'fav');
    addItem('All', '📦', 'Все системы', cnt('All'));

    // ── ГРУППЫ ───────────────────────────────────────────────
    for (const grp of CAT_GROUPS) {
        addSection(grp.label);

        for (const cid of grp.cats) {
            if (grp.virtual && VIRTUAL_CATS[cid]) {
                const v = VIRTUAL_CATS[cid];
                addItem(cid, v.icon, v.label, cnt(cid));
                continue;
            }
            const c = CATS.find(x => x.id === cid);
            if (!c) continue;

            // Пропускаем вложенные категории — они рендерятся как kids своего родителя
            if (c.parent) continue;

            // Есть ли у категории свои sub'ы в отфильтрованном списке?
            const hasSubs = filtered.some(p =>
                p.cat === cid && (p.sub || '').trim()
            );
            // Есть ли дочерние категории (по parent)?
            const hasKids = CATS.some(k => k.parent === cid);

            if (hasSubs || hasKids) {
                addCatFolder(c);
            } else {
                addItem(c.id, c.icon, c.label, cnt(c.id));
            }
        }
    }
}

/* ============ ПОИСК / ФИЛЬТРЫ ============ */
const uSC = () => $('scl').classList.toggle('show', !!(SV.searchQuery || '').length);
const cS = () => { SV.searchQuery = ''; $('sr').value = ''; uSC(); sU(); rC(); };
function resetFilters() {
    SV.searchQuery = ''; $('sr').value = ''; uSC();
    SV.statusFilter = 'all'; $('sf').value = 'all';
    SV.engineFilter = 'all'; $('fmtr').value = 'all';
    SV.bodyFilter = 'all'; $('fbdy').value = 'all';
    SV.transFilter = 'all'; $('ftr').value = 'all';
    SV.genFilter = 'all'; if ($('fgen')) $('fgen').value = 'all';
    SV.sortBy = 'default'; $('ss').value = 'default';
    updateFilterStyling(); sU(); rSB(); rC();
    toast('Фильтры сброшены', 'success');
}
function rD() {
    askConfirm(
        'При пересборке ваши записи и фото, внесённые вручную, удалятся.\n\n' +
        'Вы уверены?\n\n' +
        '💡 Если уверены — сначала сделайте Экспорт JSON.',
        doRebuild,
        { title: '♻️ Пересобрать базу?', yes: 'Да, пересобрать', no: 'Нет', showExport: true }
    );
}

async function doRebuild() {
    try {
        if (useIDB) { await iClr(SP); await iClr(SW); }
        localStorage.removeItem(PK);
        localStorage.removeItem(WK);
        resetMeta();
        D = []; W = [];
        await lAll();
        rSB(); rC();
        toast('Загружено: ' + D.length + ' поз.', 'success');
    } catch (e) { toast('Ошибка: ' + e.message, 'danger'); }
}

function mP(p, t) {
    if (!t.length) return true;
    const h = nz([p.oem || '', p.name || '', ...(p.analogs || []), ...(p.donors || []),
    ...((p.inst || []).map(i => i.text)), p.notes || '',
    ...(p.engines || []), ...(p.transmissions || []), ...(p.bodies || []), ...(p.gens || [])].join('  '));
    return t.every(x => h.includes(x));
}
function sP(a) {
    const s = SV.sortBy;
    if (s === 'default' && SV.activeCat === 'Maintenance') {
        return a.slice().sort((x, y) =>
            _maintWeight(x) - _maintWeight(y)
            || (x.name || '').localeCompare(y.name || '')
            || (x.oem || '').localeCompare(y.oem || '')
        );
    }
    if (s === 'oem') return a.slice().sort((x, y) => (x.oem || '').localeCompare(y.oem || ''));
    if (s === 'name') return a.slice().sort((x, y) => (x.name || '').localeCompare(y.name || ''));
    if (s === 'priceAsc') return a.slice().sort((x, y) => (Number(x.price) || Infinity) - (Number(y.price) || Infinity));
    if (s === 'priceDesc') return a.slice().sort((x, y) => (Number(y.price) || -Infinity) - (Number(x.price) || -Infinity));
    if (s === 'favorite') return a.slice().sort((x, y) => (y.favorite ? 1 : 0) - (x.favorite ? 1 : 0));
    return a;
}

function gF() {
    const t = nz(SV.searchQuery).split(/\s+/).filter(Boolean);
    let f = D;
    if (SV.activeVinId && SV.vinStrictFilter) {
        f = f.filter(p => {
            if (!p.donors || !p.donors.length) return true;
            const cmp = pCompat(p);
            return !cmp || cmp.cls !== 'n';
        });
    }
    if (SV.activeCat === 'Favorites') {
        f = f.filter(p => p.favorite);
    } else if (SV.activeCat !== 'All' && SV.activeCat !== 'Workshops' && SV.activeCat !== 'Log') {
        f = f.filter(p => p.cat === SV.activeCat);
        if (SV.activeSub) {
            f = f.filter(p => (p.sub || '').trim() === SV.activeSub);
        }
    }
    if (SV.engineFilter && SV.engineFilter !== 'all') f = f.filter(p => {
        const arr = p.engines || [];
        return !arr.length || arr.includes(SV.engineFilter);
    });
    if (SV.bodyFilter && SV.bodyFilter !== 'all') f = f.filter(p => {
        const arr = p.bodies || [];
        return !arr.length || arr.includes(SV.bodyFilter);
    });
    if (SV.transFilter && SV.transFilter !== 'all') f = f.filter(p => {
        const arr = p.transmissions || [];
        return !arr.length || arr.includes(SV.transFilter);
    });
    if (SV.genFilter && SV.genFilter !== 'all') f = f.filter(p => {
        const arr = p.gens || [];
        return !arr.length || arr.includes(SV.genFilter);
    });
    if (t.length) f = f.filter(p => mP(p, t));
    return sP(f);
}
function updateFilterStyling() {
    ['fmtr', 'fbdy', 'ftr'].forEach(id => {
        const el = $(id); if (!el) return;
        el.classList.toggle('act', el.value && el.value !== 'all');
    });
}
function updSearchSuggest() {
    const dl = $('searchSuggest'); if (!dl) return;
    const items = [], seen = new Set();
    const MAX = 200;
    for (const p of D) {
        if (items.length >= MAX) break;
        if (p.oem && !seen.has('o:' + p.oem)) { items.push(p.oem); seen.add('o:' + p.oem); }
        if (items.length >= MAX) break;
        if (p.name && !seen.has('n:' + p.name)) { items.push(p.name); seen.add('n:' + p.name); }
    }
    dl.innerHTML = items.map(x => '<option value="' + escA(x) + '">').join('');
}

/* ============ КОНТЕНТ ============ */
function _renderSignature() {
    return [
        SV.activeCat, SV.searchQuery, SV.statusFilter,
        SV.engineFilter, SV.bodyFilter, SV.transFilter, SV.genFilter,
        SV.sortBy, SV.groupBySub, SV.vinStrictFilter
    ].join('|');
}

function rC() {
    if (SV.activeCat === 'Workshops') { rW(); return; }
    if (SV.activeCat === 'Log') { rLog(); return; }
    if (CUSTOM.sections[SV.activeCat]) { rSec(SV.activeCat); return; }

    const sig = _renderSignature();
    if (sig !== _lastRenderSig) { _visibleLimit = PAGE_SIZE; _lastRenderSig = sig; }

    const ar = $('ca'), f = gF();

    let title, icon;
    if (SV.activeCat === 'Favorites') { title = 'Избранное'; icon = '⭐'; }
    else if (SV.activeCat === 'All') { title = 'Все системы'; icon = '📦'; }
    else {
        const c = CATS.find(x => x.id === SV.activeCat);
        title = c ? c.label : '?';
        icon = c ? c.icon : '📦';
        if (SV.activeSub) title += ' → ' + SV.activeSub;
    }
    let h = '<h2 class="sh">' + icon + ' ' + esc(title) + '</h2>';

    const chips = [];
    chips.push('<span class="chip">найдено: <b>' + f.length + '</b></span>');
    if (SV.engineFilter && SV.engineFilter !== 'all') chips.push('<span class="chip">⚙️ ' + esc(SV.engineFilter) + '</span>');
    if (SV.bodyFilter && SV.bodyFilter !== 'all') chips.push('<span class="chip">🚗 ' + esc(BODIES[SV.bodyFilter] || SV.bodyFilter) + '</span>');
    if (SV.transFilter && SV.transFilter !== 'all') chips.push('<span class="chip">🔄 ' + esc(TRANSMISSIONS[SV.transFilter] || SV.transFilter) + '</span>');
    if (SV.genFilter && SV.genFilter !== 'all') chips.push('<span class="chip">🚘 ' + esc(GENERATIONS[SV.genFilter] || SV.genFilter) + '</span>');
    if (SV.statusFilter && SV.statusFilter !== 'all') chips.push('<span class="chip">🏷 ' + esc(SV.statusFilter) + '</span>');
    if (SV.searchQuery) chips.push('<span class="chip">🔍 "' + esc(SV.searchQuery) + '"</span>');
    if (SV.activeSub) {
        chips.push(
            '<span class="chip" data-chip="clearSub" style="cursor:pointer" title="Показать весь раздел">'
            + '📂 ' + esc(SV.activeSub) + ' ✕</span>'
        );
    }
    chips.push('<span class="chip" data-chip="groupBySub" style="cursor:pointer;' + (SV.groupBySub ? 'border-color:var(--a);background:rgba(0,176,240,.12);' : '') + '" title="Группировать по подкатегориям">📂 Группы</span>');
    const av = gAV();
    if (av) {
        chips.push('<span class="chip">VIN …' + esc(av.vin.slice(-6)) + '</span>');
        chips.push('<span class="chip" data-chip="vinStrict" style="cursor:pointer;' + (SV.vinStrictFilter ? 'border-color:var(--dg);background:rgba(220,53,69,.12);' : '') + '" title="Скрыть детали, несовместимые с VIN">🔒 VIN-строго</span>');
    }
    h += '<div class="ri">' + chips.join('') + '</div>';

    if (!f.length) {
        let ei, em;
        if (SV.activeCat === 'Favorites') { ei = '⭐'; em = 'Пока нет избранного.'; }
        else if (!D.length) { ei = '📂'; em = 'База пуста. Положи parts.json в data/ или нажми ⚙️ → 📜 История версий.'; }
        else { ei = '🔍'; em = 'Ничего не найдено. Попробуйте сбросить фильтры.'; }
        h += '<div class="emp"><div class="empi">' + ei + '</div><p>' + em + '</p><button class="bn" onclick="resetFilters()" style="margin-top:10px">🔄 Сбросить фильтры</button></div>';
        ar.innerHTML = h;
        return;
    }

    if (SV.view === 'tree') {
        h += rET(f);
        ar.innerHTML = h;
        return;
    }

    if (SV.groupBySub) {
        const groups = {};
        for (const p of f) {
            const k = (p.sub || '').trim() || '— без подкатегории —';
            (groups[k] || (groups[k] = [])).push(p);
        }
        const keys = Object.keys(groups).sort((a, b) =>
            (a === '— без подкатегории —' ? 1 : b === '— без подкатегории —' ? -1 : 0)
            || a.localeCompare(b));

        let rendered = 0;
        for (const k of keys) {
            if (rendered >= _visibleLimit) break;
            h += '<h3 style="margin:14px 0 8px;font-size:.9rem;color:var(--b);display:flex;align-items:center;gap:6px">'
                + '<span style="display:inline-block;width:3px;height:14px;background:var(--a);border-radius:2px"></span>'
                + esc(k) + ' <span style="font-size:.72rem;color:var(--mu);font-weight:400">('
                + groups[k].length + ')</span></h3><div class="gr">';
            for (const p of groups[k]) {
                if (rendered >= _visibleLimit) break;
                h += cH(p);
                rendered++;
            }
            h += '</div>';
        }
    } else {
        const slice = f.slice(0, _visibleLimit);
        h += '<div class="gr">';
        for (const p of slice) h += cH(p);
        h += '</div>';
    }

    if (f.length > _visibleLimit) {
        h += '<div style="text-align:center;padding:22px 0">'
            + '<button class="bn p" onclick="_showMore()">▾ Показать ещё ('
            + (f.length - _visibleLimit) + ' из ' + f.length + ')</button></div>';
    }
    ar.innerHTML = h;
}
window._showMore = function () {
    _visibleLimit += PAGE_SIZE;
    rC();
};
window.toggleTreeAll = function () {
    const all = document.querySelectorAll('#ca details[data-etkey]');
    if (!all.length) return;
    const anyOpen = Array.from(all).some(d => d.open);
    if (!SV.expandedTree) SV.expandedTree = {};
    all.forEach(d => {
        const k = d.dataset.etkey;
        if (anyOpen) { d.open = false; delete SV.expandedTree[k]; }
        else { d.open = true; SV.expandedTree[k] = true; }
    });
    sU();
    const btn = document.querySelector('.et-tgl-btn');
    if (btn) {
        btn.textContent = anyOpen ? '▼ Развернуть всё' : '▲ Свернуть всё';
        btn.dataset.treeall = anyOpen ? 'expand' : 'collapse';
    }
};

function cH(p) {
    const o = p.oem || '';
    const anInline = (p.analogs || []).length
        ? p.analogs.map(a => '<span class="tg an">' + esc(a) + '<button class="ctb2" data-copy="' + escA(a) + '" title="Копировать">📋</button></span>').join('')
        : '<span style="color:var(--mu);font-size:.66rem">—</span>';
    const dn = (p.donors || []).map(d => '<span class="tg dn">' + esc(d) + '</span>').join('')
        || '<span style="color:var(--mu);font-size:.72rem">— нет данных —</span>';
    const eng = (p.engines || []).length
        ? p.engines.map(e => '<span class="tg eg">' + esc(e) + '</span>').join('')
        : '<span style="color:var(--mu);font-size:.72rem">— не указано —</span>';
    const bdy = (p.bodies || []).length
        ? p.bodies.map(b => '<span class="tg bd">' + esc(BODIES[b] || b) + '</span>').join('')
        : '<span style="color:var(--mu);font-size:.72rem">— не указано —</span>';
    const trn = (p.transmissions || []).map(t => '<span class="tg tr">' + esc(TRANSMISSIONS[t] || t) + '</span>').join('');
    const trm = (p.trims || []).map(t => '<span class="tg tm">' + esc(t) + '</span>').join('');
    const gn = (p.gens || []).map(g => '<span class="tg gn">' + esc(GENERATIONS[g] || g) + '</span>').join('');
    let ih = '';
    if (p.inst && p.inst.length) {
        const warns = p.inst.filter(i => i.type === 'warn');
        const others = p.inst.filter(i => i.type !== 'warn');
        ih = '<div class="ins">';
        for (const it of warns) ih += '<div class="ini"><span class="it tw">ВНИМАНИЕ</span>' + esc(it.text) + '</div>';
        for (const it of others) {
            const k = IM[it.type] || 'n';
            ih += '<div class="ini" style="margin-top:5px"><span class="it ' + IC[k] + '">' + IL[k] + '</span>' + esc(it.text) + '</div>';
        }
        ih += '</div>';
    }
    let partsHtml = '';
    if (p.parts && p.parts.length) {
        partsHtml = '<div class="cd-to-parts">'
            + '<div class="cd-to-parts-h">🛒 Купить запчасти для ТО </div>'
            + '<div class="tp-parts">'
            + p.parts.map(it => {
                const c = (it.oem || '').replace(/\s+/g, '');
                const links = c
                    ? '<a class="psl ex" target="_blank" rel="noopener noreferrer" href="' + SH.ex(c) + '" title="Exist">🟠 Exist</a>'
                    + '<a class="psl ad" target="_blank" rel="noopener noreferrer" href="' + SH.ad(c) + '" title="Autodoc">🔵 Autodoc</a>'
                    + '<a class="psl av" target="_blank" rel="noopener noreferrer" href="' + SH.av(it.oem, it.name) + '" title="Avito">🟣 Avito</a>'
                    : '';
                return '<div class="tpp-row">'
                    + '<div class="tpp-head">'
                    + '<span class="tpp-name">' + esc(it.name || '') + '</span>'
                    + (it.oem ? '<span class="tpp-oem" title="Артикул">' + esc(it.oem) + '</span>' : '')
                    + '</div>'
                    + (it.note ? '<div class="tpp-note">' + esc(it.note) + '</div>' : '')
                    + (links ? '<div class="tpp-links">' + links + '</div>' : '')
                    + '</div>';
            }).join('')
            + '</div></div>';
    }
    const ntH = '<textarea class="cn" data-notes-id="' + escA(p.id) + '" placeholder="Заметка…" rows="2">' + esc(p.notes || '') + '</textarea>';
    const phList = Array.isArray(p.photos) ? p.photos : [];
    const phh = phList.length
        ? '<div class="cd-sec" style="padding-top:4px"><div class="cd-gallery">'
        + phList.map((src, i) =>
            '<img class="cd-photo" src="' + src + '" alt="" '
            + 'data-lightbox-pid="' + escA(p.id) + '" data-lightbox-idx="' + i + '">'
        ).join('')
        + '</div></div>'
        : '';
    const f = !!p.favorite;
    const vb = p.verified ? '<span class="vb t">✓ ETKA</span>' : '<span class="vb f">⚠</span>';
    const cmp = pCompat(p);
    let ch = '';
    if (cmp) {
        const ic = cmp.cls === 'y' ? '✓' : cmp.cls === 'n' ? '✗' : '?';
        ch = '<span class="cb ' + cmp.cls + '" title="' + escA(cmp.label) + '">' + ic + ' ' + cmp.pct + '%</span>';
    }
    const st = p.status || '';
    const stBar = '<span class="cd-st-lb">Статус:</span>'
        + [['want', '🛒', 'Хочу'], ['bought', '📦', 'Купил'], ['installed', '✅', 'Поставил']]
            .map(x =>
                '<button class="tp' + (st === x[0] ? ' on' : '') + '" data-action="set-status" data-status="' + x[0] + '" data-id="' + escA(p.id) + '">' + x[1] + ' ' + x[2] + '</button>'
            ).join('');

    return '<div class="cd' + (f ? ' fav' : '') + '" data-id="' + escA(p.id) + '">'
        + '<div class="cd-top">'
        + '<h3 class="cd-nm">' + esc(p.name || '(без названия)') + '</h3>'
        + '<div class="cd-btns">'
        + '<button class="ctb sr' + (f ? ' on' : '') + '" data-action="favorite" title="Избранное">' + (f ? '★' : '☆') + '</button>'
        + '<button class="ctb" data-action="edit" title="Ред.">✎</button>'
        + '<button class="ctb dg" data-action="delete" title="Удалить">✕</button>'
        + '</div></div>'
        + '<div class="cd-meta">'
        + '<span class="cd-oem-v">' + (o ? esc(o) : '— без артикула —')
        + (o ? '<button class="cob" data-action="copy" data-oem="' + escA(o) + '" title="Копировать">📋</button>' : '')
        + '</span>' + vb + ch
        + '</div>'
        + '<div class="cd-meta cd-ans"><span class="cd-ans-lb">🔧 Аналоги:</span>' + anInline + '</div>'
        + (partsHtml
            ? partsHtml
            : '<div class="cd-purchase">' + getPurchaseHtml(p) + '</div>'
            + (o ? '<div class="cd-meta"><button class="bn" style="padding:4px 8px;font-size:.7rem" onclick="findCheaper(\'' + escA(o) + '\', \'' + escA(p.name) + '\')" title="Открыть Exist + Autodoc + Avito">🔍 Найти дешевле</button></div>' : ''))
        + lastLogBadge(o)
        + '<div class="cd-st">' + stBar + '</div>'
        + '<details class="cd-body"><summary>Подробности</summary><div class="cd-content">'
        + phh
        + '<div class="cd-sec"><div class="cd-s-t">🚗 Применимость</div>'
        + '<div class="rw"><span class="lb">Двигатели</span><div class="tgs">' + eng + '</div></div>'
        + '<div class="rw"><span class="lb">Кузова</span><div class="tgs">' + bdy + '</div></div>'
        + (gn ? '<div class="rw"><span class="lb">Поколение</span><div class="tgs">' + gn + '</div></div>' : '')
        + (trn ? '<div class="rw"><span class="lb">КПП</span><div class="tgs">' + trn + '</div></div>' : '')
        + (trm ? '<div class="rw"><span class="lb">Комплектации</span><div class="tgs">' + trm + '</div></div>' : '')
        + '<div class="rw"><span class="lb">Доноры</span><div class="tgs">' + dn + '</div></div>'
        + '</div>'
        + (ih ? '<div class="cd-sec"><div class="cd-s-t">📖 Инструкции (' + p.inst.length + ')</div>' + ih + '</div>' : '')
        + '<div class="cd-sec"><div class="cd-s-t">📝 Заметки</div>' + ntH + '</div>'
        + '</div></details>'
        + '</div>';
}

function oPC(id) {
    const p = D.find(x => x.id === id);
    if (!p) return;
    partmoId = id;
    $('partmo_title').textContent = p.name || p.oem || 'Деталь';
    let html = cH(p);
    html = html.replace(/<button class="ctb" data-action="edit"[^>]*>✎<\/button>/, '');
    html = html.replace(/<button class="ctb dg" data-action="delete"[^>]*>✕<\/button>/, '');
    html = html.replace(/ class="cd( fav)?"/, ' class="cd$1" style="border:none;box-shadow:none"');
    $('partmo_body').innerHTML = '<div style="margin:-4px">' + html + '</div>';
    const det = $('partmo_body').querySelector('.cd-body');
    if (det) det.setAttribute('open', '');
    openM('partmo');
}
const cPC = () => { closeM('partmo'); partmoId = null; };

function rSec(sid) {
    const ar = $('ca');
    const s = CUSTOM.sections[sid] || {};
    const rows = Array.isArray(s.rows) ? s.rows : [];
    let h = '<h2 class="sh">' + (s.icon || '📋') + ' ' + esc(s.label || sid) + '</h2>';
    h += '<div class="ri"><span class="chip">всего: <b>' + rows.length + '</b></span></div>';
    if (!rows.length) {
        h += '<div class="emp"><div class="empi">📋</div><p>Раздел пуст — заполни через импорт JSON.</p></div>';
        ar.innerHTML = h; return;
    }
    const cols = s.cols || [];
    h += '<div style="overflow-x:auto;border-radius:6px"><table style="width:100%;border-collapse:collapse;font-size:.82rem;background:var(--cd);border:1px solid var(--bd)">';
    if (cols.length) h += '<thead><tr>' + cols.map(c =>
        '<th style="padding:8px 10px;text-align:left;border-bottom:2px solid var(--a);background:var(--hv);font-size:.7rem;text-transform:uppercase;letter-spacing:.4px;color:var(--mu)">' + esc(c) + '</th>'
    ).join('') + '</tr></thead>';
    h += '<tbody>';
    for (const r of rows) {
        const cells = Array.isArray(r) ? r : cols.map(c => (r && r[c] != null) ? r[c] : '');
        h += '<tr>' + cells.map(c =>
            '<td style="padding:7px 10px;border-bottom:1px solid var(--bd);vertical-align:top">' + esc(String(c == null ? '' : c)) + '</td>'
        ).join('') + '</tr>';
    }
    h += '</tbody></table></div>';
    ar.innerHTML = h;
}

function rET(parts) {
    const t = {};
    for (const p of parts) {
        const m = EK[p.cat] || { g: 'Прочее', s: 'Прочее' };
        const g = m.g;
        const s = (p.sub || '').trim() || m.s;
        if (!t[g]) t[g] = {};
        if (!t[g][s]) t[g][s] = [];
        t[g][s].push(p);
    }
    if (!SV.expandedTree || typeof SV.expandedTree !== 'object') SV.expandedTree = {};
    const exp = SV.expandedTree;
    const groupKeys = Object.keys(t).sort();
    const anyOpen = groupKeys.some(g => exp['g:' + g]);

    let h = '<div class="et">';
    h += '<div class="et-tools">'
        + '<button type="button" class="bn et-tgl-btn" onclick="toggleTreeAll()" data-treeall="' + (anyOpen ? 'collapse' : 'expand') + '">'
        + (anyOpen ? '▲ Свернуть всё' : '▼ Развернуть всё')
        + '</button>'
        + '<span class="et-hint">Нажми на папку 📁, чтобы раскрыть</span>'
        + '</div>';

    for (const g of groupKeys) {
        const sg = t[g];
        let tot = 0;
        for (const s of Object.keys(sg)) tot += sg[s].length;
        const gKey = 'g:' + g;
        const gOpen = !!exp[gKey];

        h += '<details class="et-group"' + (gOpen ? ' open' : '') + ' data-etkey="' + escA(gKey) + '">';
        h += '<summary>📁 ' + esc(g) + '<span class="gc">' + tot + '</span></summary>';

        for (const s of Object.keys(sg).sort()) {
            const a = sg[s];
            const sKey = 's:' + g + '|' + s;
            const sOpen = !!exp[sKey];
            h += '<details class="et-sub"' + (sOpen ? ' open' : '') + ' data-etkey="' + escA(sKey) + '">';
            h += '<summary style="font-size:.8rem;font-weight:600;color:var(--mu)">📂 ' + esc(s) + '<span class="gc">' + a.length + '</span></summary>';
            h += '<div class="sg">';
            const sorted = a.slice().sort((x, y) => {
                if (x.cat === 'Maintenance' || y.cat === 'Maintenance') {
                    const dx = _maintWeight(x), dy = _maintWeight(y);
                    if (dx !== dy) return dx - dy;
                    return (x.name || '').localeCompare(y.name || '');
                }
                return (x.oem || '').localeCompare(y.oem || '');
            });
            for (const p of sorted) {
                const w = p.verified ? '' : ' <span style="color:var(--wn);font-size:.68rem">⚠</span>';
                const cm = pCompat(p);
                let sm = '';
                if (cm) {
                    const col = cm.cls === 'y' ? 'var(--ok)' : cm.cls === 'n' ? 'var(--dg)' : 'var(--mu)';
                    const ic = cm.cls === 'y' ? '✓' : cm.cls === 'n' ? '✗' : '?';
                    sm = ' <span style="color:' + col + ';font-weight:700;font-size:.68rem">' + ic + cm.pct + '%</span>';
                }
                let pm = '';
                if (p.status === 'want') pm = ' 🛒';
                else if (p.status === 'bought') pm = ' 📦';
                else if (p.status === 'installed') pm = ' ✅';
                let nm = p.notes ? ' 📝' : '';
                h += '<div class="ep" data-id="' + escA(p.id) + '"><span class="om">' + esc(p.oem || '—') + '</span><span class="nm">' + esc(p.name || '') + pm + nm + w + sm + '</span></div>';
            }
            h += '</div></details>';
        }
        h += '</details>';
    }
    return h + '</div>';
}

function toggleAllDetails() {
    const ar = $('ca');
    const anyOpen = ar.querySelector('.cd-body[open]');
    ar.querySelectorAll('.cd-body').forEach(d => {
        if (anyOpen) d.removeAttribute('open');
        else d.setAttribute('open', '');
    });
}

function rW() {
    const ar = $('ca');
    let h = '<h2 class="sh">🔧 Мастерские</h2>';
    h += '<div class="ri"><span class="chip">всего: <b>' + W.length + '</b></span><button class="bn p" onclick="oWM()" style="padding:4px 10px;font-size:.78rem">➕ Добавить</button></div>';
    if (!W.length) {
        h += '<div class="emp"><div class="empi">🔧</div><p><b>Список пуст</b></p><p>Сохраняйте проверенных мастеров.</p></div>';
        ar.innerHTML = h; return;
    }
    h += '<div class="gr">';
    for (const w of W) h += wH(w);
    h += '</div>';
    ar.innerHTML = h;
}
function wH(w) {
    const st = w.rating ? '<span class="wra">' + '★'.repeat(w.rating) + '☆'.repeat(5 - w.rating) + '</span>' : '';
    let l = '';
    if (w.phone) l += '<div class="wli"><span class="ic">📞</span><a href="tel:' + escA(w.phone.replace(/[^0-9+]/g, '')) + '">' + esc(w.phone) + '</a></div>';
    if (w.address) l += '<div class="wli"><span class="ic">📍</span>' + esc(w.address) + '</div>';
    if (w.spec) l += '<div class="wli"><span class="ic">🔧</span>' + esc(w.spec) + '</div>';
    if (st) l += '<div class="wli"><span class="ic">⭐</span>' + st + '</div>';
    const n = w.note ? '<div class="wnt">' + esc(w.note) + '</div>' : '';
    return '<div class="wc" data-wid="' + escA(w.id) + '"><div class="chr"><div class="wn">' + esc(w.name || '(без названия)') + '</div><div class="cto"><button class="ctb" data-wact="edit" title="Ред.">✎</button><button class="ctb dg" data-wact="delete" title="Удалить">✕</button></div></div>' + l + n + '</div>';
}

/* ============ КОПИРОВАНИЕ ============ */
function cT(t, b) {
    const x = String(t || '');
    const done = () => {
        const o = b.textContent;
        b.textContent = '✓';
        b.classList.add('ok');
        setTimeout(() => { b.textContent = o; b.classList.remove('ok'); }, 1200);
        toast('Скопировано: ' + x, 'success');
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(x).then(done).catch(() => fC(x, done));
    else fC(x, done);
}
function fC(t, d) {
    try {
        const ta = document.createElement('textarea');
        ta.value = t;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        d && d();
    } catch (e) { toast('Не удалось скопировать', 'danger'); }
}

/* ============ КЛИКИ ============ */
function oCC(e) {
    const img = e.target.closest('[data-lightbox-pid]');
    if (img) {
        const pid = img.dataset.lightboxPid;
        const idx = parseInt(img.dataset.lightboxIdx, 10) || 0;
        const p = D.find(x => x.id === pid);
        if (p && Array.isArray(p.photos)) { oL(p.photos, idx); return; }
    }
    const chip = e.target.closest('[data-chip]');
    if (chip) {
        const k = chip.dataset.chip;
        if (k === 'groupBySub') {
            SV.groupBySub = !SV.groupBySub;
            sU(); rC();
        } else if (k === 'vinStrict') {
            SV.vinStrictFilter = !SV.vinStrictFilter;
            sU(); rGar(); rSB(); rC();
        }
        return;
    }

    if (e.target.classList && e.target.classList.contains('cn')) return;
    const wb = e.target.closest('[data-wact]');
    if (wb) {
        const c = wb.closest('.wc');
        const id = c ? c.dataset.wid : null;
        if (!id) return;
        if (wb.dataset.wact === 'edit') oEMW(id); else dWsh(id);
        return;
    }
    const sb2 = e.target.closest('[data-action="set-status"]');
    if (sb2) { e.stopPropagation(); sPS(sb2.dataset.id, sb2.dataset.status); return; }
    const ct = e.target.closest('[data-copy]');
    if (ct && !ct.closest('.cto')) { e.stopPropagation(); cT(ct.dataset.copy, ct); return; }
    const b = e.target.closest('[data-action]');
    if (b) {
        const a = b.dataset.action;
        const c = b.closest('.cd');
        const id = c ? c.dataset.id : null;
        if (a === 'copy') return cT(b.dataset.oem, b);
        if (a === 'favorite' && id) return tF(id);
        if (a === 'edit' && id) return oEM(id);
        if (a === 'delete' && id) return dPt(id);
    }
    const la = e.target.closest('[data-lac]');
    if (la) {
        const c = la.closest('.log-entry');
        const id = c ? c.dataset.lid : null;
        if (!id) return;
        if (la.dataset.lac === 'edit') oLogEdit(id); else dLog(id);
        return;
    }
    const tp = e.target.closest('.ep');
    if (tp && tp.dataset.id) oPC(tp.dataset.id);
}
function tF(id) {
    const p = D.find(x => x.id === id); if (!p) return;
    p.favorite = !p.favorite;
    useIDB ? iPut(SP, p).catch(() => { }) : sD();
    rSB(); rC();
    if (partmoId === id) oPC(id);
    toast(p.favorite ? '⭐ Добавлено' : 'Убрано');
}
function sPS(id, st) {
    const p = D.find(x => x.id === id);
    if (!p || !['want', 'bought', 'installed'].includes(st)) return;
    const same = p.status === st;
    p.status = same ? '' : st;
    useIDB ? iPut(SP, p).catch(() => { }) : sD();
    rSB(); rC();
    if (partmoId === id) oPC(id);
    const L = { want: '🛒 Хочу', bought: '📦 Куплено', installed: '✅ Установлено' };
    toast(same ? 'Статус снят' : L[st], same ? '' : 'success');
    if (!same && st === 'installed' && typeof confetti === 'function') confetti();
}

function oL(list, idx) {
    _lbPhotos = Array.isArray(list) ? list.slice() : [];
    _lbIdx = Math.max(0, Math.min(_lbPhotos.length - 1, parseInt(idx, 10) || 0));
    if (!_lbPhotos.length) return;
    _lbShow();
    $('lbt').classList.add('show');
}
function _lbShow() {
    const img = $('lbi'), cnt = $('lbCount'), prev = $('lbPrev'), next = $('lbNext');
    if (img) img.src = _lbPhotos[_lbIdx] || '';
    if (cnt) cnt.textContent = _lbPhotos.length > 1 ? (_lbIdx + 1) + ' / ' + _lbPhotos.length : '';
    if (prev) prev.disabled = _lbIdx <= 0;
    if (next) next.disabled = _lbIdx >= _lbPhotos.length - 1;
}
function lbNav(dir) {
    if (!_lbPhotos.length) return;
    const n = _lbIdx + (dir > 0 ? 1 : -1);
    if (n < 0 || n >= _lbPhotos.length) return;
    _lbIdx = n;
    _lbShow();
}
const cL = () => {
    $('lbt').classList.remove('show');
    $('lbi').src = '';
    _lbPhotos = []; _lbIdx = 0;
};

/* ============ ФОРМА ДЕТАЛИ ============ */
const fCS = () => $('f_cat').innerHTML = CATS.filter(c => c.id !== 'All')
    .map(c => '<option value="' + c.id + '">' + c.icon + ' ' + esc(c.label) + '</option>').join('');

function aIR(t, x) {
    const ed = $('ie'), r = document.createElement('div');
    r.className = 'ier';
    r.innerHTML = '<select class="ity">' + Object.keys(IL).map(k => '<option value="' + MI[k] + '">' + IL[k] + '</option>').join('') + '</select>'
        + '<input type="text" class="itx" placeholder="Текст…"><button type="button" title="Удалить">×</button>';
    r.querySelector('select').value = MI[t] || 'proc';
    r.querySelector('input').value = x || '';
    r.querySelector('button').addEventListener('click', () => r.remove());
    ed.appendChild(r);
}
function rPH(h) {
    const g = $('phg'), l = $('phl');
    if (!h || !h.length) { g.style.display = 'none'; return; }
    g.style.display = '';
    l.innerHTML = h.slice().reverse().map(x =>
        '<div class="phi"><span class="phd">' + esc(fD(x.ts)) + '</span><span class="php">' + esc(fP(x.price, x.currency)) + '</span></div>'
    ).join('');
}
function oAM() {
    edId = null; pPhs = [];
    $('mt').textContent = 'Добавить деталь';
    $('f_id').value = '';
    $('f_cat').value = (SV.activeCat !== 'All' && SV.activeCat !== 'Favorites' && SV.activeCat !== 'Workshops' && SV.activeCat !== 'Log')
        ? SV.activeCat : 'Engine';
    ['f_name', 'f_oem', 'f_an', 'f_dn', 'f_pr', 'f_su', 'f_notes', 'f_eng', 'f_trn', 'f_bdy', 'f_trm', 'f_gen'].forEach(id => { if ($(id)) $(id).value = ''; });
    $('f_ver').checked = false; $('f_cu').value = 'RUB'; $('f_sts').value = ''; $('f_fav').value = '0';
    $('ie').innerHTML = ''; aIR('proc', '');
    uPP(); rPH([]);
    $('mo').classList.add('show');
    setTimeout(() => $('f_name').focus(), 50);
}
function oEM(id) {
    const p = D.find(x => x.id === id); if (!p) return;
    edId = id; pPhs = Array.isArray(p.photos) ? p.photos.slice() : [];
    $('mt').textContent = 'Редактировать: ' + (p.name || '');
    $('f_id').value = id;
    $('f_cat').value = p.cat || 'Engine';
    $('f_name').value = p.name || '';
    $('f_oem').value = p.oem || '';
    $('f_ver').checked = !!p.verified;
    $('f_an').value = (p.analogs || []).join(', ');
    $('f_dn').value = (p.donors || []).join(', ');
    $('f_eng').value = (p.engines || []).join(', ');
    $('f_trn').value = (p.transmissions || []).join(', ');
    $('f_bdy').value = (p.bodies || []).join(', ');
    $('f_gen').value = (p.gens || []).join(', ');
    $('f_trm').value = (p.trims || []).join(', ');
    $('f_pr').value = (p.price != null) ? p.price : '';
    $('f_cu').value = p.currency || 'RUB';
    $('f_sts').value = p.status || '';
    $('f_fav').value = p.favorite ? '1' : '0';
    $('f_su').value = p.shopUrl || '';
    $('f_notes').value = p.notes || '';
    const ed = $('ie'); ed.innerHTML = '';
    if (p.inst && p.inst.length) p.inst.forEach(i => aIR(IM[i.type] || 'note', i.text));
    else aIR('proc', '');
    rPH(p.priceHistory || []);
    uPP();
    $('mo').classList.add('show');
    setTimeout(() => $('f_name').focus(), 50);
}
const cM = () => { $('mo').classList.remove('show'); edId = null; pPhs = []; };

function sPt() {
    const name = $('f_name').value.trim(), cat = $('f_cat').value;
    if (!name) { toast('Введите название', 'danger'); $('f_name').focus(); return; }
    const oem = $('f_oem').value.trim(), verified = $('f_ver').checked;
    const analogs = sl($('f_an').value), donors = sl($('f_dn').value);
    const engs = sl($('f_eng').value).map(s => s.toUpperCase()).filter(x => ENGINES[x]);
    const trns = sl($('f_trn').value).filter(x => TRANSMISSIONS[x]);
    const bdys = sl($('f_bdy').value).filter(x => BODIES[x]);
    const trms = sl($('f_trm').value).filter(x => TRIMS.includes(x));
    const gens = sl($('f_gen').value).map(s => s.toUpperCase()).filter(x => GENERATIONS[x]);
    const prRaw = $('f_pr').value, price = prRaw === '' ? null : Number(prRaw);
    const currency = $('f_cu').value, status = $('f_sts').value;
    const favorite = $('f_fav').value === '1', shopUrl = sUrl($('f_su').value.trim());
    const notes = $('f_notes').value.trim();
    const inst = [];
    document.querySelectorAll('#ie .ier').forEach(r => {
        const t = r.querySelector('select').value, x = r.querySelector('input').value.trim();
        if (x) inst.push({ type: t, text: x });
    });
    const photosArr = Array.isArray(pPhs) ? pPhs.slice() : [];
    if (edId) {
        const i = D.findIndex(x => x.id === edId);
        if (i < 0) return;
        const o = D[i];
        let h = Array.isArray(o.priceHistory) ? o.priceHistory.slice() : [];
        if (o.price !== price && price != null && !isNaN(price)) {
            h.push({ ts: Date.now(), price: Number(price), currency: currency || 'RUB' });
            if (h.length > 50) h = h.slice(-50);
        }
        D[i] = Object.assign({}, o, {
            cat, sub: o.sub || '', name, oem, verified, analogs, donors,
            engines: engs, bodies: bdys, transmissions: trns, trims: trms, gens,
            price, currency, status, favorite, notes, shopUrl, inst, photos: photosArr,
            priceHistory: h
        });
        if (useIDB) iPut(SP, D[i]).catch(() => { });
        toast('Сохранено', 'success');
    } else {
        const np = {
            id: uid(), cat, sub: '', name, oem, verified, analogs, donors,
            engines: engs, bodies: bdys, transmissions: trns, trims: trms, gens,
            price, currency, status, favorite, notes, shopUrl, inst, photos: photosArr, priceHistory: []
        };
        D.push(np);
        if (useIDB) iPut(SP, np).catch(() => { });
        toast('Добавлено', 'success');
    }
    if (!useIDB) sD();
    rSB(); rC(); cM();
}
function dPt(id) {
    const p = D.find(x => x.id === id); if (!p) return;
    if (!confirm('Удалить «' + (p.name || p.oem || 'без названия').replace(/["'«»]/g, '') + '»?')) return;
    const idx = D.findIndex(x => x.id === id);
    const saved = D[idx];
    D = D.filter(x => x.id !== id);
    useIDB ? iDel(SP, id).catch(() => { }) : sD();
    rSB(); rC();
    toastUndo('Удалено: ' + (saved.name || saved.oem || ''), () => {
        D.splice(idx, 0, saved);
        useIDB ? iPut(SP, saved).catch(() => { }) : sD();
        rSB(); rC();
        toast('Восстановлено', 'success');
    });
}

/* ============ МАСТЕРСКИЕ ============ */
const oWM = () => {
    ewId = null;
    $('wmt').textContent = 'Добавить мастерскую';
    ['w_id', 'w_name', 'w_ph', 'w_ad', 'w_sp', 'w_no'].forEach(id => $(id).value = '');
    $('w_ra').value = '0';
    $('wmo').classList.add('show');
    setTimeout(() => $('w_name').focus(), 50);
};
function oEMW(id) {
    const w = W.find(x => x.id === id); if (!w) return;
    ewId = id;
    $('wmt').textContent = 'Редактировать: ' + (w.name || '');
    $('w_id').value = id;
    $('w_name').value = w.name || '';
    $('w_ph').value = w.phone || '';
    $('w_ad').value = w.address || '';
    $('w_sp').value = w.spec || '';
    $('w_ra').value = String(w.rating || 0);
    $('w_no').value = w.note || '';
    $('wmo').classList.add('show');
    setTimeout(() => $('w_name').focus(), 50);
}
const cWM = () => { $('wmo').classList.remove('show'); ewId = null; };
function sWsh() {
    const name = $('w_name').value.trim();
    if (!name) { toast('Введите название', 'danger'); return; }
    const d = {
        name, phone: $('w_ph').value.trim(), address: $('w_ad').value.trim(),
        spec: $('w_sp').value.trim(), rating: Number($('w_ra').value) || 0,
        note: $('w_no').value.trim()
    };
    if (ewId) {
        const i = W.findIndex(x => x.id === ewId);
        if (i < 0) return;
        W[i] = Object.assign({}, W[i], d);
        if (useIDB) iPut(SW, W[i]).catch(() => { });
        toast('Сохранено', 'success');
    } else {
        const nw = nW(Object.assign({ id: uid() }, d));
        W.push(nw);
        if (useIDB) iPut(SW, nw).catch(() => { });
        toast('Добавлено', 'success');
    }
    if (!useIDB) sWk();
    rSB(); rW(); cWM();
}
function dWsh(id) {
    const w = W.find(x => x.id === id); if (!w) return;
    if (!confirm('Удалить «' + (w.name || '').replace(/["'«»]/g, '') + '»?')) return;
    W = W.filter(x => x.id !== id);
    useIDB ? iDel(SW, id).catch(() => { }) : sWk();
    rSB(); rW();
    toast('Удалено', 'danger');
}

/* ============ ФОТО ============ */
const pkP = () => $('pf').click();

function rmPI(i) {
    if (!Array.isArray(pPhs)) return;
    pPhs.splice(i, 1);
    uPP();
}
function uPP() {
    const g = $('pgrid'), cnt = $('pCount');
    if (!g) return;
    if (!Array.isArray(pPhs)) pPhs = [];
    if (cnt) cnt.textContent = String(pPhs.length);
    g.innerHTML = pPhs.map((src, i) =>
        '<div class="pgrid-item">' +
        '<img src="' + sImg(src) + '" alt="">' +
        '<button type="button" class="rm" data-rmp="' + i + '" title="Удалить">✕</button>' +
        '</div>'
    ).join('');
    g.querySelectorAll('[data-rmp]').forEach(b => {
        b.onclick = () => rmPI(parseInt(b.dataset.rmp, 10));
    });
}
async function oPF(e) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = '';
    if (!files.length) return;
    const MAX = 12;
    for (const f of files) {
        if (pPhs.length >= MAX) { toast('Максимум ' + MAX + ' фото', 'danger'); break; }
        if (!/^image\//.test(f.type)) { toast('Не изображение: ' + f.name, 'danger'); continue; }
        try {
            const s = await cI(f, 800, .75);
            pPhs.push(s);
        } catch (err) { toast('Ошибка обработки', 'danger'); }
    }
    uPP();
}
const cI = (f, ms, q) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onerror = rej;
    r.onload = e => {
        const im = new Image();
        im.onerror = rej;
        im.onload = () => {
            const sc = Math.min(1, ms / Math.max(im.width, im.height));
            const w = Math.max(1, Math.round(im.width * sc));
            const h = Math.max(1, Math.round(im.height * sc));
            const c = document.createElement('canvas');
            c.width = w; c.height = h;
            const cx = c.getContext('2d');
            cx.fillStyle = '#fff';
            cx.fillRect(0, 0, w, h);
            cx.drawImage(im, 0, 0, w, h);
            res(c.toDataURL('image/jpeg', q));
        };
        im.src = e.target.result;
    };
    r.readAsDataURL(f);
});

/* ============ VIN-КЛЮЧ ============ */
const oSM = () => { $('s_vk').value = vk || ''; $('smo').classList.add('show'); };
const cSM = () => { $('smo').classList.remove('show'); };
const sSet = () => {
    vk = $('s_vk').value.trim();
    try { localStorage.setItem(VK, vk); } catch (e) { }
    toast('Сохранено', 'success');
    cSM();
};

/* ============ МЕНЮ ⚙️ ============ */
const cEM = () => $('em').classList.remove('show');
window.tMMenu = function (e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const m = document.getElementById('em');
    if (!m) return;
    m.classList.toggle('show');
};
const tMMenu = window.tMMenu;

/* ============ ЭКСПОРТ ============ */
function dl(f, c, m) {
    const b = new Blob([c], { type: m });
    const u = URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = u; a.download = f;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(u); }, 100);
}
function eD() {
    try {
        const p = {
            version: APP_VERSION,
            exportedAt: new Date().toISOString(),
            vehicle: 'VW Polo/Caddy 6N 1995-2003',
            author: USER.name || 'Guest',
            parts: D, workshops: W, garage: G,
            categories: CUSTOM.categories || [],
            sections: CUSTOM.sections || {}
        };
        const photoCount = D.reduce((s, x) => s + (Array.isArray(x.photos) ? x.photos.length : 0), 0);
        dl('vw_polo_caddy_' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(p, null, 2), 'application/json');
        toast('Экспорт: ' + D.length + ' поз., ' + W.length + ' СТО, ' + photoCount + ' фото', 'success');
    } catch (e) { toast('Ошибка: ' + e.message, 'danger'); }
}
const statL = s => ({ want: 'Хочу купить', bought: 'Куплено', installed: 'Установлено' }[s] || '');
const catL = id => { const c = CATS.find(x => x.id === id); return c ? c.label : id; };

function eCSV(of) {
    try {
        const src = of ? D.filter(p => p.favorite) : D;
        if (!src.length) { toast('Нет данных', 'danger'); return; }
        const H = ['Категория', 'Название', 'OEM', 'Подтверждён', 'Двигатели', 'КПП', 'Кузова', 'Комплектации', 'Аналоги', 'Доноры', 'Цена', 'Валюта', 'Статус', 'Избранное', 'Магазин', 'Заметки'];
        const rows = src.map(p => [
            catL(p.cat), p.name || '', p.oem || '', p.verified ? 'Да' : '',
            (p.engines || []).join('; '), (p.transmissions || []).join('; '),
            (p.bodies || []).join('; '), (p.trims || []).join('; '),
            (p.analogs || []).join('; '), (p.donors || []).join('; '),
            p.price != null ? p.price : '', p.currency || '',
            statL(p.status), p.favorite ? 'Да' : '', p.shopUrl || '', p.notes || ''
        ]);
        const csv = '\ufeff' + [H, ...rows].map(r => r.map(csvE).join(',')).join('\r\n');
        dl((of ? 'favorites_' : 'parts_') + new Date().toISOString().slice(0, 10) + '.csv', csv, 'text/csv;charset=utf-8');
        toast('CSV: ' + src.length + ' строк', 'success');
    } catch (e) { toast('Ошибка: ' + e.message, 'danger'); }
}
function eET() {
    try {
        if (!D.length) { toast('Нет данных', 'danger'); return; }
        const H = ['Группа', 'Подгруппа', 'Поз.', 'Номер', 'Наименование', 'Подтв.', 'Кол-во', 'Примечание'];
        const rows = [];
        const srt = D.slice().sort((a, b) => {
            const ga = (EK[a.cat] || {}).g || '';
            const gb = (EK[b.cat] || {}).g || '';
            if (ga !== gb) return ga.localeCompare(gb);
            return (a.oem || '').localeCompare(b.oem || '');
        });
        let lg = '', ct = 0;
        for (const p of srt) {
            const m = EK[p.cat] || { g: 'Прочее', s: 'Прочее' };
            const g = m.g;
            const s = (p.sub || '').trim() || m.s;
            if (g !== lg) { ct = 1; lg = g; } else ct++;
            const n = (p.inst || []).map(i => IL[IM[i.type] || 'n'] + ': ' + i.text).join(' | ');
            rows.push([g, s, String(ct).padStart(3, '0'), p.oem || '', p.name || '', p.verified ? 'Да' : '—', '1', n]);
        }
        const csv = '\ufeff' + [H, ...rows].map(r => r.map(csvE).join(',')).join('\r\n');
        dl('etka_' + new Date().toISOString().slice(0, 10) + '.csv', csv, 'text/csv;charset=utf-8');
        toast('ETKA-CSV: ' + rows.length + ' строк', 'success');
    } catch (e) { toast('Ошибка: ' + e.message, 'danger'); }
}
function eWCSV() {
    try {
        if (!W.length) { toast('Пусто', 'danger'); return; }
        const H = ['Название', 'Телефон', 'Адрес', 'Специализация', 'Рейтинг', 'Заметка'];
        const rows = W.map(w => [w.name, w.phone, w.address, w.spec, w.rating || '', w.note]);
        const csv = '\ufeff' + [H, ...rows].map(r => r.map(csvE).join(',')).join('\r\n');
        dl('workshops_' + new Date().toISOString().slice(0, 10) + '.csv', csv, 'text/csv;charset=utf-8');
        toast('CSV мастерских готов', 'success');
    } catch (e) { toast('Ошибка: ' + e.message, 'danger'); }
}

/* ============ ИМПОРТ ============ */
const tI = () => $('if').click();
function oIF(e) {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    const r = new FileReader();
    r.onerror = () => toast('Ошибка чтения', 'danger');
    r.onload = ev => {
        try {
            const p = JSON.parse(ev.target.result);
            const parts = Array.isArray(p) ? p : (p && Array.isArray(p.parts)) ? p.parts : null;
            if (!parts) throw new Error('Нет массива parts');
            if (!parts.length) throw new Error('Пустой массив');
            const ws = p && Array.isArray(p.workshops) ? p.workshops : null;
            const gs = p && Array.isArray(p.garage) ? p.garage : null;
            const meta = (p && typeof p === 'object') ? { categories: p.categories, sections: p.sections } : null;
            aI(parts, ws, gs, meta);
        } catch (err) { toast('Неверный JSON: ' + err.message, 'danger'); }
    };
    r.readAsText(f);
}
function aI(parts, ws, gs, meta) {
    const mode = prompt('Импортировать ' + parts.length + ' позиций.\n\n"replace" — заменить\n"merge" — добавить\n\n(Отмена)', 'merge');
    if (!mode) return;
    const m = mode.trim().toLowerCase();
    const cl = parts.map(nP).filter(Boolean);
    if (!cl.length) { toast('Нет валидных позиций', 'danger'); return; }

    if (m === 'replace') {
        if (!confirm('Заменить базу?')) return;
        D = cl;
        if (useIDB) iClr(SP).then(() => iMany(SP, D)).catch(() => { });
        else sD();
        if (ws && ws.length) {
            W = ws.map(nW).filter(Boolean);
            if (useIDB) iClr(SW).then(() => iMany(SW, W)).catch(() => { });
            else sWk();
        }
        if (gs && gs.length) {
            G = gs.filter(x => x && x.vin).map(x => ({
                id: x.id || ('g_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6)),
                vin: String(x.vin).toUpperCase(),
                brand: String(x.brand || ''),
                model: String(x.model || ''),
                year: x.year || null,
                body: String(x.body || ''),
                plant: String(x.plant || ''),
                engines: Array.isArray(x.engines) ? x.engines : [],
                addedAt: x.addedAt || Date.now()
            }));
            sG();
        }
        toast('База заменена: ' + D.length + ' поз.', 'success');
    } else if (m === 'merge') {
        const keyOf = x => (x.oem || '') + '||' + (x.name || '');
        const map = new Map(D.map(x => [keyOf(x), x]));
        let add = 0, merged = 0;
        for (const p of cl) {
            const k = keyOf(p);
            if (!map.has(k)) {
                D.push(p); map.set(k, p); add++;
            } else {
                const old = map.get(k);
                let touched = false;
                if (Array.isArray(p.photos) && p.photos.length) {
                    const existing = new Set(Array.isArray(old.photos) ? old.photos : []);
                    const merged2 = [...(old.photos || [])];
                    for (const src of p.photos) {
                        if (!existing.has(src)) { merged2.push(src); touched = true; }
                    }
                    if (touched) old.photos = merged2.slice(0, 12);
                }
                if (p.notes && p.notes !== old.notes) { old.notes = p.notes; touched = true; }
                if (p.price != null && p.price !== old.price) { old.price = p.price; touched = true; }
                if (p.shopUrl && p.shopUrl !== old.shopUrl) { old.shopUrl = p.shopUrl; touched = true; }
                if (touched) { merged++; if (useIDB) iPut(SP, old).catch(() => { }); }
            }
        }
        if (useIDB) iMany(SP, D).catch(() => { });
        else sD();

        let wa = 0;
        if (ws && ws.length) {
            const wsn = new Set(W.map(w => w.name || ''));
            for (const w of ws.map(nW).filter(Boolean)) {
                if (!wsn.has(w.name)) { W.push(w); wsn.add(w.name); wa++; }
            }
            if (useIDB) iMany(SW, W).catch(() => { });
            else sWk();
        }
        let ga = 0;
        if (gs && gs.length) {
            const gsn = new Set(G.map(g => g.vin));
            for (const g of gs) {
                if (g && g.vin && !gsn.has(String(g.vin).toUpperCase())) {
                    G.push({
                        id: g.id || ('g_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6)),
                        vin: String(g.vin).toUpperCase(),
                        brand: String(g.brand || ''),
                        model: String(g.model || ''),
                        year: g.year || null,
                        body: String(g.body || ''),
                        plant: String(g.plant || ''),
                        engines: Array.isArray(g.engines) ? g.engines : [],
                        addedAt: g.addedAt || Date.now()
                    });
                    gsn.add(String(g.vin).toUpperCase());
                    ga++;
                }
            }
            if (ga) sG();
        }
        let msg = '+' + add + ' поз., ~' + merged + ' обновлено';
        if (wa) msg += ', +' + wa + ' СТО';
        if (ga) msg += ', +' + ga + ' VIN';
        toast(msg, 'success');
    } else {
        toast('Неизвестный режим', 'danger');
        return;
    }

    if (meta && typeof meta === 'object') {
        if (Array.isArray(meta.categories)) {
            for (const c of meta.categories) {
                if (!c || !c.id) continue;
                const ex = CATS.find(x => x.id === c.id);
                if (ex) { ex.label = c.label || ex.label; ex.icon = c.icon || ex.icon; }
                else CATS.push({ id: c.id, label: c.label || c.id, icon: c.icon || '📁' });
            }
            CUSTOM.categories = (CUSTOM.categories || []).concat(meta.categories);
        }
        if (meta.sections && typeof meta.sections === 'object') {
            for (const sid of Object.keys(meta.sections)) {
                const s = meta.sections[sid]; if (!s) continue;
                CUSTOM.sections[sid] = Object.assign({}, CUSTOM.sections[sid] || {}, s);
                if (!CATS.find(x => x.id === sid)) CATS.push({ id: sid, label: s.label || sid, icon: s.icon || '📋' });
            }
        }
        sMeta();
    }
    rGar(); rSB(); rC();
}

/* ============ ЖУРНАЛ ============ */
function rLog() {
    const ar = $('ca');
    let h = '<h2 class="sh">📖 Журнал обслуживания</h2>';
    const av = gAV();
    h += '<div class="ri">';
    h += '<span class="chip">записей: <b>' + LOG.length + '</b></span>';
    if (av) h += '<span class="chip">VIN …' + esc(av.vin.slice(-6)) + '</span>';
    h += '<button class="bn p" onclick="oLogNew()" style="padding:4px 10px;font-size:.78rem">➕ Добавить запись</button>';
    h += '</div>';
    if (!LOG.length) {
        h += '<div class="emp"><div class="empi">📖</div><p><b>Журнал пуст</b></p><p>Фиксируй каждую работу — потом не вспомнишь, когда менял ГРМ.</p></div>';
        ar.innerHTML = h; return;
    }
    const srt = LOG.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.km || 0) - (a.km || 0));
    for (const e of srt) {
        h += '<div class="log-entry" data-lid="' + escA(e.id) + '" style="background:var(--cd);border:1px solid var(--bd);border-left:4px solid var(--a);border-radius:6px;padding:10px 12px;margin-bottom:8px">';
        h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:4px"><span style="font-family:Consolas,monospace;font-size:.72rem;color:var(--mu);font-weight:700">' + esc(e.date || '—') + '</span>';
        if (e.km) h += '<span style="font-size:.72rem;background:var(--hv);padding:1px 6px;border-radius:10px;color:var(--mu)">' + e.km.toLocaleString('ru-RU') + ' км</span>';
        h += '</div>';
        h += '<div style="font-weight:700;font-size:.92rem;color:var(--tx);margin:2px 0 6px">' + esc(e.title || '(без названия)') + '</div>';
        if (e.items && e.items.length) h += '<div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:6px">'
            + e.items.map(it => '<span style="font-size:.68rem;background:rgba(0,176,240,.12);color:var(--a);padding:2px 6px;border-radius:3px;font-family:Consolas,monospace">' + esc(it) + '</span>').join('') + '</div>';
        h += '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:.75rem;color:var(--mu);flex-wrap:wrap"><span>' + (e.shop ? esc(e.shop) : '') + '</span>';
        if (e.cost != null) h += '<span style="font-weight:700;color:var(--tx);font-size:.88rem">' + esc(fP(e.cost, e.currency || 'RUB')) + '</span>';
        h += '<span style="display:flex;gap:4px"><button class="ctb" data-lac="edit" title="Ред.">✎</button><button class="ctb dg" data-lac="del" title="Удалить">✕</button></span>';
        h += '</div>';
        if (e.notes) h += '<div style="font-size:.76rem;color:var(--mu);margin-top:6px;padding-top:6px;border-top:1px dashed var(--bd)">' + esc(e.notes) + '</div>';
        h += '</div>';
    }
    ar.innerHTML = h;
}
function oLogNew() {
    $('logmt').textContent = 'Новая запись';
    $('l_id').value = '';
    $('l_date').value = new Date().toISOString().slice(0, 10);
    $('l_km').value = TO.km || '';
    $('l_title').value = '';
    $('l_items').value = '';
    $('l_cost').value = '';
    $('l_cur').value = 'RUB';
    $('l_shop').value = '';
    $('l_notes').value = '';
    openM('logmo');
    setTimeout(() => $('l_title').focus(), 50);
}
function oLogEdit(id) {
    const e = LOG.find(x => x.id === id); if (!e) return;
    $('logmt').textContent = 'Редактирование';
    $('l_id').value = e.id;
    $('l_date').value = e.date || '';
    $('l_km').value = e.km || '';
    $('l_title').value = e.title || '';
    $('l_items').value = (e.items || []).join(', ');
    $('l_cost').value = e.cost != null ? e.cost : '';
    $('l_cur').value = e.currency || 'RUB';
    $('l_shop').value = e.shop || '';
    $('l_notes').value = e.notes || '';
    openM('logmo');
}
const cLog = () => closeM('logmo');
function sLog() {
    const title = $('l_title').value.trim();
    if (!title) { toast('Введите название', 'danger'); return; }
    const id = $('l_id').value;
    const rec = {
        id: id || ('l_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6)),
        date: $('l_date').value || new Date().toISOString().slice(0, 10),
        km: $('l_km').value ? Number($('l_km').value) : null,
        title,
        items: sl($('l_items').value),
        cost: $('l_cost').value !== '' ? Number($('l_cost').value) : null,
        currency: $('l_cur').value || 'RUB',
        shop: $('l_shop').value.trim(),
        notes: $('l_notes').value.trim(),
        vin: gAV() ? gAV().vin : '',
        createdAt: Date.now()
    };
    if (id) {
        const i = LOG.findIndex(x => x.id === id);
        if (i >= 0) LOG[i] = rec;
    } else LOG.push(rec);
    useIDB ? iPut('logs', rec).catch(() => { }) : sLogs();
    if (!useIDB) sLogs();
    _rebuildLogIndex();
    cLog(); rC();
    toast(id ? 'Запись обновлена' : 'Запись добавлена', 'success');
}
function dLog(id) {
    if (!confirm('Удалить запись?')) return;
    LOG = LOG.filter(x => x.id !== id);
    useIDB ? iDel('logs', id).catch(() => { }) : sLogs();
    if (!useIDB) sLogs();
    _rebuildLogIndex();
    rC();
    toast('Удалено', 'danger');
}
function lastLogForOEM(oem) {
    if (!oem) return null;
    return _logByOem.get(nz(oem)) || null;
}
function lastLogBadge(oem) {
    if (!oem) return '';
    const l = lastLogForOEM(oem);
    if (!l) return '';
    return '<div class="cd-meta"><span class="hi" style="cursor:default" title="Последняя замена: ' + escA(l.title) + '">🔧 Меняли: ' + esc(l.date) + (l.km ? ' · ' + l.km.toLocaleString('ru-RU') + ' км' : '') + '</span></div>';
}

/* ============ ТО ============ */
function nextTO() {
    if (TO.km == null || !TO.lastDate) return null;
    const last = new Date(TO.lastDate);
    if (isNaN(last.getTime())) return null;
    const interval = Number(TO.interval) || 15000;
    const monthlyKm = 1000;
    const monthsSince = Math.max(0, (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
    const kmSinceLast = monthsSince * monthlyKm;
    const kmToNext = Math.max(0, interval - kmSinceLast);
    const daysToNext = Math.round(kmToNext / monthlyKm * 30.44);
    return { interval, kmLeft: Math.round(kmToNext), daysLeft: daysToNext, lastDate: TO.lastDate };
}
function rTOWidget() {
    const chip = $('toChip'), lbl = $('toLbl');
    if (!chip || !lbl) return;
    const t = nextTO();
    if (!t) {
        lbl.textContent = 'Настроить ТО';
        chip.title = 'Заполни пробег и дату последнего ТО';
        chip.style.borderColor = '';
        chip.style.color = '';
        chip.style.background = '';
        return;
    }
    const urgent = t.daysLeft <= 7 || t.kmLeft <= 500;
    const warn = t.daysLeft <= 30 || t.kmLeft <= 2000;
    if (urgent) { chip.style.borderColor = 'var(--dg)'; chip.style.color = 'var(--dg)'; chip.style.background = 'rgba(220,53,69,.08)'; }
    else if (warn) { chip.style.borderColor = 'var(--sr)'; chip.style.color = 'var(--sr)'; chip.style.background = 'rgba(245,166,35,.08)'; }
    else { chip.style.borderColor = 'var(--ok)'; chip.style.color = 'var(--ok)'; chip.style.background = 'rgba(40,167,69,.08)'; }
    lbl.textContent = '⏱ ' + t.kmLeft.toLocaleString('ru-RU') + ' км / ' + t.daysLeft + ' дн.';
    chip.title = 'До ТО: ' + t.kmLeft.toLocaleString('ru-RU') + ' км / ' + t.daysLeft + ' дн. · Интервал ' + t.interval.toLocaleString('ru-RU') + ' км. Клик для настроек.';
}
function oTO() {
    $('t_km').value = TO.km || '';
    $('t_date').value = TO.lastDate || '';
    $('t_interval').value = String(TO.interval || 15000);
    openM('tomo');
}
const cTO = () => closeM('tomo');
function resetTO() {
    if (!confirm('Сбросить настройки ТО? Виджет вернётся в состояние «Настроить».')) return;
    TO = { km: null, lastDate: null, interval: 15000 };
    try { localStorage.removeItem(TOKEY); } catch (e) { }
    cTO(); rTOWidget();
    toast('Настройки ТО сброшены', 'danger');
}
function sTO() {
    TO.km = $('t_km').value !== '' ? Number($('t_km').value) : null;
    TO.lastDate = $('t_date').value || null;
    TO.interval = Number($('t_interval').value) || 15000;
    sTOStorage();
    cTO(); rTOWidget();
    toast('Настройки ТО сохранены', 'success');
}

/* ============ СПИСОК ПОКУПОК ============ */
function oShopList() {
    shopPick = new Set();
    const t = nextTO();
    const candidates = D.filter(p => {
        if (p.cat === 'Maintenance') return false;
        return ['Engine', 'Fuel', 'Ignition', 'Cooling', 'Brakes', 'Suspension', 'Transmission', 'Fluids', 'Bulbs', 'Electrical', 'Heating'].includes(p.cat);
    });
    const byCat = {};
    for (const p of candidates) {
        if (!byCat[p.cat]) byCat[p.cat] = [];
        byCat[p.cat].push(p);
    }
    const ar = $('shopBody');
    let h = '';
    if (t) h += '<div style="padding:10px 12px;background:rgba(40,167,69,.08);border:1px solid var(--ok);border-radius:4px;font-size:.82rem;margin-bottom:12px">📅 Последнее ТО: <b>' + esc(t.lastDate) + '</b> · Следующее через <b>' + t.kmLeft.toLocaleString('ru-RU') + ' км</b> (~' + t.daysLeft + ' дн.)</div>';
    else h += '<div style="padding:10px 12px;background:rgba(245,166,35,.08);border:1px solid var(--sr);border-radius:4px;font-size:.82rem;margin-bottom:12px">⚠️ Настрой ТО в шапке (🛠) — расчёт будет точнее. Пока показываю всё по регламенту.</div>';
    h += '<p style="font-size:.82rem;color:var(--mu);margin-top:0">Отметь, что нужно купить. Итог суммируется внизу.</p>';
    const catLbl = {
        Engine: '⚙️ Двигатель / ГРМ', Fuel: '⛽ Топливная', Ignition: '🔥 Зажигание',
        Cooling: '❄️ Охлаждение', Brakes: '🛑 Тормоза', Suspension: '🛞 Подвеска',
        Transmission: '🔄 Трансмиссия', Fluids: '🛢️ Жидкости', Bulbs: '🔆 Лампы',
        Electrical: '💡 Электрика', Heating: '🌡️ Печка'
    };
    const catOrder = ['Fluids', 'Engine', 'Ignition', 'Fuel', 'Cooling', 'Brakes', 'Suspension', 'Transmission', 'Electrical', 'Heating', 'Bulbs'];
    for (const cat of catOrder) {
        if (!byCat[cat]) continue;
        h += '<div style="margin-top:14px"><div style="font-size:.85rem;font-weight:700;color:var(--tx);padding:6px 0;border-bottom:1px solid var(--bd);margin-bottom:6px">' + (catLbl[cat] || cat) + '</div>';
        for (const p of byCat[cat]) {
            h += '<label style="display:flex;gap:8px;align-items:flex-start;padding:8px 10px;border-bottom:1px solid var(--bd);cursor:pointer;transition:all .15s"><input type="checkbox" data-shop-id="' + escA(p.id) + '" style="margin-top:3px;flex-shrink:0;width:16px;height:16px;cursor:pointer"><div style="flex:1;min-width:0">';
            h += '<div style="font-weight:700;font-size:.85rem;color:var(--tx)">' + esc(p.name || '') + '</div>';
            if (p.oem) h += '<div style="font-family:Consolas,monospace;font-size:.7rem;color:var(--mu)">' + esc(p.oem) + '</div>';
            if (p.analogs && p.analogs.length) h += '<div style="font-size:.7rem;color:var(--mu);margin-top:2px">Аналоги: ' + esc(p.analogs.slice(0, 3).join(', ')) + '</div>';
            h += '</div></label>';
        }
        h += '</div>';
    }
    h += '<div id="shopTotal" style="padding:12px;background:var(--hv);border:1px solid var(--bd);border-radius:6px;font-weight:700;font-size:.92rem;text-align:right;margin-top:10px;color:var(--tx)">Выбрано: <b>0</b> позиций</div>';
    ar.innerHTML = h;
    ar.querySelectorAll('[data-shop-id]').forEach(cb => {
        cb.addEventListener('change', () => {
            if (cb.checked) shopPick.add(cb.dataset.shopId);
            else shopPick.delete(cb.dataset.shopId);
            $('shopTotal').innerHTML = 'Выбрано: <b>' + shopPick.size + '</b> позиций';
        });
    });
    openM('shopmo');
}
const cShop = () => closeM('shopmo');
function pShop() {
    if (!shopPick.size) { toast('Ничего не выбрано', 'danger'); return; }
    const items = D.filter(p => shopPick.has(p.id));
    const css = '<style>body{font-family:Arial,sans-serif;padding:20px;color:#000}h1{font-size:18px;margin:0 0 12px}h2{font-size:14px;margin:18px 0 8px;color:#004b8f;border-bottom:1px solid #ccc;padding-bottom:3px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}th{background:#f0f0f0}@media print{@page{margin:15mm}}</style>';
    const w = window.open('', '_blank');
    let h = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Список покупок на ТО</title>' + css + '</head><body>';
    h += '<h1>Список покупок на ТО — VW Polo/Caddy 6N</h1>';
    h += '<p style="font-size:12px;color:#666">Дата: ' + new Date().toLocaleDateString('ru-RU') + (TO.km ? ' · Пробег: ' + TO.km.toLocaleString('ru-RU') + ' км' : '') + '</p>';
    const byCat = {};
    for (const p of items) {
        if (!byCat[p.cat]) byCat[p.cat] = [];
        byCat[p.cat].push(p);
    }
    for (const cat of Object.keys(byCat)) {
        h += '<h2>' + cat + '</h2><table><tr><th style="width:30px">OK</th><th style="width:150px">OEM</th><th>Наименование</th><th style="width:200px">Аналоги</th></tr>';
        for (const p of byCat[cat]) {
            h += '<tr><td></td><td>' + esc(p.oem || '—') + '</td><td>' + esc(p.name || '') + '</td><td style="font-size:11px">' + esc((p.analogs || []).slice(0, 3).join(', ')) + '</td></tr>';
        }
        h += '</table>';
    }
    h += '<p style="margin-top:20px;font-size:11px;color:#666">Всего: ' + items.length + ' позиций.</p>';
    h += '<script>window.onload=function(){setTimeout(function(){window.print()},300)}<\/script>';
    h += '</body></html>';
    w.document.write(h);
    w.document.close();
}
function eShopCSV() {
    if (!shopPick.size) { toast('Ничего не выбрано', 'danger'); return; }
    const items = D.filter(p => shopPick.has(p.id));
    const H = ['OEM', 'Название', 'Категория', 'Аналоги', 'Цена', 'Валюта', 'Заметки'];
    const rows = items.map(p => [p.oem || '', p.name || '', catL(p.cat), (p.analogs || []).join('; '), p.price != null ? p.price : '', p.currency || '', p.notes || '']);
    const csv = '\ufeff' + [H, ...rows].map(r => r.map(csvE).join(',')).join('\r\n');
    dl('to_shop_list_' + new Date().toISOString().slice(0, 10) + '.csv', csv, 'text/csv;charset=utf-8');
    toast('CSV: ' + items.length + ' позиций', 'success');
}

/* ============ НАЙТИ ДЕШЕВЛЕ ============ */
function findCheaper(oem, name) {
    if (!oem) { toast('Нет артикула', 'danger'); return; }
    const c = String(oem).replace(/\s/g, '');
    const cleanName = String(name || '')
        .replace(/\b(?:vw|volkswagen)\s+polo\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    const urls = [
        'https://www.exist.ru/Price/?pcode=' + c,
        'https://www.autodoc.ru/price/657/' + c,
        'https://www.avito.ru/rossiya/zapchasti_i_aksessuary?q=' +
        encodeURIComponent((cleanName ? cleanName + ' ' : '') + 'VW Polo ' + c)
    ];
    urls.forEach(u => {
        const a = document.createElement('a');
        a.href = u;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
    toast('Открыто 3 магазина', 'success');
}

/* ============ ЮMONEY ============ */
function copyYm() {
    const num = '410017195918895';
    const done = () => toast('📋 ЮMoney: 4100 1719 5918 895', 'success');
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(num).then(done).catch(() => fC(num, done));
    } else {
        fC(num, done);
    }
}

/* ============ PWA ============ */
function iPWA() {
    try {
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="96" fill="#001e50"/><text x="256" y="320" font-family="Arial" font-size="200" font-weight="bold" fill="#00b0f0" text-anchor="middle">VW</text></svg>';
        const ic = 'data:image/svg+xml;base64,' + btoa(svg);
        const mf = {
            name: 'VW Polo/Caddy 6N — База Мастера', short_name: 'Polo 6N',
            description: 'Каталог запчастей 1995-2003',
            start_url: location.href.split('#')[0], scope: '.',
            display: 'standalone', orientation: 'portrait-primary',
            background_color: '#0a1830', theme_color: '#0a1830', lang: 'ru',
            icons: [
                { src: ic, sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
                { src: ic, sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' }
            ]
        };
        const blob = new Blob([JSON.stringify(mf)], { type: 'application/manifest+json' });
        const url = URL.createObjectURL(blob);
        const l = document.createElement('link');
        l.rel = 'manifest'; l.href = url;
        document.head.appendChild(l);
        const ai = document.createElement('link');
        ai.rel = 'apple-touch-icon'; ai.href = ic;
        document.head.appendChild(ai);
        const fav = document.createElement('link');
        fav.rel = 'icon'; fav.href = ic;
        document.head.appendChild(fav);
    } catch (e) { }
}

/* ============ РЕДАКТОР VIN ============ */
function oVIN() {
    const av = gAV();
    if (!av || !av.ok) { toast('VIN не выбран', 'danger'); return; }
    vinEdId = av.id;
    const engSel = $('v_engine');
    engSel.innerHTML = '<option value="">— не указан —</option>'
        + Object.keys(ENGINES).map(k => '<option value="' + k + '">' + k + ' — ' + ENGINES[k].v + ' ' + ENGINES[k].hp + ' л.с.</option>').join('');
    const trnSel = $('v_trans');
    trnSel.innerHTML = '<option value="">— не указан —</option>'
        + Object.keys(TRANSMISSIONS).map(k => '<option value="' + k + '">' + TRANSMISSIONS[k] + '</option>').join('');
    $('v_model').value = av.model || '';
    $('v_proddate').value = av.prodDate || '';
    $('v_year').value = av.year || '';
    $('v_engine').value = av.engineCode || '';
    $('v_trans').value = av.transCode || '';
    $('v_equip').value = av.equipCode || '';
    $('v_bodycolor').value = av.bodyColor || '';
    $('v_roofcolor').value = av.roofColor || '';
    openM('vinmo');
}
const cVIN = () => { closeM('vinmo'); vinEdId = null; };
function sVIN() {
    if (!vinEdId) return;
    const g = G.find(x => x.id === vinEdId);
    if (!g) return;
    g.model = $('v_model').value.trim();
    g.prodDate = $('v_proddate').value || '';
    const yv = $('v_year').value;
    g.year = yv ? Number(yv) : null;
    g.engineCode = $('v_engine').value || '';
    g.transCode = $('v_trans').value || '';
    g.equipCode = $('v_equip').value.trim();
    g.bodyColor = $('v_bodycolor').value.trim().toUpperCase();
    g.roofColor = $('v_roofcolor').value.trim().toUpperCase();
    applyVinFilters();
    sG();
    rGar();
    cVIN();
    toast('Данные сохранены', 'success');
}

/* ============ SKELETON ============ */
function showSkeleton() {
    const ar = $('ca');
    if (!ar) return;
    let h = '<div class="gr">';
    for (let i = 0; i < 6; i++) {
        h += '<div class="sk-card">' +
            '<div class="skeleton sk-line w70"></div>' +
            '<div class="skeleton sk-line w40"></div>' +
            '<div class="skeleton sk-line w90"></div>' +
            '<div class="skeleton sk-line w40"></div>' +
            '</div>';
    }
    h += '</div>';
    ar.innerHTML = h;
}

/* ============ КОНФЕТТИ ============ */
function confetti() {
    const canvas = $('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.classList.add('show');
    const colors = ['#00a8e8', '#38bdf8', '#3ecf7e', '#fbbf24', '#e63946', '#8b5cf6', '#ec4899'];
    const pieces = [];
    const count = 120;
    for (let i = 0; i < count; i++) {
        pieces.push({
            x: canvas.width / 2 + (Math.random() - .5) * 200,
            y: canvas.height * 0.35,
            vx: (Math.random() - .5) * 12,
            vy: -Math.random() * 14 - 4,
            g: 0.4,
            w: 6 + Math.random() * 6,
            h: 8 + Math.random() * 6,
            color: colors[(Math.random() * colors.length) | 0],
            rot: Math.random() * Math.PI * 2,
            vrot: (Math.random() - .5) * .3,
            life: 1
        });
    }
    let frame = 0;
    function tick() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = 0;
        for (const p of pieces) {
            if (p.life <= 0) continue;
            alive++;
            p.vy += p.g;
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= .99;
            p.rot += p.vrot;
            if (p.y > canvas.height * 0.9) p.life -= .04;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        }
        frame++;
        if (alive > 0 && frame < 180) requestAnimationFrame(tick);
        else {
            canvas.classList.remove('show');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    tick();
}

/* ============ ПЛАШКА «ЧТО НОВОГО» ============ */
function _setChangelog(list) {
    if (Array.isArray(list)) _changelogCache = list;
}
function checkWhatsNew() {
    let lastSeen = '';
    try { lastSeen = localStorage.getItem(WNKEY) || ''; } catch (e) { }
    if (!lastSeen) {
        try { localStorage.setItem(WNKEY, APP_VERSION); } catch (e) { }
        return;
    }
    if (lastSeen === APP_VERSION) return;
    const rec = _changelogCache.find(r => r && String(r.version) === String(APP_VERSION));
    const changes = rec && Array.isArray(rec.changes) ? rec.changes.slice(0, 5) : [];
    showWhatsNew(APP_VERSION, changes);
}
function showWhatsNew(version, changes) {
    const el = $('whatsnew');
    if (!el) return;
    let h = '';
    h += '<div class="wn-head">';
    h += '<span class="wn-icon">🎉</span>';
    h += '<span class="wn-title">Что нового в v' + esc(version) + '</span>';
    h += '<button class="wn-close" onclick="closeWhatsNew(true)" title="Закрыть">✕</button>';
    h += '</div>';
    if (changes.length) {
        h += '<ul class="wn-list">';
        for (const c of changes) h += '<li>' + esc(c) + '</li>';
        h += '</ul>';
    } else {
        h += '<div class="wn-empty">Приложение обновлено до v' + esc(version) +
            '. Полный список изменений — в разделе «История версий».</div>';
    }
    h += '<div class="wn-foot">';
    h += '<button class="bn" onclick="closeWhatsNew(true)">Понятно</button>';
    h += '<button class="bn p" onclick="openWhatsNewDetails()">Подробнее</button>';
    h += '</div>';
    el.innerHTML = h;
    el.classList.add('show');
}
function closeWhatsNew(markSeen) {
    const el = $('whatsnew');
    if (!el) return;
    el.classList.remove('show');
    if (markSeen) {
        try { localStorage.setItem(WNKEY, APP_VERSION); } catch (e) { }
    }
}
function openWhatsNewDetails() {
    closeWhatsNew(true);
    oUp();
}

/* ============ FAQ ============ */
function oFaq() { openM('faqmo'); }
function cFaq() { closeM('faqmo'); }

/* ============ INIT ============ */
async function init() {
    if (licAppReady) return;
    licAppReady = true;
    showSkeleton();
    await lAll();
    aTh();
    aSS();
    rGar();
    applyVinFilters();
    rSB();
    rC();
    renderProfile();
    bindUI();
    updSearchSuggest();
    rTOWidget();
    iPWA();
    fCS();
    checkWhatsNew();
}

function bindUI() {
    if (window._uiAttached) return;
    window._uiAttached = true;

    const si = $('sr');
    if (!si) return;
    si.value = SV.searchQuery || '';
    uSC();

    si.addEventListener('input', e => { SV.searchQuery = e.target.value; uSC(); sUS(); dRC(); });
    $('sf').addEventListener('change', e => { SV.statusFilter = e.target.value; sU(); rSB(); rC(); });
    $('ss').addEventListener('change', e => { SV.sortBy = e.target.value; sU(); rC(); });
    $('fmtr').addEventListener('change', e => { SV.engineFilter = e.target.value; updateFilterStyling(); sU(); rSB(); rC(); });
    $('fbdy').addEventListener('change', e => { SV.bodyFilter = e.target.value; updateFilterStyling(); sU(); rSB(); rC(); });
    $('ftr').addEventListener('change', e => { SV.transFilter = e.target.value; updateFilterStyling(); sU(); rSB(); rC(); });

    const _fgen = $('fgen');
    if (_fgen) _fgen.addEventListener('change', e => { SV.genFilter = e.target.value; sU(); rSB(); rC(); });
    $('if').addEventListener('change', oIF);
    $('pf').addEventListener('change', oPF);

    $('sf').value = SV.statusFilter || 'all';
    $('ss').value = SV.sortBy || 'default';
    $('fmtr').value = SV.engineFilter || 'all';
    $('fbdy').value = SV.bodyFilter || 'all';
    $('ftr').value = SV.transFilter || 'all';
    if (_fgen) _fgen.value = SV.genFilter || 'all';
    updateFilterStyling();
    setV(SV.view || 'grid', true);

    ['pf_name', 'pf_ini', 'pf_city', 'pf_email'].forEach(id => {
        const el = $(id); if (el) el.addEventListener('input', updateProfPreview);
    });

    const ca = $('ca');
    ca.addEventListener('click', oCC);
    ca.addEventListener('click', e => {
        const sum = e.target.closest('summary');
        if (!sum) return;
        const det = sum.parentElement;
        if (!det || det.tagName !== 'DETAILS' || !det.dataset.etkey) return;
        setTimeout(() => {
            if (!SV.expandedTree) SV.expandedTree = {};
            const k = det.dataset.etkey;
            if (det.open) SV.expandedTree[k] = true;
            else delete SV.expandedTree[k];
            sU();
            const btn = document.querySelector('.et-tgl-btn');
            if (btn) {
                const any = !!document.querySelector('#ca details[data-etkey][open]');
                btn.textContent = any ? '▲ Свернуть всё' : '▼ Развернуть всё';
                btn.dataset.treeall = any ? 'collapse' : 'expand';
            }
        }, 0);
    }, false);
    ca.addEventListener('focusout', e => {
        const t = e.target;
        if (t && t.classList && t.classList.contains('cn')) {
            const id = t.dataset.notesId;
            if (!id) return;
            const p = D.find(x => x.id === id);
            if (!p) return;
            if (p.notes !== t.value) {
                p.notes = t.value;
                useIDB ? iPut(SP, p).catch(() => { }) : sD();
                toast('Заметка сохранена', 'success');
            }
        }
    });
    const pmb = $('partmo_body');
    if (pmb) {
        pmb.addEventListener('click', oCC);
        pmb.addEventListener('focusout', e => {
            const t = e.target;
            if (t && t.classList && t.classList.contains('cn')) {
                const id = t.dataset.notesId;
                if (!id) return;
                const p = D.find(x => x.id === id);
                if (!p) return;
                if (p.notes !== t.value) {
                    p.notes = t.value;
                    useIDB ? iPut(SP, p).catch(() => { }) : sD();
                    toast('Заметка сохранена', 'success');
                }
            }
        });
    }
    const gl = $('gl');
    if (gl) gl.addEventListener('click', e => {
        const d = e.target.closest('[data-vact="delete"]');
        if (d) { e.stopPropagation(); remV(d.dataset.gid); return; }
        if (e.target.closest('.gi-info')) return;
        const i = e.target.closest('.gi');
        if (i && i.dataset.gid) setAV(i.dataset.gid);
    });
    const gab = $('gab'); if (gab) gab.addEventListener('click', oGM);

    const modalClose = {
        mo: cM, wmo: cWM, gmo: cGM, smo: cSM, aboutmo: cAbout, bugmo: cBug,
        donmo: cDonate, profmo: cProfile, upmo: cUp, partmo: cPC,
        logmo: cLog, tomo: cTO, shopmo: cShop, vinmo: cVIN, thememmo: cTheme,
        faqmo: cFaq, apkmo: () => closeM('apkmo'),
        confirmmo: () => cConfirm(false)
    };
    Object.keys(modalClose).forEach(id => {
        const el = $(id); if (!el) return;
        el.addEventListener('click', e => { if (e.target.id === id) modalClose[id](); });
    });

    document.addEventListener('keydown', e => {
        if ($('lbt').classList.contains('show')) {
            if (e.key === 'ArrowLeft') { e.preventDefault(); lbNav(-1); return; }
            if (e.key === 'ArrowRight') { e.preventDefault(); lbNav(1); return; }
        }
        if (e.key === 'Escape') {
            if ($('confirmmo') && $('confirmmo').classList.contains('show')) return cConfirm(false);
            if ($('apkmo') && $('apkmo').classList.contains('show')) return closeM('apkmo');
            if ($('faqmo').classList.contains('show')) return cFaq();
            if ($('whatsnew') && $('whatsnew').classList.contains('show')) return closeWhatsNew(true);
            if ($('thememmo').classList.contains('show')) return cTheme();
            if ($('vinmo').classList.contains('show')) return cVIN();
            if ($('shopmo').classList.contains('show')) return cShop();
            if ($('tomo').classList.contains('show')) return cTO();
            if ($('logmo').classList.contains('show')) return cLog();
            if ($('partmo').classList.contains('show')) return cPC();
            if ($('lbt').classList.contains('show')) return cL();
            if ($('aboutmo').classList.contains('show')) return cAbout();
            if ($('bugmo').classList.contains('show')) return cBug();
            if ($('donmo').classList.contains('show')) return cDonate();
            if ($('profmo').classList.contains('show')) return cProfile();
            if ($('upmo').classList.contains('show')) return cUp();
            if ($('mo').classList.contains('show')) return cM();
            if ($('wmo').classList.contains('show')) return cWM();
            if ($('gmo').classList.contains('show')) return cGM();
            if ($('smo').classList.contains('show')) return cSM();
            if ($('sb').classList.contains('open-mobile')) return cMM();
            cEM();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            si.focus(); si.select();
        }
    });

    document.addEventListener('click', e => {
        const m = $('em');
        if (m.classList.contains('show') && !e.target.closest('.ew')) cEM();
    });

    let rz;
    window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(rSz, 120); });

    const dt = $('dtgl');
    if (dt) dt.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); tSB(); });

    const vtg = $('viewToggle');
    if (vtg) vtg.addEventListener('change', () => setV(vtg.checked ? 'tree' : 'grid'));

    const gv = $('g_vi');
    if (gv) {
        const vmLimit = 17;
        gv.setAttribute('autocapitalize', 'off');
        gv.setAttribute('autocomplete', 'off');
        gv.setAttribute('autocorrect', 'off');
        gv.setAttribute('spellcheck', 'false');
        gv.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); decG(); }
        });
        ['paste', 'blur'].forEach(ev => gv.addEventListener(ev, () => {
            const f = () => {
                const r = gv.value, c = r.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '').slice(0, vmLimit);
                if (c !== r) gv.value = c;
            };
            if (ev === 'paste') setTimeout(f, 0); else f();
        }));
    }

    const box = $('garageBox');
    if (box) {
        try { if (localStorage.getItem('vw_garage_collapsed') === '1') box.removeAttribute('open'); } catch (e) { }
        box.addEventListener('toggle', () => {
            try { localStorage.setItem('vw_garage_collapsed', box.open ? '0' : '1'); } catch (e) { }
        });
    }
}

/* ============ СТАРТ ============ */
window.addEventListener('DOMContentLoaded', async () => {
    try {
        const base = location.origin + location.pathname.replace(/[^/]*$/, '');
        const r = await fetch(base + 'data/update.json?t=' + Date.now(), { cache: 'no-store' });
        if (r.ok) {
            const m = await r.json();
            if (m.appVersion) APP_VERSION = String(m.appVersion);
        }
    } catch (e) { }
    ['ver_gate', 'ver_footer', 'ver_about', 'ver_bug'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = APP_VERSION;
    });
    fCS();
    checkLicense();
});