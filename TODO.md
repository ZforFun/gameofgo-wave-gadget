# Introduction #

This is a simple TODO list.
If a point is done, move it into the "Done" list

# Details #

To Do:

  * Counting mode (with signing stones as dead)
  * Add messages to the UI: e.g. "You can only put a stone on an empty place".
  * Panel for showing the moves so far, the number of captured stones, who comes, etc...
  * Separating board size from theme (a theme should support all the 3 standard sizes)


Done:

  * Implement players and alternating moves
  * Implement a simple KO-rule
  * Button First (Instead of Undo-ing to the beginning)
  * Button Last (Instead of Redo-ing to the end)
  * Implement the SGF-parser (in a simple way for the time being)
  * Undo is not smooth on highly filled board
  * With the [second SFG example](ExampleSGF2.md) the number of characters in the board description is over 10.000. This can be a lot of bytes. We should try to [compress](Compressed_Game_Representation.md) the board size...