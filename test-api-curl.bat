@echo off
echo Testing Netlify Functions API...
echo.

set SITE_URL=https://dineritou.netlify.app

echo Testing GET /api/members...
curl -v "%SITE_URL%/api/members"
echo.
echo.

echo Testing GET /api/categories...
curl -v "%SITE_URL%/api/categories"
echo.
echo.

echo Testing GET /api/transactions...
curl -v "%SITE_URL%/api/transactions"
echo.
echo.

echo Done! Check the responses above.
pause