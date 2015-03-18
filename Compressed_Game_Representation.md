# Details #

The board state is represented in the JavaScrpit object with type GameBoard.
When the board state is sent through the network we use the textual representation of this javascript object (think along the lines of gameBoard.toSource()).

This is sub optimal: a bigger board with more steps can take a lot of characters.

## Idea ##
~~Use unicode characters to represent the board.
One unicode character is 16bits.~~

~~TODO: check the actual representation in the wave. If UTF-8 is used, we might be better off using ASCII (7 bits per character).~~

## Representation of the board ##
~~boardSize\*boardSize\*2bits
00 -> Empty Cell
01 -> Black
10 -> White
-> 8 cells per character = 46 chars.~~

## Representation of the log ##
~~Each entry has 2bits of type, 1bit of color, 6bits of x coord, 6bity of y coord.
-> 1 unicode character per log entry.~~

This does not work... Unfortunately not every integer in the range of 0-65535 has an unicode character assigned, and the list of usable characters also depends on the browser platform.

An alternative approach was implemented with 3 characters per log entry. At least it is human readable...