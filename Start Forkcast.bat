@echo off
rem Serves Forkcast on localhost (needed for "Use my location") and opens it.
cd /d "%~dp0"
start "" http://localhost:8793
python -m http.server 8793
