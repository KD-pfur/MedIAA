const STORAGE_KEY = "medflow-mvp-cases";
const SESSION_KEY = "medflow-session";
const DEMO_CASES_KEY = "medflow-demo-cases";
const DEMO_CREDENTIALS = {
  admin: { username: "coordinator", password: "clinic2026" },
  user: { username: "egor", password: "health2026" },
};
const DEMO_USERS = {
  admin: {
    username: DEMO_CREDENTIALS.admin.username,
    password: DEMO_CREDENTIALS.admin.password,
    role: "admin",
    fullName: "Смирнова Ольга Викторовна",
  },
  user: {
    username: DEMO_CREDENTIALS.user.username,
    password: DEMO_CREDENTIALS.user.password,
    role: "user",
    fullName: "Орлов Егор Дмитриевич",
    age: 27,
  },
};
const DEMO_ADMINS = [
  { fullName: "Смирнова Ольга Викторовна", title: "Координатор приёмного отделения", login: DEMO_CREDENTIALS.admin.username },
  { fullName: "Петрова Анна Сергеевна", title: "Старшая медицинская сестра", login: "anna.petrova" },
  { fullName: "Иванов Максим Олегович", title: "Дежурный врач-координатор", login: "m.ivanov" },
];
const FORCED_ROLE = new URLSearchParams(window.location.search).get("role") || document.body?.dataset?.demoRole || "";
const T1DM_QUESTIONNAIRE = {
  title: "Опросник по сахарному диабету 1 типа у взрослых",
  source: "Клинические рекомендации: Сахарный диабет 1 типа у взрослых",
  questions: [
    { id: "thirst", label: "Есть выраженная жажда?", type: "boolean" },
    { id: "urination", label: "Есть частое мочеиспускание?", type: "boolean" },
    { id: "weight_loss", label: "Была непреднамеренная потеря веса за последние недели?", type: "boolean" },
    { id: "fatigue", label: "Есть выраженная слабость или утомляемость?", type: "boolean" },
    { id: "blurred_vision", label: "Есть ухудшение зрения или затуманивание?", type: "boolean" },
    { id: "nausea", label: "Есть тошнота, рвота или боль в животе?", type: "boolean" },
    { id: "acetone_breath", label: "Есть запах ацетона изо рта?", type: "boolean" },
    { id: "diet_following", label: "Соблюдаете ли рекомендации по питанию?", type: "choice", options: ["да", "частично", "нет"] },
    { id: "bread_units_count", label: "Считаете ли вы хлебные единицы перед едой?", type: "choice", options: ["всегда", "иногда", "нет"] },
    { id: "insulin_calculation", label: "Рассчитываете инсулин по хлебным единицам или на глаз?", type: "choice", options: ["по хлебным единицам", "иногда на глаз", "только на глаз"] },
    { id: "hba1c_high", label: "Наблюдали ли вы повышение уровня гликированного гемоглобина выше 7,5%?", type: "choice", options: ["да", "нет", "не знаю"] },
    { id: "glucose_known", label: "Известно ли повышенное значение глюкозы крови?", type: "choice", options: ["нет", "да, умеренно", "да, сильно повышена"] },
    { id: "autoimmune_history", label: "Есть собственные аутоиммунные заболевания?", type: "choice", options: ["нет", "не знаю", "да"] },
    { id: "duration", label: "Как быстро развились симптомы?", type: "choice", options: ["симптомов нет", "несколько дней", "1-2 недели", "больше месяца"] },
    { id: "comments", label: "Дополнительные жалобы или комментарии", type: "text" },
  ],
};
const DEFAULT_FIELD_REGIONS = {
  certificate_number: { left: 0.65, top: 0.255, right: 0.84, bottom: 0.325 },
  full_name: { left: 0.36, top: 0.335, right: 0.95, bottom: 0.405 },
  birth_date: { left: 0.28, top: 0.385, right: 0.95, bottom: 0.455 },
  city: { left: 0.52, top: 0.475, right: 0.83, bottom: 0.545 },
  street: { left: 0.08, top: 0.55, right: 0.58, bottom: 0.625 },
  house: { left: 0.81, top: 0.55, right: 0.96, bottom: 0.625 },
  apartment: { left: 0.12, top: 0.6, right: 0.34, bottom: 0.675 },
  work_or_study: { left: 0.36, top: 0.65, right: 0.95, bottom: 0.725 },
  illnesses: { left: 0.41, top: 0.755, right: 0.95, bottom: 0.825 },
  vaccinations: { left: 0.44, top: 0.855, right: 0.95, bottom: 0.925 },
};

const els = {
  authScreen: document.getElementById("auth-screen"),
  appContent: document.getElementById("app-content"),
  loginForm: document.getElementById("login-form"),
  loginUsername: document.getElementById("login-username"),
  loginPassword: document.getElementById("login-password"),
  loginStatus: document.getElementById("login-status"),
  sessionBar: document.getElementById("session-bar"),
  sessionRole: document.getElementById("session-role"),
  sessionUser: document.getElementById("session-user"),
  logoutBtn: document.getElementById("logout-btn"),
  adminPortal: document.getElementById("admin-portal"),
  adminProfiles: document.getElementById("admin-profiles"),
  adminCases: document.getElementById("admin-cases"),
  userPortal: document.getElementById("user-portal"),
  userProfileCard: document.getElementById("user-profile-card"),
  userCaseCard: document.getElementById("user-case-card"),
  caseTitle: document.getElementById("case-title"),
  documentMode: document.getElementById("document-mode"),
  fileInput: document.getElementById("file-input"),
  preprocessBtn: document.getElementById("preprocess-btn"),
  ocrBtn: document.getElementById("ocr-btn"),
  ocrStatus: document.getElementById("ocr-status"),
  previewPanel: document.getElementById("preview-panel"),
  sourceImagePreview: document.getElementById("source-image-preview"),
  processedImagePreview: document.getElementById("processed-image-preview"),
  printedPreviewCard: document.getElementById("printed-preview-card"),
  printedImagePreview: document.getElementById("printed-image-preview"),
  handwritingPreviewCard: document.getElementById("handwriting-preview-card"),
  handwritingImagePreview: document.getElementById("handwriting-image-preview"),
  preprocessMeta: document.getElementById("preprocess-meta"),
  fieldTuningPanel: document.getElementById("field-tuning-panel"),
  tuningField: document.getElementById("tuning-field"),
  tuningLeft: document.getElementById("tuning-left"),
  tuningTop: document.getElementById("tuning-top"),
  tuningRight: document.getElementById("tuning-right"),
  tuningBottom: document.getElementById("tuning-bottom"),
  applyTuning: document.getElementById("apply-tuning"),
  resetTuning: document.getElementById("reset-tuning"),
  documentText: document.getElementById("document-text"),
  parseBtn: document.getElementById("parse-btn"),
  clearBtn: document.getElementById("clear-btn"),
  fillDemo: document.getElementById("fill-demo"),
  openChat: document.getElementById("open-chat"),
  editStructured: document.getElementById("edit-structured"),
  downloadJson: document.getElementById("download-json"),
  emptyState: document.getElementById("empty-state"),
  results: document.getElementById("results"),
  summaryText: document.getElementById("summary-text"),
  patientName: document.getElementById("patient-name"),
  patientMeta: document.getElementById("patient-meta"),
  documentType: document.getElementById("document-type"),
  documentDate: document.getElementById("document-date"),
  doctorName: document.getElementById("doctor-name"),
  facilityName: document.getElementById("facility-name"),
  heroAiNote: document.getElementById("hero-ai-note"),
  diagnosisList: document.getElementById("diagnosis-list"),
  medicationList: document.getElementById("medication-list"),
  formFieldsPanel: document.getElementById("form-fields-panel"),
  formFieldsList: document.getElementById("form-fields-list"),
  labsTable: document.getElementById("labs-table"),
  sourcePreview: document.getElementById("source-preview"),
  savedCases: document.getElementById("saved-cases"),
  patientsList: document.getElementById("patients-list"),
  seedDatabaseBtn: document.getElementById("seed-database"),
  chatModal: document.getElementById("chat-modal"),
  closeChat: document.getElementById("close-chat"),
  chatLog: document.getElementById("chat-log"),
  chatForm: document.getElementById("chat-form"),
  chatInput: document.getElementById("chat-input"),
  chatStatus: document.getElementById("chat-status"),
  voiceStatus: document.getElementById("voice-status"),
  micBtn: document.getElementById("mic-btn"),
  savedCaseEditModal: document.getElementById("saved-case-edit-modal"),
  closeSavedCaseEdit: document.getElementById("close-saved-case-edit"),
  cancelSavedCaseEdit: document.getElementById("cancel-saved-case-edit"),
  savedCaseEditForm: document.getElementById("saved-case-edit-form"),
  savedCaseEditTitle: document.getElementById("saved-case-edit-title"),
  savedCaseTitleInput: document.getElementById("saved-case-title-input"),
  savedCasePatientInput: document.getElementById("saved-case-patient-input"),
  savedCaseDiagnosisInput: document.getElementById("saved-case-diagnosis-input"),
  savedCaseSummaryInput: document.getElementById("saved-case-summary-input"),
  structuredEditModal: document.getElementById("structured-edit-modal"),
  closeStructuredEdit: document.getElementById("close-structured-edit"),
  cancelStructuredEdit: document.getElementById("cancel-structured-edit"),
  structuredEditForm: document.getElementById("structured-edit-form"),
  structuredTitleInput: document.getElementById("structured-title-input"),
  structuredPatientInput: document.getElementById("structured-patient-input"),
  structuredBirthDateInput: document.getElementById("structured-birth-date-input"),
  structuredDocumentTypeInput: document.getElementById("structured-document-type-input"),
  structuredDocumentDateInput: document.getElementById("structured-document-date-input"),
  structuredFacilityInput: document.getElementById("structured-facility-input"),
  structuredDoctorInput: document.getElementById("structured-doctor-input"),
  structuredDiagnosesInput: document.getElementById("structured-diagnoses-input"),
  structuredComplaintsInput: document.getElementById("structured-complaints-input"),
  structuredMedicationsInput: document.getElementById("structured-medications-input"),
  structuredSummaryInput: document.getElementById("structured-summary-input"),
};

let currentCase = null;
let pendingImageFile = null;
let processedImageBlob = null;
let printedImageBlob = null;
let handwritingImageBlob = null;
let preprocessResult = null;
let lastAiScanResult = null;
let chatHistory = [];
let aiAvailable = false;
let fieldOverrides = structuredClone(DEFAULT_FIELD_REGIONS);
let speechRecognition = null;
let isListening = false;
let activeSpeechButton = null;
let activeSpeechUtterance = null;
let speechRecognitionSupported = false;
let speechSynthesisSupported = false;
let currentSession = null;
let editingSavedCaseId = null;

const demoText = `Выписка из амбулаторной карты
Пациент: Иванов Иван Иванович
Дата рождения: 14.05.1986
Дата документа: 12.03.2026
Медицинская организация: Клиника Сфера Здоровья
Врач: Петрова Анна Сергеевна
Жалобы: слабость, жажда, эпизоды головокружения
Диагноз: Сахарный диабет 2 типа. Артериальная гипертензия.

Лабораторные результаты:
Глюкоза - 8.4 ммоль/л (норма 3.9-5.5)
HbA1c - 7.3 % (норма 4.0-5.6)
Холестерин общий - 5.8 ммоль/л (норма 0-5.2)
Креатинин - 87 мкмоль/л (норма 62-106)

Назначения:
Метформин 1000 мг 2 раза в день после еды 30 дней
Лозартан 50 мг 1 раз в день утром

Рекомендации: контроль глюкозы, повторный анализ через 3 месяца.`;

