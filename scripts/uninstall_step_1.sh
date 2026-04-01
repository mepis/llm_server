#!/bin/bash
if [ "$EUID" -ne 0 ]; then echo "Please run this script as root user"; exit 1; fi

# remove searxng
sudo userdel searxng
sudo apt remove --purge uwsgi* -y
sudo apt remove --purge valkey* -y
sudo rm -r /usr/local/searxng
sudo rm -r /etc/searxng/
sudo rm -r /etc/uwsgi/

# remove nginx
sudo apt remove --purge nginx* -y

sudo rm -r /etc/nginx 

# clean up
sudo apt autoremove -y