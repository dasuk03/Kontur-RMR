import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowLeft,
  Camera,
  Check,
  ChevronDown,
  ClipboardCheck,
  Cloud,
  Compass,
  Crosshair,
  Download,
  ExternalLink,
  FileText,
  GitBranch,
  Home,
  ImagePlus,
  Info,
  Layers3,
  MapPin,
  Menu,
  Navigation,
  Plus,
  RadioTower,
  Route,
  Search,
  Settings2,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Upload,
  X,
  Zap,
} from 'lucide-react';
import './styles.css';

const initialKtp = {
  id: 'ktp-103',
  name: 'КТП-103',
  address: 'д. Березняки, ул. Центральная',
  status: 'В работе',
  transformer: 'ТМГ-100/10/0,4',
  kva: '100 кВА',
  feederCount: 3,
  meter: 'НАРТИС-И-300 № 40178293',
  tt: 'ТТ-0,4-100/5',
  ratio: '100/5',
  lightingMeter: 'Отсутствует',
  coords: [56.3183, 38.1854],
};

const initialObjects = [
  { id: 'f1', type: 'feeder', name: 'Фидер Ф-1', subtitle: 'Северная линия · 0,4 кВ', status: 'ok', progress: 67, coords: [56.3191, 38.1835] },
  { id: 'f2', type: 'feeder', name: 'Фидер Ф-2', subtitle: 'Центральная линия · 0,4 кВ', status: 'warning', progress: 42, coords: [56.3172, 38.1848] },
  { id: 'f3', type: 'feeder', name: 'Фидер Ф-3', subtitle: 'Южная линия · 0,4 кВ', status: 'muted', progress: 18, coords: [56.3158, 38.1861] },
  { id: 'p1', type: 'pole', name: 'Опора № 12', subtitle: 'Ф-1 · 3-стоечная', status: 'ok', progress: 100, coords: [56.3200, 38.1819], legCount: 3, schemeLegCount: 3, meterType: 'НАРТИС-И-300', meter: '№ 40178301', phase: 'A B C', house: true, lighting: 'От линии', roadSide: 'Справа' },
  { id: 'p2', type: 'pole', name: 'Опора № 13', subtitle: 'Ф-1 · 2-стоечная', status: 'warning', progress: 75, coords: [56.3206, 38.1801], legCount: 2, schemeLegCount: 2, meterType: 'Меркурий 234', meter: '№ 18293411', phase: 'A B C', house: true, lighting: 'От уличного', roadSide: 'Слева' },
  { id: 'p3', type: 'pole', name: 'Опора № 14', subtitle: 'Ф-1 · 2-стоечная', status: 'danger', progress: 50, coords: [56.3214, 38.1784], legCount: 3, schemeLegCount: 2, meterType: 'Не найден', meter: 'Не найден', phase: 'A B', house: false, lighting: 'Нет', roadSide: 'Справа' },
  { id: 'p4', type: 'pole', name: 'Опора № 21', subtitle: 'Ф-2 · 3-стоечная', status: 'ok', progress: 100, coords: [56.3169, 38.1825], legCount: 3, schemeLegCount: 3, meterType: 'НАРТИС-И-300', meter: '№ 40178325', phase: 'A B C', house: true, lighting: 'От линии', roadSide: 'Справа' },
  { id: 'p5', type: 'pole', name: 'Опора № 22', subtitle: 'Ф-2 · 2-стоечная', status: 'warning', progress: 60, coords: [56.3161, 38.1810], legCount: 2, schemeLegCount: 2, meterType: 'СЕ 102', meter: '№ 50382011', phase: 'A', house: false, lighting: 'Нет', roadSide: 'Слева' },
  { id: 'p6', type: 'pole', name: 'Опора № 31', subtitle: 'Ф-3 · 2-стоечная', status: 'muted', progress: 30, coords: [56.3147, 38.1870], legCount: 2, schemeLegCount: 2, meterType: 'Не проверен', meter: 'Не проверен', phase: 'A B C', house: true, lighting: 'От уличного', roadSide: 'Справа' },
];

