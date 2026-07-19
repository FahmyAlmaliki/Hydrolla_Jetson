"""
Hydrolla Telegram Bot
=====================
Jalankan bot ini untuk menerima command dari Telegram.

Commands:
  /start       — Pesan sambutan
  /datasensor  — Kirim data sensor terbaru (pH, DO, Suhu, NH3)
  /help        — Daftar command

Environment variables (dari .env):
  TELEGRAM_BOT_TOKEN        — Token dari @BotFather (wajib)
  HYDROLLA_API_URL          — URL Next.js API (default: http://web:3030)
  TELEGRAM_ALLOWED_CHAT_ID  — (Opsional) Chat ID yang diizinkan, kosongkan untuk semua
"""

import os
import logging
import httpx
from datetime import datetime, timezone, timedelta
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes
from telegram.constants import ParseMode

# ─────────────────────────────────────────────────────────────────
#  Konfigurasi
# ─────────────────────────────────────────────────────────────────

BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
API_URL = os.environ.get("HYDROLLA_API_URL", "http://web:3030")
ALLOWED_CHAT_ID_STR = os.environ.get("TELEGRAM_ALLOWED_CHAT_ID", "")
ALLOWED_CHAT_ID = int(ALLOWED_CHAT_ID_STR) if ALLOWED_CHAT_ID_STR.strip() else None

logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger("hydrolla-bot")

WIB = timezone(timedelta(hours=7))

# ─────────────────────────────────────────────────────────────────
#  Helper: cek akses
# ─────────────────────────────────────────────────────────────────

def is_allowed(update: Update) -> bool:
    """Cek apakah chat diizinkan mengakses bot."""
    if ALLOWED_CHAT_ID is None:
        return True  # semua diizinkan
    return update.effective_chat.id == ALLOWED_CHAT_ID

# ─────────────────────────────────────────────────────────────────
#  Helper: format status → emoji
# ─────────────────────────────────────────────────────────────────

STATUS_EMOJI = {
    "BAIK":    "✅",
    "WASPADA": "⚠️",
    "KRITIS":  "🚨",
}

def fmt_status(status: str) -> str:
    emoji = STATUS_EMOJI.get(status.upper(), "❓")
    return f"{emoji} {status.upper()}"

# ─────────────────────────────────────────────────────────────────
#  Helper: fetch data sensor dari API
# ─────────────────────────────────────────────────────────────────

async def fetch_sensor_data() -> dict | None:
    """
    Fetch data dari endpoint /api/dashboard.
    Return dict DashboardData atau None jika gagal.
    """
    url = f"{API_URL}/api/dashboard"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            return resp.json()
    except httpx.RequestError as e:
        logger.error("Gagal connect ke API: %s", e)
        return None
    except httpx.HTTPStatusError as e:
        logger.error("API error %s: %s", e.response.status_code, e)
        return None

# ─────────────────────────────────────────────────────────────────
#  Command: /start
# ─────────────────────────────────────────────────────────────────

async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not is_allowed(update):
        await update.message.reply_text("⛔ Akses tidak diizinkan.")
        return

    text = (
        "🌊 *Selamat datang di Hydrolla Bot\\!*\n\n"
        "Bot ini memantau kualitas air kolam budidaya secara real\\-time\\.\n\n"
        "📋 *Command yang tersedia:*\n"
        "  `/datasensor` — Data sensor terkini\n"
        "  `/help` — Bantuan\n\n"
        "Ketik /datasensor untuk mulai\\!"
    )
    await update.message.reply_text(text, parse_mode=ParseMode.MARKDOWN_V2)

# ─────────────────────────────────────────────────────────────────
#  Command: /help
# ─────────────────────────────────────────────────────────────────

async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not is_allowed(update):
        await update.message.reply_text("⛔ Akses tidak diizinkan.")
        return

    text = (
        "🆘 *Bantuan Hydrolla Bot*\n\n"
        "Berikut daftar command yang tersedia:\n\n"
        "🔹 `/datasensor`\n"
        "   Menampilkan data sensor terbaru\\:\n"
        "   pH, DO, Suhu, dan Amonia \\(NH3\\)\n"
        "   beserta status kondisinya\\.\n\n"
        "🔹 `/start` — Pesan sambutan\n"
        "🔹 `/help` — Tampilkan pesan ini\n\n"
        "Status kondisi:\n"
        "✅ BAIK — Parameter dalam batas normal\n"
        "⚠️ WASPADA — Parameter mendekati batas\n"
        "🚨 KRITIS — Parameter di luar batas aman"
    )
    await update.message.reply_text(text, parse_mode=ParseMode.MARKDOWN_V2)

# ─────────────────────────────────────────────────────────────────
#  Command: /datasensor
# ─────────────────────────────────────────────────────────────────

