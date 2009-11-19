i=20
while [ $i -lt 600 ]; do
  echo $i
  /opt/local/bin/mogrify -draw "line 20, $i, 596, $i" tmp.png
  i=$((i+32))
done

i=20
while [ $i -lt 600 ]; do
  echo $i
  /opt/local/bin/mogrify -draw "line $i, 20, $i, 596" tmp.png
  i=$((i+32))
done

