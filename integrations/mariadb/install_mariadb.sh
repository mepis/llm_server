#!/bin/bash

# MariaDB Installation Script for Ubuntu/Debian

set -e

echo "Updating package lists..."
sudo apt update

echo "Installing MariaDB Server..."
sudo apt install -y mariadb-server

echo "Starting and enabling MariaDB..."
sudo systemctl start mariadb
sudo systemctl enable mariadb

echo "--------------------------------------------------------"
echo "MariaDB installation completed successfully."
echo "--------------------------------------------------------"
echo "It is recommended to run 'sudo mysql_secure_installation' to secure your installation."
echo "To log in as root, use: sudo mysql -u root"
echo ""
