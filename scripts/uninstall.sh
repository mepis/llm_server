LLM_SERVER_HOME=/home/jon/.llm_server/

systemctl --user stop llama.service
systemctl --user disable llama.service
sudo rm -r ~/.config/systemd/user/llama.service
sudo rm -r $LLM_SERVER_HOME