async def cmd_datasensor(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not is_allowed(update):
        await update.message.reply_text("⛔ Akses tidak diizinkan.")
        return

    # Kirim pesan loading dulu
    loading_msg = await update.message.reply_text("⏳ Mengambil data sensor\\.\\.\\.", parse_mode=ParseMode.MARKDOWN_V2)

    data = await fetch_sensor_data()

    if data is None:
        await loading_msg.edit_text(
            "❌ *Gagal mengambil data sensor\\.*\n\n"
            "Pastikan sistem Hydrolla sedang berjalan\\.",
            parse_mode=ParseMode.MARKDOWN_V2,
        )
        return

    sensors: list[dict] = data.get("sensors", [])
    data_source: str = data.get("dataSource", "unknown")

    if not sensors:
        await loading_msg.edit_text(
            "⚠️ *Tidak ada data sensor yang tersedia\\.*",
            parse_mode=ParseMode.MARKDOWN_V2,
        )
        return

    # Buat dict sensor berdasarkan parameter
    sensor_map = {s["parameter"]: s for s in sensors}

    # Waktu sekarang WIB
    now = datetime.now(WIB)
    time_str = now.strftime("%d %b %Y, %H:%M WIB")

    # Format setiap sensor
    def fmt_sensor(param: str, unit: str, icon: str) -> str:
        s = sensor_map.get(param)
        if not s:
            return f"{icon} *{escape_md(param)}*: \\-"
        val = s["value"]
        unit_str = f" {escape_md(unit)}" if unit else ""
        status_str = fmt_status(s["status"])
        return f"{icon} *{escape_md(param)}*: `{val}`{unit_str}  {status_str}"

    ph_line   = fmt_sensor("pH",   "",      "🔬")
    do_line   = fmt_sensor("DO",   "mg/L",  "💧")
    suhu_line = fmt_sensor("Suhu", "°C",    "🌡")
    nh3_line  = fmt_sensor("NH3",  "mg/L",  "☣️")

    # Cek apakah ada kondisi KRITIS
    all_statuses = [s.get("status", "BAIK") for s in sensors]
    has_kritis = "KRITIS" in all_statuses
    has_waspada = "WASPADA" in all_statuses

    if has_kritis:
        overall = "🚨 *Ada parameter KRITIS\\! Segera periksa kolam\\.*"
    elif has_waspada:
        overall = "⚠️ *Ada parameter WASPADA\\. Pantau terus kondisi kolam\\.*"
    else:
        overall = "✅ *Semua parameter dalam kondisi BAIK\\.*"

    src_icon = "🛢" if data_source == "influxdb" else "🧪"
    src_label = "InfluxDB \\(Real\\-time\\)" if data_source == "influxdb" else "Mock Data \\(Simulasi\\)"

    message = (
        f"🌊 *Hydrolla — Data Sensor Terbaru*\n"
        f"⏱ {escape_md(time_str)}\n"
        f"{'─' * 28}\n\n"
        f"{ph_line}\n"
        f"{do_line}\n"
        f"{suhu_line}\n"
        f"{nh3_line}\n\n"
        f"{'─' * 28}\n"
        f"{overall}\n\n"
        f"{src_icon} Sumber: {src_label}"
    )

    await loading_msg.edit_text(message, parse_mode=ParseMode.MARKDOWN_V2)
    logger.info(
        "Data sensor dikirim ke chat_id=%s (source=%s)",
        update.effective_chat.id,
        data_source,
    )

# ─────────────────────────────────────────────────────────────────
#  Helper: escape karakter MarkdownV2
# ─────────────────────────────────────────────────────────────────

def escape_md(text: str) -> str:
    """Escape karakter spesial untuk MarkdownV2 Telegram."""
    special = r"\_*[]()~`>#+-=|{}.!"
    for ch in special:
        text = text.replace(ch, f"\\{ch}")
    return text

# ─────────────────────────────────────────────────────────────────
#  Main
# ─────────────────────────────────────────────────────────────────

def main() -> None:
    if not BOT_TOKEN:
        logger.error(
            "TELEGRAM_BOT_TOKEN tidak ditemukan di environment! "
            "Tambahkan ke file .env dan restart service."
        )
        raise SystemExit(1)

    logger.info("Memulai Hydrolla Telegram Bot...")
    logger.info("API URL: %s", API_URL)
    if ALLOWED_CHAT_ID:
        logger.info("Akses dibatasi ke chat_id: %s", ALLOWED_CHAT_ID)
    else:
        logger.info("Akses terbuka untuk semua chat.")

    app = Application.builder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("help", cmd_help))
    app.add_handler(CommandHandler("datasensor", cmd_datasensor))

    logger.info("Bot berjalan. Tekan Ctrl+C untuk stop.")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
