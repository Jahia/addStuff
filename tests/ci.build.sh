#!/bin/bash
source ./set-env.sh

# Copy the addstuff SNAPSHOT JAR into assets/ so it is available to the provisioning manifest
find "../target" -maxdepth 1 -name "addstuff-*.jar" ! -name "*sources*" | head -1 | xargs -I{} cp {} ./assets/

echo "Assets ready:"
ls -la assets/
