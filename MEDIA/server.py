import json
import os
from io import BytesIO
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import ssl
import sqlite3
import time
import uuid

from PIL import Image, ImageChops, ImageFilter, ImageOps
import certifi
import requests


ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "medflow.db"
GIGACHAT_AUTH_URL = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth"
GIGACHAT_API_BASE = "https://gigachat.devices.sberbank.ru/api/v1"


def load_dotenv():
    dotenv_path = ROOT / ".env"
    if not dotenv_path.exists():
        return

    for raw_line in dotenv_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


load_dotenv()
GIGACHAT_AUTH_KEY = os.environ.get("GIGACHAT_AUTH_KEY", "")
GIGACHAT_SCOPE = os.environ.get("GIGACHAT_SCOPE", "GIGACHAT_API_PERS")
GIGACHAT_MODEL = os.environ.get("GIGACHAT_MODEL", "GigaChat-Pro")
GIGACHAT_CA_BUNDLE = os.environ.get("GIGACHAT_CA_BUNDLE", certifi.where())
SSL_CONTEXT = ssl.create_default_context(cafile=GIGACHAT_CA_BUNDLE)
TOKEN_CACHE = {"access_token": "", "expires_at": 0.0}

DEMO_DATABASE_SEED = [
    {
        "patient": {
            "full_name": "Иванов Иван Иванович",
            "birth_date": "14.05.1986",
            "city": "Москва",
            "registration": "Москва, ул. Лесная, д. 12",
        },
        "documents": [
            {
                "title": "Выписка после очного приёма",
                "document_type": "Выписка",
                "summary": "Пациент Иванов Иван Иванович. Выявлены сахарный диабет 2 типа и артериальная гипертензия. Нужен повторный лабораторный контроль.",
                "source_text": "Пациент: Иванов Иван Иванович. Диагноз: Сахарный диабет 2 типа. Артериальная гипертензия.",
                "created_at": "2026-04-01 11:18:00",
                "extracted": {
                    "patient": {"name": "Иванов Иван Иванович", "birthDate": "14.05.1986"},
                    "document": {"type": "Выписка", "date": "12.03.2026", "facility": "Клиника Сфера Здоровья"},
                    "doctor": {"name": "Петрова Анна Сергеевна"},
                    "diagnoses": ["Сахарный диабет 2 типа", "Артериальная гипертензия"],
                    "complaints": ["слабость", "жажда"],
                    "medications": ["Метформин 1000 мг 2 раза в день", "Лозартан 50 мг 1 раз в день"],
                    "labs": [],
                    "summary": "Пациент Иванов Иван Иванович. Выявлены сахарный диабет 2 типа и артериальная гипертензия.",
                },
            },
            {
                "title": "Контрольный лист анализов",
                "document_type": "Результаты анализов",
                "summary": "По контрольным анализам остаются повышенными глюкоза и HbA1c.",
                "source_text": "Глюкоза 8.4 ммоль/л. HbA1c 7.3%.",
                "created_at": "2026-04-01 10:42:00",
                "extracted": {
                    "patient": {"name": "Иванов Иван Иванович", "birthDate": "14.05.1986"},
                    "document": {"type": "Результаты анализов", "date": "29.03.2026", "facility": "Лаборатория МедЛаб"},
                    "doctor": {"name": "Петрова Анна Сергеевна"},
                    "diagnoses": ["Нарушение гликемического контроля"],
                    "complaints": [],
                    "medications": [],
                    "labs": [
                        {"name": "Глюкоза", "value": "8.4", "unit": "ммоль/л", "range": "3.9 - 5.5", "status": "high"},
                        {"name": "HbA1c", "value": "7.3", "unit": "%", "range": "4.0 - 5.6", "status": "high"},
                    ],
                    "summary": "По контрольным анализам остаются повышенными глюкоза и HbA1c.",
                },
            },
        ],
    },
    {
        "patient": {
            "full_name": "Соколов Артем Игоревич",
            "birth_date": "22.11.1998",
            "city": "Москва",
            "registration": "Москва, проспект Мира, д. 41",
        },
        "documents": [
            {
                "title": "Медицинская справка перед госпитализацией",
                "document_type": "Медицинская справка",
                "summary": "Есть признаки декомпенсации диабета, требуется очная консультация эндокринолога.",
                "source_text": "Медицинская справка. Пациент: Соколов Артем Игоревич. Диагноз: сахарный диабет 2 типа.",
                "created_at": "2026-04-01 09:55:00",
                "extracted": {
                    "patient": {"name": "Соколов Артем Игоревич", "birthDate": "22.11.1998"},
                    "document": {"type": "Медицинская справка", "date": "14.03.2026", "facility": "Городская клиника №7"},
                    "doctor": {"name": "Смирнова Елена Павловна"},
                    "diagnoses": ["Сахарный диабет 2 типа", "Ожирение 1 степени"],
                    "complaints": ["жажда", "сухость во рту"],
                    "medications": ["Контроль глюкозы крови 2 раза в день"],
                    "labs": [],
                    "summary": "Есть признаки декомпенсации диабета, требуется очная консультация эндокринолога.",
                },
            }
        ],
    },
    {
        "patient": {
            "full_name": "Орлова Марина Сергеевна",
            "birth_date": "03.02.1991",
            "city": "Химки",
            "registration": "Химки, ул. Молодёжная, д. 8",
        },
        "documents": [
            {
                "title": "Результаты лабораторного контроля",
                "document_type": "Результаты анализов",
                "summary": "Нужен повторный визит к эндокринологу из-за роста HbA1c.",
                "source_text": "Пациент: Орлова Марина Сергеевна. HbA1c 6.9%. Глюкоза 7.1 ммоль/л.",
                "created_at": "2026-04-01 09:10:00",
                "extracted": {
                    "patient": {"name": "Орлова Марина Сергеевна", "birthDate": "03.02.1991"},
                    "document": {"type": "Результаты анализов", "date": "29.03.2026", "facility": "Лаборатория МедЛаб"},
                    "doctor": {"name": "Кузнецова Ирина Алексеевна"},
                    "diagnoses": ["Нарушение гликемического контроля"],
                    "complaints": [],
                    "medications": ["Рекомендован повторный визит к эндокринологу"],
                    "labs": [],
                    "summary": "Нужен повторный визит к эндокринологу из-за роста HbA1c.",
                },
            }
        ],
    },
    {
        "patient": {
            "full_name": "Кадачигов Дмитрий Сергеевич",
            "birth_date": "10.03.2007",
            "city": "Мытищи",
            "registration": "Мытищи, Новомытищинский пр-т, д. 18",
        },
        "documents": [
            {
                "title": "Описание исследования стопы",
                "document_type": "Описание снимка",
                "summary": "Подозрение на осложнение со стороны стопы, рекомендована консультация хирурга.",
                "source_text": "Описание снимка. Пациент: Кадачигов Дмитрий Сергеевич. Рекомендована консультация хирурга.",
                "created_at": "2026-03-31 17:35:00",
                "extracted": {
                    "patient": {"name": "Кадачигов Дмитрий Сергеевич", "birthDate": "10.03.2007"},
                    "document": {"type": "Описание снимка", "date": "30.03.2026", "facility": "Диагностический центр Север"},
                    "doctor": {"name": "Громов Алексей Валерьевич"},
                    "diagnoses": ["Диабетическая стопа, подозрение на осложнение"],
                    "complaints": ["болезненность в области стопы"],
                    "medications": ["Рекомендована очная консультация хирурга"],
                    "labs": [],
                    "summary": "Подозрение на осложнение со стороны стопы, рекомендована консультация хирурга.",
                },
            }
        ],
    },
]


