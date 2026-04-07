@echo off
REM Use environment variables or local configuration for signtool path and thumbprint
set SIGNTOOL_PATH="C:\Program Files (x86)\Windows Kits\10\bin\10.0.22000.0\x64\signtool"
set CERT_THUMBPRINT=fc4686753937a93fdcd48c2bb4375e239af92dcb

if defined CI (
  echo Skipping signing in CI environment.
  exit /b 0
)

%SIGNTOOL_PATH% sign /v /sha1 %CERT_THUMBPRINT% /fd SHA256 /tr http://timestamp.acs.microsoft.com /td SHA256 %*
