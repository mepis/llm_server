# remove opencode
systemctl --user stop opencode-web.service
systemctl --user disable opencode-web.service
sudo rm -r $HOME/.config/systemd/user/opencode-web.service
sudo rm -r $HOME/.opencode
sudo rm -r $HOME/.config/opencode

# remove llama.cpp
systemctl --user stop llama.service
systemctl --user disable llama.service
sudo rm -r $HOME/.config/systemd/user/llama.service
sudo rm -r $HOME/.llm_server

# remove searxng
sudo userdel searxng
sudo apt remove uwsgi -y
sudo rm -r /usr/local/searxng
sudo rm -r /etc/searxng/
sudo rm -r /etc/uwsgi/

# remove nginx
sudo apt remove nginx
sudo rm -r /etc/nginx 

# clean up
sudo apt autoremove -y