def has_real_gigachat_key():
    key = GIGACHAT_AUTH_KEY.strip()
    if not key:
        return False
    placeholders = {
        "your_gigachat_auth_key_here",
        "your_key_here",
        "...",
    }
    if key in placeholders or key.startswith("your_"):
        return False
    try:
        key.encode("ascii")
    except UnicodeEncodeError:
        return False
    return True


def gigachat_key_error():
    key = GIGACHAT_AUTH_KEY.strip()
    if not key:
        return "GIGACHAT_AUTH_KEY is not configured on the server."
    try:
        key.encode("ascii")
    except UnicodeEncodeError:
        return "GIGACHAT_AUTH_KEY contains non-ASCII characters. Paste the real Authorization key from GigaChat, not placeholder text."
    return "GIGACHAT_AUTH_KEY is not configured on the server."


class MedFlowHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        if self.path == "/api/health":
            self._send_json(
                HTTPStatus.OK,
                {
                    "ok": True,
                    "ai_configured": has_real_gigachat_key(),
                    "model": GIGACHAT_MODEL,
                },
            )
            return
        if self.path == "/api/patients":
            self._send_json(HTTPStatus.OK, {"patients": list_patients()})
            return
        if self.path == "/api/documents":
            self._send_json(HTTPStatus.OK, {"documents": list_documents()})
            return
        if self.path == "/api/database":
            self._send_json(
                HTTPStatus.OK,
                {
                    "patients": list_patients(),
                    "documents": list_documents(),
                },
            )
            return

        return super().do_GET()

    def do_POST(self):
        if self.path == "/api/preprocess-image":
            self._handle_preprocess_image()
            return
        if self.path == "/api/scan-image":
            self._handle_scan_image()
            return
        if self.path == "/api/cases":
            self._handle_save_case()
            return
        if self.path == "/api/questionnaire-opinion":
            self._handle_questionnaire_opinion()
            return
        if self.path == "/api/seed-demo-db":
            self._handle_seed_demo_db()
            return

        if self.path != "/api/chat":
            self._send_json(HTTPStatus.NOT_FOUND, {"error": "Not found"})
            return

        if not has_real_gigachat_key():
            self._send_json(
                HTTPStatus.BAD_REQUEST,
                {
                    "error": gigachat_key_error(),
                    "code": "missing_api_key",
                },
            )
            return

        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length)

        try:
            payload = json.loads(body.decode("utf-8"))
        except json.JSONDecodeError:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "Invalid JSON body"})
            return

        question = str(payload.get("question", "")).strip()
        case_data = payload.get("case", {})
        history = payload.get("history", [])

        if not question:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "Question is required"})
            return

        try:
            answer = self._call_gigachat(question, case_data, history)
        except requests.RequestException as exc:
            self._send_json(
                HTTPStatus.BAD_GATEWAY,
                {
                    "error": "GigaChat API request failed",
                    "details": str(exc),
                },
            )
            return

        self._send_json(HTTPStatus.OK, {"answer": answer, "model": GIGACHAT_MODEL})

    def do_PUT(self):
        if self.path.startswith("/api/patients/"):
            self._handle_update_patient()
            return
        if self.path.startswith("/api/documents/"):
            self._handle_update_document()
            return

        self._send_json(HTTPStatus.NOT_FOUND, {"error": "Not found"})

    def do_DELETE(self):
        if self.path.startswith("/api/patients/"):
            self._handle_delete_patient()
            return
        if self.path.startswith("/api/documents/"):
            self._handle_delete_document()
            return

        self._send_json(HTTPStatus.NOT_FOUND, {"error": "Not found"})

    def _handle_preprocess_image(self):
        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length)
        if not body:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "Image file is required"})
            return
        mode = self.headers.get("X-Document-Mode", "auto").strip().lower() or "auto"

        try:
            image = Image.open(BytesIO(body))
            original_size = image.size
            processed, rotation, extras = preprocess_image(image, mode=mode)
        except Exception as exc:
            self._send_json(
                HTTPStatus.BAD_REQUEST,
                {"error": "Could not process image", "details": str(exc)},
            )
            return

        original_buffer = BytesIO()
        processed_buffer = BytesIO()

        ImageOps.exif_transpose(image).save(original_buffer, format="PNG")
        processed.save(processed_buffer, format="PNG")

        printed_preview = None
        handwriting_preview = None
        if extras.get("printed") is not None:
            printed_buffer = BytesIO()
            extras["printed"].save(printed_buffer, format="PNG")
            printed_preview = encode_image(printed_buffer.getvalue())
        if extras.get("handwriting") is not None:
            handwriting_buffer = BytesIO()
            extras["handwriting"].save(handwriting_buffer, format="PNG")
            handwriting_preview = encode_image(handwriting_buffer.getvalue())

        self._send_json(
            HTTPStatus.OK,
            {
                "original_preview": encode_image(original_buffer.getvalue()),
                "processed_preview": encode_image(processed_buffer.getvalue()),
                "printed_preview": printed_preview,
                "handwriting_preview": handwriting_preview,
                "mode": mode,
                "rotation": rotation,
                "original_size": {"width": original_size[0], "height": original_size[1]},
                "processed_size": {"width": processed.width, "height": processed.height},
            },
        )

    def _handle_scan_image(self):
        if not has_real_gigachat_key():
            self._send_json(
                HTTPStatus.BAD_REQUEST,
                {
                    "error": gigachat_key_error(),
                    "code": "missing_api_key",
                },
            )
            return

        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length)
        if not body:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "Image file is required"})
            return

        content_type = self.headers.get("Content-Type", "image/png").strip() or "image/png"
        mode = self.headers.get("X-Document-Mode", "auto").strip().lower() or "auto"

        try:
            result = self._scan_image_with_gigachat(body, content_type, mode)
        except requests.RequestException as exc:
            self._send_json(
                HTTPStatus.BAD_GATEWAY,
                {
                    "error": "GigaChat API image scan failed",
                    "details": str(exc),
                },
            )
            return
        except Exception as exc:
            self._send_json(
                HTTPStatus.BAD_GATEWAY,
                {
                    "error": "GigaChat image scan failed",
                    "details": str(exc),
                },
            )
            return
        except json.JSONDecodeError as exc:
            self._send_json(
                HTTPStatus.BAD_GATEWAY,
                {
                    "error": "Model returned invalid JSON",
                    "details": str(exc),
                },
            )
            return

        self._send_json(HTTPStatus.OK, {"scan": result, "model": GIGACHAT_MODEL})

    def _handle_save_case(self):
        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length)
        try:
            payload = json.loads(body.decode("utf-8"))
        except json.JSONDecodeError:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "Invalid JSON body"})
            return

        try:
            result = save_case_to_db(
                str(payload.get("title", "")).strip() or "Без названия",
                str(payload.get("sourceText", "")),
                payload.get("extracted") or {},
            )
        except Exception as exc:
            self._send_json(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                {"error": "Could not save case", "details": str(exc)},
            )
            return

        self._send_json(HTTPStatus.OK, result)

    def _handle_questionnaire_opinion(self):
        if not has_real_gigachat_key():
            payload = self._read_json_body()
            if payload is None:
                self._send_json(HTTPStatus.BAD_REQUEST, {"error": "Invalid JSON body"})
                return
            answers = payload.get("answers") or {}
            patient = payload.get("patient") or {}
            questionnaire_title = str(payload.get("title", "")).strip() or "Опросник по сахарному диабету 1 типа у взрослых"
            opinion = analyze_questionnaire_locally(questionnaire_title, patient, answers, gigachat_key_error())
            self._send_json(HTTPStatus.OK, {"opinion": opinion, "model": "local-fallback"})
            return

        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length)
        try:
            payload = json.loads(body.decode("utf-8"))
        except json.JSONDecodeError:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "Invalid JSON body"})
            return

        answers = payload.get("answers") or {}
        patient = payload.get("patient") or {}
        questionnaire_title = str(payload.get("title", "")).strip() or "Опросник по сахарному диабету 1 типа у взрослых"

        try:
            opinion = self._analyze_questionnaire_with_gigachat(questionnaire_title, patient, answers)
        except Exception as exc:
            opinion = analyze_questionnaire_locally(questionnaire_title, patient, answers, str(exc))

        self._send_json(HTTPStatus.OK, {"opinion": opinion, "model": GIGACHAT_MODEL})

    def _handle_update_patient(self):
        patient_id = extract_numeric_id(self.path, "/api/patients/")
        if patient_id is None:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "Некорректный идентификатор пациента"})
            return

        payload = self._read_json_body()
        if payload is None:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "Invalid JSON body"})
            return

        try:
            patient = update_patient_record(patient_id, payload)
        except ValueError as exc:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": str(exc)})
            return

        if not patient:
            self._send_json(HTTPStatus.NOT_FOUND, {"error": "Пациент не найден"})
            return

        self._send_json(HTTPStatus.OK, {"patient": patient})

    def _handle_update_document(self):
        document_id = extract_numeric_id(self.path, "/api/documents/")
        if document_id is None:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "Некорректный идентификатор документа"})
            return

        payload = self._read_json_body()
        if payload is None:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "Invalid JSON body"})
            return

        try:
            document = update_document_record(document_id, payload)
        except ValueError as exc:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": str(exc)})
            return

        if not document:
            self._send_json(HTTPStatus.NOT_FOUND, {"error": "Документ не найден"})
            return

        self._send_json(HTTPStatus.OK, {"document": document})

    def _handle_delete_patient(self):
        patient_id = extract_numeric_id(self.path, "/api/patients/")
        if patient_id is None:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "Некорректный идентификатор пациента"})
            return

        deleted = delete_patient_record(patient_id)
        if not deleted:
            self._send_json(HTTPStatus.NOT_FOUND, {"error": "Пациент не найден"})
            return

        self._send_json(HTTPStatus.OK, {"deleted": True, "patient_id": patient_id})

    def _handle_delete_document(self):
        document_id = extract_numeric_id(self.path, "/api/documents/")
        if document_id is None:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "Некорректный идентификатор документа"})
            return

        deleted = delete_document_record(document_id)
        if not deleted:
            self._send_json(HTTPStatus.NOT_FOUND, {"error": "Документ не найден"})
            return

        self._send_json(HTTPStatus.OK, {"deleted": True, "document_id": document_id})

    def _handle_seed_demo_db(self):
        try:
            result = seed_demo_database_now()
        except Exception as exc:
            self._send_json(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                {"error": "Не удалось заполнить демо-базу", "details": str(exc)},
            )
            return

        self._send_json(HTTPStatus.OK, result)

    def _read_json_body(self):
        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length)
        try:
            return json.loads(body.decode("utf-8"))
        except json.JSONDecodeError:
            return None

    def _call_gigachat(self, question, case_data, history):
        source_text = str(case_data.get("sourceText", ""))[:18000]
        extracted = case_data.get("extracted", {})

        system_prompt = (
            "Ты помощник по медицинским документам в demo-MVP. "
            "Отвечай только по данным документа и извлечённым полям. "
            "Если в документе нет ответа, скажи это явно. "
            "Не придумывай диагнозы, лечение и рекомендации. "
            "Отвечай кратко на русском."
        )
        context_prompt = (
            f"Вопрос пользователя:\n{question}\n\n"
            f"Извлечённые поля JSON:\n{json.dumps(extracted, ensure_ascii=False)}\n\n"
            f"Исходный текст документа:\n{source_text}"
        )
        messages = [{"role": "system", "content": system_prompt}]
        for item in history[-8:]:
            role = item.get("role", "assistant")
            content = str(item.get("content", "")).strip()
            if content:
                messages.append({"role": role, "content": content})
        messages.append({"role": "user", "content": context_prompt})
        data = gigachat_chat(messages)
        return extract_gigachat_text(data) or "Модель не вернула текстовый ответ."

    def _analyze_questionnaire_with_gigachat(self, questionnaire_title, patient, answers):
        system_prompt = (
            "Ты помогаешь врачу оценить ответы пациента на медицинский опросник. "
            "Это не диагноз. Нужна только аккуратная предварительная клиническая оценка для врача. "
            "Отвечай строго JSON без пояснений вне JSON. "
            "Не придумывай факты, которых нет в ответах."
        )
        user_prompt = (
            f"Название опросника: {questionnaire_title}\n"
            f"Пациент: {json.dumps(patient, ensure_ascii=False)}\n"
            f"Ответы: {json.dumps(answers, ensure_ascii=False)}\n\n"
            "Верни JSON структуры: "
            "{\"risk_level\":\"низкий|средний|высокий|критический\","
            "\"summary_for_doctor\":\"\","
            "\"red_flags\":[],"
            "\"likely_concerns\":[],"
            "\"recommended_route\":\"\","
            "\"needs_urgent_review\":true,"
            "\"patient_message\":\"\"}. "
            "Если есть признаки экстренного состояния, отражай это в risk_level, red_flags и needs_urgent_review."
        )
        data = gigachat_chat([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ])
        text = extract_gigachat_text(data)
        return parse_json_from_text(text)

    def _scan_image_with_gigachat(self, image_bytes, content_type, mode):
        source_image = prepare_upload_image(image_bytes)
        prepared_bytes = image_to_png_bytes(source_image)
        file_id = gigachat_upload_file(prepared_bytes, "image/png", "medical-document.png")
        overrides = parse_field_overrides(self.headers.get("X-Field-Overrides", ""))
        scan_mode = "медицинская справка или бланк" if mode == "form" else "общий медицинский документ"
        prompt = (
            "Распознай текст с прикрепленного медицинского документа и верни только JSON без пояснений. "
            f"Тип документа ожидается: {scan_mode}. "
            "Если это медицинская справка, отдавай приоритет заполненным рукописным полям, а не печатным подписям строк. "
            "Не подменяй значение поля названием самого поля. "
            "JSON-структура: "
            "{\"document_type\":\"\",\"raw_text\":\"\",\"summary\":\"\",\"patient_name\":\"\",\"birth_date\":\"\","
            "\"facility\":\"\",\"doctor\":\"\",\"diagnoses\":[],\"complaints\":[],\"medications\":[],"
            "\"labs\":[{\"name\":\"\",\"value\":\"\",\"unit\":\"\",\"range\":\"\",\"status\":\"\"}],"
            "\"form_fields\":{\"certificate_number\":\"\",\"full_name\":\"\",\"birth_date\":\"\",\"city\":\"\","
            "\"street\":\"\",\"house\":\"\",\"apartment\":\"\",\"work_or_study\":\"\",\"illnesses\":\"\","
            "\"vaccinations\":\"\",\"registration\":\"\"}}. "
            "Если поле не найдено, верни пустую строку или пустой массив. Не придумывай данные."
        )
        data = gigachat_chat([{"role": "user", "content": prompt, "attachments": [file_id]}])
        text = extract_gigachat_text(data)
        result = parse_json_from_text(text)
        if mode == "form" or result.get("document_type") == "Медицинская справка":
            result = enrich_form_scan_with_crops(source_image, result, overrides)
        return result

    def _send_json(self, status, data):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def gigachat_verify_target():
    return GIGACHAT_CA_BUNDLE if GIGACHAT_CA_BUNDLE else True


