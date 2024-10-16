USER_ID=$(id -u)
docker-compose run -u ${USER_ID} --workdir "/opt/project/app" --entrypoint  "node dl_shapefiles" node-watch 
docker-compose run -u ${USER_ID} --workdir "/opt/project/app" --entrypoint  "node topo_shapefiles" node-watch