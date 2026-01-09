#!/bin/bash -e
NAME="cons-cms"
IP="92.205.182.35"

# Check if the .kt file exists in the same directory as the script
if [ -f "$(dirname "\$0")/.kt" ]; then
    USER="khaled.altimany"
else
    USER="ali.ab"
fi

# Check if the zip file exists before trying to remove it
if [ -f "$NAME.zip" ]; then
    rm $NAME.zip
fi

yes | cp .env .env.example &&
yes | cp .env.prod .env &&
yes | cp Dockerfile.manual Dockerfile &&

git archive --format zip --output ./$NAME.zip develop &&
zip ./$NAME.zip .env &&
zip ./$NAME.zip Dockerfile &&

yes | mv .env.example .env &&
yes | mv Dockerfile Dockerfile.manual &&

scp $NAME.zip deploy-cms.sh $USER@$IP: &&
ssh -t $USER@$IP "sh -x deploy-cms.sh" &&

echo "done"