#!/bin/bash

current_dir=$(pwd)



echo "${current_dir}"

echo $HOME

cd $HOME
ls

LLM_SERVER_HOME=$HOME/.llm_server

echo $LLM_SERVER_HOME

ls $LLM_SERVER_HOME


echo $HOME/.config/opencode
ls $HOME/.config/opencode