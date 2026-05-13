#!/bin/bash
source ./set-env.sh

echo " == Printing the most important environment variables"
echo " MANIFEST: ${MANIFEST}"
echo " JAHIA_IMAGE: ${JAHIA_IMAGE}"
echo " MODULE_ID: ${MODULE_ID}"
echo " JAHIA_URL: ${JAHIA_URL}"
echo " SUPER_USER_PASSWORD: ${SUPER_USER_PASSWORD}"

if [[ -z ${JAHIA_LICENSE} ]]; then
    if [[ -f /tmp/license.xml ]]; then
        echo " == License found in /tmp/license.xml, encoding it =="
        export JAHIA_LICENSE=$(base64 -i /tmp/license.xml)
    else
        echo " == STARTUP FAILURE: no JAHIA_LICENSE env var and no /tmp/license.xml =="
        exit 1
    fi
fi

echo " == Starting Jahia =="
docker-compose up -d --renew-anon-volumes jahia

if [[ "$1" != "notests" ]]; then
    ./env.run.sh
fi
