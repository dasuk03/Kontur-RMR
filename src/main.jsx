import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowLeft,
  Building2,
  Camera,
  Cable,
  Check,
  ChevronDown,
  ClipboardCheck,
  CircleDot,
  Cloud,
  Compass,
  Crosshair,
  Download,
  ExternalLink,
  FileImage,
  FileText,
  FileUp,
  GitBranch,
  Home,
  ImagePlus,
  Info,
  Layers3,
  Lightbulb,
  MapPin,
  Menu,
  MousePointer2,
  Navigation,
  Plus,
  Printer,
  RadioTower,
  RotateCcw,
  Route,
  Search,
  Save,
  Settings2,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Trash2,
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

const defaultProject = {
  id: 'survey-24-071',
  settlement: 'д. Березняки',
  district: 'Сергиево-Посадский район',
  region: 'Московская область',
  surveyDate: '2026-07-21',
  notes: 'Обследование сети 0,4 кВ вдоль всех фидеров КТП.',
  ktp: initialKtp,
};

function readLocalProject() {
  try {
    const raw = localStorage.getItem('kontur-survey-project');
    return raw ? JSON.parse(raw) : defaultProject;
  } catch {
    return defaultProject;
  }
}

function normalizeProject(value) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    ...defaultProject,
    ...source,
    ktp: { ...defaultProject.ktp, ...(source.ktp || {}) },
  };
}

function normalizeObjects(value) {
  if (!Array.isArray(value)) return initialObjects;
  return value.map((object) => ({
    ...object,
    coords: Array.isArray(object.coords) && object.coords.length === 2
      ? object.coords.map(Number)
      : initialKtp.coords,
  }));
}

function saveBlob(filename, content, mime) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

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

