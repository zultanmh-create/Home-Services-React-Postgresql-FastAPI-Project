@echo off
echo Fixing jose package issue...
echo.
echo Uninstalling incorrect 'jose' package...
pip uninstall jose -y
echo.
echo Installing correct 'python-jose' package...
pip install python-jose[cryptography]
echo.
echo Done! Now try running: fastapi dev main.py
pause

