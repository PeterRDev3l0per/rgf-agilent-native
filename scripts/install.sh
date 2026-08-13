#!/usr/bin/env bash
# Agilent Native Suite — One-Liner Instant Installer for macOS & Linux

set -e

COLOR_CYAN='\033[96m'
COLOR_GREEN='\033[92m'
COLOR_RESET='\033[0m'

echo -e "${COLOR_CYAN}===================================================================${COLOR_RESET}"
echo -e "${COLOR_CYAN}    ⚡ AGILENT NATIVE SUITE — INSTANT INSTALLER (macOS / Linux) ⚡${COLOR_RESET}"
echo -e "${COLOR_CYAN}===================================================================${COLOR_RESET}"

# Check Python 3.10+
if ! command -v python3 &> /dev/null; then
    echo -e "❌ Error: Python 3.10+ is required but not installed."
    exit 1
fi

INSTALL_DIR="$HOME/.agilent-native"

if [ -d "$INSTALL_DIR" ]; then
    echo -e "🔄 Updating existing installation in $INSTALL_DIR..."
    cd "$INSTALL_DIR"
    git pull origin main
else
    echo -e "📥 Cloning Agilent Native Suite into $INSTALL_DIR..."
    git clone https://github.com/PeterRDev3l0per/rgf-agilent-native.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

if [ ! -d ".venv" ]; then
    echo -e "⚙️ Creating Python virtual environment..."
    python3 -m venv .venv
fi

source .venv/bin/activate
pip install --upgrade pip
pip install -e .[dev]

echo -e "${COLOR_GREEN}✓ Installation complete! Running Agilent Setup Wizard...${COLOR_RESET}"
python3 scripts/setup.py --non-interactive
