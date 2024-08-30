#!/bin/bash

home=$HOME
profile=$PROFILE

echo "Connecting to $profile"

#export SUDO_ASKPASS="$home/.config/wireguard-gui/zenity.sh"

profile_path="/etc/wireguard/$profile.conf"

# Create a temporary script under /tmp/wireguard-tmp.sh
cat <<EOF > /tmp/wireguard-tmp.sh
#!/bin/bash

cp -f "$home/.config/wireguard-gui/profiles/$profile.conf" "$profile_path"

if ip a | grep -q $profile; then
  wg-quick down $profile
else
  wg-quick up $profile
fi
EOF

chmod +x /tmp/wireguard-tmp.sh

pkexec /tmp/wireguard-tmp.sh

STATUS=$?

echo "Return code: $STATUS"

rm /tmp/wireguard-tmp.sh

exit $STATUS
