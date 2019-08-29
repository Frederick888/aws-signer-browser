#!/usr/bin/env bash

cd ./aws-signer-browser

zip -r -FS ../aws-signer-browser.zip * \
    -x 'node_modules/*' \
    -x package.json -x yarn.lock
zip -r ../aws-signer-browser.zip * \
    -i 'node_modules/materialize-css/dist/*' \
    -i 'node_modules/@mdi/font/css/*.css' \
    -i 'node_modules/@mdi/font/fonts/*' \
    -i 'node_modules/crypto-js/*'

cd ..