const checks = [
  { id: 'map', label: 'Реальная опора соответствует схеме', note: 'Номер и количество ног', group: 'Сверка со схемой' },
  { id: 'meter', label: 'Прибор учета зафиксирован', note: 'Тип и заводской номер', group: 'Проверка ПУ' },
  { id: 'phase', label: 'Фазность ввода определена', note: 'A / B / C или однофазный ввод', group: 'Проверка ПУ' },
  { id: 'house', label: 'Дом / участок отмечен верно', note: 'Наличие объекта на участке', group: 'Сверка со схемой' },
  { id: 'shunt', label: 'Шунты и сторонние подключения проверены', note: 'Визуальный контроль', group: 'Безопасность' },
  { id: 'light', label: 'Фонарь отмечен на схеме', note: 'От уличной сети или от линии', group: 'Уличное освещение' },
  { id: 'photo', label: 'Подробные фото прикреплены', note: 'ПУ, схема, ТТ и общий вид', group: 'Фотофиксация' },
];

function tgInit() {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
    tg.setHeaderColor('#07101d');
    tg.setBackgroundColor('#f5f7fa');
  }
}

function YandexMap({ objects, selectedId, onSelect, showScheme }) {
  const mapRef = useRef(null);
  const ymapsRef = useRef(null);
  const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY;
  const route = useMemo(() => objects.filter((o) => o.type === 'pole'), [objects]);

  useEffect(() => {
    tgInit();
    if (!apiKey) return undefined;
    const scriptId = 'yandex-maps-script';
    const init = () => {
      if (!window.ymaps || !mapRef.current || ymapsRef.current) return;
      window.ymaps.ready(() => {
        if (!mapRef.current || ymapsRef.current) return;
        const map = new window.ymaps.Map(mapRef.current, {
          center: initialKtp.coords,
          zoom: 14,
          controls: ['zoomControl', 'geolocationControl'],
        });
        const collection = new window.ymaps.GeoObjectCollection();
        objects.forEach((object) => {
          const mark = new window.ymaps.Placemark(object.coords, {
            balloonContentHeader: object.name,
            balloonContentBody: object.subtitle,
          }, { preset: object.type === 'feeder' ? 'islands#blueCircleDotIcon' : 'islands#orangeCircleDotIcon' });
          mark.events.add('click', () => onSelect(object.id));
          collection.add(mark);
        });
        map.geoObjects.add(collection);
        map.geoObjects.add(new window.ymaps.Polyline(route.map((p) => p.coords), {}, { strokeColor: '#2b7fff', strokeWidth: 4, strokeOpacity: 0.75 }));
        ymapsRef.current = map;
      });
    };
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`;
      script.onload = init;
      document.body.appendChild(script);
    } else init();
    return () => { if (ymapsRef.current) { ymapsRef.current.destroy(); ymapsRef.current = null; } };
  }, [apiKey]);

  return (
    <div className="map-shell">
      {apiKey && <div className="yandex-map" ref={mapRef} />}
      <div className={`demo-map ${apiKey ? 'demo-map-hidden' : ''}`}>
        <div className="map-grid" />
        <div className="map-road road-a" />
        <div className="map-road road-b" />
        <div className="map-road road-c" />
        <div className="map-water" />
        <span className="map-label label-village">БЕРЕЗНЯКИ</span>
        <span className="map-label label-street">ул. Центральная</span>
        <div className="route-line route-1" />
        <div className="route-line route-2" />
        <div className="route-line route-3" />
        <div className="ktp-marker"><Zap size={15} fill="currentColor" /> <span>КТП-103</span></div>
        {objects.filter((o) => o.type === 'pole').map((object, index) => (
          <button
            key={object.id}
            className={`map-marker ${object.status} ${selectedId === object.id ? 'selected' : ''}`}
            style={{ left: `${31 + (index % 3) * 7 + Math.floor(index / 3) * 19}%`, top: `${26 + (index % 3) * 13 + Math.floor(index / 3) * 27}%` }}
            onClick={() => onSelect(object.id)}
            title={object.name}
          >
            <span>{index + 1}</span>
          </button>
        ))}
        {showScheme && <div className="scheme-overlay"><GitBranch size={16} /> Режим схемы · фидер Ф-1</div>}
        {!apiKey && <div className="demo-note"><Info size={14} /> Деморежим · подключите ключ Яндекс Карт для спутниковой карты</div>}
      </div>
      <div className="map-topbar">
        <div className="map-search"><Search size={16} /><span>Поиск по адресу, ПУ или опоре</span><kbd>⌘ K</kbd></div>
        <button className="map-icon-button" title="Моё местоположение"><Crosshair size={17} /></button>
        <button className="map-icon-button" title="Слои"><Layers3 size={17} /></button>
      </div>
      <div className="map-legend">
        <span><i className="legend-dot blue" /> обследовано</span>
        <span><i className="legend-dot yellow" /> требует внимания</span>
        <span><i className="legend-dot red" /> не найдено</span>
      </div>
      <div className="map-scale">100 м</div>
    </div>
  );
}

function StatusPill({ status, children }) {
  return <span className={`status-pill ${status}`}><i />{children}</span>;
}

function PhotoStrip({ photos, onAdd }) {
  return (
    <div className="photo-block">
      <div className="section-title-row"><div><h3>Фотофиксация</h3><p>Подробно снимите каждый элемент</p></div><span className="photo-count">{photos.length}/5</span></div>
      <div className="photo-grid">
        {photos.map((photo, index) => <div className="photo-tile" key={photo.id}><img src={photo.url} alt={photo.label} /><span>{photo.label}</span><b>{index + 1}</b></div>)}
        {photos.length < 5 && <label className="add-photo"><Camera size={21} /><span>Добавить фото</span><input type="file" accept="image/*" capture="environment" multiple onChange={onAdd} /></label>}
      </div>
    </div>
  );
}

function KtpPanel({ onClose }) {
  const [photos, setPhotos] = useState([]);
  const addPhoto = (event) => {
    const files = Array.from(event.target.files || []).slice(0, 5 - photos.length);
    setPhotos((current) => [...current, ...files.map((file, i) => ({ id: `${file.name}-${Date.now()}-${i}`, url: URL.createObjectURL(file), label: 'КТП' }))]);
  };
  return <aside className="detail-panel">
    <div className="detail-header"><button className="back-button" onClick={onClose}><ArrowLeft size={18} /></button><div><span className="eyebrow">Карточка объекта</span><h2>{initialKtp.name}</h2></div><button className="ghost-button"><MoreIcon /></button></div>
    <div className="detail-scroll">
      <div className="object-address"><MapPin size={16} /><span>{initialKtp.address}</span><button><ExternalLink size={14} /></button></div>
      <div className="progress-card"><div className="progress-heading"><div><span>Готовность обследования</span><strong>68%</strong></div><StatusPill status="warning">Есть замечания</StatusPill></div><div className="progress-track"><div style={{ width: '68%' }} /></div><p><Check size={14} /> 19 из 28 объектов проверено</p></div>
      <div className="detail-section"><div className="section-title-row"><div><h3>Паспорт КТП</h3><p>Заполните по факту на месте</p></div><button className="edit-button"><Settings2 size={15} /> Изменить</button></div><div className="passport-grid"><DataCell label="Трансформатор" value={initialKtp.transformer} /><DataCell label="Мощность" value={initialKtp.kva} /><DataCell label="Прибор учета" value={initialKtp.meter} /><DataCell label="Трансформаторы тока" value={`${initialKtp.tt} · ${initialKtp.ratio}`} /><DataCell label="Уличное освещение" value={initialKtp.lightingMeter} danger /><DataCell label="Фидеров" value={`${initialKtp.feederCount} линии`} /></div></div>
      <PhotoStrip photos={photos} onAdd={addPhoto} />
      <div className="detail-section"><div className="section-title-row"><div><h3>Документы и схема</h3><p>Приложите актуальную однолинейную схему</p></div></div><label className="upload-doc"><FileText size={20} /><div><strong>Схема КТП-103.pdf</strong><span>Последняя версия · 1.2 МБ</span></div><Check className="doc-check" size={17} /></label></div>
    </div>
    <div className="panel-footer"><button className="secondary-button"><Download size={16} /> Экспорт</button><button className="primary-button"><Cloud size={16} /> Синхронизировать</button></div>
  </aside>;
}

function MoreIcon() { return <span className="more-icon"><i /><i /><i /></span>; }
function DataCell({ label, value, danger }) { return <div className={`data-cell ${danger ? 'danger-cell' : ''}`}><span>{label}</span><strong>{value}</strong></div>; }

function PolePanel({ object, checksState, setChecksState, onClose, onLocate }) {
  const [photos, setPhotos] = useState([]);
  const [notes, setNotes] = useState('');
  const addPhoto = (event) => {
    const files = Array.from(event.target.files || []).slice(0, 5 - photos.length);
    setPhotos((current) => [...current, ...files.map((file, i) => ({ id: `${file.name}-${Date.now()}-${i}`, url: URL.createObjectURL(file), label: 'Опора' }))]);
  };
  const toggle = (id) => setChecksState((state) => ({ ...state, [id]: !state[id] }));
  const localChecks = checks.filter((check) => ['map', 'meter', 'phase', 'house', 'shunt', 'light', 'photo'].includes(check.id));
  return <aside className="detail-panel">
    <div className="detail-header"><button className="back-button" onClick={onClose}><ArrowLeft size={18} /></button><div><span className="eyebrow">Фидер Ф-1 · контрольный лист</span><h2>{object.name}</h2></div><StatusPill status={object.status}>{object.status === 'ok' ? 'Проверено' : object.status === 'warning' ? 'Внимание' : 'Не найдено'}</StatusPill></div>
    <div className="detail-scroll">
      <div className="object-address"><Route size={16} /><span>{object.subtitle}</span><button onClick={onLocate}><Navigation size={14} /></button></div>
      <div className="warning-banner"><ShieldAlert size={18} /><div><strong>Есть расхождение со схемой</strong><span>На схеме указано 2 ноги, по факту визуально 3</span></div></div>
      <div className="detail-section"><div className="section-title-row"><div><h3>Данные осмотра</h3><p>Зафиксируйте значения на опоре</p></div><button className="edit-button"><Settings2 size={15} /> Изменить</button></div><div className="inspection-form"><label>Тип ПУ<select defaultValue={object.meterType}><option>НАРТИС-И-300</option><option>Меркурий 234</option><option>СЕ 102</option><option>Не найден</option></select></label><label>Номер ПУ<input defaultValue={object.meter} /></label><label>Фазность ввода<div className="segmented"><button className={object.phase === 'A B C' ? 'active' : ''}>A B C</button><button className={object.phase === 'A' ? 'active' : ''}>A</button><button>A B</button></div></label><label>Сторона дороги<select defaultValue={object.roadSide}><option>Слева</option><option>Справа</option><option>Не определена</option></select></label><label>Ноги опоры <small className="form-hint">схема: {object.schemeLegCount}</small><div className="number-input"><button>−</button><strong>{object.legCount} · факт</strong><button>+</button></div></label><label>Дом на участке<div className="segmented"><button className={object.house ? 'active' : ''}>Есть</button><button className={!object.house ? 'active' : ''}>Нет</button></div></label><label>Уличный фонарь<select defaultValue={object.lighting}><option>Нет</option><option>От линии</option><option>От уличного</option></select></label><label>Координаты участка<input defaultValue={`${object.coords[0].toFixed(6)}, ${object.coords[1].toFixed(6)}`} /></label></div></div>
      <div className="detail-section"><div className="section-title-row"><div><h3>Чек-лист осмотра</h3><p>Отметьте выполненные проверки</p></div><span className="check-progress">{localChecks.filter((c) => checksState[c.id]).length}/{localChecks.length}</span></div><div className="check-list">{localChecks.map((check) => <button className={`check-row ${checksState[check.id] ? 'checked' : ''}`} key={check.id} onClick={() => toggle(check.id)}><span className="checkbox">{checksState[check.id] && <Check size={13} />}</span><span><strong>{check.label}</strong><small>{check.note}</small></span></button>)}</div></div>
      <PhotoStrip photos={photos} onAdd={addPhoto} />
      <div className="detail-section"><div className="section-title-row"><div><h3>Примечание</h3><p>Зафиксируйте детали и замечания</p></div></div><textarea placeholder="Например: кабельный ввод со стороны дома, пломба целая..." value={notes} onChange={(event) => setNotes(event.target.value)} /></div>
    </div>
    <div className="panel-footer"><button className="secondary-button"><Camera size={16} /> Фото</button><button className="primary-button"><Check size={16} /> Сохранить опору</button></div>
  </aside>;
}

function App() {
  const [objects, setObjects] = useState(initialObjects);
  const [selectedId, setSelectedId] = useState('p2');
  const [selectedTab, setSelectedTab] = useState('map');
  const [showScheme, setShowScheme] = useState(false);
  const [search, setSearch] = useState('');
  const [checksState, setChecksState] = useState({ map: true, meter: true, phase: false, house: true, shunt: false, light: false, photo: false });
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [gps, setGps] = useState(null);
  const selected = objects.find((object) => object.id === selectedId);
  const filtered = objects.filter((object) => `${object.name} ${object.subtitle}`.toLowerCase().includes(search.toLowerCase()));
  const totalChecked = Object.values(checksState).filter(Boolean).length;

  const selectObject = (id) => { setSelectedId(id); setSelectedTab('objects'); };
  const locate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => setGps([position.coords.latitude, position.coords.longitude]));
  };
  const exportData = () => {
    const payload = { exportedAt: new Date().toISOString(), ktp: initialKtp, objects, checks: checksState, gps };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'ktp-103-obsledovanie.json'; anchor.click(); URL.revokeObjectURL(url);
  };
  return <div className="app-shell">
    <header className="topbar"><div className="brand"><div className="brand-mark"><Zap size={16} fill="currentColor" /></div><span>КОНТУР</span><i /></div><div className="top-context"><span className="context-kicker">Полевое обследование</span><strong>КТП-103 <ChevronDown size={15} /></strong></div><div className="top-actions"><div className="sync-state"><span /><span>Сохранено локально</span></div><button className="icon-top"><Cloud size={17} /></button><div className="avatar">ДВ</div></div><button className="mobile-menu" onClick={() => setShowMobileNav(!showMobileNav)}><Menu size={20} /></button></header>
    <div className="workspace">
      <nav className={`sidebar ${showMobileNav ? 'sidebar-open' : ''}`}>
        <div className="session-card"><div className="session-icon"><ClipboardCheck size={18} /></div><div><strong>Сессия № 24-071</strong><span>Сергиево-Посадский РЭС</span></div><MoreIcon /></div>
        <div className="nav-label">Рабочее пространство</div>
        <button className={`nav-item ${selectedTab === 'map' ? 'active' : ''}`} onClick={() => setSelectedTab('map')}><MapPin size={17} /><span>Карта обследования</span><b>28</b></button>
        <button className={`nav-item ${selectedTab === 'objects' ? 'active' : ''}`} onClick={() => setSelectedTab('objects')}><RadioTower size={17} /><span>Объекты на линии</span><b>6</b></button>
        <button className={`nav-item ${selectedTab === 'checklist' ? 'active' : ''}`} onClick={() => setSelectedTab('checklist')}><ClipboardCheck size={17} /><span>Общий чек-лист</span><b>{totalChecked}/7</b></button>
        <div className="nav-label spaced">Справочники</div>
        <button className="nav-item"><FileText size={17} /><span>Схемы и документы</span></button><button className="nav-item"><Settings2 size={17} /><span>Настройки проекта</span></button>
        <div className="sidebar-bottom"><div className="weather"><Sun size={18} /><div><strong>+18°</strong><span>Березняки · ясно</span></div></div><div className="operator"><div className="avatar small">ДВ</div><div><strong>Даниил В.</strong><span>Инженер РЭС</span></div><ChevronDown size={15} /></div></div>
      </nav>
      <main className="main-area">
        <div className="page-heading"><div><div className="breadcrumbs"><span>Объекты</span><i>/</i><strong>КТП-103</strong></div><h1>Обследование линии</h1><p>Сверка схемы с фактическим состоянием сети</p></div><div className="heading-actions"><button className="outline-button" onClick={exportData}><Download size={16} /> Экспорт отчёта</button><button className="primary-button compact" onClick={locate}><Crosshair size={16} /> GPS {gps ? 'определён' : 'позиция'}</button></div></div>
        <div className="metric-row"><Metric icon={<RadioTower />} label="КТП" value="1" detail="в работе" tone="blue" /><Metric icon={<Route />} label="Фидеры" value="3" detail="вдоль линии" tone="violet" /><Metric icon={<MapPin />} label="Опоры" value="28" detail="6 требуют внимания" tone="orange" /><Metric icon={<ShieldAlert />} label="Расхождения" value="4" detail="нужно проверить" tone="red" /></div>
        <div className="content-grid">
          <section className="map-card"><div className="card-toolbar"><div className="view-tabs"><button className={!showScheme ? 'active' : ''} onClick={() => setShowScheme(false)}><MapPin size={15} /> Карта</button><button className={showScheme ? 'active' : ''} onClick={() => setShowScheme(true)}><GitBranch size={15} /> Схема фидера</button></div><div className="toolbar-right"><button className="toolbar-button"><SlidersHorizontal size={15} /> Фильтры</button><button className="toolbar-button"><Layers3 size={15} /> Слои</button></div></div><YandexMap objects={objects} selectedId={selectedId} onSelect={selectObject} showScheme={showScheme} /><div className="map-footer"><div><span className="live-dot" /> <strong>Полевой режим активен</strong><span> · данные сохраняются на устройстве</span></div><button onClick={locate}><Navigation size={15} /> Центрировать по GPS</button></div></section>
          <section className="objects-card"><div className="objects-head"><div><span className="eyebrow">Маршрут обследования</span><h2>Объекты на линии <span>6</span></h2></div><button className="add-button"><Plus size={16} /> Объект</button></div><div className="search-field"><Search size={16} /><input placeholder="Найти опору или ПУ" value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>/</kbd></div><div className="object-list">{filtered.map((object) => <button key={object.id} className={`object-row ${selectedId === object.id ? 'selected' : ''}`} onClick={() => selectObject(object.id)}><div className={`object-icon ${object.type} ${object.status}`}>{object.type === 'feeder' ? <Route size={16} /> : <RadioTower size={16} />}</div><div className="object-copy"><strong>{object.name}</strong><span>{object.subtitle}</span><div className="mini-progress"><i style={{ width: `${object.progress}%` }} /></div></div><div className="object-end"><StatusPill status={object.status}>{object.progress}%</StatusPill><ChevronDown size={15} /></div></button>)}</div><div className="objects-foot"><span><i className="online-dot" /> Последняя синхронизация 2 мин назад</span><button onClick={exportData}><Upload size={14} /> Выгрузить</button></div></section>
        </div>
      </main>
      {selectedTab === 'objects' && selected && <PolePanel object={selected} checksState={checksState} setChecksState={setChecksState} onClose={() => setSelectedTab('map')} onLocate={locate} />}
      {selectedTab === 'checklist' && <ChecklistPanel checksState={checksState} setChecksState={setChecksState} onClose={() => setSelectedTab('map')} />}
      {selectedTab === 'map' && <KtpPanel onClose={() => setSelectedTab('objects')} />}
    </div>
  </div>;
}

function Metric({ icon, label, value, detail, tone }) { return <div className="metric-card"><div className={`metric-icon ${tone}`}>{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></div>; }

function ChecklistPanel({ checksState, setChecksState, onClose }) {
  const toggle = (id) => setChecksState((state) => ({ ...state, [id]: !state[id] }));
  return <aside className="detail-panel checklist-panel"><div className="detail-header"><button className="back-button" onClick={onClose}><ArrowLeft size={18} /></button><div><span className="eyebrow">КТП-103</span><h2>Общий чек-лист</h2></div><button className="ghost-button"><MoreIcon /></button></div><div className="detail-scroll"><div className="checklist-summary"><div className="summary-circle"><strong>{Object.values(checksState).filter(Boolean).length}</strong><span>из {checks.length}</span></div><div><strong>Проверки объекта</strong><p>Заполненность обязательных полей</p></div></div>{['Сверка со схемой', 'Проверка ПУ', 'Безопасность', 'Уличное освещение', 'Фотофиксация'].map((group) => <div className="check-group" key={group}><h3>{group}</h3>{checks.filter((check) => check.group === group).map((check) => <button className={`check-row ${checksState[check.id] ? 'checked' : ''}`} key={check.id} onClick={() => toggle(check.id)}><span className="checkbox">{checksState[check.id] && <Check size={13} />}</span><span><strong>{check.label}</strong><small>{check.note}</small></span></button>)}</div>)}</div><div className="panel-footer"><button className="secondary-button" onClick={() => setChecksState(Object.fromEntries(checks.map((c) => [c.id, true])))}><Check size={16} /> Отметить всё</button><button className="primary-button" onClick={onClose}>Готово</button></div></aside>;
}

createRoot(document.getElementById('root')).render(<App />);
