# Отчёт по слиянию инструкций — 2026-10-27 · v1.13.1

Инструмент: `tools/build-instructions.js` · библиотека: `tools/instructions/*.json`
Режим: **ЗАПИСЬ** · файлов изменено: 14 · карточек: 407 · добавлено строк: 9279

Слияние ДОПОЛНЯЕТ инструкции карточки и ничего не удаляет: существующие строки
остаются на месте, дубликаты по тексту отбрасываются (повторный запуск ничего не меняет).
Запись идёт в то поле, которое у карточки уже есть — `i` (`[["s","текст"]]`) или
`inst` (`[{type,text}]`, длинная схема `parts-06.json`); типы приводятся по карте `IM`.
Ключ слияния приложения (`oem + name`) не затрагивается.

## Записи библиотеки

| id | файл | заголовок | карточек найдено | применено | строк добавлено |
|---|---|---|---|---|---|
| `timing-belt` | 10-engine-timing.json | Замена ремня ГРМ (полная процедура) | 2 | 2 | 92 |
| `timing-kit` | 10-engine-timing.json | Комплект ГРМ (ремень + ролики + помпа) | 2 | 2 | 38 |
| `timing-tensioner` | 10-engine-timing.json | Натяжной ролик ГРМ | 2 | 2 | 24 |
| `timing-idler` | 10-engine-timing.json | Промежуточный (направляющий) ролик ГРМ | 2 | 2 | 12 |
| `water-pump` | 10-engine-timing.json | Помпа (водяной насос), приводимая ремнём ГРМ | 6 | 6 | 102 |
| `camshaft-sprocket` | 10-engine-timing.json | Зубчатый шкив распредвала | 5 | 5 | 55 |
| `crank-pulley-bolt` | 10-engine-timing.json | Центральный болт / шкив коленвала | 2 | 2 | 16 |
| `oil-change` | 11-maintenance.json | Замена моторного масла и масляного фильтра | 3 | 3 | 105 |
| `air-filter` | 11-maintenance.json | Воздушный фильтр | 3 | 3 | 33 |
| `cabin-filter` | 11-maintenance.json | Салонный фильтр | 1 | 1 | 11 |
| `fuel-filter` | 11-maintenance.json | Топливный фильтр | 5 | 5 | 80 |
| `wiper-blades` | 11-maintenance.json | Щётки стеклоочистителя | 4 | 4 | 56 |
| `battery-service` | 11-maintenance.json | Аккумулятор: замена и обслуживание | 1 | 1 | 19 |
| `spare-wheel-kit` | 11-maintenance.json | Запасное колесо, домкрат и дорожный набор | 4 | 4 | 68 |
| `radiator` | 20-cooling.json | Радиатор охлаждения | 2 | 2 | 40 |
| `thermostat` | 20-cooling.json | Термостат с корпусом | 4 | 4 | 60 |
| `cooling-fan` | 20-cooling.json | Вентилятор радиатора | 1 | 1 | 14 |
| `coolant-hoses` | 20-cooling.json | Патрубки и шланги системы охлаждения | 6 | 6 | 66 |
| `expansion-tank` | 20-cooling.json | Расширительный бачок и крышка | 3 | 3 | 33 |
| `heater-core` | 20-cooling.json | Радиатор отопителя (печки) | 1 | 1 | 15 |
| `coolant-refill` | 20-cooling.json | Заправка и прокачка системы охлаждения | 4 | 4 | 72 |
| `lambda-sensor` | 21-fuel-intake.json | Лямбда-зонд | 2 | 2 | 28 |
| `fuel-pressure-reg` | 21-fuel-intake.json | Регулятор давления топлива (РДТ) | 2 | 2 | 26 |
| `throttle-body` | 21-fuel-intake.json | Дроссельная заслонка и регулятор холостого хода | 3 | 3 | 39 |
| `fuel-pump` | 21-fuel-intake.json | Бензонасос погружной и его реле | 2 | 2 | 38 |
| `evap-canister` | 21-fuel-intake.json | Адсорбер и клапан N80 | 5 | 5 | 45 |
| `intake-gasket` | 21-fuel-intake.json | Прокладка впускного коллектора | 2 | 2 | 28 |
| `spark-plugs` | 22-ignition.json | Свечи зажигания (бензин) | 4 | 4 | 76 |
| `glow-plugs` | 22-ignition.json | Свечи накаливания (дизель) | 1 | 1 | 13 |
| `ignition-coil` | 22-ignition.json | Катушка зажигания | 1 | 1 | 14 |
| `ht-wires` | 22-ignition.json | Высоковольтные провода | 1 | 1 | 10 |
| `distributor` | 22-ignition.json | Крышка трамблёра и бегунок (8V) | 2 | 2 | 22 |
| `knock-crank-sensors` | 22-ignition.json | Датчик детонации и датчик положения коленвала (ДПКВ) | 2 | 2 | 28 |
| `front-pads` | 30-brakes-front.json | Передние тормозные колодки: замена | 3 | 3 | 144 |
| `front-discs` | 30-brakes-front.json | Передние тормозные диски: замена | 6 | 6 | 174 |
| `front-caliper` | 30-brakes-front.json | Суппорт передний (корпус) и его ремонт | 7 | 7 | 189 |
| `caliper-guides` | 30-brakes-front.json | Направляющие и ремкомплекты суппорта | 10 | 10 | 160 |
| `drum-brake-shoes` | 31-brakes-rear.json | Задние барабанные колодки: замена и регулировка | 7 | 7 | 329 |
| `brake-drum` | 31-brakes-rear.json | Тормозной барабан задний | 7 | 7 | 119 |
| `wheel-cylinder` | 31-brakes-rear.json | Колёсный (рабочий) тормозной цилиндр задний | 3 | 3 | 90 |
| `handbrake-cable` | 31-brakes-rear.json | Трос стояночного тормоза и его регулировка | 18 | 18 | 450 |
| `brake-backplate` | 31-brakes-rear.json | Тормозной щит задний | 4 | 4 | 48 |
| `brake-master-cylinder` | 32-brakes-hydraulics.json | Главный тормозной цилиндр (ГТЦ) | 7 | 7 | 245 |
| `brake-booster` | 32-brakes-hydraulics.json | Вакуумный усилитель тормозов (ВУТ) | 21 | 21 | 483 |
| `brake-hoses` | 32-brakes-hydraulics.json | Тормозные шланги | 8 | 8 | 176 |
| `brake-lines` | 32-brakes-hydraulics.json | Тормозные трубки (медные/стальные) | 1 | 1 | 19 |
| `abs-sensor` | 32-brakes-hydraulics.json | Датчик ABS (передний/задний) и ротор | 6 | 6 | 162 |
| `front-strut` | 40-suspension-front.json | Передняя амортизаторная стойка (в сборе) | 7 | 7 | 350 |
| `strut-mount-bearing` | 40-suspension-front.json | Опорный подшипник и верхняя опора стойки | 5 | 5 | 80 |
| `front-spring` | 40-suspension-front.json | Пружина передняя | 11 | 11 | 209 |
| `front-control-arm` | 40-suspension-front.json | Рычаг передней подвески (в сборе и по частям) | 6 | 6 | 192 |
| `ball-joint` | 40-suspension-front.json | Шаровая опора | 3 | 3 | 63 |
| `sway-bar` | 40-suspension-front.json | Стойки и втулки стабилизатора, стабилизатор | 13 | 13 | 260 |
| `subframe` | 40-suspension-front.json | Подрамник (передняя поперечина) | 9 | 9 | 162 |
| `bump-stop-boot` | 40-suspension-front.json | Отбойник и пыльник амортизатора | 2 | 2 | 22 |
| `rear-shock` | 41-rear-axle.json | Задний амортизатор | 9 | 9 | 279 |
| `rear-spring` | 41-rear-axle.json | Пружина задняя | 5 | 5 | 95 |
| `rear-hub-bearing` | 41-rear-axle.json | Подшипник и ступица заднего колеса | 6 | 6 | 198 |
| `rear-beam` | 41-rear-axle.json | Задняя балка и её сайлентблоки | 9 | 9 | 252 |
| `tie-rod-end` | 42-steering.json | Рулевой наконечник и рулевая тяга | 8 | 8 | 264 |
| `steering-rack` | 42-steering.json | Рулевая рейка (механизм) | 14 | 14 | 462 |
| `rack-boots` | 42-steering.json | Пыльники рулевой рейки и тяг | 4 | 4 | 64 |
| `ps-pump` | 42-steering.json | Насос гидроусилителя руля (ГУР) | 13 | 13 | 390 |
| `steering-wheel` | 42-steering.json | Рулевое колесо (в т.ч. с подушкой безопасности) | 11 | 11 | 275 |
| `clutch-kit` | 50-drivetrain.json | Комплект сцепления и выжимной подшипник | 10 | 10 | 450 |
| `clutch-cable` | 50-drivetrain.json | Трос сцепления | 1 | 1 | 12 |
| `shifter-linkage` | 50-drivetrain.json | Кулиса и тяги переключения | 5 | 5 | 60 |
| `driveshaft-cv` | 50-drivetrain.json | Приводные валы, ШРУСы и пыльники | 8 | 8 | 256 |
| `gearbox-oil` | 50-drivetrain.json | Масло в МКПП: замена и уровень | 1 | 1 | 15 |
| `engine-mounts` | 50-drivetrain.json | Опоры (подушки) двигателя и КПП | 3 | 3 | 36 |
| `cat-downpipe` | 60-exhaust.json | Катализатор и приёмная труба | 2 | 2 | 42 |
| `flex-joint` | 60-exhaust.json | Гофра (гибкое соединение) глушителя | 1 | 1 | 12 |
| `mufflers` | 60-exhaust.json | Глушители: основной и передний (резонатор) | 6 | 6 | 66 |
| `exhaust-gaskets-hangers` | 60-exhaust.json | Прокладки, хомуты и резиновые подвесы выпуска | 3 | 3 | 24 |
| `alternator` | 70-electrical-drive.json | Генератор: снятие, установка, проверка | 3 | 3 | 72 |
| `starter-motor` | 70-electrical-drive.json | Стартер | 3 | 3 | 54 |
| `serpentine-belt` | 70-electrical-drive.json | Поликлиновой ремень и натяжитель | 4 | 4 | 68 |
| `crank-pulley-damper` | 70-electrical-drive.json | Демпферный шкив коленвала | 3 | 3 | 42 |
| `wheel-bolts` | 90-wheels.json | Колёсные болты и установка колеса | 2 | 2 | 40 |
| `tires-pressure` | 90-wheels.json | Шины: размеры, давления, ротация | 11 | 11 | 165 |
| `disc-fixing-screw` | 90-wheels.json | Винт фиксации тормозного диска и посадка диска на ступицу | 2 | 2 | 22 |
| `balance-weights` | 90-wheels.json | Балансировочные грузы | 6 | 6 | 60 |

## Селекторы, не нашедшие карточек (0)

_Нет._

## Ошибки и предупреждения библиотеки

_Ошибок нет._

_Предупреждений нет._