const DEMO_SAVED_CASES = [
  {
    id: "seed-saved-case-1",
    title: "Выписка после очного приёма",
    createdAt: "2026-04-01T09:20:00.000Z",
    sourceText: demoText,
    extracted: {
      patient: { name: "Иванов Иван Иванович", birthDate: "14.05.1986" },
      document: { type: "Выписка", date: "12.03.2026", facility: "Клиника Сфера Здоровья" },
      doctor: { name: "Петрова Анна Сергеевна" },
      diagnoses: ["Сахарный диабет 2 типа", "Артериальная гипертензия"],
      complaints: ["слабость", "жажда", "эпизоды головокружения"],
      medications: [
        "Метформин 1000 мг 2 раза в день после еды 30 дней",
        "Лозартан 50 мг 1 раз в день утром",
      ],
      labs: [
        { name: "Глюкоза", value: "8.4", unit: "ммоль/л", range: "3.9 - 5.5", status: "high" },
        { name: "HbA1c", value: "7.3", unit: "%", range: "4.0 - 5.6", status: "high" },
        { name: "Холестерин общий", value: "5.8", unit: "ммоль/л", range: "0 - 5.2", status: "high" },
      ],
      summary: "Пациент Иванов Иван Иванович. Тип документа: выписка. Выявлены: сахарный диабет 2 типа, артериальная гипертензия. Отклонения по анализам: Глюкоза, HbA1c, Холестерин общий. Назначений: 2. Жалобы: слабость, жажда, эпизоды головокружения.",
    },
  },
  {
    id: "seed-saved-case-2",
    title: "Медицинская справка перед госпитализацией",
    createdAt: "2026-04-01T10:10:00.000Z",
    sourceText: "Медицинская справка. Пациент: Соколов Артем Игоревич. Диагноз: сахарный диабет 2 типа.",
    extracted: {
      patient: { name: "Соколов Артем Игоревич", birthDate: "22.11.1998" },
      document: { type: "Медицинская справка", date: "14.03.2026", facility: "Городская клиника №7" },
      doctor: { name: "Смирнова Елена Павловна" },
      diagnoses: ["Сахарный диабет 2 типа", "Ожирение 1 степени"],
      complaints: ["жажда", "сухость во рту"],
      medications: ["Контроль глюкозы крови 2 раза в день"],
      labs: [
        { name: "Глюкоза", value: "9.2", unit: "ммоль/л", range: "3.9 - 5.5", status: "high" },
        { name: "HbA1c", value: "8.1", unit: "%", range: "4.0 - 5.6", status: "high" },
      ],
      summary: "Пациент Соколов Артем Игоревич. Тип документа: медицинская справка. Выявлены: сахарный диабет 2 типа, ожирение 1 степени. Отклонения по анализам: Глюкоза, HbA1c.",
    },
  },
  {
    id: "seed-saved-case-3",
    title: "Результаты лабораторного контроля",
    createdAt: "2026-04-01T11:05:00.000Z",
    sourceText: "Результаты анализов. Пациент: Орлова Марина Сергеевна. HbA1c: 6.9%. Глюкоза: 7.1 ммоль/л.",
    extracted: {
      patient: { name: "Орлова Марина Сергеевна", birthDate: "03.02.1991" },
      document: { type: "Результаты анализов", date: "29.03.2026", facility: "Лаборатория МедЛаб" },
      doctor: { name: "Кузнецова Ирина Алексеевна" },
      diagnoses: ["Нарушение гликемического контроля"],
      complaints: [],
      medications: ["Рекомендован повторный визит к эндокринологу"],
      labs: [
        { name: "Глюкоза", value: "7.1", unit: "ммоль/л", range: "3.9 - 5.5", status: "high" },
        { name: "HbA1c", value: "6.9", unit: "%", range: "4.0 - 5.6", status: "high" },
      ],
      summary: "Пациент Орлова Марина Сергеевна. Тип документа: результаты анализов. Выявлены: нарушение гликемического контроля. Отклонения по анализам: Глюкоза, HbA1c.",
    },
  },
  {
    id: "seed-saved-case-4",
    title: "Описание исследования стопы",
    createdAt: "2026-04-01T12:25:00.000Z",
    sourceText: "Описание снимка. Пациент: Кадачигов Дмитрий Сергеевич. Рекомендована консультация хирурга.",
    extracted: {
      patient: { name: "Кадачигов Дмитрий Сергеевич", birthDate: "" },
      document: { type: "Описание снимка", date: "30.03.2026", facility: "Диагностический центр Север" },
      doctor: { name: "Громов Алексей Валерьевич" },
      diagnoses: ["Диабетическая стопа, подозрение на осложнение"],
      complaints: ["болезненность в области стопы"],
      medications: ["Рекомендована очная консультация хирурга"],
      labs: [],
      summary: "Пациент Кадачигов Дмитрий Сергеевич. Тип документа: описание снимка. Выявлены: диабетическая стопа, подозрение на осложнение.",
    },
  },
];

const DEMO_CASE_TEMPLATES = [
  {
    patientUsername: DEMO_USERS.user.username,
    patientName: DEMO_USERS.user.fullName,
    disease: "Сахарный диабет 1 типа у взрослых",
    title: "Первичное обращение",
    requestedAt: "2026-03-31T08:45:00.000Z",
    testApproved: true,
    testCompleted: true,
    testResult: "Опросник заполнен. Нужна проверка врача.",
    questionnaireAnswers: {
      thirst: "да",
      urination: "да",
      weight_loss: "да",
      fatigue: "да",
      blurred_vision: "да",
      nausea: "нет",
      acetone_breath: "нет",
      diet_following: "частично",
      bread_units_count: "иногда",
      insulin_calculation: "иногда на глаз",
      hba1c_high: "да",
      glucose_known: "да, умеренно",
      autoimmune_history: "не знаю",
      duration: "1-2 недели",
      comments: "Сильная жажда по вечерам и выраженная усталость после работы.",
    },
    aiOpinion: {
      status: "ok",
      risk_level: "повышенный",
      summary_for_doctor: "Есть признаки декомпенсации и нарушения самоконтроля. Нужна очная оценка схемы инсулинотерапии и контроль HbA1c.",
      red_flags: ["жажда", "снижение веса", "затуманивание зрения"],
      likely_concerns: ["декомпенсация диабета", "ошибки в расчёте доз инсулина"],
      recommended_route: "Консультация эндокринолога и повторный лабораторный контроль",
      needs_urgent_review: false,
      patient_message: "Есть повод обсудить терапию с эндокринологом в ближайшее время.",
    },
    neuralVerdict: "Есть признаки декомпенсации. Требуется очная корректировка терапии.",
    adminApproved: false,
    ward: "",
    doctorRedirect: "Консультация эндокринолога и повторный лабораторный контроль",
    status: "Опросник заполнен. Ожидается врач",
  },
  {
    patientUsername: DEMO_USERS.user.username,
    patientName: DEMO_USERS.user.fullName,
    disease: "Контроль инсулинотерапии после выписки",
    title: "Повторный контроль",
    requestedAt: "2026-03-18T10:20:00.000Z",
    testApproved: true,
    testCompleted: true,
    testResult: "Опросник заполнен. Состояние стабильное.",
    questionnaireAnswers: {
      thirst: "нет",
      urination: "нет",
      weight_loss: "нет",
      fatigue: "нет",
      blurred_vision: "нет",
      nausea: "нет",
      acetone_breath: "нет",
      diet_following: "да",
      bread_units_count: "всегда",
      insulin_calculation: "по хлебным единицам",
      hba1c_high: "нет",
      glucose_known: "нет",
      autoimmune_history: "не знаю",
      duration: "симптомов нет",
      comments: "Самочувствие стабильное, веду дневник сахаров ежедневно.",
    },
    aiOpinion: {
      status: "ok",
      risk_level: "низкий",
      summary_for_doctor: "Пациент соблюдает рекомендации и контролирует терапию. Можно продолжить текущее наблюдение.",
      red_flags: [],
      likely_concerns: [],
      recommended_route: "Плановый приём через 3 месяца",
      needs_urgent_review: false,
      patient_message: "Состояние выглядит стабильным. Продолжайте самоконтроль по текущей схеме.",
    },
    neuralVerdict: "Текущее состояние стабильное, допустим плановый контроль.",
    adminApproved: true,
    ward: "",
    doctorRedirect: "Плановый приём через 3 месяца",
    status: "Врач подтвердил плановое наблюдение",
  },
  {
    patientUsername: DEMO_USERS.user.username,
    patientName: DEMO_USERS.user.fullName,
    disease: "Онлайн-опрос перед очной консультацией",
    title: "Новое обращение",
    requestedAt: "",
    testApproved: false,
    testCompleted: false,
    testResult: null,
    questionnaireAnswers: {},
    aiOpinion: null,
    neuralVerdict: "",
    adminApproved: false,
    ward: "",
    doctorRedirect: "",
    status: "Ожидает запроса пациента",
  },
];

function ensureDemoCases() {
  const existing = loadDemoCases();
  if (!existing.length) {
    saveDemoCases(buildInitialDemoCases());
    return;
  }
  const migratedCases = migrateDemoCases(existing);
  if (JSON.stringify(existing) !== JSON.stringify(migratedCases)) {
    saveDemoCases(migratedCases);
  }
}

function loadDemoCases() {
  try {
    return JSON.parse(localStorage.getItem(DEMO_CASES_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveDemoCases(cases) {
  localStorage.setItem(DEMO_CASES_KEY, JSON.stringify(cases));
}

function ensureSavedCases() {
  const existing = loadCases();
  if (!existing.length) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(structuredClone(DEMO_SAVED_CASES)));
    return;
  }

  const titles = new Set(existing.map((item) => item.title));
  const seeded = [...existing];
  for (const sample of DEMO_SAVED_CASES) {
    if (seeded.length >= 6) {
      break;
    }
    if (!titles.has(sample.title)) {
      seeded.push(structuredClone(sample));
      titles.add(sample.title);
    }
  }
  if (seeded.length !== existing.length) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  }
}

function buildNewDemoCase(index = 1) {
  return {
    id: `demo-case-${Date.now()}-${index}`,
    createdAt: new Date().toISOString(),
    patientUsername: DEMO_USERS.user.username,
    patientName: DEMO_USERS.user.fullName,
    disease: "Онлайн-опрос перед очной консультацией",
    title: `Обращение от ${formatDayMonth(new Date().toISOString())}`,
    requestedAt: "",
    testApproved: false,
    testCompleted: false,
    testResult: null,
    neuralVerdict: "",
    aiOpinion: null,
    questionnaireAnswers: {},
    adminApproved: false,
    ward: "",
    doctorRedirect: "",
    status: "Ожидает запроса пациента",
  };
}

function resetDemoCase(caseItem) {
  return {
    ...caseItem,
    requestedAt: "",
    testApproved: false,
    testCompleted: false,
    testResult: null,
    neuralVerdict: "",
    aiOpinion: null,
    questionnaireAnswers: {},
    adminApproved: false,
    ward: "",
    doctorRedirect: "",
    status: "Опрос сброшен координатором",
  };
}

function buildInitialDemoCases() {
  return DEMO_CASE_TEMPLATES.map((template, index) => ({
    id: `demo-seed-${index + 1}`,
    createdAt: new Date(Date.now() - index * 1000 * 60 * 60 * 24 * 7).toISOString(),
    ...structuredClone(template),
  }));
}

function migrateDemoCases(cases) {
  const migrated = cases.map((caseItem, index) => {
    const next = structuredClone(caseItem);
    if (next.patientUsername === "user") {
      next.patientUsername = DEMO_USERS.user.username;
    }
    if (!next.patientUsername) {
      next.patientUsername = DEMO_USERS.user.username;
    }
    if (!next.patientName || next.patientName === "Масников Егор Дмитриевич") {
      next.patientName = DEMO_USERS.user.fullName;
    }
    if (!next.disease || next.disease === "Сахарный диабет 1 типа у взрослых") {
      next.disease = index === 0 ? "Сахарный диабет 1 типа у взрослых" : next.disease || "Онлайн-опрос перед очной консультацией";
    }
    if (!next.title || /^Обращение #/i.test(next.title)) {
      next.title = index === 0 ? "Первичное обращение" : `Обращение от ${formatDayMonth(next.createdAt || new Date().toISOString())}`;
    }
    if (next.status === "Новый запрос не создан") {
      next.status = "Ожидает запроса пациента";
    }
    if (next.status === "Опрос обнулён администратором") {
      next.status = "Опрос сброшен координатором";
    }
    return next;
  });

  const hasRecentDataset = migrated.some((item) => item.title === "Первичное обращение");
  if (!hasRecentDataset && migrated.length < 3) {
    return buildInitialDemoCases();
  }
  return migrated;
}

function migrateStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      return;
    }
    const session = JSON.parse(raw);
    if (!session) {
      return;
    }
    if (session.username === "admin") {
      session.username = DEMO_USERS.admin.username;
      session.fullName = DEMO_USERS.admin.fullName;
    }
    if (session.username === "user") {
      session.username = DEMO_USERS.user.username;
      session.fullName = DEMO_USERS.user.fullName;
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    localStorage.removeItem(SESSION_KEY);
  }
}