def gigachat_headers(token):
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }


def gigachat_access_token():
    now = time.time()
    if TOKEN_CACHE["access_token"] and TOKEN_CACHE["expires_at"] > now + 30:
        return TOKEN_CACHE["access_token"]

    response = requests.post(
        GIGACHAT_AUTH_URL,
        headers={
            "Authorization": f"Basic {GIGACHAT_AUTH_KEY}",
            "RqUID": str(uuid.uuid4()),
            "Content-Type": "application/x-www-form-urlencoded",
        },
        data={"scope": GIGACHAT_SCOPE},
        timeout=60,
        verify=gigachat_verify_target(),
    )
    response.raise_for_status()
    payload = response.json()
    access_token = payload.get("access_token", "")
    expires_at_ms = int(payload.get("expires_at", 0))
    expires_at = (expires_at_ms / 1000) if expires_at_ms else (now + 1500)
    TOKEN_CACHE["access_token"] = access_token
    TOKEN_CACHE["expires_at"] = expires_at
    return access_token


def gigachat_chat(messages):
    token = gigachat_access_token()
    response = requests.post(
        f"{GIGACHAT_API_BASE}/chat/completions",
        headers=gigachat_headers(token),
        json={
            "model": GIGACHAT_MODEL,
            "messages": messages,
            "temperature": 0.1,
        },
        timeout=180,
        verify=gigachat_verify_target(),
    )
    response.raise_for_status()
    return response.json()


