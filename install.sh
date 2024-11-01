GROUP_ID=$(id -g)
USER_ID=$(id -u)
cp -r .env_custom .env
echo "" >> .env
if [[ $(uname) == "Darwin" ]]; then
    GROUP_ID=0
    USER_ID=0
fi
echo UID=${USER_ID} >> .env
echo GID=${GROUP_ID} >> .env
docker-compose run -u ${USER_ID} --workdir "/opt/project/app" --entrypoint  "yarn install" node-watch