function hydrateSession() {
  if (FORCED_ROLE && DEMO_USERS[FORCED_ROLE]) {
    const forcedAccount = DEMO_USERS[FORCED_ROLE];
    currentSession = {
      username: forcedAccount.username,
      role: forcedAccount.role,
      fullName: forcedAccount.fullName,
    };
    updateSessionUi();
    return;
  }
  try {
    currentSession = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    currentSession = null;
  }
  updateSessionUi();
}

function handleLogin(event) {
  event.preventDefault();
  const username = els.loginUsername.value.trim();
  const password = els.loginPassword.value.trim();
  const account = Object.values(DEMO_USERS).find((user) => user.username === username && user.password === password);

  if (!account) {
    els.loginStatus.textContent = `Неверный логин или пароль. Используйте ${DEMO_USERS.admin.username}/${DEMO_USERS.admin.password} или ${DEMO_USERS.user.username}/${DEMO_USERS.user.password}.`;
    return;
  }

  currentSession = {
    username: account.username,
    role: account.role,
    fullName: account.fullName,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(currentSession));
  els.loginPassword.value = "";
  els.loginStatus.textContent = "Вход выполнен.";
  updateSessionUi();
}

function logout() {
  if (FORCED_ROLE) {
    window.location.href = "index.html";
    return;
  }
  currentSession = null;
  localStorage.removeItem(SESSION_KEY);
  els.loginUsername.value = "";
  els.loginPassword.value = "";
  stopSpeechPlayback();
  if (isListening && speechRecognition) {
    speechRecognition.stop();
  }
  updateSessionUi();
}

function updateSessionUi() {
  const loggedIn = Boolean(currentSession);
  els.authScreen.classList.toggle("hidden", loggedIn || Boolean(FORCED_ROLE));
  els.appContent.classList.toggle("hidden", !loggedIn);

  if (!loggedIn) {
    return;
  }

  const isAdmin = currentSession.role === "admin";
  els.sessionRole.textContent = isAdmin ? "Администратор" : "Пациент";
  els.sessionUser.textContent = `${currentSession.fullName} (${currentSession.username})`;
  document.querySelectorAll(".admin-only").forEach((element) => {
    element.classList.toggle("hidden", !isAdmin);
  });
  els.adminPortal.classList.toggle("hidden", !isAdmin);
  els.userPortal.classList.toggle("hidden", isAdmin);

  renderAdminProfiles();
  renderRolePortals();
}

function renderAdminProfiles() {
  els.adminProfiles.innerHTML = DEMO_ADMINS.map((admin) => `
    <article class="profile-card">
      <h3>${escapeHtml(admin.fullName)}</h3>
      <p class="muted">${escapeHtml(admin.title)}</p>
      <p>Профиль: ${escapeHtml(admin.login)}</p>
    </article>
  `).join("");
}

function renderRolePortals() {
  const cases = loadDemoCases();
  if (currentSession?.role === "admin") {
    renderAdminCases(cases);
  } else if (currentSession?.role === "user") {
    const userCases = cases.filter((item) => item.patientUsername === currentSession.username);
    renderUserPortal(userCases.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]);
  }
}

function renderAdminCases(cases) {
  const newCaseButton = `
    <article class="case-card">
      <p class="section-kicker">Новая запись</p>
      <h3>Создать новое обращение</h3>
      <p class="muted">Координатор открывает новое обращение и подготавливает онлайн-опрос для пациента.</p>
      <div class="case-actions">
        <button class="primary-btn" type="button" data-demo-action="new-case">Создать обращение</button>
      </div>
    </article>
  `;

  els.adminCases.innerHTML = newCaseButton + cases.map((caseItem, index) => `
    <article class="case-card">
      <p class="section-kicker">${escapeHtml(caseItem.title || `Обращение #${index + 1}`)}</p>
      <h3>${escapeHtml(caseItem.disease)}</h3>
      <p class="muted">${escapeHtml(caseItem.patientName)}</p>
      <p><span class="status-badge ${caseItem.adminApproved ? "" : "warn"}">${escapeHtml(caseItem.status)}</span></p>
      <div class="case-step-list">
        <div class="case-step"><strong>Онлайн-тест</strong>${caseItem.testApproved ? "Разрешён" : "Ожидает разрешения"}</div>
        <div class="case-step"><strong>Результат пациента</strong>${escapeHtml(caseItem.testResult || "Ещё не загружен")}</div>
        <div class="case-step"><strong>Вердикт нейросети</strong>${escapeHtml(caseItem.aiOpinion?.summary_for_doctor || caseItem.neuralVerdict || "Ещё не рассчитан")}</div>
        <div class="case-step"><strong>Маршрут</strong>${escapeHtml(caseItem.ward || caseItem.doctorRedirect || "Не назначен")}</div>
        <div class="case-step"><strong>Красные флаги</strong>${escapeHtml((caseItem.aiOpinion?.red_flags || []).join(", ") || "Не выделены")}</div>
      </div>
      ${renderQuestionnaireAnswers(caseItem.questionnaireAnswers)}
      <div class="case-actions">
        <button class="ghost-btn" type="button" data-demo-action="approve-test" data-demo-case="${caseItem.id}">Разрешить тест</button>
        <button class="ghost-btn" type="button" data-demo-action="neural-check" data-demo-case="${caseItem.id}">Сверить с нейросетью</button>
        <button class="ghost-btn" type="button" data-demo-action="doctor-approve" data-demo-case="${caseItem.id}">Подтвердить врачом</button>
        <button class="ghost-btn" type="button" data-demo-action="route-ward" data-demo-case="${caseItem.id}">Направить в палату</button>
        <button class="ghost-btn" type="button" data-demo-action="reset-case" data-demo-case="${caseItem.id}">Обнулить опрос</button>
        <button class="ghost-btn" type="button" data-demo-action="delete-case" data-demo-case="${caseItem.id}">Удалить обращение</button>
      </div>
    </article>
  `).join("");

  els.adminCases.querySelectorAll("[data-demo-action]").forEach((button) => {
    button.addEventListener("click", () => handleAdminCaseAction(button.dataset.demoCase, button.dataset.demoAction));
  });
}

function renderUserPortal(caseItem) {
  const account = DEMO_USERS.user;
  els.userProfileCard.innerHTML = `
    <div class="profile-card">
      <h3>${escapeHtml(account.fullName)}</h3>
      <p class="muted">Личный кабинет пациента</p>
      <p>Возраст: ${escapeHtml(String(account.age))}</p>
      <p>Цель: проверить себя на ${escapeHtml(caseItem?.disease || "заболевание")}</p>
    </div>
  `;

  if (!caseItem) {
    els.userCaseCard.innerHTML = `<div class="empty-state"><p>Обращение не найдено.</p></div>`;
    return;
  }

  els.userCaseCard.innerHTML = `
    <article class="profile-card">
      <p class="section-kicker">${escapeHtml(caseItem.title || "Обращение")}</p>
      <h3>${escapeHtml(caseItem.disease)}</h3>
      <p><span class="status-badge ${caseItem.adminApproved ? "" : "warn"}">${escapeHtml(caseItem.status)}</span></p>
      <div class="case-step-list">
        <div class="case-step"><strong>Разрешение на тест</strong>${caseItem.testApproved ? "Получено" : "Ожидает администратора"}</div>
      <div class="case-step"><strong>Онлайн-тест</strong>${caseItem.testCompleted ? "Пройден" : "Не пройден"}</div>
      <div class="case-step"><strong>Вердикт нейросети</strong>${escapeHtml(caseItem.aiOpinion?.patient_message || caseItem.neuralVerdict || "Ожидается")}</div>
      <div class="case-step"><strong>Вердикт врача</strong>${caseItem.adminApproved ? "Подтверждён" : "Ожидается"}</div>
        <div class="case-step"><strong>Направление</strong>${escapeHtml(caseItem.ward || caseItem.doctorRedirect || "Пока не назначено")}</div>
      </div>
      ${renderQuestionnaireForm(caseItem)}
      <div class="case-actions">
        <button class="ghost-btn" type="button" data-user-action="request-test">Запросить тест</button>
        <button class="ghost-btn" type="button" data-user-action="complete-test" ${caseItem.testApproved ? "" : "disabled"}>Пройти онлайн-тест</button>
      </div>
    </article>
  `;

  els.userCaseCard.querySelectorAll("[data-user-action]").forEach((button) => {
    button.addEventListener("click", () => handleUserCaseAction(caseItem.id, button.dataset.userAction));
  });
  els.userCaseCard.querySelectorAll("[data-questionnaire-submit]").forEach((button) => {
    button.addEventListener("click", () => submitQuestionnaire(caseItem.id));
  });
}

function handleUserCaseAction(caseId, action) {
  const cases = loadDemoCases();
  const caseItem = cases.find((item) => item.id === caseId);
  if (!caseItem) {
    return;
  }

  if (action === "request-test") {
    caseItem.requestedAt = new Date().toISOString();
    caseItem.status = "Пациент ждёт разрешения на онлайн-тест";
  }

  if (action === "complete-test" && caseItem.testApproved) {
    caseItem.testCompleted = true;
    caseItem.testResult = "Ответы опросника заполнены. Ожидается оценка нейросети";
    caseItem.status = "Тест пройден. Ожидается нейросеть и врач";
  }

  saveDemoCases(cases);
  renderRolePortals();
}

function handleAdminCaseAction(caseId, action) {
  const cases = loadDemoCases();
  if (action === "new-case") {
    cases.unshift(buildNewDemoCase(cases.length + 1));
    saveDemoCases(cases);
    renderRolePortals();
    return;
  }
  const caseItem = cases.find((item) => item.id === caseId);
  if (!caseItem) {
    return;
  }

  if (action === "approve-test") {
    caseItem.testApproved = true;
    caseItem.status = "Тест разрешён. Пациент может проходить обследование";
  }

  if (action === "neural-check") {
    if (hasUsableAiOpinion(caseItem.aiOpinion)) {
      caseItem.status = "Нейросеть дала заключение. Ожидается подтверждение врача";
      caseItem.neuralVerdict = caseItem.aiOpinion.summary_for_doctor || "Нейросеть завершила анализ";
    } else if (caseItem.testCompleted) {
      caseItem.status = "Мнение нейросети не получено. Нужна ручная проверка врача";
      caseItem.neuralVerdict = "Не удалось получить мнение нейросети";
      caseItem.doctorRedirect = "";
      caseItem.ward = "";
    } else {
      caseItem.status = "Сначала пациент должен заполнить опросник";
      caseItem.neuralVerdict = "Нейросеть ждёт ответы опросника";
    }
  }

  if (action === "doctor-approve") {
    caseItem.adminApproved = true;
    caseItem.status = "Врач подтвердил необходимость дальнейшего лечения";
    if (!caseItem.neuralVerdict) {
      caseItem.neuralVerdict = "Нейросеть: данных мало, решение подтверждено врачом вручную";
    }
  }

  if (action === "route-ward") {
    caseItem.ward = "Палата эндокринологии";
    caseItem.doctorRedirect = "Направлен к эндокринологу";
    caseItem.status = "Пациент направлен в нужную палату";
  }

  if (action === "reset-case") {
    const index = cases.findIndex((item) => item.id === caseId);
    cases[index] = resetDemoCase(caseItem);
  }

  if (action === "delete-case") {
    const filteredCases = cases.filter((item) => item.id !== caseId);
    saveDemoCases(filteredCases);
    renderRolePortals();
    return;
  }

  saveDemoCases(cases);
  renderRolePortals();
}

function renderQuestionnaireForm(caseItem) {
  const disabled = !caseItem.testApproved ? "disabled" : "";
  const answers = caseItem.questionnaireAnswers || {};
  const fields = T1DM_QUESTIONNAIRE.questions.map((question) => {
    if (question.type === "boolean") {
      return `
        <label class="field">
          <span>${escapeHtml(question.label)}</span>
          <select data-question-id="${question.id}" ${disabled}>
            <option value="">Выберите</option>
            <option value="да" ${answers[question.id] === "да" ? "selected" : ""}>Да</option>
            <option value="нет" ${answers[question.id] === "нет" ? "selected" : ""}>Нет</option>
          </select>
        </label>
      `;
    }
    if (question.type === "choice") {
      return `
        <label class="field">
          <span>${escapeHtml(question.label)}</span>
          <select data-question-id="${question.id}" ${disabled}>
            <option value="">Выберите</option>
            ${question.options.map((option) => `<option value="${escapeHtml(option)}" ${answers[question.id] === option ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
          </select>
        </label>
      `;
    }
    return `
      <label class="field">
        <span>${escapeHtml(question.label)}</span>
        <textarea data-question-id="${question.id}" rows="3" ${disabled}>${escapeHtml(answers[question.id] || "")}</textarea>
      </label>
    `;
  }).join("");

  return `
    <section class="panel">
      <div class="panel-head">
        <h3>${escapeHtml(T1DM_QUESTIONNAIRE.title)}</h3>
      </div>
      <p class="muted">Источник: ${escapeHtml(T1DM_QUESTIONNAIRE.source)}. Нейросеть формирует мнение для врача, а не диагноз.</p>
      ${fields}
      <div class="case-actions">
        <button class="ghost-btn" type="button" data-questionnaire-submit="true" ${disabled}>Отправить ответы нейросети</button>
      </div>
    </section>
  `;
}

