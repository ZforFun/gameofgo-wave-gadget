#!/bin/bash

# Configure the size / filename parameters
BOARD_LEFT_OFFSET=15
BOARD_TOP_OFFSET=15
BOARD_HORIZONTAL_GAP=23
BOARD_VERTICAL_GAP=23
BOARD_SIZE=13
BOARD_FILENAME=board13.png
BOARD_BACKGROUND_COLOR="#EBCA70"
BOARD_BACKGROUND_FILENAME="bg13.png"
STARPOINT_SIZE=3

STONE_SIZE=23
BLACK_STONE_FILENAME=black.png
BLACK_LAST_STONE_FILENAME=black-last.png
BLACK_STONE_COLOR="#000000"
WHITE_STONE_FILENAME=white.png
WHITE_LAST_STONE_FILENAME=white-last.png
WHITE_STONE_COLOR="#EBEBEB"


# Create the board...
i="$(($BOARD_LEFT_OFFSET * 2 + (BOARD_SIZE - 1) * BOARD_HORIZONTAL_GAP))"
j="$((BOARD_TOP_OFFSET * 2 + (BOARD_SIZE-1) * BOARD_VERTICAL_GAP))"
#convert  -size "$i"x"$j" \
#         xc:none -fill "$BOARD_BACKGROUND_COLOR" -background "$BOARD_BACKGROUND_COLOR" \
#         -draw "rectangle 0,0 $i,$j" \
#         "_$BOARD_FILENAME"

echo "The ideal size of the background image ($BOARD_BACKGROUND_FILENAME) is $i x $j."
cp $BOARD_BACKGROUND_FILENAME $BOARD_FILENAME
chmod 777 $BOARD_FILENAME

# Put on the lines...
i="$BOARD_LEFT_OFFSET"
j=$((BOARD_LEFT_OFFSET + (BOARD_SIZE-1) * BOARD_HORIZONTAL_GAP))
while [ "$i" -le "$j" ]; do
  echo $i
  mogrify -draw "line $BOARD_LEFT_OFFSET, $i, $j, $i" "$BOARD_FILENAME"
  i=$((i+BOARD_HORIZONTAL_GAP))
done

i="$BOARD_TOP_OFFSET"
j=$((BOARD_TOP_OFFSET + (BOARD_SIZE-1) * BOARD_VERTICAL_GAP))
while [ "$i" -le "$j" ]; do
  echo $i
  mogrify -draw "line $i, $BOARD_TOP_OFFSET, $i, $j" "$BOARD_FILENAME"
  i=$((i+BOARD_VERTICAL_GAP))
done

# Draw the handicap points
i=0
while [ "$i" -le "2" ]; do
  j=0
  while [ "$j" -le "2" ]; do
    echo "Starpoint: $i, $j"
    mogrify -draw "circle $((BOARD_LEFT_OFFSET+$((i*3+3))*BOARD_HORIZONTAL_GAP)),$((BOARD_TOP_OFFSET+$((j*3+3))*BOARD_VERTICAL_GAP)),$((BOARD_LEFT_OFFSET+$((i*3+3))*BOARD_HORIZONTAL_GAP+STARPOINT_SIZE)),$((BOARD_TOP_OFFSET+$((j*3+3))*BOARD_VERTICAL_GAP))" "$BOARD_FILENAME"
    j=$((j+1))
  done
  i=$((i+1))
done
