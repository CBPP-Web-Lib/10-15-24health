Requirements: Must be using Mac OS X, or Windows Subsystem for Linux, and have Docker installed.

After cloning this template repo:

(Only once)
1. Run `chmod +x *.sh` to make scripts executable
2. Run `./install.sh` to install node modules and set environment variables to your user ID
3. Run `./setup.sh` to download shapefiles and convert to topojson

(Whenever working on project)
1. Run `./start.sh` and visit `http://localhost:8080` (dev bundle; builds fast) or `http://localhost:8081` (prod bundle, builds slower, this is the one that gets deployed)
2. In a separate terminal, run `./stop.sh` when done (or just ctrl-x in the running terminal)

To enter the Node container (for example, to run `npm i` this or that) just run `./enter_container.sh` to be dropped into a shell inside; and then just `exit` when done.