function renderQuestionnaireAnswers(answers = {}) {
  const entries = Object.entries(answers).filter(([, value]) => String(value || "").trim());
  if (!entries.length) {
    return `<div class="case-step-list"><div class="case-step"><strong>Ответы опросника</strong>Пациент ещё не заполнил опросник</div></div>`;
  }
  return `
    <div class="case-step-list">
      <div class="case-step"><strong>Ответы опросника</strong>${entries.map(([key, value]) => `${escapeHtml(questionLabelById(key))}: ${escapeHtml(String(value))}`).join("<br>")}</div>
    </div>
  `;
}

function questionLabelById(id) {
  return T1DM_QUESTIONNAIRE.questions.find((question) => question.id === id)?.label || id;
}

async function submitQuestionnaire(caseId) {
  const cases = loadDemoCases();
  const caseItem = cases.find((item) => item.id === caseId);
  if (!caseItem) {
    return;
  }

  const answers = {};
  els.userCaseCard.querySelectorAll("[data-question-id]").forEach((field) => {
    answers[field.dataset.questionId] = field.value.trim();
  });
  caseItem.questionnaireAnswers = answers;
  caseItem.testCompleted = true;
  caseItem.status = "Опросник отправлен. Нейросеть оценивает ответы";
  caseItem.testResult = "Опросник заполнен";
  saveDemoCases(cases);
  renderRolePortals();

  try {
    const response = await fetch("/api/questionnaire-opinion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: T1DM_QUESTIONNAIRE.title,
        patient: {
          full_name: caseItem.patientName,
          age: DEMO_USERS.user.age,
        },
        answers,
      }),
    });
    if (!response.ok) {
      const details = await safeJson(response);
      throw new Error(details?.error || `Questionnaire request failed with ${response.status}`);
    }
    const data = await response.json();
    caseItem.aiOpinion = data.opinion || null;
    if (hasUsableAiOpinion(caseItem.aiOpinion)) {
      caseItem.neuralVerdict = data.opinion?.summary_for_doctor || "Нейросеть обработала опросник";
      caseItem.status = data.opinion?.needs_urgent_review
        ? "Нейросеть выделила срочные признаки. Нужен врач"
        : "Нейросеть завершила оценку. Ожидается врач";
    } else {
      caseItem.neuralVerdict = "Не удалось получить мнение нейросети";
      caseItem.status = "Опросник заполнен. Мнение нейросети не получено";
    }
    if (hasUsableAiOpinion(caseItem.aiOpinion) && data.opinion?.recommended_route && !caseItem.doctorRedirect) {
      caseItem.doctorRedirect = data.opinion.recommended_route;
    }
  } catch (error) {
    console.error(error);
    caseItem.aiOpinion = {
      status: "error",
      risk_level: "не определён",
      summary_for_doctor: "Не удалось получить мнение нейросети",
      red_flags: [],
      likely_concerns: [],
      recommended_route: "",
      needs_urgent_review: false,
      patient_message: "Нейросеть временно недоступна. Дождитесь врача.",
      error_message: error.message || "Ошибка запроса к нейросети",
    };
    caseItem.neuralVerdict = "Нейросеть временно недоступна";
    caseItem.status = "Опросник заполнен. Ожидается врач";
    caseItem.doctorRedirect = "";
    caseItem.ward = "";
  }

  saveDemoCases(cases);
  renderRolePortals();
}

function hasUsableAiOpinion(aiOpinion) {
  if (!aiOpinion || aiOpinion.status === "error") {
    return false;
  }
  const summary = String(aiOpinion.summary_for_doctor || "").trim();
  if (!summary) {
    return false;
  }
  const invalidSummaries = new Set([
    "Не удалось получить мнение нейросети",
    "Нейросеть временно недоступна",
  ]);
  return !invalidSummaries.has(summary);
}

els.fileInput.addEventListener("change", handleFileUpload);
els.loginForm.addEventListener("submit", handleLogin);
els.logoutBtn.addEventListener("click", logout);
els.documentMode.addEventListener("change", handleDocumentModeChange);
els.preprocessBtn.addEventListener("click", preprocessSelectedImage);
els.ocrBtn.addEventListener("click", runImageOcr);
els.fillDemo.addEventListener("click", () => {
  els.caseTitle.value = "Выписка после амбулаторного приёма";
  els.documentText.value = demoText;
});
els.clearBtn.addEventListener("click", clearForm);
els.parseBtn.addEventListener("click", parseCurrentText);
els.tuningField.addEventListener("change", syncTuningInputs);
els.applyTuning.addEventListener("click", applyFieldTuning);
els.resetTuning.addEventListener("click", resetFieldTuning);
els.openChat.addEventListener("click", openChat);
els.closeChat.addEventListener("click", () => {
  stopSpeechPlayback();
  els.chatModal.close();
});
els.editStructured.addEventListener("click", openStructuredEditor);
els.chatForm.addEventListener("submit", submitChatQuestion);
els.micBtn.addEventListener("click", toggleVoiceInput);
els.downloadJson.addEventListener("click", downloadCurrentCase);
els.closeSavedCaseEdit.addEventListener("click", () => {
  editingSavedCaseId = null;
  els.savedCaseEditModal.close();
});
els.cancelSavedCaseEdit.addEventListener("click", () => {
  editingSavedCaseId = null;
  els.savedCaseEditModal.close();
});
els.savedCaseEditForm.addEventListener("submit", submitSavedCaseEdit);
els.closeStructuredEdit.addEventListener("click", () => els.structuredEditModal.close());
els.cancelStructuredEdit.addEventListener("click", () => els.structuredEditModal.close());
els.structuredEditForm.addEventListener("submit", submitStructuredEdit);
els.seedDatabaseBtn?.addEventListener("click", seedDemoDatabaseFromUi);

renderSavedCases();
loadPatients();
syncTuningInputs();
setupVoiceFeatures();
bindSpeechButtons();
checkAiHealth();
ensureDemoCases();
ensureSavedCases();
migrateStoredSession();
hydrateSession();

function handleFileUpload(event) {
  const [file] = event.target.files;
  if (!file) {
    resetImageWorkflow();
    return;
  }

  if (file.type.startsWith("image/")) {
    pendingImageFile = file;
    processedImageBlob = null;
    els.previewPanel.classList.remove("hidden");
    els.sourceImagePreview.src = URL.createObjectURL(file);
    els.processedImagePreview.removeAttribute("src");
    els.preprocessMeta.textContent = "Сервер сохраняет исходную ориентацию, обрезает и усиливает контраст перед распознаванием.";
    els.preprocessBtn.disabled = false;
    els.ocrBtn.disabled = false;
    els.ocrStatus.textContent = `Изображение выбрано: ${file.name}. Идёт подготовка к распознаванию...`;
    if (!els.caseTitle.value.trim()) {
      els.caseTitle.value = stripFileExtension(file.name);
    }
    preprocessSelectedImage();
    return;
  }

  resetImageWorkflow();
  els.ocrBtn.disabled = true;
  els.preprocessBtn.disabled = true;
  els.ocrStatus.textContent = "Файл прочитан как текстовый документ.";
  const reader = new FileReader();
  reader.onload = () => {
    els.documentText.value = typeof reader.result === "string" ? reader.result : "";
    if (!els.caseTitle.value.trim()) {
      els.caseTitle.value = stripFileExtension(file.name);
    }
  };
  reader.readAsText(file, "utf-8");
}

function clearForm() {
  els.caseTitle.value = "";
  els.documentText.value = "";
  els.fileInput.value = "";
  currentCase = null;
  els.editStructured.disabled = true;
  resetImageWorkflow();
}

function handleDocumentModeChange() {
  toggleFieldTuning(getEffectiveParseMode() === "form");
  syncTuningInputs();
}

function resetImageWorkflow() {
  pendingImageFile = null;
  processedImageBlob = null;
  printedImageBlob = null;
  handwritingImageBlob = null;
  preprocessResult = null;
  lastAiScanResult = null;
  els.preprocessBtn.disabled = true;
  els.ocrBtn.disabled = true;
  els.ocrStatus.textContent = "Для изображений PNG/JPG/WebP доступно распознавание текста через GigaChat API.";
  els.previewPanel.classList.add("hidden");
  els.fieldTuningPanel.classList.add("hidden");
  if (els.sourceImagePreview.src.startsWith("blob:")) {
    URL.revokeObjectURL(els.sourceImagePreview.src);
  }
  els.sourceImagePreview.removeAttribute("src");
  els.processedImagePreview.removeAttribute("src");
  els.printedImagePreview.removeAttribute("src");
  els.handwritingImagePreview.removeAttribute("src");
  els.printedPreviewCard.classList.add("hidden");
  els.handwritingPreviewCard.classList.add("hidden");
  els.preprocessMeta.textContent = "Сервер сохраняет исходную ориентацию и усиливает контраст перед распознаванием.";
}

