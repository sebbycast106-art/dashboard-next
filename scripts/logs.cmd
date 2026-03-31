@echo off
setlocal

:: Stream live Railway logs for the dashboard service
:: Run this from anywhere - it uses the linked project config

set "RAILWAY=%~dp0..\..\railway-cli\railway.exe"
if not exist "%RAILWAY%" set "RAILWAY=railway"

"%RAILWAY%" logs --service 8d2e4474-cae1-48c4-88a1-59c5f215fcf3 --environment e50cf998-9ca9-4676-938c-b9bd7413c16b
