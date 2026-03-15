#!/ /bin/bash
source "$(dirname "$0")/central_config.sh"
systemctl --user restart llama.service