#!/bin/bash

# Configure the size / filename parameters
BOARD_LEFT_OFFSET=15
BOARD_TOP_OFFSET=15
BOARD_HORIZONTAL_GAP=23
BOARD_VERTICAL_GAP=23
BOARD_SIZE=19
BOARD_FILENAME=board.png
BOARD_BACKGROUND_COLOR="#EBCA70"

STONE_SIZE=23
BLACK_STONE_FILENAME=black.png
BLACK_LAST_STONE_FILENAME=black-last.png
BLACK_STONE_COLOR="#000000"
WHITE_STONE_FILENAME=white.png
WHITE_LAST_STONE_FILENAME=white-last.png
WHITE_STONE_COLOR="#EBEBEB"

########################

# Create the stones
STONE_IMAGE_SIZE="$STONE_SIZE"x"$STONE_SIZE"
DRAW_COMMAND="circle $((STONE_SIZE / 2)),$((STONE_SIZE / 2)) $((STONE_SIZE / 2)),0.5"
# DRAW_COMMAND="circle 0,0 $STONE_SIZE,$STONE_SIZE"
convert  -size "$STONE_IMAGE_SIZE" xc:none -fill "$BLACK_STONE_COLOR" -draw "$DRAW_COMMAND"  \
         "$BLACK_STONE_FILENAME"
convert  -size "$STONE_IMAGE_SIZE" xc:none -fill "$WHITE_STONE_COLOR" -draw "$DRAW_COMMAND"  \
         "$WHITE_STONE_FILENAME"
DRAW_COMMAND="circle $((STONE_SIZE / 2)),$((STONE_SIZE / 2)) $((STONE_SIZE / 2)),$((STONE_SIZE * 3 / 8))"
convert  "$BLACK_STONE_FILENAME" -fill "$WHITE_STONE_COLOR" -draw "$DRAW_COMMAND"  \
         "$BLACK_LAST_STONE_FILENAME"
DRAW_COMMAND="circle $((STONE_SIZE / 2)),$((STONE_SIZE / 2)) $((STONE_SIZE / 2)),$((STONE_SIZE * 3 / 8))"
convert  "$WHITE_STONE_FILENAME" -fill "$BLACK_STONE_COLOR" -draw "$DRAW_COMMAND"  \
         "$WHITE_LAST_STONE_FILENAME"

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
# TODO:
