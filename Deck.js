// Jake Levi 2019

//TODO:
// RemovePlayer functionality
// Finish the play loop
// Obfuscate other players
// Add ai for other players (allow local play?)
// Add a 'game status' print func - i.e. "You got 2 Q's from Jake, now what?" just below playfield

// Make 'Hand', & 'Card'data types


class Deck {
  // Initializes the deck with a dictionary of __cards
  // A card is an int - we can mod by num_ranks to give the rank of the card
  // numJokers is the amount of jokers in the deck : int
  // numRanks is the number of cards in a single suit : int
  // numSuits is the number of suits in the Deck : int
  constructor(numSuits, numRank, numJokers) {
    this.numSuits = numSuits;
    this.numJokers = numJokers;
    this.numRank = numRank;
    this.cards = Array.from({length: numSuits*numRank + numJokers}, (x,i) => i);
    this.discard = [];
  }

  //Returns the number of cards in this deck (total #, does not consider discard as separate)
  get numCards () {
    return this.numSuits * this.numRank + this.numJokers;
  }

  // Returns the number of cards remaining in this Game's Deck
  get cardsRemaining() {
    return this.cards.length
  }

  // Shuffles this deck
  shuffle() {
    for (let i = this.numCards - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  // Shuffles this deck with its discard pile
  reshuffle() {
    this.cards = this.cards.concat(this.discard);
    this.discard = [];
    this.shuffle();
  }

  // Draws the given number of cards, adds them to the discard pile & returns an array representing them
  // num: int
  draw(num) {
    if(this.cards.length>0 && num <= this.cards.length) {
      for(let i = 0; i < num; i++){
        this.discard.unshift(this.cards.shift());
      }
      return this.discard.slice(0,num);
    }
  }

  // Returns the rank of the given cards
  getRank(card){
    return card % this.numRank;
  }

}

// An abstract base class for all games
class Game {

  // adds a Player with the given name to the game
  // name: string
  addPlayer(name) {
    throw new Error('Game is abstract');
  }

  // Returns the number of cards in this Game's Deck
  get numCards() {
    throw new Error('Game is abstract');
  }
}

// A class to represent the game Go Fish
class GoFish extends Game {
  constructor() {
    super();
    this.players = []; // players is an array of the players in this game
    this.currentPlayer = -1; // A random first player will be chosen
    this.deck = new Deck(4, 13, 0);
  }

  // Returns the number of players in this game
  get numPlayers(){
    return this.players.length
  }
  // Returns the number of cards in this Game's Deck
  get totalCards() {
    return this.deck.numCards
  }

  // Returns the number of cards remaining in this Game's Deck
  get cardsRemaining() {
    return this.deck.cardsRemaining
  }

  // Takes in an int representing a card & changes it to the correct string representation
  interpretCard(card){
    var rank = card % this.deck.numRank;
    var suit = Math.floor(card / this.deck.numRank);
    switch(rank){
      case 0:
      rank = 'A';
      break;
      case 10:
      rank = 'J';
      break;
      case 11:
      rank = 'Q';
      break;
      case 12:
      rank = 'K';
      break;
      default:
      // Because we start at 0, all ranks are one below their true value
      rank +=1;
    }

    switch(suit){
      case 0:
      suit = '\u2660';
      break;
      case 1:
      suit = '\u2661';
      break;
      case 2:
      suit = '\u2662';
      break;
      case 3:
      suit = '\u2663';
      break;
    }
    return rank+suit;
  }

  // Reshuffles the deck & clears all hands
  // Deals cards to all Players in this Game
  // Sorts all hands
  // Should only be used at the start of the Game
  startGame() {
    this.deal();
    this.sortHands();
    this.currentPlayer = Math.floor(Math.random()*this.players.length) // Random starting player
    document.getElementById("pregame").hidden = true; // Hide the pre-game buttons
    document.getElementById("takeTurn").hidden = false;
    document.getElementById("selectors").hidden = false;

    this.refreshValues();
    this.takeTurn0();
  }

  // Deals cards to all Players in this Game
  // Reshuffles the deck
  deal() {
    this.deck.reshuffle();
    var cards;
    // If we have 2 players, each get 7 cards, otherwise they get 5 each
    if(this.numPlayers < 2) {throw new  Error('Not enough players to deal to');}
    else if(this.numPlayers == 2) {cards = 7;}
    else {cards = 5;}
    // Deal the cards
    for(var i=0; i < this.numPlayers; i++) {
      this.players[i].hand = [];
      for(var j=0; j < cards; j++) {
        var dealt = this.deck.draw(1);
        this.players[i].addCard(dealt);
      }
    }
  }

  sortHands() {
    // Sort the cards based on rank
    for(var i=0; i < this.numPlayers; i++) {
      // the anonymous function being passed to sort ensures we sort in ascending order
      this.players[i].hand.sort(function(a,b){
        return b%game.deck.numRank - a%game.deck.numRank
      });
    }
  }

  // adds a Player with the given name to the game
  // name: string
  addPlayer(name) {
    this.players.push(new Player(this, name));
  }

  // adds a Player with the given name to the game via a prompt
  promptAddPlayer() {
    var name = prompt("What is the name of the player?");
    name = name.replace(/[^a-zA-Z0-9]/g, '');
    if(name.length === 0){throw new Error('Name cannot be empty')}
    this.addPlayer(name);
    this.refreshValues();
  }

  // Progresses to the next player in this games
  nextPlayer(){
    if(this.currentPlayer<this.players.length-1){this.currentPlayer++;}
    else {this.currentPlayer=0;}
    this.takeTurn0();
  }


  // Starts the turn of the current player (this.currentPlayer)
  // Formats the relevant elements
  takeTurn0() {
    // 0. Get input for who the player wants to ask for what card (based on player's hand)
    // 1. Do they have the card? If yes, transfer card, check for tricks, and go to step 1.
    // 2. Add a card from the deck to this player's hand (check for tricks) & end turn
    this.refreshValues();
    // choices represents the ranks of the cards, giving us the list of cards the
    // player can choose from to request
    var choices = [...new Set(this.players[this.currentPlayer].getHand.map(card => card % 13))];
    // Create a dropdown menu to allow a choice of which card to request & from who & button to confirm
    var selectRank = document.getElementById("selectRank");

    // Clear the selection box options to prevent duplicate entries
    for(var i = selectRank.options.length - 1 ; i >= 0 ; i--){selectRank.remove(i);}

    choices.forEach(function(element){selectRank.options[selectRank.options.length] =
      new Option(game.interpretCard(element).replace(/\W/g, ''), element);})

    var selectPlayer = document.getElementById("selectPlayer");
    // Clear the selection box options to prevent duplicate entries
    for(var i = selectPlayer.options.length - 1 ; i >= 0 ; i--){selectPlayer.remove(i);}
    var opponents = this.players.slice(0);
    opponents.splice(this.currentPlayer, 1);
    opponents.forEach(function(element){selectPlayer.options[selectPlayer.options.length] =
      new Option(element.getName);})
  }

  // Continues the turn of the current player (this.currentPlayer)
  takeTurn1() {
    // 0. Get input for who the player wants to ask for what card (based on player's hand)
    // 1. Do they have the card? If yes, transfer cards of the rank, check for tricks, and go to step 1.
    // 2. Add a card from the deck to this player's hand (check for tricks & successful catch) & end turn
    var rank = parseInt(document.getElementById("selectRank").value, 10); //Str->int
    var name = document.getElementById("selectPlayer").value;
    var player = this.players.find(function(a){return a.getName===name});
    if(player.getHandRanks.includes(rank)){ // Does the player have any cards of the given rank?
      this.players[this.currentPlayer].addCards(player.removeRank(rank));
      this.countBooks(this.players[this.currentPlayer]);
      this.takeTurn0();
    }
    else{
      var card = this.deck.draw(1);
      this.players[this.currentPlayer].addCard(card);
      if(this.deck.getRank(card) == rank){
        this.takeTurn0();
      }
      else {
      this.nextPlayer();
    }
    }
  }

  // Let the player 'go fish'!
  goFish(player){
    player.addCard(this.deck.draw(1));

  }

  // Counts the given player's books, removes them and changes their score accordingly
  countBooks(player){
    var hand = player.getHandRanks;
    console.log("Counting hand: " + hand);

    // Remove all values from hand apart from sets of 4
    var map = new Map();
    hand.forEach(a => map.set(a, (map.get(a) || 0) + 1));
    hand = hand.filter(a => map.get(a) == 4);

    console.log("Hand post filter: " + hand);

    // Add the number of books to the player's score
    player.changeScore(Math.floor(hand.length/4));

    // Remove all 4 card sets
    for(var i=0; i<hand.length; i++){
      player.hand.splice(player.hand.lastIndexOf(hand[i]), 1);
    }
  }

  // Refreshes the data in the tables for GoFish
  refreshValues() {
    this.sortHands();
    // gameInfo Table
    var gameInfo = document.getElementById("gameInfo");

    // Player Table
    var players = document.getElementById("players");

    // Resets the tables
    gameInfo.innerHTML = "";
    players.innerHTML = "";

    // gameInfo table setup
    gameInfo.insertRow();
    gameInfo.rows[0].insertCell().innerHTML = "Number of Players";
    gameInfo.rows[0].insertCell().innerHTML = game.players.length;
    gameInfo.insertRow();
    gameInfo.rows[1].insertCell().innerHTML = "Cards Remaining";
    gameInfo.rows[1].insertCell().innerHTML = game.cardsRemaining;

    // player table setup
    for(var i=0; i<game.numPlayers; i++){
      players.insertRow();
      players.rows[i].insertCell().innerHTML = game.players[i].getName;
      players.rows[i].insertCell().innerHTML = game.players[i].getHandStr;
      players.rows[i].insertCell().innerHTML = game.players[i].getScore;
    }

    // Headers for player table
    players.insertRow(0);
    players.rows[0].insertCell().innerHTML = "Player Name";
    players.rows[0].insertCell().innerHTML = "Hand";
    players.rows[0].insertCell().innerHTML = "Books won";

    players.getElementsByTagName("tr")[this.currentPlayer+1].style.fontWeight = "bold";
  }
}

// A class representing a Player of a game
class Player {
  constructor(game, name){
    this.game = game;
    this.name = name;
    this.score = 0;
    this.hand = [];
  }

  // Returns this Player's name
  get getName(){
    return this.name;
  }

  // Returns this Player's score
  get getScore(){
    return this.score;
  }

  // Changes this Player's score by i
  changeScore(i) {
    this.score += i;
  }

  // Returns this Player's hand as a formatted string
  get getHandStr(){
    var rawHand = this.hand.slice(0);
    var strHand = [];
    // Go through and interpret every card in this hand
    while(rawHand.length > 0) {
      strHand.push(this.game.interpretCard(rawHand.pop()));
    }
    // the .join method allows us to replace the standard comma with any string
    return strHand.join(" ");
  }

  // Returns this Player's hand as an array
  get getHand(){
    return this.hand;
  }

  // Returns this Player's hand as an array
  get getHandRanks(){
    return this.hand.map(x=>x%13);
  }

  // Adds a card to this Player's hand
  // card: int
  addCard(card) {
    this.hand.push(card);
  }

  // Adds the list of cards to this Player's hand
  // card: [int,int..]
  addCards(cards) {
    for(var i=0; i<cards.length; i++){
        this.addCard(cards[i]);
    }
  }

  // Removes all cards of a rank from this Player's hand & returns them
  // card: int
  removeRank(rank) {
    var hand = this.hand
    var indicies = []; //Array containing the indicies of all cards to be removed
    for(var i=0; i<hand.length; i++) {
      if(hand[i]%13==rank) {
        indicies.unshift(i);
      }
    }
    // remove from the front of indicies (descending order of indicies (back to front))
    var removed = [];
    for(var j=0; j < indicies.length; j++){
        removed.push(hand.splice(indicies[j],1));
    }
    return removed;
  }

  // Removes a card from this Player's hand & returns it
  // card: int
  removeCard(card) {
    return this.hand.splice(this.hand.indexOf(card), 1)[0];
    //the [0] is to unwrap the card from splice's return array
  }

}
