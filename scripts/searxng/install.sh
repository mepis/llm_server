#!/bin/bash

sudo useradd --shell /bin/bash --system --home-dir "/usr/local/searxng" --comment 'Privacy-respecting metasearch engine' searxng
sudo git clone "https://github.com/searxng/searxng" "/usr/local/searxng/"
sudo chown -R "searxng:searxng" "/usr/local/searxng"
cd /usr/local/searxng/
sudo ./utils/searxng.sh install all
sudo apt-get install nginx
sudo cp searxng /etc/nginx/sites-enabled/searxng
sudo systemctl restart nginx
sudo service uwsgi restart searxng