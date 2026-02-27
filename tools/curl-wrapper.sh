#!/bin/sh
# Wrapper to run curl from Windows System32 via Cygwin
# Usage: ./curl-wrapper.sh <curl-args>
/cygdrive/c/Windows/System32/curl.exe "$@"
