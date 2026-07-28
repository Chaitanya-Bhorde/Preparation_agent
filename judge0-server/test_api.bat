@echo off
echo Waiting 20 seconds for services to fully start...
timeout /t 20 /nobreak >nul
echo.
echo Testing Judge0 API at http://localhost:2358/about
curl http://localhost:2358/about
echo.
echo Done.
pause