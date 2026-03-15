#!/ /bin/bash
source "$(dirname "$0")/central_config.sh"
curl -fsSL https://opencode.ai/install | bash
mkdir ~/.config/opencode
cd ..