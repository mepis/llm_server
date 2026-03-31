#!/bin/bash

sudo apt install nginx

# sudo useradd --shell /bin/bash --system --home-dir "/usr/local/searxng" --comment 'Privacy-respecting metasearch engine' searxng
sudo git clone "https://github.com/searxng/searxng" "/usr/local/searxng/"
# sudo chown -R "searxng:searxng" "/usr/local/searxng"
cd /usr/local/searxng/
git config --global --add safe.directory /usr/local/searxng
sudo -H ./utils/searxng.sh install all
# sudo cp searxng /etc/nginx/sites-enabled/searxng
# sudo rm /etc/nginx/sites-enabled/default
# sudo systemctl restart nginx
# sudo service uwsgi restart searxng