def gigachat_upload_file(file_bytes, content_type, filename):
    token = gigachat_access_token()
    response = requests.post(
        f"{GIGACHAT_API_BASE}/files",
        headers={
            "Authorization": f"Bearer {token}",
        },
        data={"purpose": "general"},
        files={"file": (filename, file_bytes, content_type)},
        timeout=180,
        verify=gigachat_verify_target(),
    )
    response.raise_for_status()
    payload = response.json()
    return payload.get("id", "")


def extract_gigachat_text(payload):
    choices = payload.get("choices") or []
    if not choices:
        return ""
    message = choices[0].get("message", {})
    return str(message.get("content", "")).strip()


def prepare_upload_image(image_bytes):
    image = Image.open(BytesIO(image_bytes))
    prepared = ImageOps.exif_transpose(image).convert("RGB")
    if max(prepared.size) > 2200:
        prepared.thumbnail((2200, 2200))
    return prepared


def image_to_png_bytes(image):
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def crop_region(image, left, top, right, bottom):
    width, height = image.size
    return image.crop((
        int(width * left),
        int(height * top),
        int(width * right),
        int(height * bottom),
    ))


def form_field_regions():
    return {
        "certificate_number": (0.65, 0.255, 0.84, 0.325),
        "full_name": (0.36, 0.335, 0.95, 0.405),
        "birth_date": (0.28, 0.385, 0.95, 0.455),
        "city": (0.52, 0.475, 0.83, 0.545),
        "street": (0.08, 0.55, 0.58, 0.625),
        "house": (0.81, 0.55, 0.96, 0.625),
        "apartment": (0.12, 0.60, 0.34, 0.675),
        "work_or_study": (0.36, 0.65, 0.95, 0.725),
        "illnesses": (0.41, 0.755, 0.95, 0.825),
        "vaccinations": (0.44, 0.855, 0.95, 0.925),
    }


def parse_field_overrides(raw_value):
    if not raw_value:
        return {}
    try:
        data = json.loads(raw_value)
    except json.JSONDecodeError:
        return {}
    parsed = {}
    for key, value in data.items():
        if not isinstance(value, dict):
            continue
        try:
            parsed[key] = (
                float(value.get("left")),
                float(value.get("top")),
                float(value.get("right")),
                float(value.get("bottom")),
            )
        except (TypeError, ValueError):
            continue
    return parsed


def enrich_form_scan_with_crops(source_image, result, overrides=None):
    existing = dict(result.get("form_fields") or {})
    regions = form_field_regions()
    if overrides:
        regions.update(overrides)
    for field_name, bounds in regions.items():
        current_value = str(existing.get(field_name, "")).strip()
        if current_value:
            continue
        crop = crop_region(source_image, *bounds)
        field_value = scan_form_field_crop(field_name, crop)
        if field_value:
            existing[field_name] = field_value

    if existing.get("full_name") and not result.get("patient_name"):
        result["patient_name"] = existing["full_name"]
    if existing.get("birth_date") and not result.get("birth_date"):
        result["birth_date"] = existing["birth_date"]

    registration = ", ".join(
        part for part in [
            existing.get("city", ""),
            existing.get("street", ""),
            existing.get("house", ""),
            existing.get("apartment", ""),
        ] if part
    )
    if registration and not existing.get("registration"):
        existing["registration"] = registration

    result["form_fields"] = {
        "certificate_number": existing.get("certificate_number", ""),
        "full_name": existing.get("full_name", ""),
        "birth_date": existing.get("birth_date", ""),
        "city": existing.get("city", ""),
        "street": existing.get("street", ""),
        "house": existing.get("house", ""),
        "apartment": existing.get("apartment", ""),
        "work_or_study": existing.get("work_or_study", ""),
        "illnesses": existing.get("illnesses", ""),
        "vaccinations": existing.get("vaccinations", ""),
        "registration": existing.get("registration", ""),
    }
    return result


def scan_form_field_crop(field_name, crop):
    crop_bytes = image_to_png_bytes(crop)
    file_id = gigachat_upload_file(crop_bytes, "image/png", f"{field_name}.png")
    prompt = (
        f"На изображении только одно поле медицинской справки: {field_name}. "
        "Прочитай только рукописное или заполненное значение этого поля. "
        "Игнорируй печатные названия, линии формы и штампы. "
        "Верни только JSON без пояснений: {\"value\":\"\"}. "
        "Если значение неразборчиво, верни пустую строку."
    )
    data = gigachat_chat([{"role": "user", "content": prompt, "attachments": [file_id]}])
    text = extract_gigachat_text(data)
    try:
        parsed = parse_json_from_text(text)
    except json.JSONDecodeError:
        return ""
    return str(parsed.get("value", "")).strip()


def parse_json_from_text(text):
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:].strip()
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise json.JSONDecodeError("No JSON object found", cleaned, 0)
    return json.loads(cleaned[start:end + 1])


