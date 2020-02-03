#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

cd "$DIR/aws-signer-browser" || { printf 'Project directory aws-signer-browser not found?\n'; exit 1; }

zip -r -FS ../aws-signer-browser.zip -- * \
    -x 'node_modules/*' \
    -x package.json -x yarn.lock
zip -r ../aws-signer-browser.zip -- * \
    -i 'node_modules/materialize-css/dist/*' \
    -i 'node_modules/@mdi/font/css/*.css' \
    -i 'node_modules/@mdi/font/fonts/*' \
    -i 'node_modules/crypto-js/*'
zip -d ../aws-signer-browser.zip '**/.DS_Store' '**/*.min.js' '**/*.min.css'

cd ..