async function preprocessSelectedImage() {
  if (!pendingImageFile) {
    return;
  }

  els.preprocessBtn.disabled = true;
  els.ocrStatus.textContent = "Подготовка изображения на сервере...";

  try {
    const response = await fetch("/api/preprocess-image", {
      method: "POST",
      headers: {
        "Content-Type": pendingImageFile.type || "application/octet-stream",
        "X-Filename": encodeURIComponent(pendingImageFile.name),
        "X-Document-Mode": getSelectedMode(),
      },
      body: pendingImageFile,
    });

    if (!response.ok) {
      const details = await safeJson(response);
      throw new Error(details?.error || `Preprocess request failed with ${response.status}`);
    }

    const data = await response.json();
    preprocessResult = data;
    els.previewPanel.classList.remove("hidden");
    toggleFieldTuning(getSelectedMode() === "form" || data.mode === "form");
    els.sourceImagePreview.src = data.original_preview;
    els.processedImagePreview.src = data.processed_preview;
    els.preprocessMeta.textContent = `Поворот отключён. Размер после обработки: ${data.processed_size.width} x ${data.processed_size.height}.`;
    processedImageBlob = dataUrlToBlob(data.processed_preview);
    printedImageBlob = data.printed_preview ? dataUrlToBlob(data.printed_preview) : null;
    handwritingImageBlob = data.handwriting_preview ? dataUrlToBlob(data.handwriting_preview) : null;
    if (data.printed_preview) {
      els.printedPreviewCard.classList.remove("hidden");
      els.printedImagePreview.src = data.printed_preview;
    } else {
      els.printedPreviewCard.classList.add("hidden");
      els.printedImagePreview.removeAttribute("src");
    }
    if (data.handwriting_preview) {
      els.handwritingPreviewCard.classList.remove("hidden");
      els.handwritingImagePreview.src = data.handwriting_preview;
    } else {
      els.handwritingPreviewCard.classList.add("hidden");
      els.handwritingImagePreview.removeAttribute("src");
    }
    els.ocrStatus.textContent = "Изображение подготовлено. Распознавание будет запущено по улучшенной версии.";
    els.ocrBtn.disabled = false;
  } catch (error) {
    console.error(error);
    processedImageBlob = null;
    printedImageBlob = null;
    handwritingImageBlob = null;
    preprocessResult = null;
    toggleFieldTuning(getSelectedMode() === "form");
    els.ocrStatus.textContent = "Не удалось улучшить изображение. Распознавание будет работать по исходному файлу.";
    els.preprocessMeta.textContent = "Серверная обработка не удалась. Можно попробовать распознавание по исходному изображению.";
    els.printedPreviewCard.classList.add("hidden");
    els.handwritingPreviewCard.classList.add("hidden");
    els.ocrBtn.disabled = false;
  } finally {
    els.preprocessBtn.disabled = false;
  }
}

async function parseCurrentText() {
  const sourceText = els.documentText.value.trim();
  if (!sourceText) {
    alert("Добавьте текст документа.");
    return;
  }

  const extracted = extractMedicalData(sourceText, getEffectiveParseMode());
  const aiExtracted = buildExtractedFromAiScan(lastAiScanResult, sourceText, getEffectiveParseMode());
  const finalExtracted = aiExtracted || extracted;
  const caseRecord = {
    id: crypto.randomUUID(),
    title: els.caseTitle.value.trim() || finalExtracted.document.type || "Без названия",
    createdAt: new Date().toISOString(),
    extracted: finalExtracted,
    sourceText,
  };

  currentCase = caseRecord;
  renderCase(caseRecord);
  persistCase(caseRecord);
  await saveCaseToDatabase(caseRecord);
}

async function runImageOcr() {
  if (!pendingImageFile) {
    alert("Сначала выберите изображение.");
    return;
  }
  if (!aiAvailable) {
    els.ocrStatus.textContent = "Распознавание через GigaChat недоступно. Проверьте GIGACHAT_AUTH_KEY и перезапустите server.py.";
    return;
  }

  els.ocrBtn.disabled = true;
  els.ocrStatus.textContent = "Идёт распознавание текста через GigaChat API...";

  try {
    const scan = await scanImageWithAi();
    lastAiScanResult = scan;
    const recognized = scan.raw_text?.trim() || "";
    if (scan.document_type === "Медицинская справка") {
      els.documentMode.value = "form";
    }
    els.documentText.value = recognized;
    els.ocrStatus.textContent = recognized
      ? "Распознавание через GigaChat завершено. Текст добавлен в поле документа."
      : "Распознавание завершено, но уверенный текст не найден.";
  } catch (error) {
    console.error(error);
    lastAiScanResult = null;
    els.ocrStatus.textContent = `Ошибка распознавания через GigaChat API: ${error.message}`;
  } finally {
    els.ocrBtn.disabled = false;
  }
}

async function scanImageWithAi() {
  const scanSource = processedImageBlob || pendingImageFile;
  const response = await fetch("/api/scan-image", {
    method: "POST",
    headers: {
      "Content-Type": scanSource.type || pendingImageFile?.type || "image/png",
      "X-Document-Mode": getSelectedMode(),
      "X-Field-Overrides": JSON.stringify(fieldOverrides),
    },
    body: scanSource,
  });

  if (!response.ok) {
    const details = await safeJson(response);
    const serverError = [details?.error, details?.details].filter(Boolean).join(" ");
    throw new Error(serverError || `Распознавание не выполнено: ${response.status}`);
  }

  const data = await response.json();
  if (data.model) {
    els.ocrStatus.textContent = `Распознавание через GigaChat: ${data.model}`;
  }
  return data.scan || {};
}

function extractMedicalData(text, mode = "auto") {
  const normalized = text.replace(/\r/g, "");
  const lines = normalized.split("\n").map((line) => line.trim()).filter(Boolean);
  const documentType = inferDocumentType(normalized, mode);
  const isFormMode = mode === "form" || documentType === "Медицинская справка";

  if (isFormMode) {
    return extractFormCertificateData(normalized, lines, documentType);
  }

  const patient = {
    name: matchValue(normalized, [
      /Пациент[:\-]\s*([^\n]+)/i,
      /ФИО[:\-]\s*([^\n]+)/i,
    ]) || inferPersonLine(lines),
    birthDate: matchValue(normalized, [
      /Дата рождения[:\-]\s*([0-3]?\d[.\-/][01]?\d[.\-/]\d{2,4})/i,
    ]) || "",
  };

  const document = {
    type: documentType,
    date: matchValue(normalized, [
      /Дата документа[:\-]\s*([0-3]?\d[.\-/][01]?\d[.\-/]\d{2,4})/i,
      /Дата[:\-]\s*([0-3]?\d[.\-/][01]?\d[.\-/]\d{2,4})/i,
    ]) || "",
    facility: matchValue(normalized, [
      /Медицинская организация[:\-]\s*([^\n]+)/i,
      /Клиника[:\-]\s*([^\n]+)/i,
      /Лаборатория[:\-]\s*([^\n]+)/i,
    ]) || "",
  };

  const doctor = {
    name: matchValue(normalized, [
      /Врач[:\-]\s*([^\n]+)/i,
      /Лечащий врач[:\-]\s*([^\n]+)/i,
    ]) || "",
  };

  const diagnoses = extractDiagnoses(normalized);
  const medications = extractMedications(lines);
  const labs = extractLabs(lines);
  const complaints = extractComplaints(normalized);
  const summary = buildSummary({ patient, document, diagnoses, medications, labs, complaints });

  return {
    patient,
    document,
    doctor,
    diagnoses,
    complaints,
    medications,
    labs,
    summary,
  };
}

function matchValue(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return "";
}