def analyze_questionnaire_locally(questionnaire_title, patient, answers, error_message=""):
    positive_flags = []
    medium_flags = []

    def has_yes(key):
        value = str(answers.get(key, "")).strip().lower()
        return value in {"да", "yes", "true"}

    def value_contains(key, expected_values):
        value = str(answers.get(key, "")).strip().lower()
        return value in {item.lower() for item in expected_values}

    if has_yes("urination"):
        medium_flags.append("частое мочеиспускание")
    if has_yes("weight_loss"):
        positive_flags.append("непреднамеренная потеря веса")
    if has_yes("blurred_vision"):
        medium_flags.append("ухудшение зрения")
    if has_yes("nausea"):
        positive_flags.append("тошнота или боль в животе")
    if has_yes("acetone_breath"):
        positive_flags.append("запах ацетона")
    if value_contains("duration", ["несколько дней", "1-2 недели"]):
        positive_flags.append("быстрое развитие симптомов")
    if value_contains("glucose_known", ["да, сильно повышена"]):
        positive_flags.append("выраженное повышение глюкозы")
    if value_contains("glucose_known", ["да, умеренно"]):
        medium_flags.append("повышенная глюкоза")
    if value_contains("hba1c_high", ["да"]):
        medium_flags.append("гликированный гемоглобин выше 7,5%")
    if value_contains("insulin_calculation", ["только на глаз", "иногда на глаз"]):
        medium_flags.append("неточного расчёта инсулина")
    if value_contains("bread_units_count", ["нет"]):
        medium_flags.append("нет подсчёта хлебных единиц")
    if value_contains("diet_following", ["нет"]):
        medium_flags.append("не соблюдает питание")

    score = (len(positive_flags) * 2) + len(medium_flags)
    if len(positive_flags) >= 3 or score >= 7:
        risk_level = "высокий"
    elif score >= 4:
        risk_level = "средний"
    else:
        risk_level = "низкий"

    if has_yes("nausea") and has_yes("acetone_breath"):
        risk_level = "критический"

    all_flags = positive_flags + medium_flags
    likely_concerns = []
    if any(flag in positive_flags for flag in ["запах ацетона", "тошнота или боль в животе", "быстрое развитие симптомов"]):
        likely_concerns.append("риск декомпенсации и кетоза")
    if "гликированный гемоглобин выше 7,5%" in medium_flags:
        likely_concerns.append("недостаточный контроль гликемии")
    if "неточного расчёта инсулина" in medium_flags or "нет подсчёта хлебных единиц" in medium_flags:
        likely_concerns.append("ошибки самоконтроля и коррекции инсулина")

    route_by_risk = {
        "критический": "Срочный осмотр врача и неотложная госпитализация.",
        "высокий": "Приоритетная консультация эндокринолога в ближайшее время.",
        "средний": "Плановая консультация эндокринолога и коррекция терапии.",
        "низкий": "Плановое наблюдение врача и контроль самоконтроля.",
    }
    patient_message_by_risk = {
        "критический": "Есть тревожные сочетания симптомов. Нужен срочный осмотр врача.",
        "высокий": "Нужна быстрая очная оценка врача. Не откладывайте обращение.",
        "средний": "Ответы требуют плановой оценки врача и проверки контроля заболевания.",
        "низкий": "Выраженных срочных признаков по анкете не видно, но решение остаётся за врачом.",
    }

    patient_name = str(patient.get("full_name", "")).strip() or "Пациент"
    summary_parts = [f"{patient_name}: предварительная оценка опросника."]
    if all_flags:
        summary_parts.append(f"Выявлены признаки: {', '.join(all_flags[:6])}.")
    else:
        summary_parts.append("Выраженные настораживающие признаки по анкете не выделены.")
    if likely_concerns:
        summary_parts.append(f"Вероятные проблемы: {', '.join(likely_concerns[:3])}.")
    if error_message:
        summary_parts.append("Заключение сформировано по локальным правилам, потому что нейросеть не ответила.")

    return {
        "status": "fallback" if error_message else "ok",
        "risk_level": risk_level,
        "summary_for_doctor": " ".join(summary_parts),
        "red_flags": positive_flags,
        "likely_concerns": likely_concerns,
        "recommended_route": route_by_risk[risk_level],
        "needs_urgent_review": risk_level in {"высокий", "критический"},
        "patient_message": patient_message_by_risk[risk_level],
        "error_message": error_message,
        "source": "local-rules" if error_message else "gigachat",
        "questionnaire_title": questionnaire_title,
    }


def db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with db_connection() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS patients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                full_name TEXT NOT NULL,
                birth_date TEXT DEFAULT '',
                city TEXT DEFAULT '',
                registration TEXT DEFAULT '',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                document_type TEXT DEFAULT '',
                summary TEXT DEFAULT '',
                source_text TEXT DEFAULT '',
                extracted_json TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(patient_id) REFERENCES patients(id)
            );
            """
        )


def seed_demo_database(conn):
    patient_count = conn.execute("SELECT COUNT(*) FROM patients").fetchone()[0]
    document_count = conn.execute("SELECT COUNT(*) FROM documents").fetchone()[0]
    if patient_count or document_count:
        return {"seeded": False, "patients": patient_count, "documents": document_count}

    for entry in DEMO_DATABASE_SEED:
        patient = entry["patient"]
        cursor = conn.execute(
            """
            INSERT INTO patients (full_name, birth_date, city, registration, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                patient["full_name"],
                patient["birth_date"],
                patient["city"],
                patient["registration"],
                entry["documents"][0]["created_at"],
            ),
        )
        patient_id = cursor.lastrowid
        for document in entry["documents"]:
            conn.execute(
                """
                INSERT INTO documents (patient_id, title, document_type, summary, source_text, extracted_json, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    patient_id,
                    document["title"],
                    document["document_type"],
                    document["summary"],
                    document["source_text"],
                    json.dumps(document["extracted"], ensure_ascii=False),
                    document["created_at"],
                ),
            )
    patient_count = conn.execute("SELECT COUNT(*) FROM patients").fetchone()[0]
    document_count = conn.execute("SELECT COUNT(*) FROM documents").fetchone()[0]
    return {"seeded": True, "patients": patient_count, "documents": document_count}


def seed_demo_database_now():
    init_db()
    with db_connection() as conn:
        return seed_demo_database(conn)


def save_case_to_db(title, source_text, extracted):
    init_db()
    with db_connection() as conn:
        patient_id = find_or_create_patient(conn, extracted)
        cursor = conn.execute(
            """
            INSERT INTO documents (patient_id, title, document_type, summary, source_text, extracted_json)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                patient_id,
                title,
                ((extracted.get("document") or {}).get("type") or ""),
                extracted.get("summary", ""),
                source_text,
                json.dumps(extracted, ensure_ascii=False),
            ),
        )
        document_id = cursor.lastrowid
        row = conn.execute(
            """
            SELECT p.*, COUNT(d.id) AS document_count, MAX(d.created_at) AS last_document_at
            FROM patients p
            LEFT JOIN documents d ON d.patient_id = p.id
            WHERE p.id = ?
            GROUP BY p.id
            """,
            (patient_id,),
        ).fetchone()
        document = conn.execute(
            """
            SELECT
                d.id,
                d.patient_id,
                d.title,
                d.document_type,
                d.summary,
                d.source_text,
                d.created_at
            FROM documents d
            WHERE d.id = ?
            """,
            (document_id,),
        ).fetchone()
    return {"saved": True, "patient": dict(row), "document": dict(document)}


def find_or_create_patient(conn, extracted):
    patient = extracted.get("patient") or {}
    form_fields = extracted.get("formFields") or {}
    full_name = (patient.get("name") or form_fields.get("fullName") or "").strip() or "Неизвестный пациент"
    birth_date = (patient.get("birthDate") or form_fields.get("birthDate") or "").strip()
    city = (form_fields.get("city") or "").strip()
    registration = (form_fields.get("registration") or "").strip()

    if birth_date:
        row = conn.execute(
            "SELECT id FROM patients WHERE full_name = ? AND birth_date = ? ORDER BY id LIMIT 1",
            (full_name, birth_date),
        ).fetchone()
    else:
        row = conn.execute(
            "SELECT id FROM patients WHERE full_name = ? ORDER BY id LIMIT 1",
            (full_name,),
        ).fetchone()

    if row:
        conn.execute(
            """
            UPDATE patients
            SET city = CASE WHEN city = '' THEN ? ELSE city END,
                registration = CASE WHEN registration = '' THEN ? ELSE registration END
            WHERE id = ?
            """,
            (city, registration, row["id"]),
        )
        return row["id"]

    cursor = conn.execute(
        """
        INSERT INTO patients (full_name, birth_date, city, registration)
        VALUES (?, ?, ?, ?)
        """,
        (full_name, birth_date, city, registration),
    )
    return cursor.lastrowid


