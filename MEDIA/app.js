const STORAGE_KEY = "medflow-mvp-cases";
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
  chatModal: document.getElementById("chat-modal"),
  closeChat: document.getElementById("close-chat"),
  chatLog: document.getElementById("chat-log"),
  chatForm: document.getElementById("chat-form"),
  chatInput: document.getElementById("chat-input"),
  chatStatus: document.getElementById("chat-status"),
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

els.fileInput.addEventListener("change", handleFileUpload);
els.documentMode.addEventListener("change", handleDocumentModeChange);
els.preprocessBtn.addEventListener("click", preprocessSelectedImage);
els.ocrBtn.addEventListener("click", runImageOcr);
els.fillDemo.addEventListener("click", () => {
  els.caseTitle.value = "Демо: выписка Иванова";
  els.documentText.value = demoText;
});
els.clearBtn.addEventListener("click", clearForm);
els.parseBtn.addEventListener("click", parseCurrentText);
els.tuningField.addEventListener("change", syncTuningInputs);
els.applyTuning.addEventListener("click", applyFieldTuning);
els.resetTuning.addEventListener("click", resetFieldTuning);
els.openChat.addEventListener("click", openChat);
els.closeChat.addEventListener("click", () => els.chatModal.close());
els.chatForm.addEventListener("submit", submitChatQuestion);
els.downloadJson.addEventListener("click", downloadCurrentCase);

renderSavedCases();
loadPatients();
syncTuningInputs();
checkAiHealth();

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
    els.preprocessMeta.textContent = "Сервер сохраняет исходную ориентацию, обрезает и усиливает контраст перед OCR.";
    els.preprocessBtn.disabled = false;
    els.ocrBtn.disabled = false;
    els.ocrStatus.textContent = `Изображение выбрано: ${file.name}. Идёт подготовка для OCR...`;
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
  els.ocrStatus.textContent = "Для изображений PNG/JPG/WebP доступно OCR через GigaChat API.";
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
  els.preprocessMeta.textContent = "Сервер сохраняет исходную ориентацию и усиливает контраст перед OCR.";
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
    els.ocrStatus.textContent = "Изображение подготовлено. OCR будет запущен по улучшенной версии.";
    els.ocrBtn.disabled = false;
  } catch (error) {
    console.error(error);
    processedImageBlob = null;
    printedImageBlob = null;
    handwritingImageBlob = null;
    preprocessResult = null;
    toggleFieldTuning(getSelectedMode() === "form");
    els.ocrStatus.textContent = "Не удалось улучшить изображение. OCR будет работать по исходному файлу.";
    els.preprocessMeta.textContent = "Серверная обработка не удалась. Можно попробовать OCR по исходнику.";
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
    els.ocrStatus.textContent = "OCR через GigaChat недоступен. Проверьте GIGACHAT_AUTH_KEY и перезапустите server.py.";
    return;
  }

  els.ocrBtn.disabled = true;
  els.ocrStatus.textContent = "Идёт OCR через GigaChat API...";

  try {
    const scan = await scanImageWithAi();
    lastAiScanResult = scan;
    const recognized = scan.raw_text?.trim() || "";
    if (scan.document_type === "Медицинская справка") {
      els.documentMode.value = "form";
    }
    els.documentText.value = recognized;
    els.ocrStatus.textContent = recognized
      ? "OCR через GigaChat завершён. Текст добавлен в поле документа."
      : "OCR завершён, но уверенный текст не найден.";
  } catch (error) {
    console.error(error);
    lastAiScanResult = null;
    els.ocrStatus.textContent = `Ошибка OCR через GigaChat API: ${error.message}`;
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
    throw new Error(serverError || `AI OCR failed with ${response.status}`);
  }

  const data = await response.json();
  if (data.model) {
    els.ocrStatus.textContent = `OCR через GigaChat: ${data.model}`;
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
    els.savedCases.innerHTML = `<div class="empty-state"><p>Сохранённых кейсов пока нет.</p></div>`;
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
        <button data-case-id="${caseRecord.id}" class="ghost-btn">Открыть кейс</button>
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
    await response.json();
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
  chatHistory = [];
  els.chatLog.innerHTML = `
    <div class="chat-bubble assistant">
      <p>Спросите, что найдено в документе: диагноз, отклонения анализов, назначения, врач, дата или краткая сводка.</p>
    </div>
  `;
  els.chatInput.value = "";
  els.chatStatus.textContent = aiAvailable
    ? "AI-чат использует GigaChat API и ограничен контекстом текущего документа."
    : "GigaChat API не настроен или недоступен.";
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
    els.chatStatus.textContent = "AI-чат временно недоступен. Переключено на локальный fallback.";
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
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  bubble.appendChild(paragraph);
  els.chatLog.appendChild(bubble);
  els.chatLog.scrollTop = els.chatLog.scrollHeight;
  return bubble;
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
    els.chatStatus.textContent = `AI-чат активен. Модель: ${data.model}.`;
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
      ? `AI-чат подключен. Модель: ${data.model}.`
      : "AI-чат не подключен. Добавьте GIGACHAT_AUTH_KEY в .env и перезапустите сервер.";
  } catch {
    aiAvailable = false;
    els.heroAiNote.textContent = "AI-чат недоступен. Проверьте, что локальный сервер запущен.";
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