function inferPersonLine(lines) {
  const match = lines.find((line) => /[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+/.test(line));
  return match || "";
}

function inferDocumentTypeByText(lowered) {
  if (lowered.includes("медицинская справка") || lowered.includes("форма № 086")) {
    return "Медицинская справка";
  }
  if (lowered.includes("выписка")) {
    return "Выписка";
  }
  if (lowered.includes("анализ")) {
    return "Результаты анализов";
  }
  if (lowered.includes("рецепт")) {
    return "Рецепт";
  }
  if (lowered.includes("рентген") || lowered.includes("кт") || lowered.includes("мрт")) {
    return "Описание снимка";
  }
  return "Медицинский документ";
}

function inferDocumentType(text, mode = "auto") {
  const lowered = text.toLowerCase();
  if (mode === "form") {
    return "Медицинская справка";
  }
  return inferDocumentTypeByText(lowered);
}

function extractDiagnoses(text) {
  const direct = matchValue(text, [
    /Диагноз[:\-]\s*([^\n]+)/i,
    /Диагнозы[:\-]\s*([^\n]+)/i,
    /Заключение[:\-]\s*([^\n]+)/i,
  ]);

  const source = direct || "";
  return source
    .split(/[.;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractComplaints(text) {
  const complaints = matchValue(text, [
    /Жалобы[:\-]\s*([^\n]+)/i,
  ]);

  return complaints
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractMedications(lines) {
  const medLines = [];
  let inSection = false;

  for (const line of lines) {
    if (/Назначения[:\-]/i.test(line) || /Рекомендовано[:\-]/i.test(line)) {
      inSection = true;
      continue;
    }

    if (inSection && /^(Рекомендации|Лабораторные результаты|Диагноз)/i.test(line)) {
      inSection = false;
    }

    if (!inSection) {
      continue;
    }

    if (inSection && /^[А-ЯЁA-Z].*/.test(line)) {
      medLines.push(line);
      continue;
    }
  }

  return medLines.filter((line) => /\d/.test(line)).map((line) => line.replace(/^\-\s*/, ""));
}

function extractLabs(lines) {
  const labPattern = /^([A-Za-zА-Яа-яЁё0-9\s%()"/+-]+?)\s*[-:]\s*([\d.,]+)\s*([A-Za-zА-Яа-яЁё/%µмкМольлLdl-]*)\s*(?:\(?(?:норма|референс|ref)\s*([<>]?\s*[\d.,]+\s*[-–]\s*[\d.,]+|[<>]?\s*[\d.,]+)\)?)?$/i;

  return lines
    .map((line) => {
      const match = line.match(labPattern);
      if (!match) {
        return null;
      }

      const value = Number(match[2].replace(",", "."));
      const rangeText = (match[4] || "").replace(/\s+/g, "");
      const status = evaluateRange(value, rangeText);

      return {
        name: match[1].trim(),
        value: match[2].trim(),
        unit: (match[3] || "").trim(),
        range: formatRange(rangeText),
        status,
      };
    })
    .filter(Boolean);
}

function evaluateRange(value, rangeText) {
  if (!rangeText) {
    return "unknown";
  }

  if (rangeText.includes("-") || rangeText.includes("–")) {
    const [min, max] = rangeText.split(/[-–]/).map((item) => Number(item.replace(",", ".")));
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return "unknown";
    }
    if (value < min) {
      return "low";
    }
    if (value > max) {
      return "high";
    }
    return "normal";
  }

  const numeric = Number(rangeText.replace(/[<>]/g, "").replace(",", "."));
  if (!Number.isFinite(numeric)) {
    return "unknown";
  }
  if (rangeText.startsWith("<")) {
    return value < numeric ? "normal" : "high";
  }
  if (rangeText.startsWith(">")) {
    return value > numeric ? "normal" : "low";
  }
  return "unknown";
}

function formatRange(rangeText) {
  if (!rangeText) {
    return "Не указана";
  }
  return rangeText.replace("-", " - ").replace("–", " - ");
}

function buildSummary({ patient, document, diagnoses, medications, labs, complaints }) {
  const parts = [];

  if (patient.name) {
    parts.push(`Пациент ${patient.name}`);
  }

  if (document.type) {
    parts.push(`тип документа: ${document.type.toLowerCase()}`);
  }

  if (diagnoses.length) {
    parts.push(`выявлены: ${diagnoses.slice(0, 2).join(", ")}`);
  }

  const abnormalLabs = labs.filter((lab) => lab.status === "high" || lab.status === "low");
  if (abnormalLabs.length) {
    parts.push(`отклонения по анализам: ${abnormalLabs.map((lab) => lab.name).join(", ")}`);
  }

  if (medications.length) {
    parts.push(`назначений: ${medications.length}`);
  }

  if (complaints.length) {
    parts.push(`жалобы: ${complaints.slice(0, 3).join(", ")}`);
  }

  return parts.length ? `${parts.join(". ")}.` : "Ключевые сущности не были уверенно найдены.";
}

function renderCase(caseRecord) {
  const { extracted, sourceText } = caseRecord;
  const combinedPatientMeta = [extracted.patient.birthDate && `Дата рождения: ${extracted.patient.birthDate}`]
    .filter(Boolean)
    .join(" ");
  const documentMeta = [extracted.document.date && `Дата: ${extracted.document.date}`]
    .filter(Boolean)
    .join(" ");

  els.emptyState.classList.add("hidden");
  els.results.classList.remove("hidden");
  els.downloadJson.disabled = false;
  els.openChat.disabled = false;
  els.editStructured.disabled = false;

  els.summaryText.textContent = extracted.summary || "Сводка не сформирована.";
  els.patientName.textContent = extracted.patient.name || "Не найден";
  els.patientMeta.textContent = combinedPatientMeta || "Дата рождения не указана";
  els.documentType.textContent = extracted.document.type || "Не найден";
  els.documentDate.textContent = documentMeta || "Дата документа не указана";
  els.doctorName.textContent = extracted.doctor.name || "Не найден";
  els.facilityName.textContent = extracted.document.facility || "Организация не указана";
  els.sourcePreview.textContent = sourceText;

  renderDiagnosisTags(extracted);
  renderMedications(extracted.medications);
  renderFormFields(extracted.formFields || {});
  renderLabs(extracted.labs);
}

function renderDiagnosisTags(extracted) {
  const combined = [...extracted.diagnoses, ...extracted.complaints];
  els.diagnosisList.innerHTML = combined.length
    ? combined.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
    : `<li>Не найдено</li>`;
}

function renderMedications(medications) {
  els.medicationList.innerHTML = medications.length
    ? medications.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
    : `<li>Назначения не найдены</li>`;
}

function renderFormFields(formFields) {
  const entries = Object.entries(formFields).filter(([, value]) => value);
  if (!entries.length) {
    els.formFieldsPanel.classList.add("hidden");
    els.formFieldsList.innerHTML = "";
    return;
  }

  els.formFieldsPanel.classList.remove("hidden");
  els.formFieldsList.innerHTML = entries
    .map(([key, value]) => `<li><strong>${escapeHtml(labelForFormField(key))}:</strong> ${escapeHtml(value)}</li>`)
    .join("");
}

function renderLabs(labs) {
  els.labsTable.innerHTML = labs.length
    ? labs.map((lab) => {
      const statusMap = {
        normal: { label: "Норма", className: "status-normal" },
        high: { label: "Выше", className: "status-high" },
        low: { label: "Ниже", className: "status-low" },
        unknown: { label: "Без оценки", className: "status-normal" },
      };
      const status = statusMap[lab.status] || statusMap.unknown;
      return `
        <tr>
          <td>${escapeHtml(lab.name)}</td>
          <td>${escapeHtml([lab.value, lab.unit].filter(Boolean).join(" "))}</td>
          <td>${escapeHtml(lab.range)}</td>
          <td><span class="status-pill ${status.className}">${status.label}</span></td>
        </tr>
      `;
    }).join("")
    : `<tr><td colspan="4">Показатели не найдены</td></tr>`;
}

function persistCase(caseRecord) {
  const cases = loadCases();
  cases.unshift(caseRecord);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cases.slice(0, 12)));
  renderSavedCases();
}

function renderSavedCases() {
  const cases = loadCases();

  if (!cases.length) {
    els.savedCases.innerHTML = `<div class="empty-state"><p>Сохранённых обращений пока нет.</p></div>`;
    return;
  }

  els.savedCases.innerHTML = cases.map((caseRecord) => {
    const diagnosis = caseRecord.extracted?.diagnoses?.[0] || "Без диагноза";
    return `
      <article class="case-card">
        <p class="section-kicker">${formatDate(caseRecord.createdAt)}</p>
        <h3>${escapeHtml(caseRecord.title)}</h3>
        <p class="muted">${escapeHtml(caseRecord.extracted?.patient?.name || "Пациент не указан")}</p>
        <p>${escapeHtml(diagnosis)}</p>
        <div class="case-actions">
          <button data-case-id="${caseRecord.id}" class="ghost-btn" type="button">Открыть обращение</button>
          <button data-edit-case-id="${caseRecord.id}" class="ghost-btn" type="button">Редактировать</button>
          <button data-delete-case-id="${caseRecord.id}" class="ghost-btn" type="button">Удалить обращение</button>
        </div>
      </article>
    `;
  }).join("");

  document.querySelectorAll("[data-case-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const selected = cases.find((item) => item.id === button.dataset.caseId);
      if (selected) {
        currentCase = selected;
        renderCase(selected);
      }
    });
  });

  document.querySelectorAll("[data-delete-case-id]").forEach((button) => {
    button.addEventListener("click", () => {
      deleteSavedCase(button.dataset.deleteCaseId);
    });
  });

  document.querySelectorAll("[data-edit-case-id]").forEach((button) => {
    button.addEventListener("click", () => {
      openSavedCaseEditor(button.dataset.editCaseId);
    });
  });
}

async function deleteSavedCase(caseId) {
  const cases = loadCases();
  const caseRecord = cases.find((item) => item.id === caseId);
  if (!caseRecord) {
    return;
  }

  let documentId = caseRecord.dbDocumentId || null;
  if (!documentId) {
    documentId = await resolveDocumentIdForCase(caseRecord);
  }

  if (documentId) {
    try {
      const response = await fetch(`/api/documents/${documentId}`, { method: "DELETE" });
      if (!response.ok) {
        const details = await safeJson(response);
        throw new Error(details?.error || `delete document failed with ${response.status}`);
      }
    } catch (error) {
      console.error(error);
    }
  }

  const remainingCases = cases.filter((item) => item.id !== caseId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(remainingCases));

  if (currentCase?.id === caseId) {
    currentCase = null;
    els.results.classList.add("hidden");
    els.emptyState.classList.remove("hidden");
    els.downloadJson.disabled = true;
    els.openChat.disabled = true;
    els.editStructured.disabled = true;
  }

  renderSavedCases();
  await loadPatients();
}

function saveEditedSavedCase(caseId, payload) {
  const cases = loadCases();
  const caseIndex = cases.findIndex((item) => item.id === caseId);
  if (caseIndex === -1) {
    return;
  }

  const caseRecord = structuredClone(cases[caseIndex]);
  caseRecord.title = payload.title || "Без названия";
  caseRecord.extracted = caseRecord.extracted || {};
  caseRecord.extracted.patient = caseRecord.extracted.patient || {};
  caseRecord.extracted.patient.name = payload.patientName || "Пациент не указан";
  caseRecord.extracted.summary = payload.summary || caseRecord.extracted.summary || "";

  const diagnoses = Array.isArray(caseRecord.extracted.diagnoses) ? [...caseRecord.extracted.diagnoses] : [];
  if (payload.diagnosis) {
    if (diagnoses.length) {
      diagnoses[0] = payload.diagnosis;
    } else {
      diagnoses.push(payload.diagnosis);
    }
  } else if (diagnoses.length) {
    diagnoses.shift();
  }
  caseRecord.extracted.diagnoses = diagnoses;

  cases[caseIndex] = caseRecord;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));

  if (currentCase?.id === caseId) {
    currentCase = caseRecord;
    renderCase(caseRecord);
  }

  renderSavedCases();
}

function openSavedCaseEditor(caseId) {
  const caseRecord = loadCases().find((item) => item.id === caseId);
  if (!caseRecord) {
    return;
  }

  editingSavedCaseId = caseId;
  els.savedCaseEditTitle.textContent = caseRecord.title || "Обращение";
  els.savedCaseTitleInput.value = caseRecord.title || "";
  els.savedCasePatientInput.value = caseRecord.extracted?.patient?.name || "";
  els.savedCaseDiagnosisInput.value = caseRecord.extracted?.diagnoses?.[0] || "";
  els.savedCaseSummaryInput.value = caseRecord.extracted?.summary || "";
  els.savedCaseEditModal.showModal();
}

function submitSavedCaseEdit(event) {
  event.preventDefault();
  if (!editingSavedCaseId) {
    return;
  }

  saveEditedSavedCase(editingSavedCaseId, {
    title: els.savedCaseTitleInput.value.trim(),
    patientName: els.savedCasePatientInput.value.trim(),
    diagnosis: els.savedCaseDiagnosisInput.value.trim(),
    summary: els.savedCaseSummaryInput.value.trim(),
  });
  els.savedCaseEditModal.close();
  editingSavedCaseId = null;
}

function openStructuredEditor() {
  if (!currentCase) {
    return;
  }

  const extracted = currentCase.extracted || {};
  els.structuredTitleInput.value = currentCase.title || "";
  els.structuredPatientInput.value = extracted.patient?.name || "";
  els.structuredBirthDateInput.value = extracted.patient?.birthDate || "";
  els.structuredDocumentTypeInput.value = extracted.document?.type || "";
  els.structuredDocumentDateInput.value = extracted.document?.date || "";
  els.structuredFacilityInput.value = extracted.document?.facility || "";
  els.structuredDoctorInput.value = extracted.doctor?.name || "";
  els.structuredDiagnosesInput.value = (extracted.diagnoses || []).join("\n");
  els.structuredComplaintsInput.value = (extracted.complaints || []).join("\n");
  els.structuredMedicationsInput.value = (extracted.medications || []).join("\n");
  els.structuredSummaryInput.value = extracted.summary || "";
  els.structuredEditModal.showModal();
}

function submitStructuredEdit(event) {
  event.preventDefault();
  if (!currentCase) {
    return;
  }

  const updatedCase = structuredClone(currentCase);
  updatedCase.title = els.structuredTitleInput.value.trim() || "Без названия";
  updatedCase.extracted = updatedCase.extracted || {};
  updatedCase.extracted.patient = updatedCase.extracted.patient || {};
  updatedCase.extracted.document = updatedCase.extracted.document || {};
  updatedCase.extracted.doctor = updatedCase.extracted.doctor || {};

  updatedCase.extracted.patient.name = els.structuredPatientInput.value.trim();
  updatedCase.extracted.patient.birthDate = els.structuredBirthDateInput.value.trim();
  updatedCase.extracted.document.type = els.structuredDocumentTypeInput.value.trim();
  updatedCase.extracted.document.date = els.structuredDocumentDateInput.value.trim();
  updatedCase.extracted.document.facility = els.structuredFacilityInput.value.trim();
  updatedCase.extracted.doctor.name = els.structuredDoctorInput.value.trim();
  updatedCase.extracted.diagnoses = splitTextareaLines(els.structuredDiagnosesInput.value);
  updatedCase.extracted.complaints = splitTextareaLines(els.structuredComplaintsInput.value);
  updatedCase.extracted.medications = splitTextareaLines(els.structuredMedicationsInput.value);
  updatedCase.extracted.summary = els.structuredSummaryInput.value.trim();

  replaceStoredCase(updatedCase);
  currentCase = updatedCase;
  renderCase(updatedCase);
  renderSavedCases();
  els.structuredEditModal.close();
}

function replaceStoredCase(updatedCase) {
  const cases = loadCases();
  const index = cases.findIndex((item) => item.id === updatedCase.id);
  if (index === -1) {
    return;
  }
  cases[index] = updatedCase;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
}

async function resolveDocumentIdForCase(caseRecord) {
  try {
    const response = await fetch("/api/documents");
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    const documents = Array.isArray(data.documents) ? data.documents : [];
    const patientName = caseRecord.extracted?.patient?.name || "";
    const summary = caseRecord.extracted?.summary || "";
    const documentType = caseRecord.extracted?.document?.type || "";
    const match = documents.find((item) =>
      (item.title || "") === (caseRecord.title || "") &&
      (item.patient_name || "") === patientName &&
      (item.summary || "") === summary &&
      (item.document_type || "") === documentType
    );
    return match?.id || null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

function splitTextareaLines(value) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function loadPatients() {
  try {
    const response = await fetch("/api/patients");
    if (!response.ok) {
      throw new Error(`patients failed with ${response.status}`);
    }
    const data = await response.json();
    renderPatients(Array.isArray(data.patients) ? data.patients : []);
  } catch (error) {
    console.error(error);
    els.patientsList.innerHTML = `<div class="empty-state"><p>Список пациентов недоступен.</p></div>`;
  }
}

async function seedDemoDatabaseFromUi() {
  if (!els.seedDatabaseBtn) {
    return;
  }
  els.seedDatabaseBtn.disabled = true;
  els.seedDatabaseBtn.textContent = "Заполняю...";
  try {
    const response = await fetch("/api/seed-demo-db", { method: "POST" });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `seed failed with ${response.status}`);
    }
    await loadPatients();
    if (data.seeded) {
      els.seedDatabaseBtn.textContent = `Добавлено: ${data.patients} пациентов`;
    } else {
      els.seedDatabaseBtn.textContent = "База уже заполнена";
    }
  } catch (error) {
    console.error(error);
    els.seedDatabaseBtn.textContent = "Ошибка заполнения";
  } finally {
    window.setTimeout(() => {
      if (els.seedDatabaseBtn) {
        els.seedDatabaseBtn.disabled = false;
        els.seedDatabaseBtn.textContent = "Заполнить демо-базу";
      }
    }, 2200);
  }
}

