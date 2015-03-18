# Introduction #

Although go has only a few, simple rules, there are slight differences between rule sets. On this page the reference rule set is the basis for the Go Gadget.

# Details #

## Players and equipment ##

  * Rule 1. Players: Go is a game between two players, called Black and White.
  * Rule 2. Board: Go is played on a plane grid of 19 horizontal and 19 vertical lines, called a board.

  * Definition. ("Intersection," "Adjacent") A point on the board where a horizontal line meets a vertical line is called an intersection. Two intersections are said to be adjacent if they are distinct and connected by a horizontal or vertical line with no other intersections between them.

  * Rule 3. Stones: Go is played with playing tokens known as stones. Each player has at his disposal an adequate supply of stones of his color.

## Positions ##

  * Rule 4. Positions: At any time in the game, each intersection on the board is in one and only one of the following three states: 1) empty; 2) occupied by a black stone; or 3) occupied by a white stone. A position consists of an indication of the state of each intersection.

  * Definition. ("Connected") In a given position, two stones of the same color (or two empty intersections) are said to be connected if it is possible to pass from one to the other by a succession of stones of that color (or empty intersections, respectively) in which any two consecutive ones are adjacent.
  * Definition. ("Liberty") In a given position, a liberty of a stone is an empty intersection adjacent to that stone or adjacent to a stone which is connected to that stone.

## Play ##

  * Rule 5. Initial position: At the beginning of the game, the board is empty.
  * Rule 6. Turns: Black moves first. The players alternate thereafter.
  * Rule 7. Moving: On his turn, a player may either pass (by announcing "pass" and performing no action) or play. A play consists of the following steps (performed in the prescribed order):

  * Step 1. (Playing a stone) Placing a stone of his color on an empty intersection (chosen subject to Rule 8 and, if it is in effect, to Optional Rule 7A).
  * Step 2. (Capture) Removing from the board any stones of his opponent's color that have no liberties.
  * Step 3. (Self-capture) Removing from the board any stones of his own color that have no liberties.

  * Rule 7A. Prohibition of suicide: A play is illegal if one or more stones would be removed in Step 3 of that play.

  * Rule 8. (Ko rule) One may not capture just one stone, if that stone was played on the previous move, and that move also captured just one stone.

## End ##

  * Rule 9. End: The game ends when both players have passed consecutively. The final position is the position on the board at the time the players pass consecutively.

  * Definition. ("Territory") In the final position, an empty intersection is said to belong to a player's territory if 1) all stones adjacent to it or to an empty intersection connected to it are of his color; and 2) there is at least one such stone.
  * Definition. ("Area") In the final position, an intersection is said to belong to a player's area if either: 1) it belongs to that player's territory; or 2) it is occupied by a stone of that player's color.
  * Definition. ("Score") A player's score is the number of intersections in his area in the final position.

  * Rule 10. Winner: If one player has a higher score than the other, then that player wins. Otherwise, the game is drawn.