function YandexMap({ objects, selectedId, onSelect, showScheme, showLayers, center, search, onSearch, onLocate, onToggleLayers }) {
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
          center: center || initialKtp.coords,
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
    let waitingForScript = false;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`;
      script.onload = init;
      document.body.appendChild(script);
    } else if (window.ymaps) {
      init();
    } else {
      waitingForScript = true;
      script.addEventListener('load', init, { once: true });
    }
    return () => {
      if (waitingForScript) script.removeEventListener('load', init);
      if (ymapsRef.current) { ymapsRef.current.destroy(); ymapsRef.current = null; }
    };
  }, [apiKey, center, objects]);

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
        <div className="map-search"><Search size={16} /><input aria-label="Поиск по карте" placeholder="Поиск по адресу, ПУ или опоре" value={search} onChange={(event) => onSearch(event.target.value)} /><kbd>⌘ K</kbd></div>
        <button className="map-icon-button" type="button" title="Моё местоположение" onClick={onLocate}><Crosshair size={17} /></button>
        <button className={`map-icon-button ${showLayers ? 'active' : ''}`} type="button" title="Слои карты" onClick={onToggleLayers}><Layers3 size={17} /></button>
      </div>
      {showLayers && <div className="map-layer-popover"><strong>Слои карты</strong><span><i className="legend-dot blue" /> Линии фидеров</span><span><i className="legend-dot orange" /> Опоры и ПУ</span><span><i className="legend-dot gray" /> Географическая подложка</span></div>}
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

function PhotoStrip({ photos, onAdd, inputRef }) {
  return (
    <div className="photo-block">
      <div className="section-title-row"><div><h3>Фотофиксация</h3><p>Подробно снимите каждый элемент</p></div><span className="photo-count">{photos.length}/5</span></div>
      <div className="photo-grid">
        {photos.map((photo, index) => <div className="photo-tile" key={photo.id}><img src={photo.url} alt={photo.label} /><span>{photo.label}</span><b>{index + 1}</b></div>)}
        {photos.length < 5 && <label className="add-photo"><Camera size={21} /><span>Добавить фото</span><input ref={inputRef} type="file" accept="image/*" capture="environment" multiple onChange={onAdd} /></label>}
      </div>
    </div>
  );
}

function KtpPanel({ onClose, ktp, onExport, onEdit, onSync, onOpenAddress }) {
  const [photos, setPhotos] = useState([]);
  const [documentName, setDocumentName] = useState('Схема КТП-103.pdf');
  const photoInputRef = useRef(null);
  const addPhoto = (event) => {
    const files = Array.from(event.target.files || []).slice(0, 5 - photos.length);
    setPhotos((current) => [...current, ...files.map((file, i) => ({ id: `${file.name}-${Date.now()}-${i}`, url: URL.createObjectURL(file), label: 'КТП' }))]);
  };
  return <aside className="detail-panel" aria-label={`Карточка ${ktp.name}`}>
    <div className="detail-header"><button className="back-button" type="button" aria-label="Закрыть карточку" title="Закрыть" onClick={onClose}><ArrowLeft size={18} /></button><div><span className="eyebrow">Карточка объекта</span><h2>{ktp.name}</h2></div><button className="ghost-button" type="button" aria-label="Изменить КТП" title="Изменить данные КТП" onClick={onEdit}><Settings2 size={16} /></button></div>
    <div className="detail-scroll">
      <div className="object-address"><MapPin size={16} /><span>{ktp.address}</span><button type="button" aria-label="Открыть адрес на карте" title="Открыть адрес на карте" onClick={onOpenAddress}><ExternalLink size={14} /></button></div>
      <div className="progress-card"><div className="progress-heading"><div><span>Готовность обследования</span><strong>68%</strong></div><StatusPill status="warning">Есть замечания</StatusPill></div><div className="progress-track"><div style={{ width: '68%' }} /></div><p><Check size={14} /> 19 из 28 объектов проверено</p></div>
      <div className="detail-section"><div className="section-title-row"><div><h3>Паспорт КТП</h3><p>Заполните по факту на месте</p></div><button className="edit-button" type="button" onClick={onEdit}><Settings2 size={15} /> Изменить</button></div><div className="passport-grid"><DataCell label="Трансформатор" value={ktp.transformer} /><DataCell label="Мощность" value={ktp.kva} /><DataCell label="Прибор учета" value={ktp.meter} /><DataCell label="Трансформаторы тока" value={`${ktp.tt} · ${ktp.ratio}`} /><DataCell label="Уличное освещение" value={ktp.lightingMeter} danger /><DataCell label="Фидеров" value={`${ktp.feederCount} линии`} /></div></div>
      <PhotoStrip photos={photos} onAdd={addPhoto} inputRef={photoInputRef} />
      <div className="detail-section"><div className="section-title-row"><div><h3>Документы и схема</h3><p>Приложите актуальную однолинейную схему</p></div></div><label className="upload-doc"><FileText size={20} /><div><strong>{documentName}</strong><span>{documentName === 'Схема КТП-103.pdf' ? 'Последняя версия · 1.2 МБ' : 'Файл выбран для текущей сессии'}</span></div><Check className="doc-check" size={17} /><input type="file" accept="application/pdf,.pdf,image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) setDocumentName(file.name); }} /></label></div>
    </div>
    <div className="panel-footer"><button className="secondary-button" type="button" onClick={onExport}><Download size={16} /> Экспорт</button><button className="primary-button" type="button" onClick={onSync}><Cloud size={16} /> Синхронизировать</button></div>
  </aside>;
}

function MoreIcon() { return <span className="more-icon"><i /><i /><i /></span>; }
function DataCell({ label, value, danger }) { return <div className={`data-cell ${danger ? 'danger-cell' : ''}`}><span>{label}</span><strong>{value}</strong></div>; }

function PolePanel({ object, checksState, setChecksState, onClose, onLocate, onSave }) {
  const [photos, setPhotos] = useState([]);
  const [notes, setNotes] = useState('');
  const [draft, setDraft] = useState(() => ({ ...object, coords: [...(object.coords || initialKtp.coords)] }));
  const photoInputRef = useRef(null);
  useEffect(() => {
    setDraft({ ...object, coords: [...(object.coords || initialKtp.coords)] });
    setNotes(object.notes || '');
  }, [object]);
  const addPhoto = (event) => {
    const files = Array.from(event.target.files || []).slice(0, 5 - photos.length);
    setPhotos((current) => [...current, ...files.map((file, i) => ({ id: `${file.name}-${Date.now()}-${i}`, url: URL.createObjectURL(file), label: 'Опора' }))]);
  };
  const toggle = (id) => setChecksState((state) => ({ ...state, [id]: !state[id] }));
  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const updateCoords = (value) => {
    const coords = value.split(',').map((item) => Number(item.trim()));
    if (coords.length === 2 && coords.every(Number.isFinite)) update('coords', coords);
  };
  const localChecks = checks.filter((check) => ['map', 'meter', 'phase', 'house', 'shunt', 'light', 'photo'].includes(check.id));
  return <aside className="detail-panel" aria-label={`Карточка ${object.name}`}>
    <div className="detail-header"><button className="back-button" type="button" aria-label="Закрыть карточку" title="Закрыть" onClick={onClose}><ArrowLeft size={18} /></button><div><span className="eyebrow">{object.subtitle || 'Контрольный лист'}</span><h2>{object.name}</h2></div><StatusPill status={object.status}>{object.status === 'ok' ? 'Проверено' : object.status === 'warning' ? 'Внимание' : 'Не найдено'}</StatusPill></div>
    <div className="detail-scroll">
      <div className="object-address"><Route size={16} /><span>{object.subtitle}</span><button type="button" aria-label="Получить моё местоположение" title="Получить GPS" onClick={onLocate}><Navigation size={14} /></button></div>
      {draft.legCount !== draft.schemeLegCount && <div className="warning-banner"><ShieldAlert size={18} /><div><strong>Есть расхождение со схемой</strong><span>На схеме указано {draft.schemeLegCount} ноги, по факту визуально {draft.legCount}</span></div></div>}
      <div className="detail-section"><div className="section-title-row"><div><h3>Данные осмотра</h3><p>Зафиксируйте значения на опоре</p></div></div><div className="inspection-form"><label>Тип ПУ<select value={draft.meterType || ''} onChange={(event) => update('meterType', event.target.value)}><option value="">Не указан</option><option>НАРТИС-И-300</option><option>Меркурий 234</option><option>СЕ 102</option><option>Не найден</option></select></label><label>Номер ПУ<input value={draft.meter || ''} onChange={(event) => update('meter', event.target.value)} /></label><label>Фазность ввода<div className="segmented"><button type="button" className={draft.phase === 'A B C' ? 'active' : ''} onClick={() => update('phase', 'A B C')}>A B C</button><button type="button" className={draft.phase === 'A' ? 'active' : ''} onClick={() => update('phase', 'A')}>A</button><button type="button" className={draft.phase === 'A B' ? 'active' : ''} onClick={() => update('phase', 'A B')}>A B</button></div></label><label>Сторона дороги<select value={draft.roadSide || ''} onChange={(event) => update('roadSide', event.target.value)}><option>Слева</option><option>Справа</option><option>Не определена</option></select></label><label>Ноги опоры <small className="form-hint">схема: {draft.schemeLegCount}</small><div className="number-input"><button type="button" aria-label="Уменьшить количество ног" onClick={() => update('legCount', Math.max(0, Number(draft.legCount || 0) - 1))}>−</button><strong>{draft.legCount} · факт</strong><button type="button" aria-label="Увеличить количество ног" onClick={() => update('legCount', Number(draft.legCount || 0) + 1)}>+</button></div></label><label>Дом на участке<div className="segmented"><button type="button" className={draft.house ? 'active' : ''} onClick={() => update('house', true)}>Есть</button><button type="button" className={!draft.house ? 'active' : ''} onClick={() => update('house', false)}>Нет</button></div></label><label>Уличный фонарь<select value={draft.lighting || ''} onChange={(event) => update('lighting', event.target.value)}><option>Нет</option><option>От линии</option><option>От уличного</option></select></label><label>Координаты участка<input value={(draft.coords || initialKtp.coords).map((coordinate) => Number(coordinate).toFixed(6)).join(', ')} onChange={(event) => updateCoords(event.target.value)} /></label></div></div>
      <div className="detail-section"><div className="section-title-row"><div><h3>Чек-лист осмотра</h3><p>Отметьте выполненные проверки</p></div><span className="check-progress">{localChecks.filter((c) => checksState[c.id]).length}/{localChecks.length}</span></div><div className="check-list">{localChecks.map((check) => <button className={`check-row ${checksState[check.id] ? 'checked' : ''}`} key={check.id} onClick={() => toggle(check.id)}><span className="checkbox">{checksState[check.id] && <Check size={13} />}</span><span><strong>{check.label}</strong><small>{check.note}</small></span></button>)}</div></div>
      <PhotoStrip photos={photos} onAdd={addPhoto} inputRef={photoInputRef} />
      <div className="detail-section"><div className="section-title-row"><div><h3>Примечание</h3><p>Зафиксируйте детали и замечания</p></div></div><textarea placeholder="Например: кабельный ввод со стороны дома, пломба целая..." value={notes} onChange={(event) => setNotes(event.target.value)} /></div>
    </div>
    <div className="panel-footer"><button className="secondary-button" type="button" onClick={() => photoInputRef.current?.click()}><Camera size={16} /> Фото</button><button className="primary-button" type="button" onClick={() => onSave({ ...draft, notes })}><Check size={16} /> Сохранить опору</button></div>
  </aside>;
}

function FeederPanel({ feeder, poles, onClose, onSelect }) {
  const feederCode = getFeederCode(feeder.name);
  const feederPoles = poles.filter((pole) => getFeederCode(pole.subtitle) === feederCode);
  return <aside className="detail-panel" aria-label={`Карточка ${feeder.name}`}>
    <div className="detail-header"><button className="back-button" type="button" aria-label="Закрыть карточку" title="Закрыть" onClick={onClose}><ArrowLeft size={18} /></button><div><span className="eyebrow">Карточка фидера</span><h2>{feeder.name}</h2></div><StatusPill status={feeder.status}>{feeder.progress}% обследовано</StatusPill></div>
    <div className="detail-scroll"><div className="object-address"><Route size={16} /><span>{feeder.subtitle}</span></div><div className="progress-card"><div className="progress-heading"><div><span>Готовность линии</span><strong>{feeder.progress}%</strong></div><StatusPill status={feeder.status}>Полевое обследование</StatusPill></div><div className="progress-track"><div style={{ width: `${feeder.progress}%` }} /></div><p><Check size={14} /> {feederPoles.length} опор привязано к фидеру</p></div><div className="detail-section"><div className="section-title-row"><div><h3>Опоры на линии</h3><p>Откройте карточку для подробной проверки</p></div></div><div className="check-list">{feederPoles.length ? feederPoles.map((pole) => <button className="check-row" type="button" key={pole.id} onClick={() => onSelect(pole.id)}><span className={`object-icon pole ${pole.status}`}><RadioTower size={15} /></span><span><strong>{pole.name}</strong><small>{pole.meterType} · {pole.meter}</small></span><ChevronDown size={14} /></button>) : <div className="empty-tree">На фидере пока нет опор.</div>}</div></div></div>
    <div className="panel-footer"><button className="primary-button" type="button" onClick={onClose}>Закрыть</button></div>
  </aside>;
}

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return <label className="builder-field"><span>{label}</span><input type={type} value={value ?? ''} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
}

function ProjectBuilderPanel({ project, objects, onSave, onClose }) {
  const [draft, setDraft] = useState(() => ({ ...project, ktp: { ...project.ktp } }));
  const [draftObjects, setDraftObjects] = useState(() => objects.map((object) => ({ ...object })));
  const feeders = draftObjects.filter((object) => object.type === 'feeder');
  const poles = draftObjects.filter((object) => object.type === 'pole');
  const updateProject = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const updateKtp = (key, value) => setDraft((current) => ({ ...current, ktp: { ...current.ktp, [key]: value } }));
  const updateObject = (id, key, value) => setDraftObjects((current) => current.map((object) => object.id === id ? { ...object, [key]: value } : object));
  const addFeeder = () => setDraftObjects((current) => [...current, { id: `f-${Date.now()}`, type: 'feeder', name: `Фидер Ф-${current.filter((item) => item.type === 'feeder').length + 1}`, subtitle: 'Новая линия · 0,4 кВ', status: 'muted', progress: 0, coords: draft.ktp.coords }]);
  const addPole = () => setDraftObjects((current) => [...current, { id: `p-${Date.now()}`, type: 'pole', name: `Опора № ${current.filter((item) => item.type === 'pole').length + 1}`, subtitle: `${feeders[0]?.name || 'Фидер Ф-1'} · новая опора`, status: 'muted', progress: 0, coords: draft.ktp.coords, legCount: 2, schemeLegCount: 2, meterType: 'Не проверен', meter: 'Не проверен', phase: 'A B C', house: false, lighting: 'Нет', roadSide: 'Не определена' }]);
  const removeObject = (id) => setDraftObjects((current) => current.filter((object) => object.id !== id));
  const save = () => onSave({ ...draft, ktp: { ...draft.ktp, feederCount: feeders.length } }, draftObjects);
  return <aside className="detail-panel builder-panel">
    <div className="detail-header"><button className="back-button" onClick={onClose}><ArrowLeft size={18} /></button><div><span className="eyebrow">Единоличный режим</span><h2>Настройка обследования</h2></div><Save size={18} className="builder-save-icon" /></div>
    <div className="detail-scroll builder-scroll">
      <div className="builder-intro"><Building2 size={20} /><div><strong>Полная схема населённого пункта</strong><span>Заполните исходные данные, а «Контур» построит структуру КТП → фидеры → опоры → ПУ.</span></div></div>
      <div className="detail-section"><div className="section-title-row"><div><h3>1. Населённый пункт</h3><p>Общие данные обследования</p></div></div><div className="builder-grid"><Field label="Населённый пункт" value={draft.settlement} onChange={(value) => updateProject('settlement', value)} /><Field label="Район" value={draft.district} onChange={(value) => updateProject('district', value)} /><Field label="Субъект РФ" value={draft.region} onChange={(value) => updateProject('region', value)} /><Field label="Дата обследования" type="date" value={draft.surveyDate} onChange={(value) => updateProject('surveyDate', value)} /></div><label className="builder-field full"><span>Примечание по маршруту</span><textarea value={draft.notes || ''} onChange={(event) => updateProject('notes', event.target.value)} /></label></div>
      <div className="detail-section"><div className="section-title-row"><div><h3>2. КТП</h3><p>Паспортная информация</p></div></div><div className="builder-grid"><Field label="Наименование / номер" value={draft.ktp.name} onChange={(value) => updateKtp('name', value)} /><Field label="Адрес / ориентир" value={draft.ktp.address} onChange={(value) => updateKtp('address', value)} /><Field label="Трансформатор" value={draft.ktp.transformer} onChange={(value) => updateKtp('transformer', value)} /><Field label="Мощность, кВА" value={draft.ktp.kva} onChange={(value) => updateKtp('kva', value)} /><Field label="Номер ПУ КТП" value={draft.ktp.meter} onChange={(value) => updateKtp('meter', value)} /><Field label="ТТ и коэффициент" value={`${draft.ktp.tt || ''} · ${draft.ktp.ratio || ''}`} onChange={(value) => { const [tt, ratio] = value.split('·').map((item) => item.trim()); updateKtp('tt', tt); updateKtp('ratio', ratio); }} /><Field label="ПУ уличного освещения" value={draft.ktp.lightingMeter} onChange={(value) => updateKtp('lightingMeter', value)} /></div></div>
      <div className="detail-section"><div className="section-title-row"><div><h3>3. Фидеры</h3><p>Все отходящие линии КТП</p></div><button className="edit-button" onClick={addFeeder}><Plus size={14} /> Добавить</button></div><div className="builder-list">{feeders.map((feeder, index) => <div className="builder-row" key={feeder.id}><div className="builder-row-title"><strong>{index + 1}. {feeder.name}</strong><button className="remove-button" onClick={() => removeObject(feeder.id)}><X size={13} /></button></div><div className="builder-grid"><Field label="Название фидера" value={feeder.name} onChange={(value) => updateObject(feeder.id, 'name', value)} /><Field label="Описание / направление" value={feeder.subtitle} onChange={(value) => updateObject(feeder.id, 'subtitle', value)} /></div></div>)}</div></div>
      <div className="detail-section"><div className="section-title-row"><div><h3>4. Опоры, участки и ПУ</h3><p>Одна строка — один фактический объект на линии</p></div><button className="edit-button" onClick={addPole}><Plus size={14} /> Добавить</button></div><div className="builder-list">{poles.map((pole, index) => <div className="builder-row" key={pole.id}><div className="builder-row-title"><strong>{index + 1}. {pole.name}</strong><button className="remove-button" onClick={() => removeObject(pole.id)}><X size={13} /></button></div><div className="builder-grid"><Field label="Номер опоры" value={pole.name} onChange={(value) => updateObject(pole.id, 'name', value)} /><Field label="Фидер" value={pole.subtitle} onChange={(value) => updateObject(pole.id, 'subtitle', value)} /><Field label="Тип ПУ" value={pole.meterType} onChange={(value) => updateObject(pole.id, 'meterType', value)} /><Field label="Номер ПУ" value={pole.meter} onChange={(value) => updateObject(pole.id, 'meter', value)} /><Field label="Ноги: факт / схема" value={`${pole.legCount} / ${pole.schemeLegCount}`} onChange={(value) => { const [fact, scheme] = value.split('/').map((item) => Number(item.trim())); updateObject(pole.id, 'legCount', fact || 0); updateObject(pole.id, 'schemeLegCount', scheme || 0); }} /><Field label="Фазность" value={pole.phase} onChange={(value) => updateObject(pole.id, 'phase', value)} /><Field label="Сторона дороги" value={pole.roadSide} onChange={(value) => updateObject(pole.id, 'roadSide', value)} /><Field label="Фонарь" value={pole.lighting} onChange={(value) => updateObject(pole.id, 'lighting', value)} /><Field label="Координаты" value={pole.coords?.join(', ')} onChange={(value) => updateObject(pole.id, 'coords', value.split(',').map((item) => Number(item.trim())))} /><label className="builder-field"><span>Дом / ввод на участке</span><select value={pole.house ? 'Есть' : 'Нет'} onChange={(event) => updateObject(pole.id, 'house', event.target.value === 'Есть')}><option>Есть</option><option>Нет</option></select></label></div></div>)}</div></div>
    </div>
    <div className="panel-footer"><button className="secondary-button" onClick={onClose}>Отмена</button><button className="primary-button" onClick={save}><Save size={16} /> Сохранить локально</button></div>
  </aside>;
}

function SettlementSchemePanel({ project, objects, onClose, onSelect }) {
  const feeders = objects.filter((object) => object.type === 'feeder');
  const poles = objects.filter((object) => object.type === 'pole');
  return <aside className="detail-panel scheme-panel"><div className="detail-header"><button className="back-button" onClick={onClose}><ArrowLeft size={18} /></button><div><span className="eyebrow">Структурированная схема</span><h2>{project.settlement}</h2></div><GitBranch size={18} className="builder-save-icon" /></div><div className="detail-scroll"><div className="scheme-summary"><div><strong>{project.ktp.name}</strong><span>{project.ktp.transformer} · {project.ktp.kva}</span></div><div className="scheme-stats"><span><b>{feeders.length}</b> фидера</span><span><b>{poles.length}</b> опор</span></div></div><div className="scheme-tree"><div className="tree-root"><Zap size={15} /> {project.ktp.name}<small>{project.ktp.address}</small></div>{feeders.map((feeder) => { const feederKey = feeder.name.replace(/^Фидер\s*/i, '').trim(); const feederPoles = poles.filter((pole) => pole.subtitle?.startsWith(feederKey)); return <div className="tree-feeder" key={feeder.id}><div className="tree-feeder-title"><Route size={15} /><strong>{feeder.name}</strong><span>{feeder.subtitle}</span></div><div className="tree-poles">{feederPoles.map((pole) => <button key={pole.id} className="tree-pole" onClick={() => onSelect(pole.id)}><RadioTower size={14} /><span><strong>{pole.name}</strong><small>{pole.meterType} · {pole.meter}</small></span><StatusPill status={pole.status}>{pole.house ? 'Дом' : 'Пусто'}</StatusPill></button>)}{feederPoles.length === 0 && <div className="empty-tree">Опоры ещё не привязаны к этому фидеру</div>}</div></div>; })}</div><div className="detail-section scheme-checks"><h3>Автоматические расхождения</h3><p>Система подсвечивает места, где фактические данные не совпадают с исходной схемой.</p>{poles.filter((pole) => pole.legCount !== pole.schemeLegCount || pole.meter === 'Не найден' || pole.meterType === 'Не найден').map((pole) => <button key={pole.id} onClick={() => onSelect(pole.id)}><AlertTriangle size={14} /><span>{pole.name}: требуется проверка</span></button>)}{poles.every((pole) => pole.legCount === pole.schemeLegCount && pole.meter !== 'Не найден' && pole.meterType !== 'Не найден') && <div className="empty-tree">Расхождений по введённым данным нет.</div>}</div></div><div className="panel-footer"><button className="primary-button" onClick={onClose}>Вернуться к карте</button></div></aside>;
}

const diagramTypeLabels = {
  ktp: 'КТП',
  pole: 'Опора',
  meter: 'ПУ',
  house: 'Дом / участок',
  lamp: 'Фонарь',
  branch: 'Ответвление',
  switch: 'Аппарат',
  note: 'Замечание',
};

function getFeederCode(value = '') {
  const match = value.match(/Ф-?\s*\d+/i);
  return match ? match[0].replace(/\s+/g, '').toUpperCase() : 'Ф-1';
}

function getSchemeNode(id, type, x, y, title, subtitle = '', extra = {}) {
  return { id, type, x, y, title, subtitle, color: extra.color || '#101827', ...extra };
}

function buildDiagram(project, objects) {
  const feeders = objects.filter((object) => object.type === 'feeder');
  const poles = objects.filter((object) => object.type === 'pole');
  const nodes = [
    getSchemeNode('diagram-ktp', 'ktp', 600, 665, project.ktp.name, `${project.ktp.transformer} · ${project.ktp.kva}`, { color: '#1262c9' }),
    getSchemeNode('diagram-transformer', 'switch', 600, 590, 'Ввод 10 кВ', project.ktp.transformer, { color: '#101827' }),
  ];
  const edges = [{ id: 'edge-ktp-transformer', from: 'diagram-ktp', to: 'diagram-transformer', label: 'ВЛ-10 кВ', color: '#2563eb', dashed: true }];
  const laneX = [210, 600, 990];

  feeders.forEach((feeder, feederIndex) => {
    const code = getFeederCode(feeder.name);
    const feederPoles = poles.filter((pole) => getFeederCode(pole.subtitle) === code);
    const baseX = laneX[feederIndex % laneX.length];
    const baseY = 485 - Math.floor(feederIndex / laneX.length) * 92;
    let previous = 'diagram-transformer';
    feederPoles.forEach((pole, poleIndex) => {
      const x = Math.max(100, Math.min(1100, baseX + (poleIndex % 2 === 0 ? 0 : (feederIndex % 2 ? -80 : 80))));
      const y = Math.max(135, baseY - poleIndex * 66);
      const poleId = `diagram-${pole.id}`;
      nodes.push(getSchemeNode(poleId, 'pole', x, y, pole.name.replace(/^Опора\s*/i, ''), `${code} · ${pole.legCount || 2} ноги`, { color: pole.status === 'danger' ? '#dc2626' : pole.status === 'warning' ? '#d88914' : '#111827', objectId: pole.id }));
      edges.push({ id: `edge-${previous}-${poleId}`, from: previous, to: poleId, label: poleIndex === 0 ? `${code} · СИП 4×70` : '', color: feederIndex === 0 ? '#2563eb' : feederIndex === 1 ? '#d18a18' : '#19a974', dashed: feederIndex !== 1 });
      previous = poleId;
      const houseId = `diagram-house-${pole.id}`;
      const meterId = `diagram-meter-${pole.id}`;
      nodes.push(getSchemeNode(houseId, 'house', x + (poleIndex % 2 === 0 ? 68 : -68), y - 13, pole.house ? `Участок ${pole.name.replace(/\D/g, '')}` : 'Пустой участок', pole.roadSide || '', { color: pole.house ? '#111827' : '#9aa5b3', objectId: pole.id, muted: !pole.house }));
      nodes.push(getSchemeNode(meterId, 'meter', x + (poleIndex % 2 === 0 ? 68 : -68), y + 29, pole.meterType || 'ПУ', pole.meter || 'Не найден', { color: pole.meter === 'Не найден' ? '#dc2626' : '#111827', objectId: pole.id }));
      edges.push({ id: `edge-${poleId}-${houseId}`, from: poleId, to: houseId, label: pole.phase || '', color: '#111827' });
      edges.push({ id: `edge-${poleId}-${meterId}`, from: poleId, to: meterId, label: '', color: '#111827', dashed: true });
      if (pole.lighting && pole.lighting !== 'Нет') {
        const lampId = `diagram-lamp-${pole.id}`;
        nodes.push(getSchemeNode(lampId, 'lamp', x + (poleIndex % 2 === 0 ? 38 : -38), y - 46, 'Ф', pole.lighting, { color: '#ee9b19', objectId: pole.id }));
        edges.push({ id: `edge-${poleId}-${lampId}`, from: poleId, to: lampId, label: 'осв.', color: '#ee9b19', dashed: true });
      }
    });
    if (!feederPoles.length) {
      const endId = `diagram-empty-${feeder.id}`;
      nodes.push(getSchemeNode(endId, 'branch', baseX, baseY, code, 'фидер без опор', { color: '#9aa5b3' }));
      edges.push({ id: `edge-transformer-${endId}`, from: 'diagram-transformer', to: endId, label: code, color: '#9aa5b3', dashed: true });
    }
  });
  nodes.push(getSchemeNode('diagram-note', 'note', 94, 690, 'Автоматически построено из данных обследования', 'Перетащите элементы для точной компоновки', { color: '#2563eb' }));
  return { version: 1, title: `Схема балансовой группы ${project.ktp.name}`, settlement: project.settlement, date: project.surveyDate, page: 'A3 landscape', nodes, edges };
}

function downloadText(filename, content, mime = 'text/plain;charset=utf-8') {
  saveBlob(filename, content, mime);
}

function DiagramNode({ node, selected, onSelect, onPointerDown }) {
  const label = node.title || diagramTypeLabels[node.type];
  const subtitle = node.subtitle || '';
  const nodeColor = node.color || '#101827';
  const common = { onClick: (event) => { event.stopPropagation(); onSelect(node.id); }, onPointerDown: (event) => onPointerDown(event, node.id), className: `diagram-node ${selected ? 'selected' : ''}` };
  if (node.type === 'ktp') return <g {...common}><circle cx={node.x} cy={node.y} r="30" fill="#eaf3ff" stroke={nodeColor} strokeWidth="3" /><circle cx={node.x - 9} cy={node.y} r="9" fill="none" stroke={nodeColor} strokeWidth="2" /><circle cx={node.x + 9} cy={node.y} r="9" fill="none" stroke={nodeColor} strokeWidth="2" /><text x={node.x} y={node.y + 52} textAnchor="middle" className="diagram-title">{label}</text><text x={node.x} y={node.y + 67} textAnchor="middle" className="diagram-subtitle">{subtitle}</text></g>;
  if (node.type === 'pole') return <g {...common}><rect x={node.x - 9} y={node.y - 9} width="18" height="18" fill="#fff" stroke={nodeColor} strokeWidth="2" /><text x={node.x} y={node.y - 16} textAnchor="middle" className="diagram-title">{label}</text><text x={node.x} y={node.y + 25} textAnchor="middle" className="diagram-subtitle">{subtitle}</text></g>;
  if (node.type === 'house') return <g {...common} opacity={node.muted ? 0.58 : 1}><path d={`M ${node.x - 22} ${node.y - 2} L ${node.x} ${node.y - 19} L ${node.x + 22} ${node.y - 2}`} fill="none" stroke={nodeColor} strokeWidth="2" /><rect x={node.x - 15} y={node.y - 2} width="30" height="22" fill="#fff" stroke={nodeColor} strokeWidth="2" /><text x={node.x} y={node.y + 34} textAnchor="middle" className="diagram-title">{label}</text><text x={node.x} y={node.y + 48} textAnchor="middle" className="diagram-subtitle">{subtitle}</text></g>;
  if (node.type === 'meter') return <g {...common}><rect x={node.x - 34} y={node.y - 13} width="68" height="26" fill="#fff" stroke={nodeColor} strokeWidth="1.6" /><text x={node.x} y={node.y - 1} textAnchor="middle" className="diagram-title small">{label}</text><text x={node.x} y={node.y + 10} textAnchor="middle" className="diagram-subtitle tiny">{subtitle}</text></g>;
  if (node.type === 'lamp') return <g {...common}><line x1={node.x} y1={node.y + 18} x2={node.x} y2={node.y - 8} stroke={nodeColor} strokeWidth="2" /><circle cx={node.x} cy={node.y - 12} r="7" fill="#fff5d8" stroke={nodeColor} strokeWidth="2" /><text x={node.x} y={node.y + 31} textAnchor="middle" className="diagram-subtitle">{label} · {subtitle}</text></g>;
  if (node.type === 'note') return <g {...common}><rect x={node.x - 110} y={node.y - 20} width="220" height="42" rx="4" fill="#eef6ff" stroke={nodeColor} strokeDasharray="4 3" /><text x={node.x} y={node.y - 2} textAnchor="middle" className="diagram-title small">{label}</text><text x={node.x} y={node.y + 12} textAnchor="middle" className="diagram-subtitle tiny">{subtitle}</text></g>;
  return <g {...common}><circle cx={node.x} cy={node.y} r="12" fill="#fff" stroke={nodeColor} strokeWidth="2" /><text x={node.x} y={node.y + 29} textAnchor="middle" className="diagram-title">{label}</text><text x={node.x} y={node.y + 42} textAnchor="middle" className="diagram-subtitle">{subtitle}</text></g>;
}

function DiagramEditorPanel({ project, objects, diagram, onSave, onClose }) {
  const [draft, setDraft] = useState(() => diagram || buildDiagram(project, objects));
  const [selectedId, setSelectedId] = useState('diagram-ktp');
  const [drag, setDrag] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [linkMode, setLinkMode] = useState(false);
  const [linkFrom, setLinkFrom] = useState(null);
  const svgRef = useRef(null);
  const nodesById = useMemo(() => Object.fromEntries(draft.nodes.map((node) => [node.id, node])), [draft.nodes]);
  const selectedNode = nodesById[selectedId];
  const pointFromEvent = (event) => {
    const rect = svgRef.current.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * 1200, y: ((event.clientY - rect.top) / rect.height) * 760 };
  };
  const updateNode = (id, patch) => setDraft((current) => ({ ...current, nodes: current.nodes.map((node) => node.id === id ? { ...node, ...patch } : node) }));
  const startDrag = (event, id) => {
    if (linkMode) return;
    const node = nodesById[id];
    const point = pointFromEvent(event);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDrag({ id, dx: node.x - point.x, dy: node.y - point.y });
  };
  const moveDrag = (event) => {
    if (!drag) return;
    const point = pointFromEvent(event);
    updateNode(drag.id, { x: Math.max(35, Math.min(1165, point.x + drag.dx)), y: Math.max(35, Math.min(725, point.y + drag.dy)) });
  };
  const endDrag = () => setDrag(null);
  const selectNode = (id) => {
    if (linkMode) {
      if (!linkFrom) { setLinkFrom(id); setSelectedId(id); return; }
      if (linkFrom !== id) setDraft((current) => ({ ...current, edges: [...current.edges, { id: `edge-manual-${Date.now()}`, from: linkFrom, to: id, label: 'ответвление', color: '#111827', dashed: true }] }));
      setLinkFrom(null);
      setLinkMode(false);
      setSelectedId(id);
      return;
    }
    setSelectedId(id);
  };
  const addNode = (type) => {
    const offset = draft.nodes.length % 5;
    const id = `diagram-manual-${type}-${Date.now()}`;
    const defaults = { pole: ['новая', '2 ноги'], house: ['Новый участок', 'сторона дороги'], meter: ['ПУ', '№ не указан'], lamp: ['Ф', 'уличное освещение'], branch: ['Ответвление', 'СИП'], switch: ['РС-481', 'аппарат'], note: ['Замечание', 'добавьте текст'] };
    const [title, subtitle] = defaults[type] || ['Элемент', ''];
    const node = getSchemeNode(id, type, 260 + offset * 110, 170 + offset * 46, title, subtitle, { color: type === 'lamp' ? '#ee9b19' : '#111827' });
    setDraft((current) => ({ ...current, nodes: [...current.nodes, node] }));
    setSelectedId(id);
  };
  const removeSelected = () => {
    if (!selectedNode || selectedNode.type === 'ktp') return;
    setDraft((current) => ({ ...current, nodes: current.nodes.filter((node) => node.id !== selectedId), edges: current.edges.filter((edge) => edge.from !== selectedId && edge.to !== selectedId) }));
    setSelectedId('diagram-ktp');
  };
  const exportSvg = () => {
    if (!svgRef.current) return;
    const clone = svgRef.current.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', '420mm');
    clone.setAttribute('height', '297mm');
    clone.querySelectorAll('.diagram-selection').forEach((element) => element.remove());
    downloadText(`${project.ktp.name}-schema.svg`, new XMLSerializer().serializeToString(clone), 'image/svg+xml;charset=utf-8');
  };
  const reset = () => setDraft(buildDiagram(project, objects));
  const save = () => onSave(draft);

  return <aside className="detail-panel diagram-panel">
    <div className="detail-header diagram-header"><button className="back-button" onClick={onClose}><ArrowLeft size={18} /></button><div><span className="eyebrow">Редактор топологии · формат A3</span><h2>Схема балансовой группы</h2></div><div className="diagram-header-actions"><button className="ghost-button" title="Сбросить автокомпоновку" onClick={reset}><RotateCcw size={16} /></button><button className="ghost-button" title="Печать A3" onClick={() => window.print()}><Printer size={17} /></button></div></div>
    <div className="diagram-toolbar"><div className="diagram-tool-group"><button className={!linkMode ? 'active' : ''} onClick={() => { setLinkMode(false); setLinkFrom(null); }}><MousePointer2 size={14} /> Выбор</button><button className={linkMode ? 'active' : ''} onClick={() => setLinkMode(true)}><Cable size={14} /> Соединить</button></div><div className="diagram-tool-group"><button onClick={() => addNode('pole')}><Plus size={13} /> Опора</button><button onClick={() => addNode('house')}><Home size={14} /> Дом</button><button onClick={() => addNode('meter')}><CircleDot size={14} /> ПУ</button><button onClick={() => addNode('lamp')}><Lightbulb size={14} /> Фонарь</button><button onClick={() => addNode('note')}><FileText size={14} /> Заметка</button></div><div className="diagram-tool-group diagram-zoom"><button onClick={() => setZoom((value) => Math.max(.65, value - .1))}>−</button><span>{Math.round(zoom * 100)}%</span><button onClick={() => setZoom((value) => Math.min(1.5, value + .1))}>+</button></div></div>
    <div className="diagram-subtoolbar"><div><strong>{draft.title}</strong><span>{draft.settlement} · {draft.date}</span></div><div className="diagram-actions"><button className="secondary-button" onClick={reset}><Sparkles size={14} /> Авторазмещение</button><button className="secondary-button" onClick={exportSvg}><FileImage size={14} /> Скачать SVG</button><button className="primary-button" onClick={save}><Save size={14} /> Сохранить</button></div></div>
    <div className="diagram-body"><div className="diagram-canvas-wrap"><div className={`diagram-mode-hint ${linkMode ? 'linking' : ''}`}>{linkMode ? (linkFrom ? 'Выберите второй элемент для соединения' : 'Выберите первый элемент') : 'Перетаскивайте элементы мышью · кликните для редактирования'}</div><svg ref={svgRef} className="diagram-canvas" viewBox="0 0 1200 760" style={{ transform: `scale(${zoom})` }} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerLeave={endDrag} onClick={() => { if (!linkMode) setSelectedId(null); }}>
      <defs><pattern id="diagram-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M 24 0 L 0 0 0 24" fill="none" stroke="#e6edf5" strokeWidth="1" /></pattern><filter id="diagram-shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#516579" floodOpacity=".14" /></filter></defs>
      <rect width="1200" height="760" fill="#fff" /><rect x="18" y="18" width="1164" height="724" fill="url(#diagram-grid)" stroke="#b8c5d3" strokeWidth="2" /><text x="55" y="64" className="diagram-page-title">{draft.title}</text><text x="55" y="92" className="diagram-page-settlement">{draft.settlement}</text><text x="1140" y="64" textAnchor="end" className="diagram-page-date">{draft.date}</text>
      <text x="600" y="726" textAnchor="middle" className="diagram-page-footer">Контур · схема построена из данных обследования · {draft.page}</text>
      {draft.edges.map((edge) => { const from = nodesById[edge.from]; const to = nodesById[edge.to]; if (!from || !to) return null; return <g key={edge.id}><line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#fff" strokeWidth="6" /><line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={edge.color || '#111827'} strokeWidth={edge.width || 2} strokeDasharray={edge.dashed ? '7 5' : undefined} /><text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 6} className="diagram-edge-label">{edge.label}</text></g>; })}
      {draft.nodes.map((node) => <DiagramNode key={node.id} node={node} selected={selectedId === node.id} onSelect={selectNode} onPointerDown={startDrag} />)}
      {selectedId && nodesById[selectedId] && <rect className="diagram-selection" x={nodesById[selectedId].x - 42} y={nodesById[selectedId].y - 38} width="84" height="76" rx="5" fill="none" stroke="#2b7fff" strokeDasharray="4 3" strokeWidth="1.5" />}
    </svg></div><div className="diagram-inspector"><div className="inspector-heading"><div><span className="eyebrow">Свойства элемента</span><h3>{selectedNode ? diagramTypeLabels[selectedNode.type] : 'Ничего не выбрано'}</h3></div>{selectedNode && selectedNode.type !== 'ktp' && <button className="remove-button" onClick={removeSelected} title="Удалить"><Trash2 size={15} /></button>}</div>{selectedNode ? <><label className="builder-field"><span>Название / подпись</span><input value={selectedNode.title || ''} onChange={(event) => updateNode(selectedId, { title: event.target.value })} /></label><label className="builder-field"><span>Дополнительные данные</span><textarea value={selectedNode.subtitle || ''} onChange={(event) => updateNode(selectedId, { subtitle: event.target.value })} /></label><label className="builder-field"><span>Цвет линии и подписи</span><input type="color" value={selectedNode.color || '#101827'} onChange={(event) => updateNode(selectedId, { color: event.target.value })} /></label><div className="inspector-coordinates"><span>X</span><input type="number" value={Math.round(selectedNode.x)} onChange={(event) => updateNode(selectedId, { x: Number(event.target.value) })} /><span>Y</span><input type="number" value={Math.round(selectedNode.y)} onChange={(event) => updateNode(selectedId, { y: Number(event.target.value) })} /></div><div className="inspector-meta"><span>Связей: {draft.edges.filter((edge) => edge.from === selectedId || edge.to === selectedId).length}</span><span>ID: {selectedNode.objectId || selectedNode.id}</span></div></> : <div className="inspector-empty"><MousePointer2 size={22} /><p>Выберите опору, ПУ, дом или участок на схеме, чтобы изменить подпись, цвет и положение.</p></div>}<div className="inspector-help"><Cable size={15} /><span>Для ручного ответвления включите «Соединить» и выберите два элемента по очереди.</span></div></div></div>
    <div className="panel-footer"><button className="secondary-button" onClick={onClose}>Закрыть</button><button className="primary-button" onClick={save}><Save size={16} /> Сохранить схему</button></div>
  </aside>;
}

function App() {
  const [project, setProject] = useState(() => normalizeProject(readLocalProject()));
  const [objects, setObjects] = useState(() => {
    try {
      const raw = localStorage.getItem('kontur-survey-objects');
      return normalizeObjects(raw ? JSON.parse(raw) : initialObjects);
    } catch {
      return initialObjects;
    }
  });
  const [selectedId, setSelectedId] = useState('p2');
  const [selectedTab, setSelectedTab] = useState('map');
  const [openPanel, setOpenPanel] = useState('ktp');
  const [showScheme, setShowScheme] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [diagram, setDiagram] = useState(() => {
    try {
      const raw = localStorage.getItem('kontur-schema-diagram');
      return raw ? JSON.parse(raw) : buildDiagram(project, objects);
    } catch {
      return buildDiagram(project, objects);
    }
  });
  const [search, setSearch] = useState('');
  const [showOnlyIssues, setShowOnlyIssues] = useState(false);
  const [checksState, setChecksState] = useState(() => {
    try {
      const raw = localStorage.getItem('kontur-checks');
      return raw ? { ...Object.fromEntries(checks.map((check) => [check.id, false])), ...JSON.parse(raw) } : { map: true, meter: true, phase: false, house: true, shunt: false, light: false, photo: false };
    } catch {
      return { map: true, meter: true, phase: false, house: true, shunt: false, light: false, photo: false };
    }
  });
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [gps, setGps] = useState(null);
  const selected = objects.find((object) => object.id === selectedId);
  const filtered = objects.filter((object) => {
    const matchesSearch = `${object.name} ${object.subtitle} ${object.meter || ''}`.toLowerCase().includes(search.toLowerCase());
    const hasIssue = object.type === 'pole' && (object.status === 'warning' || object.status === 'danger' || object.legCount !== object.schemeLegCount || object.meter === 'Не найден');
    return matchesSearch && (!showOnlyIssues || hasIssue);
  });
  const totalChecked = Object.values(checksState).filter(Boolean).length;

  useEffect(() => {
    localStorage.setItem('kontur-checks', JSON.stringify(checksState));
  }, [checksState]);

  useEffect(() => {
    if (selectedId && objects.some((object) => object.id === selectedId)) return;
    setSelectedId(objects[0]?.id || null);
  }, [objects, selectedId]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        document.querySelector('.search-field input, .map-search input')?.focus();
      }
      if (event.key === 'Escape') {
        setOpenPanel(null);
        setShowMobileNav(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigate = (tab) => {
    setSelectedTab(tab);
    setShowMobileNav(false);
    setShowLayers(false);
    if (tab === 'map') setOpenPanel(null);
    else if (tab === 'objects') setOpenPanel(selected ? 'object' : null);
    else setOpenPanel(null);
  };
  const selectObject = (id) => { setSelectedId(id); setSelectedTab('objects'); setOpenPanel('object'); setShowMobileNav(false); };
  const locate = () => {
    if (!navigator.geolocation) {
      window.alert('Геолокация недоступна в этом браузере.');
      return;
    }
    navigator.geolocation.getCurrentPosition((position) => setGps([position.coords.latitude, position.coords.longitude]), () => window.alert('Не удалось получить GPS-позицию. Разрешите доступ к геолокации.'));
  };
  const exportData = () => {
    const payload = { exportedAt: new Date().toISOString(), project, ktp: project.ktp, objects, diagram, checks: checksState, gps };
    saveBlob(`${project.settlement || 'obsledovanie'}-kontur.json`, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8');
  };
  const importData = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result);
        const nextProject = normalizeProject(payload.project || { ...defaultProject, ktp: payload.ktp || defaultProject.ktp });
        const nextObjects = normalizeObjects(payload.objects);
        const nextDiagram = payload.diagram || buildDiagram(nextProject, nextObjects);
        setProject(nextProject);
        setObjects(nextObjects);
        setDiagram(nextDiagram);
        setChecksState(payload.checks && typeof payload.checks === 'object' ? payload.checks : checksState);
        localStorage.setItem('kontur-survey-project', JSON.stringify(nextProject));
        localStorage.setItem('kontur-survey-objects', JSON.stringify(nextObjects));
        localStorage.setItem('kontur-schema-diagram', JSON.stringify(nextDiagram));
        localStorage.setItem('kontur-checks', JSON.stringify(payload.checks || checksState));
        setSelectedTab('map');
        setOpenPanel(null);
      } catch {
        window.alert('Не удалось импортировать файл: проверьте формат JSON.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };
  const saveProject = (nextProject, nextObjects) => {
    setProject(nextProject);
    setObjects(nextObjects);
    const nextDiagram = buildDiagram(nextProject, nextObjects);
    setDiagram(nextDiagram);
    localStorage.setItem('kontur-survey-project', JSON.stringify(nextProject));
    localStorage.setItem('kontur-survey-objects', JSON.stringify(nextObjects));
    localStorage.setItem('kontur-schema-diagram', JSON.stringify(nextDiagram));
    setSelectedTab('map');
    setOpenPanel(null);
  };
  const saveDiagram = (nextDiagram) => {
    setDiagram(nextDiagram);
    localStorage.setItem('kontur-schema-diagram', JSON.stringify(nextDiagram));
    setSelectedTab('map');
    setOpenPanel(null);
  };
  const resetProject = () => {
    setProject(defaultProject);
    setObjects(initialObjects);
    localStorage.removeItem('kontur-survey-project');
    localStorage.removeItem('kontur-survey-objects');
    localStorage.removeItem('kontur-schema-diagram');
    setDiagram(buildDiagram(defaultProject, initialObjects));
    setSelectedTab('map');
    setOpenPanel(null);
  };
  const saveObject = (nextObject) => {
    const nextObjects = objects.map((object) => object.id === nextObject.id ? nextObject : object);
    const nextDiagram = buildDiagram(project, nextObjects);
    setObjects(nextObjects);
    localStorage.setItem('kontur-survey-objects', JSON.stringify(nextObjects));
    setDiagram(nextDiagram);
    localStorage.setItem('kontur-schema-diagram', JSON.stringify(nextDiagram));
    setOpenPanel(null);
  };
  const syncLocal = () => {
    localStorage.setItem('kontur-survey-project', JSON.stringify(project));
    localStorage.setItem('kontur-survey-objects', JSON.stringify(objects));
    window.alert('Данные сохранены на этом устройстве.');
  };
  const openAddress = () => {
    const [latitude, longitude] = project.ktp.coords || [];
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) window.open(`https://yandex.ru/maps/?ll=${longitude}%2C${latitude}&z=16&pt=${longitude}%2C${latitude}`, '_blank', 'noopener,noreferrer');
  };
  return <div className="app-shell">
    <header className="topbar"><div className="brand"><div className="brand-mark"><Zap size={16} fill="currentColor" /></div><span>КОНТУР</span><i /></div><button className="top-context" type="button" onClick={() => { setSelectedTab('map'); setOpenPanel('ktp'); }}><span className="context-kicker">Полевое обследование</span><strong>{project.ktp.name} <ChevronDown size={15} /></strong></button><div className="top-actions"><div className="sync-state"><span /><span>Сохранено локально</span></div><button className="icon-top" type="button" aria-label="Настройки проекта" title="Настройки проекта" onClick={() => navigate('builder')}><Settings2 size={17} /></button><div className="avatar">ДВ</div></div><button className="mobile-menu" type="button" aria-label="Открыть меню" onClick={() => setShowMobileNav(!showMobileNav)}><Menu size={20} /></button></header>
    <div className="workspace">
      {showMobileNav && <button className="mobile-nav-backdrop" type="button" aria-label="Закрыть меню" onClick={() => setShowMobileNav(false)} />}
      <nav className={`sidebar ${showMobileNav ? 'sidebar-open' : ''}`}>
        <div className="session-card"><div className="session-icon"><ClipboardCheck size={18} /></div><div><strong>Сессия {project.id.replace('survey-', '№ ')}</strong><span>{project.district}</span></div><MoreIcon /></div>
        <div className="nav-label">Рабочее пространство</div>
        <button className={`nav-item ${selectedTab === 'map' ? 'active' : ''}`} type="button" onClick={() => navigate('map')}><MapPin size={17} /><span>Карта обследования</span><b>28</b></button>
        <button className={`nav-item ${selectedTab === 'objects' ? 'active' : ''}`} type="button" onClick={() => navigate('objects')}><RadioTower size={17} /><span>Объекты на линии</span><b>{objects.length}</b></button>
        <button className={`nav-item ${selectedTab === 'scheme' ? 'active' : ''}`} type="button" onClick={() => navigate('scheme')}><GitBranch size={17} /><span>Схема населённого пункта</span><b>{objects.length}</b></button>
        <button className={`nav-item ${selectedTab === 'diagram' ? 'active' : ''}`} type="button" onClick={() => navigate('diagram')}><Cable size={17} /><span>Редактор схемы Visio</span><b>A3</b></button>
        <button className={`nav-item ${selectedTab === 'checklist' ? 'active' : ''}`} type="button" onClick={() => navigate('checklist')}><ClipboardCheck size={17} /><span>Общий чек-лист</span><b>{totalChecked}/7</b></button>
        <div className="nav-label spaced">Справочники</div>
        <button className="nav-item" type="button" onClick={() => navigate('diagram')}><FileText size={17} /><span>Схемы и документы</span></button><button className={`nav-item ${selectedTab === 'builder' ? 'active' : ''}`} type="button" onClick={() => navigate('builder')}><Settings2 size={17} /><span>Настройки проекта</span></button>
        <div className="sidebar-bottom"><div className="weather"><Sun size={18} /><div><strong>+18°</strong><span>Березняки · ясно</span></div></div><div className="operator"><div className="avatar small">ДВ</div><div><strong>Даниил В.</strong><span>Инженер РЭС</span></div><ChevronDown size={15} /></div></div>
      </nav>
      <main className="main-area">
        <div className="page-heading"><div><div className="breadcrumbs"><span>{project.settlement}</span><i>/</i><strong>{project.ktp.name}</strong></div><h1>Обследование линии</h1><p>Сверка схемы с фактическим состоянием сети</p></div><div className="heading-actions"><button className="outline-button" type="button" onClick={exportData}><Download size={16} /> Экспорт отчёта</button><label className="outline-button file-button"><FileUp size={16} /> Импорт<input type="file" accept="application/json,.json" onChange={importData} /></label><button className="primary-button compact gps-action" type="button" onClick={locate}><Crosshair size={16} /> GPS {gps ? 'определён' : 'позиция'}</button></div></div>
        <div className="metric-row"><Metric icon={<RadioTower />} label="КТП" value="1" detail="в работе" tone="blue" /><Metric icon={<Route />} label="Фидеры" value={objects.filter((object) => object.type === 'feeder').length} detail="вдоль линии" tone="violet" /><Metric icon={<MapPin />} label="Опоры" value={objects.filter((object) => object.type === 'pole').length} detail="объектов в базе" tone="orange" /><Metric icon={<ShieldAlert />} label="Расхождения" value={objects.filter((object) => object.type === 'pole' && (object.legCount !== object.schemeLegCount || object.meter === 'Не найден')).length} detail="нужно проверить" tone="red" /></div>
        <div className="content-grid">
          <section className="map-card"><div className="card-toolbar"><div className="view-tabs"><button type="button" className={!showScheme ? 'active' : ''} onClick={() => setShowScheme(false)}><MapPin size={15} /> Карта</button><button type="button" className={showScheme ? 'active' : ''} onClick={() => setShowScheme(true)}><GitBranch size={15} /> Схема фидера</button></div><div className="toolbar-right"><button className={`toolbar-button ${showOnlyIssues ? 'active' : ''}`} type="button" onClick={() => setShowOnlyIssues((value) => !value)}><SlidersHorizontal size={15} /> Фильтры {showOnlyIssues ? '· включены' : ''}</button><button className={`toolbar-button ${showLayers ? 'active' : ''}`} type="button" onClick={() => setShowLayers((value) => !value)}><Layers3 size={15} /> Слои</button></div></div><YandexMap objects={objects} center={project.ktp.coords} selectedId={selectedId} onSelect={selectObject} showScheme={showScheme} showLayers={showLayers} search={search} onSearch={setSearch} onLocate={locate} onToggleLayers={() => setShowLayers((value) => !value)} /><div className="map-footer"><div><span className="live-dot" /> <strong>Полевой режим активен</strong><span> · данные сохраняются на устройстве</span></div><button type="button" onClick={locate}><Navigation size={15} /> Центрировать по GPS</button></div></section>
          <section className="objects-card"><div className="objects-head"><div><span className="eyebrow">Маршрут обследования</span><h2>Объекты на линии <span>{objects.length}</span></h2></div><button className="add-button" type="button" onClick={() => navigate('builder')}><Plus size={16} /> Объект</button></div><div className="search-field"><Search size={16} /><input aria-label="Поиск объектов" placeholder="Найти опору или ПУ" value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>/</kbd></div><div className="object-list">{filtered.map((object) => <button type="button" key={object.id} className={`object-row ${selectedId === object.id ? 'selected' : ''}`} onClick={() => selectObject(object.id)}><div className={`object-icon ${object.type} ${object.status}`}>{object.type === 'feeder' ? <Route size={16} /> : <RadioTower size={16} />}</div><div className="object-copy"><strong>{object.name}</strong><span>{object.subtitle}</span><div className="mini-progress"><i style={{ width: `${object.progress}%` }} /></div></div><div className="object-end"><StatusPill status={object.status}>{object.progress}%</StatusPill><ChevronDown size={15} /></div></button>)}</div><div className="objects-foot"><span><i className="online-dot" /> Последняя синхронизация 2 мин назад</span><button type="button" onClick={exportData}><Upload size={14} /> Выгрузить</button></div></section>
        </div>
      </main>
      {selectedTab === 'objects' && openPanel === 'object' && selected?.type === 'pole' && <PolePanel object={selected} checksState={checksState} setChecksState={setChecksState} onClose={() => setOpenPanel(null)} onLocate={locate} onSave={saveObject} />}
      {selectedTab === 'objects' && openPanel === 'object' && selected?.type === 'feeder' && <FeederPanel feeder={selected} poles={objects.filter((object) => object.type === 'pole')} onClose={() => setOpenPanel(null)} onSelect={selectObject} />}
      {selectedTab === 'checklist' && <ChecklistPanel checksState={checksState} setChecksState={setChecksState} onClose={() => navigate('map')} />}
      {selectedTab === 'scheme' && <SettlementSchemePanel project={project} objects={objects} onClose={() => navigate('map')} onSelect={selectObject} />}
      {selectedTab === 'diagram' && <DiagramEditorPanel project={project} objects={objects} diagram={diagram} onSave={saveDiagram} onClose={() => navigate('map')} />}
      {selectedTab === 'builder' && <ProjectBuilderPanel project={project} objects={objects} onSave={saveProject} onClose={() => navigate('map')} />}
      {selectedTab === 'map' && openPanel === 'ktp' && <KtpPanel ktp={project.ktp} onClose={() => setOpenPanel(null)} onExport={exportData} onEdit={() => navigate('builder')} onSync={syncLocal} onOpenAddress={openAddress} />}
    </div>
  </div>;
}