async function saveCaseToDatabase(caseRecord) {
  try {
    const response = await fetch("/api/cases", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(caseRecord),
    });
    if (!response.ok) {
      const details = await safeJson(response);
      throw new Error(details?.error || `save case failed with ${response.status}`);
    }
    const data = await response.json();
    if (data?.document?.id) {
      caseRecord.dbDocumentId = data.document.id;
      caseRecord.dbPatientId = data.document.patient_id;
      replaceStoredCase(caseRecord);
      if (currentCase?.id === caseRecord.id) {
        currentCase = caseRecord;
      }
    }
    await loadPatients();
  } catch (error) {
    console.error(error);
  }
}

function renderPatients(patients) {
  if (!patients.length) {
    els.patientsList.innerHTML = `<div class="empty-state"><p>Пациентов в базе пока нет.</p></div>`;
    return;
  }

  els.patientsList.innerHTML = patients.map((patient) => `
    <article class="case-card">
      <p class="section-kicker">${escapeHtml(patient.last_document_at ? formatDate(patient.last_document_at) : formatDate(patient.created_at))}</p>
      <h3>${escapeHtml(patient.full_name || "Неизвестный пациент")}</h3>
      <p class="muted">${escapeHtml(patient.birth_date || "Дата рождения не указана")}</p>
      <p>${escapeHtml(patient.registration || patient.city || "Адрес не указан")}</p>
      <p class="muted">Документов: ${escapeHtml(String(patient.document_count || 0))}</p>
    </article>
  `).join("");
}

function openChat() {
  if (!currentCase) {
    return;
  }
  resetChat();
  els.chatModal.showModal();
}

function resetChat() {
  stopSpeechPlayback();
  chatHistory = [];
  els.chatLog.innerHTML = `
    <div class="chat-bubble assistant">
      <div class="chat-bubble-top">
        <p>Спросите, что найдено в документе: диагноз, отклонения анализов, назначения, врач, дата или краткая сводка.</p>
        <button class="tts-btn" type="button" aria-label="Озвучить ответ" title="Озвучить ответ">🔊</button>
      </div>
    </div>
  `;
  els.chatInput.value = "";
  els.chatStatus.textContent = aiAvailable
    ? "Помощник использует GigaChat API и ограничен контекстом текущего документа."
    : "GigaChat API не настроен или недоступен.";
  els.voiceStatus.textContent = describeVoiceAvailability();
  bindSpeechButtons();
}

async function submitChatQuestion(event) {
  event.preventDefault();
  const question = els.chatInput.value.trim();
  if (!question || !currentCase) {
    return;
  }

  appendChatMessage("user", question);
  els.chatInput.value = "";
  const pendingBubble = appendChatMessage("assistant", "Думаю...");

  let answer = "";
  try {
    answer = aiAvailable
      ? await askAi(question, currentCase, chatHistory)
      : answerQuestion(question, currentCase);
  } catch (error) {
    console.error(error);
    aiAvailable = false;
    els.chatStatus.textContent = "Помощник временно недоступен. Выполнен переход на локальные ответы.";
    answer = answerQuestion(question, currentCase);
  }

  pendingBubble.querySelector("p").textContent = answer;
  chatHistory.push({ role: "user", content: question });
  chatHistory.push({ role: "assistant", content: answer });
  els.chatLog.scrollTop = els.chatLog.scrollHeight;
}

