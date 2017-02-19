(function() {

	initialize_start_screen()
	var game_state = {}
	initialize_game_state()
	start_game()
	activate_mouseover_effects()
	handle_box_clicks()

	//
	// START AND END SCREEN SETUP
	//

	function initialize_start_screen() {
		var loading_screen = $("<div class='overlay'><h1>Tic Tac Toe</h1></div>")
		var start_game_button = $("<button class='button'>Start game</button>")
		var enter_your_name_input = $("<input id='enter_name' placeholder='Enter your name'>")
		$("body").append(loading_screen)
		$(".overlay").append(enter_your_name_input).append(start_game_button)
	}

	function initialize_end_screen() {
		
		var end_screen = $("<div class='overlay' id='finish'><header><h1>Tic Tac Toe</h1><p id='message'></p><button class='button' id='new-game'>New game</button></header></div>")
		$("body").append(end_screen)
		if (get_winner() === "o-win") {
			$(".overlay").addClass("o-win")
		} else if (get_winner() === "x-win") {
			$(".overlay").addClass("x-win")
		} else {
			$(".overlay").addClass("draw")
		}
	}

	//
	// GAME STATE FUNCTIONS
	//

	function initialize_game_state() {

		game_state.open_boxes = ["11", "12", "13", "21", "22", "23", "31", "32", "33"]
		game_state.active_player = null
		game_state.computer_player = null
		game_state.human_player = null
		game_state.o_marks = []
		game_state.x_marks = []
		game_state.game_over = false
	}

	// Reset the game board before starting a new game 

	// (this is necessary because, for css formatting reasons the game's state is mirrored in the html by dynamic property assignment)

	function reset_game_board() {
		jQuery.each($(".boxes .box"), function() {
			$(this).removeClass("box-filled-1")
		})

		jQuery.each($(".boxes .box"), function() {
			$(this).removeClass("box-filled-2")
		})
	}

	// Active player is identified at the top of the page (O or X is highlighted, depending on whose turn it is)
	// Note the mirroring of game state between the html and the game_state object

	function toggle_player_turn() {
		if ($("#player1").hasClass("active")) {
			$("#player1").removeClass("players-turn").removeClass("active")
			$("#player2").addClass("players-turn").addClass("active")
			game_state.active_player = "player2"
		} else {
			$("#player2").removeClass("players-turn").removeClass("active")
			$("#player1").addClass("players-turn").addClass("active")
			game_state.active_player = "player1"
		}

			// if you don't clear the hover effect when the turn switches, the previous symbol's hover carries over into the
			// next player's turn

			jQuery.each($(".boxes .box"), function() {
				$(this).removeClass("hover-o")
			})

			jQuery.each($(".boxes .box"), function() {
				$(this).removeClass("hover-x")
			})
	}

	// Does X start, or does O?

	function randomize_starting_player() {
		var who_starts = Math.round(Math.random(),0)
		if (who_starts === 0) {
			toggle_player_turn()
		} else if (who_starts === 1) {
			toggle_player_turn()
			toggle_player_turn()
		}
	}

	// Is X the computer player, or is O?

	function randomize_computer_player() {
		var who_is_player_one = Math.round(Math.random(),0)
		if (who_is_player_one === 0) {
			$("#player_name1").html(game_state.player_name)
			$("#player_name2").html("Computer")
			game_state.computer_player = "player2"
			game_state.human_player = "player1"
		} else if (who_is_player_one === 1) {
			$("#player_name2").html(game_state.player_name)
			$("#player_name1").html("Computer")
			game_state.computer_player = "player1"
			game_state.human_player = "player2"
		}

	}

	//  Which boxes has the human player checked?  What about the computer?

	function human_boxes() {
		if (game_state.human_player === "player1") {
			return game_state.o_marks
		} else {
			return game_state.x_marks
		}
	}

	function computer_boxes() {
		if (game_state.computer_player === "player1") {
			return game_state.o_marks
		} else {
			return game_state.x_marks
		}
	}

//
//	COMPUTER PLAYER LOGIC
//

	// Gives a random number from 0 to x - 1

	function random_index(x) {
		return Math.floor((Math.random() * x))
	}

	// returns the possible paths to victory

	function paths_to_victory() {
		var paths = {"first_row": ["11", "12", "13"], 
					 "second_row": ["21", "22", "23"], 
					 "third_row": ["31", "32", "33"], 
					 "first_col": ["11", "21", "31"], 
					 "second_col": ["12", "22", "32"], 
					 "third_col": ["13", "23", "33"], 
					 "first_diag": ["11", "22", "33"],
					 "second_diag": ["13", "22", "31"]}

		// deletes paths along which a win is impossible

		jQuery.each(paths, function(path_key, path_val) {
			jQuery.each(human_boxes(), function(box_index, box_val) {
				if (path_val.includes(box_val)) {
					delete paths[path_key]
				}
			})
		})

		// remove any elements of values that have already been selected by the computer

		jQuery.each(paths, function(path_key, path_val) {
			jQuery.each(computer_boxes(), function(box_index, box_val) {
				if (path_val.includes(box_val)) {
					var index = path_val.indexOf(box_val)
					path_val.splice(index,1)
				}
			})
		})

		return paths

	}

	//  returns the choices from a randomly selected path towards victory

	function random_choices_towards_victory() {
		var keys = Object.keys(paths_to_victory())
		var some_choices = paths_to_victory()[keys[random_index(keys.length)]]

		// remove any values from chocies that have already been selected
		if (some_choices != null) {
			return some_choices
		} else {
			return []
		}
	
	}

	// return the path name for the path that is the shortest (or one of the shortest ones, if there is a tie)

	function steps_to_victory( x ) {
		var return_key = ""
		var paths = paths_to_victory()
		jQuery.each(paths, function(key, value) {
			if (value.length === x) {
				return_key = key
			} 
		})
		return return_key
	}

	// Determine which box the computer player should pick, and generate an artifical click to pick that box.

	// Priorities:  First, if the computer can win in one move, it will always choose to.
	// Second, the computer will attempt to block any possible win by the opponent.
	// Third, it will make a move along the shortest path to victory available, randomly if there is more than one equally short path.
	// As a last resort, it will pick a random open box (this occurs when there are moves remaining but a draw is already inevitable).

	function artificial_click() {

		if (steps_to_victory(1).length > 0) {
			console.log("computer win!")
			best_choice = paths_to_victory()[steps_to_victory(1)][0]
			$("#" + best_choice).click()
		} else if (human_boxes().includes("11") && human_boxes().includes("13") && game_state.open_boxes.includes("12")) {
			$("#12").click()
		} else if (human_boxes().includes("31") && human_boxes().includes("33") && game_state.open_boxes.includes("32")) {
			$("#32").click()
		} else if (human_boxes().includes("11") && human_boxes().includes("31") && game_state.open_boxes.includes("21")) {
			$("#21").click()
		} else if (human_boxes().includes("13") && human_boxes().includes("33") && game_state.open_boxes.includes("23")) {
			$("#23").click()
		} else if (human_boxes().includes("11") && human_boxes().includes("33") && game_state.open_boxes.includes("22")) {
			$("#22").click()
		} else if (human_boxes().includes("13") && human_boxes().includes("31") && game_state.open_boxes.includes("22")) {
			$("#22").click()
		} else if (human_boxes().includes("11") && human_boxes().includes("12") && game_state.open_boxes.includes("13")) {
			$("#13").click()
		} else if (human_boxes().includes("12") && human_boxes().includes("13") && game_state.open_boxes.includes("11")) {
			$("#11").click()
		} else if (human_boxes().includes("21") && human_boxes().includes("22") && game_state.open_boxes.includes("23")) {
			$("#23").click()
		} else if (human_boxes().includes("22") && human_boxes().includes("23") && game_state.open_boxes.includes("21")) {
			$("#21").click()
		} else if (human_boxes().includes("31") && human_boxes().includes("32") && game_state.open_boxes.includes("33")) {
			$("#33").click()
		} else if (human_boxes().includes("32") && human_boxes().includes("33") && game_state.open_boxes.includes("31")) {
			$("#31").click()
		} else if (human_boxes().includes("11") && human_boxes().includes("21") && game_state.open_boxes.includes("31")) {
			$("#31").click()
		} else if (human_boxes().includes("21") && human_boxes().includes("31") && game_state.open_boxes.includes("11")) {
			$("#11").click()
		} else if (human_boxes().includes("12") && human_boxes().includes("22") && game_state.open_boxes.includes("32")) {
			$("#32").click()
		} else if (human_boxes().includes("22") && human_boxes().includes("32") && game_state.open_boxes.includes("12")) {
			$("#12").click()
		} else if (human_boxes().includes("13") && human_boxes().includes("23") && game_state.open_boxes.includes("33")) {
			$("#33").click()
		} else if (human_boxes().includes("23") && human_boxes().includes("33") && game_state.open_boxes.includes("13")) {
			$("#13").click()
		} else if (human_boxes().includes("11") && human_boxes().includes("22") && game_state.open_boxes.includes("33")) {
			$("#33").click()
		} else if (human_boxes().includes("13") && human_boxes().includes("22") && game_state.open_boxes.includes("31")) {
			$("#31").click()
		} else if (human_boxes().includes("31") && human_boxes().includes("22") && game_state.open_boxes.includes("13")) {
			$("#13").click()
		} else if (human_boxes().includes("33") && human_boxes().includes("22") && game_state.open_boxes.includes("11")) {
			$("#11").click()
		} else if (steps_to_victory(2).length > 0) {
			console.log('1 steps from winning')
			choice = paths_to_victory()[steps_to_victory(2)][random_index(2)]
			$("#" + choice).click()
		} else if (steps_to_victory(3).length > 0) {
			console.log('2 steps from winning')
			choices = random_choices_towards_victory()
			choice = choices[random_index(choices.length)]
			$("#" + choice).click()
		}
		else {
			console.log('Just pick anything')
			var random_box = game_state.open_boxes[random_index(game_state.open_boxes.length)];
			$("#" + random_box).click()
		}
	}

	// Perform the computer player's move, if it is the computer player's turn (with a slight delay)

	function computer_move() {
		setTimeout( function () {
			if ((game_state.active_player === game_state.computer_player) && (game_state.game_over === false)) {
				artificial_click()
			}
		},1000)
	}

	//
	// EVENT HANDLERS
	//

	// Clear overlay and select a starting player when player clicks "Start game"

	function start_game() {
		$(".overlay button").on("click", function() {
			game_state.player_name = $("#enter_name").val() !== "" ? $("#enter_name").val() : "Mr. No Name";
			randomize_starting_player()
			randomize_computer_player()
			$("body .overlay").remove()
			computer_move()					// the computer only moves if if it is the computer's turn
		});
	}

	// Used by event handler logic.  Checks the part of the game-state held by the html for if a given box is filled.

	function is_filled(this_context) {
		return ($(this_context).hasClass("box-filled-1") || $(this_context).hasClass("box-filled-2"))
	}

	// Empty squares are highlighted with player's symbol when moused over, if the box isn't already filled

	function activate_mouseover_effects() {
		$(".boxes .box").on("mouseover", function() {
			if ((game_state.active_player === "player1") && !is_filled(this) && (game_state.game_over === false)) {

				jQuery.each($(".boxes .box"), function() {
					$(this).removeClass("hover-o")
				})

				$(this).addClass("hover-o")

			 } else if ((game_state.active_player === "player2") && !is_filled(this) && (game_state.game_over === false)) {

			 	jQuery.each($(".boxes .box"), function() {
					$(this).removeClass("hover-x")
				})

			 	$(this).addClass("hover-x")

			 }
		})

	// If you don't remove the hover effect on mouse-out, it can result in the wrong symbol temporarily appearing on a clicked box that was just being hovered

		$(".boxes .box").on("mouseout", function() {
			jQuery.each($(".boxes .box"), function() {
					$(this).removeClass("hover-o")
			})

			jQuery.each($(".boxes .box"), function() {
					$(this).removeClass("hover-x")
			})
		})
	}

	// When someone clicks on a box, the active player's symbol fills the box (and it becomes the next player's turn), if it isn't already filled.  
	function handle_box_clicks() {
		$(".boxes .box").on("click", function () {

			if (is_filled(this)) {

				//do nothing if the box is already filled

			} else if (game_state.game_over === false) {

				// check the box with the mark of whichever player is active

				if (game_state.active_player === "player1") {

					$(this).addClass("box-filled-1")

					// remove the selected box's id from the game_state object's list of open boxes, in three steps

					var this_id = $(this).attr('id')
					var this_index = game_state.open_boxes.indexOf(this_id)
					game_state.open_boxes.splice(this_index, 1)

					// don't forget to keep a separate list of boxes that have o-marks in them

					game_state.o_marks.push(this_id)

				} else if (game_state.active_player === "player2") {

					$(this).addClass("box-filled-2")

					var this_id = $(this).attr('id')
					var this_index = game_state.open_boxes.indexOf(this_id)
					game_state.open_boxes.splice(this_index, 1)

					game_state.x_marks.push(this_id)
				}

				// switch the active player, at which point the computer makes its move, if it should

				toggle_player_turn()
				computer_move()
			}

			//  any time a box is clicked, the win conditions need to be checked, and if someone has won, 
			//  then a message is generated, and the win screen is displayed.  The win screen contains a
			//  a button that, if clicked, removes the win screen, re-initializes the game state,  
			//  re-creates the start screen, and re-binds the new start button to do its thing when clicked

			if ( (game_state.open_boxes.length === 0) || get_winner() ) {

				game_state.game_over = true

				var end_game_message = ""

				if ((game_state.open_boxes.length === 0) && (get_winner() === false)) {
					end_game_message = "DRAW"
					$(".overlay").addClass("draw")
				} else if (get_winner() === "x-win") {
					end_game_message = "WINNER"
					if (game_state.human_player === "player2") {
						end_game_message += ": "
						end_game_message += game_state.player_name
					}
				} else if (get_winner() === "o-win") {
					end_game_message = "WINNER"
					if (game_state.human_player === "player1") {
						end_game_message += ": "
						end_game_message += game_state.player_name
					}
				}

				setTimeout(function() {
					initialize_end_screen()
					$("#message").html(end_game_message)
					$("button#new-game").on("click", function() {
						initialize_game_state()
						$("body .overlay").remove()
						initialize_start_screen()
						start_game()
					});
					reset_game_board()
				},1000)
			}
		})
	}

	//
	// WIN CONDITION CHECKING
	//

	function bot_row_win() {
		if ( game_state.o_marks.includes("31") && game_state.o_marks.includes("32") && game_state.o_marks.includes("33") ) {
			return "o-win"
		} else if ( game_state.x_marks.includes("31") && game_state.x_marks.includes("32") && game_state.x_marks.includes("33") ) {
			return "x-win"
		} else { return false }
	}

	function mid_row_win() {
		if ( game_state.o_marks.includes("21") && game_state.o_marks.includes("22") && game_state.o_marks.includes("23") ) {
			return "o-win"
		} else if ( game_state.x_marks.includes("21") && game_state.x_marks.includes("22") && game_state.x_marks.includes("23") ) {
			return "x-win"
		} else { return false }
	}

	function top_row_win() {
		if ( game_state.o_marks.includes("11") && game_state.o_marks.includes("12") && game_state.o_marks.includes("13") ) {
			return "o-win"
		} else if ( game_state.x_marks.includes("11") && game_state.x_marks.includes("12") && game_state.x_marks.includes("13") ) {
			return "x-win"
		} else { return false }
	}

	function left_col_win() {
		if ( game_state.o_marks.includes("11") && game_state.o_marks.includes("21") && game_state.o_marks.includes("31") ) {
			return "o-win"
		} else if ( game_state.x_marks.includes("11") && game_state.x_marks.includes("21") && game_state.x_marks.includes("31") ) {
			return "x-win"
		} else { return false }
	}

	function mid_col_win() {
		if ( game_state.o_marks.includes("12") && game_state.o_marks.includes("22") && game_state.o_marks.includes("32") ) {
			return "o-win"
		} else if ( game_state.x_marks.includes("12") && game_state.x_marks.includes("22") && game_state.x_marks.includes("32") ) {
			return "x-win"
		} else { return false }
	}

	function right_col_win() {
		if ( game_state.o_marks.includes("13") && game_state.o_marks.includes("23") && game_state.o_marks.includes("33") ) {
			return "o-win"
		} else if ( game_state.x_marks.includes("13") && game_state.x_marks.includes("23") && game_state.x_marks.includes("33") ) {
			return "x-win"
		} else { return false }
	}

	function first_diag_win() {
		if ( game_state.o_marks.includes("11") && game_state.o_marks.includes("22") && game_state.o_marks.includes("33") ) {
			return "o-win"
		} else if ( game_state.x_marks.includes("11") && game_state.x_marks.includes("22") && game_state.x_marks.includes("33") ) {
			return "x-win"
		} else { return false }
	}

	function second_diag_win() {
		if ( game_state.o_marks.includes("13") && game_state.o_marks.includes("22") && game_state.o_marks.includes("31") ) {
			return "o-win"
		} else if ( game_state.x_marks.includes("13") && game_state.x_marks.includes("22") && game_state.x_marks.includes("31") ) {
			return "x-win"
		} else { return false }
	}

	function get_winner() {
		return ( bot_row_win() || mid_row_win() || top_row_win() || left_col_win() || mid_col_win() || right_col_win() || first_diag_win() || second_diag_win() )
	}
}())