function Metric({ icon, label, value, detail, tone }) { return <div className="metric-card"><div className={`metric-icon ${tone}`}>{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></div>; }

function ChecklistPanel({ checksState, setChecksState, onClose }) {
  const toggle = (id) => setChecksState((state) => ({ ...state, [id]: !state[id] }));
  return <aside className="detail-panel checklist-panel"><div className="detail-header"><button className="back-button" type="button" onClick={onClose}><ArrowLeft size={18} /></button><div><span className="eyebrow">КТП-103</span><h2>Общий чек-лист</h2></div><button className="ghost-button" type="button" aria-label="Закрыть чек-лист" title="Закрыть" onClick={onClose}><X size={16} /></button></div><div className="detail-scroll"><div className="checklist-summary"><div className="summary-circle"><strong>{Object.values(checksState).filter(Boolean).length}</strong><span>из {checks.length}</span></div><div><strong>Проверки объекта</strong><p>Заполненность обязательных полей</p></div></div>{['Сверка со схемой', 'Проверка ПУ', 'Безопасность', 'Уличное освещение', 'Фотофиксация'].map((group) => <div className="check-group" key={group}><h3>{group}</h3>{checks.filter((check) => check.group === group).map((check) => <button className={`check-row ${checksState[check.id] ? 'checked' : ''}`} type="button" key={check.id} onClick={() => toggle(check.id)}><span className="checkbox">{checksState[check.id] && <Check size={13} />}</span><span><strong>{check.label}</strong><small>{check.note}</small></span></button>)}</div>)}</div><div className="panel-footer"><button className="secondary-button" type="button" onClick={() => setChecksState(Object.fromEntries(checks.map((c) => [c.id, true])))}><Check size={16} /> Отметить всё</button><button className="primary-button" type="button" onClick={onClose}>Готово</button></div></aside>;
}

createRoot(document.getElementById('root')).render(<App />);
