@echo off
if exist ".venv\Scripts\agilent.exe" (
    ".venv\Scripts\agilent.exe" %*
) else (
    ".venv\Scripts\python.exe" -m agilent_native.cli %*
)
