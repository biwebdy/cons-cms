#!/bin/bash -e

NAME="cons-cms"
VERSION="1.0.0"
PORT="1449"
OLDIMAGE="$(docker images --filter=reference=$NAME --format "{{.ID}}")"


if [ -e $NAME.zip ];
then
  rm -rf cms/ &&
  mkdir cms &&
  mv $NAME.zip  cms/$NAME.zip &&
  cd cms/ &&
  unzip -qo $NAME.zip &&
  rm $NAME.zip &&
  docker build --no-cache -t $NAME:$VERSION . &&
  docker rm -f $NAME &&
  docker run --network host --name $NAME --restart unless-stopped -p $PORT:$PORT -v /data/$NAME:/strapi/public -d $NAME:$VERSION &&
  docker rmi $OLDIMAGE &&
  echo "done"
else
  disp_error "Please make sure that '$NAME.zip' is available under $PWD" &&
  disp_error "Going to stop the script! " &&
  disp_success "Dont worry no change was made. Place '$NAME.zip' under $PWD and re-run the script." &&
  exit 1
fi