def list_patients():
    init_db()
    with db_connection() as conn:
        rows = conn.execute(
            """
            SELECT p.*, COUNT(d.id) AS document_count, MAX(d.created_at) AS last_document_at
            FROM patients p
            LEFT JOIN documents d ON d.patient_id = p.id
            GROUP BY p.id
            ORDER BY COALESCE(MAX(d.created_at), p.created_at) DESC
            """
        ).fetchall()
    return [dict(row) for row in rows]


def list_documents():
    init_db()
    with db_connection() as conn:
        rows = conn.execute(
            """
            SELECT
                d.id,
                d.patient_id,
                d.title,
                d.document_type,
                d.summary,
                d.source_text,
                d.created_at,
                p.full_name AS patient_name,
                p.birth_date AS patient_birth_date
            FROM documents d
            JOIN patients p ON p.id = d.patient_id
            ORDER BY d.created_at DESC, d.id DESC
            """
        ).fetchall()
    return [dict(row) for row in rows]


def delete_document_record(document_id):
    init_db()
    with db_connection() as conn:
        cursor = conn.execute("DELETE FROM documents WHERE id = ?", (document_id,))
    return cursor.rowcount > 0


def delete_patient_record(patient_id):
    init_db()
    with db_connection() as conn:
        conn.execute("DELETE FROM documents WHERE patient_id = ?", (patient_id,))
        cursor = conn.execute("DELETE FROM patients WHERE id = ?", (patient_id,))
    return cursor.rowcount > 0


def get_patient_by_id(patient_id):
    init_db()
    with db_connection() as conn:
        row = conn.execute(
            """
            SELECT p.*, COUNT(d.id) AS document_count, MAX(d.created_at) AS last_document_at
            FROM patients p
            LEFT JOIN documents d ON d.patient_id = p.id
            WHERE p.id = ?
            GROUP BY p.id
            """,
            (patient_id,),
        ).fetchone()
    return dict(row) if row else None


def get_document_by_id(document_id):
    init_db()
    with db_connection() as conn:
        row = conn.execute(
            """
            SELECT
                d.id,
                d.patient_id,
                d.title,
                d.document_type,
                d.summary,
                d.source_text,
                d.created_at,
                p.full_name AS patient_name,
                p.birth_date AS patient_birth_date
            FROM documents d
            JOIN patients p ON p.id = d.patient_id
            WHERE d.id = ?
            """,
            (document_id,),
        ).fetchone()
    return dict(row) if row else None


def update_patient_record(patient_id, payload):
    full_name = str(payload.get("full_name", "")).strip()
    if not full_name:
        raise ValueError("ФИО пациента не может быть пустым")

    birth_date = str(payload.get("birth_date", "")).strip()
    city = str(payload.get("city", "")).strip()
    registration = str(payload.get("registration", "")).strip()

    init_db()
    with db_connection() as conn:
        cursor = conn.execute(
            """
            UPDATE patients
            SET full_name = ?, birth_date = ?, city = ?, registration = ?
            WHERE id = ?
            """,
            (full_name, birth_date, city, registration, patient_id),
        )
        if cursor.rowcount == 0:
            return None
    return get_patient_by_id(patient_id)


def update_document_record(document_id, payload):
    title = str(payload.get("title", "")).strip()
    if not title:
        raise ValueError("Название обращения не может быть пустым")

    document_type = str(payload.get("document_type", "")).strip()
    summary = str(payload.get("summary", "")).strip()

    init_db()
    with db_connection() as conn:
        cursor = conn.execute(
            """
            UPDATE documents
            SET title = ?, document_type = ?, summary = ?
            WHERE id = ?
            """,
            (title, document_type, summary, document_id),
        )
        if cursor.rowcount == 0:
            return None
    return get_document_by_id(document_id)


def extract_numeric_id(path, prefix):
    if not path.startswith(prefix):
        return None
    value = path[len(prefix):].split("?", 1)[0].strip("/")
    if not value.isdigit():
        return None
    return int(value)


def preprocess_image(image, mode="auto"):
    base_rgb = ImageOps.exif_transpose(image).convert("RGB")
    base = base_rgb.convert("L")
    if max(base.size) > 2200:
        base_rgb.thumbnail((2200, 2200))
        base = base_rgb.convert("L")

    best_angle = 0
    best_image = prepare_for_ocr(base)
    best_rgb = base_rgb

    blue_mask = build_blue_mask(best_rgb)
    blue_bbox = component_bbox(blue_mask, best_rgb.size)
    form_like = mode == "form" or (
        blue_bbox is not None and infer_form_like(best_image, best_rgb)
    )

    if form_like and blue_bbox is not None:
        cropped_rgb = crop_with_padding(best_rgb, blue_bbox)
        handwriting = prepare_color_text_output(cropped_rgb)
        printed_crop = crop_text_area(best_rgb, best_image)
        printed = prepare_form_print_output(printed_crop)
        final_image = merge_ocr_layers(printed, handwriting)
        return final_image, best_angle, {"printed": printed, "handwriting": handwriting}

    if blue_bbox is not None:
        cropped_rgb = crop_with_padding(best_rgb, blue_bbox)
        final_image = prepare_color_text_output(cropped_rgb)
        return final_image, best_angle, {"printed": None, "handwriting": final_image}

    cropped = crop_text_area(best_rgb, best_image)
    final_image = prepare_final_output(cropped)
    return final_image, best_angle, {"printed": None, "handwriting": None}


def prepare_for_ocr(image):
    grayscale = image.convert("L")
    contrasted = ImageOps.autocontrast(grayscale, cutoff=1)
    denoised = contrasted.filter(ImageFilter.MedianFilter(size=3))
    sharpened = denoised.filter(ImageFilter.SHARPEN)
    return sharpened