function appendChatMessage(role, text) {
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${role}`;
  if (role === "assistant") {
    const top = document.createElement("div");
    top.className = "chat-bubble-top";
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    const ttsButton = document.createElement("button");
    ttsButton.type = "button";
    ttsButton.className = "tts-btn";
    ttsButton.setAttribute("aria-label", "Озвучить ответ");
    ttsButton.title = "Озвучить ответ";
    ttsButton.textContent = "🔊";
    top.appendChild(paragraph);
    top.appendChild(ttsButton);
    bubble.appendChild(top);
  } else {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    bubble.appendChild(paragraph);
  }
  els.chatLog.appendChild(bubble);
  bindSpeechButtons();
  els.chatLog.scrollTop = els.chatLog.scrollHeight;
  return bubble;
}

function setupVoiceFeatures() {
  const RecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
  speechRecognitionSupported = Boolean(RecognitionClass);
  speechSynthesisSupported = typeof window.speechSynthesis !== "undefined" && typeof window.SpeechSynthesisUtterance !== "undefined";

  if (speechRecognitionSupported) {
    speechRecognition = new RecognitionClass();
    speechRecognition.lang = "ru-RU";
    speechRecognition.interimResults = false;
    speechRecognition.maxAlternatives = 1;
    speechRecognition.onstart = () => {
      isListening = true;
      els.micBtn.classList.add("active");
      els.micBtn.classList.remove("error");
      els.voiceStatus.textContent = "Идёт запись. Говорите в микрофон.";
    };
    speechRecognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || "")
        .join(" ")
        .trim();
      if (!transcript) {
        els.voiceStatus.textContent = "Речь не распознана. Попробуйте ещё раз.";
        return;
      }
      els.chatInput.value = els.chatInput.value.trim()
        ? `${els.chatInput.value.trim()} ${transcript}`
        : transcript;
      els.voiceStatus.textContent = "Текст добавлен в поле ввода. Можно отредактировать и отправить.";
    };
    speechRecognition.onerror = (event) => {
      isListening = false;
      els.micBtn.classList.remove("active");
      els.micBtn.classList.add("error");
      els.voiceStatus.textContent = mapSpeechRecognitionError(event.error);
    };
    speechRecognition.onend = () => {
      isListening = false;
      els.micBtn.classList.remove("active");
      if (!els.micBtn.classList.contains("error") && els.voiceStatus.textContent === "Идёт запись. Говорите в микрофон.") {
        els.voiceStatus.textContent = "Запись завершена.";
      }
    };
  } else {
    els.micBtn.disabled = true;
  }

  if (speechSynthesisSupported) {
    window.speechSynthesis.onvoiceschanged = () => {};
  }

  els.voiceStatus.textContent = describeVoiceAvailability();
}

function describeVoiceAvailability() {
  if (!speechRecognitionSupported && !speechSynthesisSupported) {
    return "Голосовые функции не поддерживаются этим браузером.";
  }
  if (!speechRecognitionSupported) {
    return "Голосовой ввод недоступен. Озвучка ответов доступна.";
  }
  if (!speechSynthesisSupported) {
    return "Озвучка недоступна. Голосовой ввод доступен.";
  }
  return "Можно использовать микрофон и озвучку ответов.";
}

function toggleVoiceInput() {
  if (!speechRecognitionSupported || !speechRecognition) {
    els.voiceStatus.textContent = "Голосовой ввод не поддерживается в этом браузере.";
    els.micBtn.classList.add("error");
    return;
  }

  els.micBtn.classList.remove("error");
  if (isListening) {
    speechRecognition.stop();
    els.voiceStatus.textContent = "Запись остановлена.";
    return;
  }

  try {
    speechRecognition.start();
  } catch {
    els.voiceStatus.textContent = "Не удалось запустить микрофон. Проверьте доступ к нему.";
    els.micBtn.classList.add("error");
  }
}

function mapSpeechRecognitionError(errorCode) {
  const messages = {
    "not-allowed": "Нет доступа к микрофону. Разрешите его в браузере.",
    "service-not-allowed": "Служба распознавания речи недоступна в этом браузере.",
    "audio-capture": "Микрофон не найден или недоступен.",
    "no-speech": "Речь не обнаружена. Попробуйте говорить ближе к микрофону.",
    "network": "Ошибка сети при распознавании речи.",
    "aborted": "Запись остановлена.",
  };
  return messages[errorCode] || "Не удалось распознать речь.";
}

function bindSpeechButtons() {
  els.chatLog.querySelectorAll(".tts-btn").forEach((button) => {
    if (button.dataset.bound === "true") {
      return;
    }
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      const bubble = button.closest(".chat-bubble.assistant");
      const text = bubble?.querySelector("p")?.textContent?.trim() || "";
      if (!text) {
        return;
      }
      toggleSpeechPlayback(button, text);
    });
  });
}

function toggleSpeechPlayback(button, text) {
  if (!speechSynthesisSupported) {
    els.voiceStatus.textContent = "Озвучка не поддерживается в этом браузере.";
    return;
  }

  if (activeSpeechButton === button) {
    stopSpeechPlayback();
    els.voiceStatus.textContent = "Озвучка остановлена.";
    return;
  }

  stopSpeechPlayback();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ru-RU";
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.voice = pickRussianVoice();
  utterance.onend = () => {
    if (activeSpeechButton === button) {
      button.classList.remove("active");
      activeSpeechButton = null;
      activeSpeechUtterance = null;
      els.voiceStatus.textContent = "Озвучка завершена.";
    }
  };
  utterance.onerror = () => {
    if (activeSpeechButton === button) {
      button.classList.remove("active");
      activeSpeechButton = null;
      activeSpeechUtterance = null;
    }
    els.voiceStatus.textContent = "Не удалось озвучить ответ.";
  };

  activeSpeechButton = button;
  activeSpeechUtterance = utterance;
  button.classList.add("active");
  els.voiceStatus.textContent = "Идёт озвучка ответа.";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function stopSpeechPlayback() {
  if (speechSynthesisSupported) {
    window.speechSynthesis.cancel();
  }
  if (activeSpeechButton) {
    activeSpeechButton.classList.remove("active");
  }
  activeSpeechButton = null;
  activeSpeechUtterance = null;
}

function pickRussianVoice() {
  if (!speechSynthesisSupported) {
    return null;
  }
  const voices = window.speechSynthesis.getVoices();
  return voices.find((voice) => voice.lang?.toLowerCase().startsWith("ru"))
    || voices.find((voice) => /russian|рус/i.test(`${voice.name} ${voice.lang}`))
    || null;
}

async function askAi(question, caseRecord, history) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question,
      history,
      case: caseRecord,
    }),
  });

  if (!response.ok) {
    const details = await safeJson(response);
    throw new Error(details?.error || `Chat request failed with ${response.status}`);
  }

  const data = await response.json();
  if (data.model) {
    els.chatStatus.textContent = `Помощник подключён. Модель: ${data.model}.`;
  }
  return data.answer || "Модель не вернула ответ.";
}

async function checkAiHealth() {
  try {
    const response = await fetch("/api/health");
    if (!response.ok) {
      throw new Error("health failed");
    }
    const data = await response.json();
    aiAvailable = Boolean(data.ai_configured);
    els.heroAiNote.textContent = aiAvailable
      ? `Помощник подключён. Модель: ${data.model}.`
      : "Помощник не подключён. Добавьте GIGACHAT_AUTH_KEY в .env и перезапустите сервер.";
  } catch {
    aiAvailable = false;
    els.heroAiNote.textContent = "Помощник недоступен. Проверьте, что локальный сервер запущен.";
  }
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function answerQuestion(question, caseRecord) {
  const q = question.toLowerCase();
  const { extracted, sourceText } = caseRecord;
  const abnormalLabs = extracted.labs.filter((lab) => lab.status === "high" || lab.status === "low");

  if (/(summary|сводк|итог|кратко|что с пациент)/.test(q)) {
    return extracted.summary;
  }

  if (/(пациент|фио|кто это)/.test(q)) {
    return extracted.patient.name
      ? `Пациент: ${extracted.patient.name}${extracted.patient.birthDate ? `, дата рождения ${extracted.patient.birthDate}` : ""}.`
      : "Имя пациента уверенно не найдено.";
  }

  if (/(врач|доктор|клиник|организац)/.test(q)) {
    const parts = [];
    if (extracted.doctor.name) {
      parts.push(`врач: ${extracted.doctor.name}`);
    }
    if (extracted.document.facility) {
      parts.push(`организация: ${extracted.document.facility}`);
    }
    return parts.length ? `Найдено ${parts.join(", ")}.` : "Врач или организация не найдены.";
  }

  if (/(диагноз|заключен|жалоб)/.test(q)) {
    const items = [...extracted.diagnoses, ...extracted.complaints];
    return items.length ? `Найдено: ${items.join("; ")}.` : "Диагнозы или жалобы не найдены.";
  }

  if (/(поля|бланк|форма|дата рождения|место регистрации|прививк)/.test(q) && extracted.formFields) {
    const fields = Object.entries(extracted.formFields).filter(([, value]) => value);
    return fields.length
      ? `Поля формы: ${fields.map(([key, value]) => `${labelForFormField(key)} — ${value}`).join("; ")}.`
      : "Поля формы не найдены.";
  }

  if (/(назначен|лекарств|рецепт|препарат)/.test(q)) {
    return extracted.medications.length
      ? `Назначения: ${extracted.medications.join("; ")}.`
      : "Назначения не найдены.";
  }

  if (/(вне норм|отклонен|аномал|анализ|лаборат)/.test(q)) {
    if (!extracted.labs.length) {
      return "Лабораторные показатели не найдены.";
    }
    if (!abnormalLabs.length) {
      return `Найдены показатели: ${extracted.labs.map((lab) => `${lab.name} ${lab.value} ${lab.unit}`.trim()).join("; ")}. Выраженных отклонений по указанным референсам не найдено.`;
    }
    return `Отклонения: ${abnormalLabs.map((lab) => `${lab.name} ${lab.value} ${lab.unit}`.trim()).join("; ")}.`;
  }

  if (/(когда|дата)/.test(q)) {
    return extracted.document.date
      ? `Дата документа: ${extracted.document.date}.`
      : "Дата документа не найдена.";
  }

  if (/(исходн|текст|оригинал|цитат)/.test(q)) {
    return sourceText.slice(0, 700) + (sourceText.length > 700 ? "..." : "");
  }

  const fuzzyLines = sourceText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => {
      const words = q.split(/\s+/).filter((word) => word.length > 3);
      return words.some((word) => line.toLowerCase().includes(word));
    })
    .slice(0, 3);

  if (fuzzyLines.length) {
    return `Нашёл релевантные строки: ${fuzzyLines.join(" | ")}.`;
  }

  return "Пока отвечаю только по содержимому текущего документа: пациент, диагнозы, анализы, назначения, врач, дата и сводка.";
}

function loadCases() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function downloadCurrentCase() {
  if (!currentCase) {
    return;
  }

  const blob = new Blob([JSON.stringify(currentCase, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${slugify(currentCase.title)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function stripFileExtension(name) {
  return name.replace(/\.[^.]+$/, "");
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "") || "case";
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDayMonth(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "сегодня";
  }
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
  }).format(date);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function dataUrlToBlob(dataUrl) {
  const [meta, base64] = dataUrl.split(",");
  const mime = meta.match(/data:(.*?);base64/)?.[1] || "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mime });
}

function toggleFieldTuning(visible) {
  els.fieldTuningPanel.classList.toggle("hidden", !visible);
}

function syncTuningInputs() {
  const fieldKey = els.tuningField.value;
  const region = fieldOverrides[fieldKey] || DEFAULT_FIELD_REGIONS[fieldKey];
  if (!region) {
    return;
  }
  els.tuningLeft.value = region.left.toFixed(2);
  els.tuningTop.value = region.top.toFixed(2);
  els.tuningRight.value = region.right.toFixed(2);
  els.tuningBottom.value = region.bottom.toFixed(2);
}

function applyFieldTuning() {
  const fieldKey = els.tuningField.value;
  const left = Number(els.tuningLeft.value);
  const top = Number(els.tuningTop.value);
  const right = Number(els.tuningRight.value);
  const bottom = Number(els.tuningBottom.value);

  if ([left, top, right, bottom].some((value) => !Number.isFinite(value) || value < 0 || value > 1)) {
    alert("Координаты поля должны быть в диапазоне от 0 до 1.");
    return;
  }
  if (left >= right || top >= bottom) {
    alert("Left должен быть меньше Right, а Top меньше Bottom.");
    return;
  }

  fieldOverrides[fieldKey] = { left, top, right, bottom };
  els.ocrStatus.textContent = `Координаты поля ${labelForTuningField(fieldKey)} обновлены.`;
}

function resetFieldTuning() {
  const fieldKey = els.tuningField.value;
  fieldOverrides[fieldKey] = structuredClone(DEFAULT_FIELD_REGIONS[fieldKey]);
  syncTuningInputs();
  els.ocrStatus.textContent = `Координаты поля ${labelForTuningField(fieldKey)} сброшены к шаблону.`;
}

function buildExtractedFromAiScan(scan, sourceText, mode) {
  if (!scan || !scan.raw_text) {
    return null;
  }

  const formFields = normalizeFormFields(scan.form_fields || {});
  const isForm = mode === "form" || scan.document_type === "Медицинская справка" || Boolean(formFields.fullName);

  return {
    patient: {
      name: scan.patient_name || formFields.fullName || "",
      birthDate: scan.birth_date || formFields.birthDate || "",
    },
    document: {
      type: scan.document_type || (isForm ? "Медицинская справка" : "Медицинский документ"),
      date: "",
      facility: scan.facility || "",
    },
    doctor: {
      name: scan.doctor || "",
    },
    diagnoses: Array.isArray(scan.diagnoses) ? scan.diagnoses.filter(Boolean) : [],
    complaints: Array.isArray(scan.complaints) ? scan.complaints.filter(Boolean) : [],
    medications: Array.isArray(scan.medications) ? scan.medications.filter(Boolean) : [],
    labs: Array.isArray(scan.labs) ? scan.labs.filter((lab) => lab?.name) : [],
    formFields,
    summary: scan.summary || `Документ распознан через GigaChat OCR.${sourceText ? "" : " Текст найден частично."}`,
  };
}

function normalizeFormFields(fields) {
  return {
    certificateNumber: fields.certificate_number || "",
    fullName: fields.full_name || "",
    birthDate: fields.birth_date || "",
    city: fields.city || "",
    street: fields.street || "",
    house: fields.house || "",
    apartment: fields.apartment || "",
    workOrStudy: fields.work_or_study || "",
    illnesses: fields.illnesses || "",
    vaccinations: fields.vaccinations || "",
    registration: fields.registration || "",
  };
}

function getSelectedMode() {
  return els.documentMode?.value || "auto";
}

function getEffectiveParseMode() {
  if (getSelectedMode() === "form") {
    return "form";
  }
  if (preprocessResult?.mode === "form") {
    return "form";
  }
  return "auto";
}

function extractFormCertificateData(normalized, lines, documentType) {
  const source = normalized.replace(/===.*?===/g, "");
  const patientName = matchValue(source, [
    /Фамилия,\s*имя,\s*отчество\s*([^\n]+)/i,
    /ФИО[:\-]?\s*([^\n]+)/i,
  ]) || inferPersonLine(lines);

  const birthDateFromParts = inferBirthDate(source);
  const formFields = {
    certificateNumber: matchValue(source, [
      /Медицинская справка\s*№\s*([A-Za-zА-Яа-яЁё0-9-]+)/i,
      /Справка\s*№\s*([A-Za-zА-Яа-яЁё0-9-]+)/i,
    ]),
    fullName: patientName,
    birthDate: birthDateFromParts || matchValue(source, [
      /Дата рождения[:\-]?\s*([^\n]+)/i,
    ]),
    city: matchValue(source, [
      /город\s+([А-ЯЁA-Z][^\n]+)/i,
    ]),
    street: matchValue(source, [
      /улица\s+([А-ЯЁA-Z][^\n]+)/i,
    ]),
    house: matchValue(source, [
      /дом\s+([A-Za-zА-Яа-яЁё0-9-]+)/i,
    ]),
    apartment: matchValue(source, [
      /квартира\s+([A-Za-zА-Яа-яЁё0-9-]+)/i,
    ]),
    workOrStudy: matchValue(source, [
      /Место учебы,\s*работы\s*([^\n]+)/i,
      /Место учебы\s*,?\s*работы\s*([^\n]+)/i,
    ]),
    illnesses: matchValue(source, [
      /Перенесенные заболевания\s*([^\n]+)/i,
    ]),
    vaccinations: matchValue(source, [
      /Профилактические прививки\s*([^\n]+)/i,
    ]),
    registration: matchValue(source, [
      /Место регистрации\s*([^\n]+)/i,
    ]),
  };

  const patient = {
    name: formFields.fullName || "",
    birthDate: formFields.birthDate || "",
  };

  const document = {
    type: documentType,
    date: matchValue(source, [
      /от\s+([0-3]?\d[.\-/][01]?\d[.\-/]\d{2,4})/i,
      /Дата документа[:\-]\s*([0-3]?\d[.\-/][01]?\d[.\-/]\d{2,4})/i,
    ]) || "",
    facility: matchValue(source, [
      /Наименование медицинской организации\s*([^\n]+)/i,
      /Медицинская организация[:\-]?\s*([^\n]+)/i,
    ]) || "",
  };

  const doctor = {
    name: matchValue(source, [
      /Врач[:\-]?\s*([^\n]+)/i,
    ]) || "",
  };

  const diagnoses = [formFields.illnesses].filter(Boolean);
  const complaints = [formFields.vaccinations].filter(Boolean);
  const medications = [];
  const labs = [];
  const summary = buildFormSummary(formFields, document);

  return {
    patient,
    document,
    doctor,
    diagnoses,
    complaints,
    medications,
    labs,
    formFields,
    summary,
  };
}

function inferBirthDate(text) {
  const day = matchValue(text, [/Дата рождения:\s*число\s*([0-3]?\d)/i]);
  const month = matchValue(text, [/месяц\s*([01]?\d)/i]);
  const year = matchValue(text, [/год\s*(\d{4})/i]);
  if (day && month && year) {
    return `${day.padStart(2, "0")}.${month.padStart(2, "0")}.${year}`;
  }
  return "";
}

function buildFormSummary(formFields, document) {
  const parts = [];
  if (formFields.fullName) {
    parts.push(`пациент: ${formFields.fullName}`);
  }
  if (formFields.birthDate) {
    parts.push(`дата рождения: ${formFields.birthDate}`);
  }
  if (formFields.city || formFields.street) {
    parts.push(`регистрация: ${[formFields.city, formFields.street, formFields.house, formFields.apartment].filter(Boolean).join(", ")}`);
  }
  if (formFields.workOrStudy) {
    parts.push(`место учебы или работы: ${formFields.workOrStudy}`);
  }
  if (formFields.illnesses) {
    parts.push(`перенесенные заболевания: ${formFields.illnesses}`);
  }
  if (formFields.vaccinations) {
    parts.push(`прививки: ${formFields.vaccinations}`);
  }
  if (document.facility) {
    parts.push(`организация: ${document.facility}`);
  }
  return parts.length ? `Медицинская справка, ${parts.join(". ")}.` : "Распознана медицинская справка, но поля формы найдены неуверенно.";
}

function labelForFormField(key) {
  const labels = {
    certificateNumber: "Номер справки",
    fullName: "ФИО",
    birthDate: "Дата рождения",
    city: "Город",
    street: "Улица",
    house: "Дом",
    apartment: "Квартира",
    workOrStudy: "Место учебы/работы",
    illnesses: "Перенесенные заболевания",
    vaccinations: "Прививки",
    registration: "Место регистрации",
  };
  return labels[key] || key;
}

function labelForTuningField(key) {
  const labels = {
    certificate_number: "Номер справки",
    full_name: "ФИО",
    birth_date: "Дата рождения",
    city: "Город",
    street: "Улица",
    house: "Дом",
    apartment: "Квартира",
    work_or_study: "Место учебы/работы",
    illnesses: "Перенесенные заболевания",
    vaccinations: "Прививки",
  };
  return labels[key] || key;
}
