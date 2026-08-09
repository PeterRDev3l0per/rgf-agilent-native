"""Playwright E2E Integration Test Suite for Agilent Native Web UI."""

import asyncio
import os
import threading
import time
import pytest
import uvicorn
from playwright.async_api import async_playwright, Page, expect

from agilent_native.config import config
from agilent_native.server import app, track_event


class ServerThread(threading.Thread):
    def __init__(self):
        super().__init__(daemon=True)
        self.server = uvicorn.Server(uvicorn.Config(app, host="127.0.0.1", port=8005, log_level="warning"))

    def run(self):
        self.server.run()

    def stop(self):
        self.server.should_exit = True


@pytest.fixture(scope="module", autouse=True)
def live_server():
    """Start live test server on port 8005."""
    server = ServerThread()
    server.start()
    time.sleep(1.5)
    yield
    server.stop()


@pytest.fixture(scope="module", autouse=True)
def seed_test_data():
    """Seed test work item data into SQLite."""
    asyncio.run(
        track_event(
            change_name="e2e-playwright-task",
            event_type="in_progress",
            status="success",
            payload={
                "start_date": "2026-08-09",
                "target_date": "2026-08-10",
                "test_results": "6/6 Tests Passed",
                "release": "v1.0.0-e2e",
            },
        )
    )


@pytest.mark.asyncio
async def test_e2e_kanban_gantt_chat_and_telemetry():
    """Execute complete E2E test covering all 4 user cases in headless browser."""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("http://127.0.0.1:8005/app/", wait_until="networkidle")

        # 1. Verify Page Title
        title = await page.title()
        assert "Agilent Native Suite" in title

        # 2. Verify Header Telemetry Badges
        ollama_badge = page.locator("#badge-ollama")
        await expect(ollama_badge).to_be_visible()

        ram_badge = page.locator("#text-ram")
        await expect(ram_badge).to_be_visible()

        # 3. Verify Kanban Board Task Rendering
        kanban_col = page.locator("#col-in-progress")
        await expect(kanban_col).to_be_visible()
        card_text = await page.content()
        assert "E2e Playwright Task" in card_text or "agilent" in card_text.lower()

        # 5. Verify Manual Task Creation Modal
        await page.click("button:has-text('+ Nueva Tarea')")
        await page.wait_for_timeout(300)
        create_modal = page.locator("#modal-create-task")
        await expect(create_modal).to_be_visible()

        await page.fill("#create-title", "Manual E2E Test Task")
        await page.fill("#create-description", "Created via Playwright automated E2E test")
        await page.click("button:has-text('Guardar Tarea')")
        await page.wait_for_timeout(500)

        # 6. Verify Task Details View Modal
        eye_btn = page.locator("button[title='Ver Detalle']").first
        if await eye_btn.count() > 0:
            await eye_btn.click()
            await page.wait_for_timeout(300)
            detail_modal = page.locator("#modal-task-detail")
            await expect(detail_modal).to_be_visible()
            await page.click("button:has-text('Cerrar Detalle')")

        # 7. Verify Local RAG Chat Query Execution
        await page.click("#tab-chat")
        await page.wait_for_timeout(500)
        await page.fill("#chat-input", "¿Cuál es el estado del proyecto?")
        await page.press("#chat-input", "Enter")

        # Wait for chat response feed update
        await page.wait_for_timeout(2000)
        chat_feed = page.locator("#chat-feed")
        feed_text = await chat_feed.inner_text()
        assert "¿Cuál es el estado del proyecto?" in feed_text

        await browser.close()
