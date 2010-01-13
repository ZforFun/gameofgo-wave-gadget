#!/bin/bash

# Configure the size / filename parameters
BOARD_LEFT_OFFSET=20
BOARD_TOP_OFFSET=20
BOARD_HORIZONTAL_GAP=32
BOARD_VERTICAL_GAP=32
BOARD_SIZE=9
BOARD_FILENAME=board9.png
BOARD_BACKGROUND_COLOR="#FF4600"
STARPOINT_SIZE=4

STONE_SIZE=24
BLACK_STONE_FILENAME=black.png
BLACK_LAST_STONE_FILENAME=black-last.png
BLACK_STONE_COLOR="#000000"
WHITE_STONE_FILENAME=white.png
WHITE_LAST_STONE_FILENAME=white-last.png
WHITE_STONE_COLOR="#EBEBEB"

########################

# Create the board...
i="$(($BOARD_LEFT_OFFSET * 2 + (BOARD_SIZE - 1) * BOARD_HORIZONTAL_GAP))"
j="$((BOARD_TOP_OFFSET * 2 + (BOARD_SIZE-1) * BOARD_VERTICAL_GAP))"
convert  -size "$i"x"$j" \
         xc:none -fill "$BOARD_BACKGROUND_COLOR" -background "$BOARD_BACKGROUND_COLOR" \
         -draw "rectangle 0,0 $i,$j" \
         "$BOARD_FILENAME"


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
while [ "$i" -le "1" ]; do
  j=0
  while [ "$j" -le "1" ]; do
    echo "Starpoint: $i, $j"
    mogrify -draw "circle $((BOARD_LEFT_OFFSET+$((i*4+2))*BOARD_HORIZONTAL_GAP)),$((BOARD_TOP_OFFSET+$((j*4+2))*BOARD_VERTICAL_GAP)),$((BOARD_LEFT_OFFSET+$((i*4+2))*BOARD_HORIZONTAL_GAP+STARPOINT_SIZE)),$((BOARD_TOP_OFFSET+$((j*4+2))*BOARD_VERTICAL_GAP))" "$BOARD_FILENAME"
    j=$((j+1))
  done
  i=$((i+1))
done
mogrify -draw "circle $((BOARD_LEFT_OFFSET+$((4))*BOARD_HORIZONTAL_GAP)),$((BOARD_TOP_OFFSET+$((4))*BOARD_VERTICAL_GAP)),$((BOARD_LEFT_OFFSET+$((4))*BOARD_HORIZONTAL_GAP+STARPOINT_SIZE)),$((BOARD_TOP_OFFSET+$((4))*BOARD_VERTICAL_GAP))" "$BOARD_FILENAME"

