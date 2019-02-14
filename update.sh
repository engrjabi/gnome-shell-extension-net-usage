#!/bin/bash
source="./net-usage@engrjabi"
destination="$HOME/.local/share/gnome-shell/extensions"
if [ ! -d "$destination" ]; then
  mkdir -p "$destination"
fi
cp -R "$source" "$destination"
