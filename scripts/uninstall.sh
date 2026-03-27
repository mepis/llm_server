
systemctl --user stop llama.service
systemctl --user disable llama.service
LLM_SERVER_HOME=/home/jon/.llm_server/

sudo rm -r $LLM_SERVER_HOME