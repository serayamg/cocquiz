@echo off
title QuizCOC Auto Sync
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\sync-watcher.ps1"
pause
