#!/bin/bash

home=$HOME
profile=$PROFILE

echo "Connecting to $profile"

export SUDO_ASKPASS="$home/.config/wireguard-gui/zenity.sh"

profile_path="/etc/wireguard/$profile.conf"

# Create a temporary script under /tmp/wireguard-tmp.sh
cat <<EOF > /tmp/wireguard-tmp.sh
#!/bin/bash

if [ ! -f "$profile_path" ]; then
  ln -s "$home/.config/wireguard-gui/profiles/$profile.conf" "$profile_path"
  chmod 400 "$profile_path"
fi

if ip a | grep -q $profile; then
  wg-quick down $profile
else
  wg-quick up $profile
fi
EOF

chmod +x /tmp/wireguard-tmp.sh

sudo -A -s /tmp/wireguard-tmp.sh

rm /tmp/wireguard-tmp.sh
