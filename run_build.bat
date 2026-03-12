@echo off
npm run build > build_output.txt 2>&1
echo Build finished with errorlevel %errorlevel% >> build_output.txt