def prepare_final_output(image):
    expanded = ImageOps.expand(image, border=24, fill=255)
    contrasted = ImageOps.autocontrast(expanded, cutoff=1)
    binary = contrasted.point(lambda p: 255 if p > 170 else 0, mode="1")
    return binary.convert("L")


def prepare_color_text_output(image):
    mask = build_blue_mask(image)
    thickened = mask.filter(ImageFilter.MaxFilter(size=3))
    white_background = thickened.point(lambda p: 0 if p > 0 else 255, mode="L")
    expanded = ImageOps.expand(white_background, border=24, fill=255)
    return expanded


def prepare_form_print_output(image):
    expanded = ImageOps.expand(image, border=20, fill=255)
    contrasted = ImageOps.autocontrast(expanded, cutoff=1)
    without_blue = suppress_blue_ink(contrasted)
    binary = without_blue.point(lambda p: 255 if p > 185 else 0, mode="1")
    return binary.convert("L")


def merge_ocr_layers(printed, handwriting):
    width = max(printed.width, handwriting.width)
    height = printed.height + handwriting.height + 20
    canvas = Image.new("L", (width, height), 255)
    canvas.paste(printed, (0, 0))
    canvas.paste(handwriting, (0, printed.height + 20))
    return canvas


def crop_text_area(source_rgb, prepared_gray):
    bbox = find_text_bbox(source_rgb, prepared_gray)
    if bbox is None:
        return prepared_gray

    return crop_with_padding(prepared_gray, bbox)


def crop_with_padding(image, bbox):
    left, top, right, bottom = bbox
    pad_x = max(18, int((right - left) * 0.08))
    pad_y = max(18, int((bottom - top) * 0.12))
    left = max(0, left - pad_x)
    top = max(0, top - pad_y)
    right = min(image.width, right + pad_x)
    bottom = min(image.height, bottom + pad_y)
    return image.crop((left, top, right, bottom))


def find_text_bbox(source_rgb, prepared_gray):
    bbox = component_bbox(build_blue_mask(source_rgb), source_rgb.size)
    if bbox is not None:
        return bbox
    return component_bbox(build_dark_mask(prepared_gray), prepared_gray.size)


def build_blue_mask(image):
    pixels = []
    for red, green, blue in image.getdata():
        is_blue = blue > 45 and blue > red + 10 and blue > green + 6
        pixels.append(255 if is_blue else 0)
    mask = Image.new("L", image.size)
    mask.putdata(pixels)
    return mask


def suppress_blue_ink(image):
    rgb = image.convert("RGB")
    pixels = []
    for red, green, blue in rgb.getdata():
        if blue > red + 10 and blue > green + 6:
            pixels.append(255)
        else:
            pixels.append(int((red + green + blue) / 3))
    gray = Image.new("L", rgb.size)
    gray.putdata(pixels)
    return gray


def build_dark_mask(image):
    return image.point(lambda p: 255 if p < 155 else 0, mode="1").convert("L")


def component_bbox(binary, size):
    width, height = size
    pixels = list(binary.getdata())
    visited = bytearray(width * height)
    components = []
    max_component_area = max(96, int(width * height * 0.01))

    for y in range(height):
        for x in range(width):
            idx = y * width + x
            if visited[idx] or pixels[idx] == 0:
                continue

            stack = [idx]
            visited[idx] = 1
            area = 0
            min_x = max_x = x
            min_y = max_y = y

            while stack:
                current = stack.pop()
                cx = current % width
                cy = current // width
                area += 1
                min_x = min(min_x, cx)
                max_x = max(max_x, cx)
                min_y = min(min_y, cy)
                max_y = max(max_y, cy)

                for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                    if nx < 0 or ny < 0 or nx >= width or ny >= height:
                        continue
                    neighbor = ny * width + nx
                    if visited[neighbor] or pixels[neighbor] == 0:
                        continue
                    visited[neighbor] = 1
                    stack.append(neighbor)

            box_width = max_x - min_x + 1
            box_height = max_y - min_y + 1
            if area < 8 or area > max_component_area:
                continue
            if box_width > width * 0.45 and box_height > height * 0.25:
                continue

            components.append((min_x, min_y, max_x + 1, max_y + 1, area))

    if not components:
        return None

    left = min(component[0] for component in components)
    top = min(component[1] for component in components)
    right = max(component[2] for component in components)
    bottom = max(component[3] for component in components)
    return left, top, right, bottom


def infer_form_like(prepared_gray, source_rgb):
    row_count = count_horizontal_lines(prepared_gray)
    blue_bbox = component_bbox(build_blue_mask(source_rgb), source_rgb.size)
    return row_count >= 6 or blue_bbox is not None


def count_horizontal_lines(image):
    binary = image.point(lambda p: 255 if p < 165 else 0, mode="1").convert("L")
    width, height = binary.size
    pixels = list(binary.getdata())
    row_scores = []
    for y in range(height):
        offset = y * width
        ink = sum(1 for x in range(width) if pixels[offset + x] > 0)
        row_scores.append(ink / width)
    return sum(1 for score in row_scores if score > 0.3)


def score_orientation(image):
    sample = image.copy()
    sample.thumbnail((320, 320))
    binary = sample.point(lambda p: 255 if p > 180 else 0, mode="1").convert("L")
    width, height = binary.size
    pixels = list(binary.getdata())
    row_scores = []
    col_scores = [0] * width

    for y in range(height):
        row_sum = 0
        offset = y * width
        for x in range(width):
            ink = 255 - pixels[offset + x]
            row_sum += ink
            col_scores[x] += ink
        row_scores.append(row_sum)

    row_variation = sum(abs(row_scores[idx] - row_scores[idx - 1]) for idx in range(1, len(row_scores)))
    col_variation = sum(abs(col_scores[idx] - col_scores[idx - 1]) for idx in range(1, len(col_scores)))
    return row_variation - (col_variation * 0.7)


def encode_image(image_bytes):
    import base64

    encoded = base64.b64encode(image_bytes).decode("ascii")
    return f"data:image/png;base64,{encoded}"


if __name__ == "__main__":
    init_db()
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8000"))
    server = ThreadingHTTPServer((host, port), MedFlowHandler)
    print(f"Serving MedFlow on http://{host}:{port}")
    server.serve_forever()
