rsync -av \
  -e "/usr/bin/ssh" \
  ./html/ cbppapps@vps42437.dreamhostps.com:/home/cbppapps/apps.cbpp.org/health10-15-24_percent/

rsync -av \
  -e "/usr/bin/ssh" \
  ./node/prod/ cbppapps@vps42437.dreamhostps.com:/home/cbppapps/apps.cbpp.org/health10-15-24_percent/js/
