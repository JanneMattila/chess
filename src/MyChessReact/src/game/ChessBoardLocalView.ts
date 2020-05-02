import { ChessBoard } from "./ChessBoard";
import { ChessMove } from "./ChessMove";
import { ChessBoardPiece } from "./ChessBoardPiece";
import { ChessPiece } from "./ChessPiece";
import { ChessBoardState } from "./ChessBoardState";
import { GameModel } from "../models/GameModel";
import { setTimeout } from "timers";
import { ChessPlayer } from "./ChessPlayer";

export class ChessBoardLocalView {
    private board: ChessBoard = new ChessBoard();
    private previousAvailableMoves: ChessMove[] = []
    private game: GameModel = new GameModel();
    private currentMoveNumber: number = 0;

    public initialize(currentPlayerTurn: boolean = false) {
        // Start preparing the board
        this.board = new ChessBoard();
        this.board.initialize();
        this.previousAvailableMoves = [];

        // Update game board to the screen
        this.drawBoard();
    }

    public async load() {
        this.initialize();
        console.log("local game");
        this.game = new GameModel();
    }

    private makeNumberOfMoves(game: GameModel, movesCount: number): number {
        this.initialize(true);
        this.game = game;

        let count = Math.min(game.moves.length, movesCount);
        console.log("going to make " + count + " moves");
        for (let i = 0; i < count; i++) {
            let move = game.moves[i];
            let promotion = move.promotion !== null ? move.promotion : "";
            this.makeMove(move.move, promotion);
        }
        this.setBoardStatus(count, game.moves.length);
        let move = game.moves[count - 1];
        this.setThinkTime(count, move.time);
        this.setComment(move.comment);
        this.drawBoard();

        return count;
    }

    public drawBoard() {
        console.log("drawBoard");

        // Update game board table
        let table = document.getElementById("table-game") as HTMLTableElement;
        table.innerHTML = "";

        let lastMove = this.board.lastMove();
        let lastMoveCapture = this.board.lastMoveCapture();

        for (let row = 0; row < ChessBoard.BOARD_SIZE; row++) {

            let rowElement = document.createElement("tr") as HTMLTableRowElement;
            table.appendChild(rowElement);

            for (let column = 0; column < ChessBoard.BOARD_SIZE; column++) {

                let piece: ChessBoardPiece = this.board.getPiece(column, row);
                let cell: HTMLTableCellElement = document.createElement("td") as HTMLTableCellElement;
                let image: HTMLImageElement = document.createElement("img") as HTMLImageElement;

                rowElement.appendChild(cell);
                cell.appendChild(image);

                cell.id = "" + row + "-" + column;
                cell.addEventListener('click', (evt) => {
                    console.log("onCellClick event");
                    let element = evt.currentTarget as HTMLElement;
                    this.pieceSelected(element.id);
                });

                let pieceColor: string = "";
                let pieceRank: string = "";

                switch (piece.piece) {
                    case ChessPiece.Bishop:
                        pieceRank = "Bishop";
                        break;
                    case ChessPiece.King:
                        pieceRank = "King";
                        break;
                    case ChessPiece.Knight:
                        pieceRank = "Knight";
                        break;
                    case ChessPiece.Queen:
                        pieceRank = "Queen";
                        break;
                    case ChessPiece.Rook:
                        pieceRank = "Rook";
                        break;
                    case ChessPiece.Pawn:
                        pieceRank = "Pawn";
                        break;
                    default:
                        pieceRank = "Empty";
                        break;
                }

                if (piece.player === ChessPlayer.None) {
                    image.src = "/images/Empty.svg";
                }
                else {
                    if (piece.player === ChessPlayer.White) {
                        pieceColor = "White";
                    }
                    else if (piece.player === ChessPlayer.Black) {
                        pieceColor = "Black";
                    }

                    image.src = "/images/" + pieceRank + pieceColor + ".svg";
                }

                if ((row + column) % 2 === 0) {
                    cell.classList.add("lightCell");
                }
                else {
                    cell.classList.add("darkCell");
                }

                if (lastMove !== null) {
                    if (lastMove.from.horizontalLocation === column &&
                        lastMove.from.verticalLocation === row) {
                        cell.classList.add("highlightPreviousFrom");
                    }
                    else if (lastMoveCapture !== null &&
                        lastMoveCapture.from.horizontalLocation === column &&
                        lastMoveCapture.from.verticalLocation === row) {
                        cell.classList.add("highlightCapture");
                    }
                    else if (lastMove.to.horizontalLocation === column &&
                        lastMove.to.verticalLocation === row) {
                        cell.classList.add("highlightPreviousTo");
                    }
                }
            }
        }
    }

    public makeMove(move: string, promotion: string) {
        console.log("Making move " + move + " with promotion " + promotion);
        this.board.makeMoveFromString(move);
        if (promotion.length > 0) {
            this.changePromotionFromString(promotion);
        }
    }

    public pieceSelected(id: string) {
        console.log("pieceSelected to " + id);

        if (this.game !== null && this.game.moves !== null &&
            this.game.moves.length !== this.currentMoveNumber) {
            console.log("Not in last move");
            return;
        }

        let rowIndex: number = parseInt(id[0]);
        let columnIndex: number = parseInt(id[2]);
        let identifier = rowIndex + "-" + columnIndex;

        if (this.previousAvailableMoves.length > 0) {

            let selectedMove: ChessMove | null = null;
            for (let i = 0; i < this.previousAvailableMoves.length; i++) {

                let move: ChessMove = this.previousAvailableMoves[i];
                let moveId: string = move.to.verticalLocation + "-" + move.to.horizontalLocation;
                let element = document.getElementById(moveId);

                if (element?.id === identifier) {
                    selectedMove = move;
                }

                element?.classList.remove("highlightMoveAvailable");
            }

            this.previousAvailableMoves = [];

            if (selectedMove !== null) {
                // Make selected move
                /*let locations: ChessMove[] =*/ this.board.makeMove(selectedMove, true);
                this.drawBoard();

                if (this.board.lastMovePromotion() !== null) {

                    let queenPromotionElement = document.getElementById("promotionRadioQueen") as HTMLInputElement;
                    queenPromotionElement.checked = true;
                }
                else {
                    this.setBoardStatus(0, 0);

                    this.showConfirmationDialog("inline");
                }

                return;
            }
        }

        let moves: ChessMove[] = this.board.getAvailableMoves(columnIndex, rowIndex);

        if (moves.length > 0) {
            for (let i = 0; i < moves.length; i++) {
                let move: ChessMove = moves[i];
                let element = document.getElementById(move.to.verticalLocation + "-" + move.to.horizontalLocation);
                element?.classList.add("highlightMoveAvailable");
                this.previousAvailableMoves[i] = move;
            }
        }
    }

    public confirm = (): void => {
        console.log("confirmed");
        this.showConfirmationDialog("none");
    }

    public cancel = (): void => {
        console.log("cancel");
        this.showConfirmationDialog("none");
        this.undo();
    }

    private showConfirmationDialog(display: string) {
        let confirmationDialogElement = document.getElementById("confirmation");
        if (confirmationDialogElement !== null) {
            confirmationDialogElement.style.display = display;
        }
    }

    private changePromotionFromString(name: string): boolean {
        console.log("changePromotionFromString to " + name);
        if (name === "Queen") {
            // No changes to promotion
            return false;
        }
        else if (name === "Knight") {
            this.board.changePromotion(ChessPiece.Knight);
        }
        else if (name === "Rook") {
            this.board.changePromotion(ChessPiece.Rook);
        }
        else if (name === "Bishop") {
            this.board.changePromotion(ChessPiece.Bishop);
        }

        return true;
    }

    public changePromotion(name: string) {
        let promotionDialogElement = document.getElementById("promotionDialog");
        if (promotionDialogElement !== null) {
            promotionDialogElement.style.display = "none";

            let nodes: NodeList = document.getElementsByName(name)
            for (let i: number = 0; i < nodes.length; i++) {
                let radioElement = nodes[i] as HTMLInputElement;
                if (radioElement.checked === true) {
                    if (this.changePromotionFromString(radioElement.value)) {
                        this.drawBoard();
                    }
                    return;
                }
            }

        }
    }

    public undo() {
        let commentDialogElement = document.getElementById("commentDialog");
        if (commentDialogElement !== null) {
            commentDialogElement.style.display = "none";
        }

        this.board.undo();
        this.drawBoard();
    }

    public getLastMoveAsString(): string | undefined {
        return this.board.lastMove()?.getMoveString();
    }

    public getLastMovePromotionAsString(): string {
        let lastPromotion = this.board.lastMovePromotion();
        if (lastPromotion !== null) {
            return lastPromotion.piece.toString();
        }

        return "";
    }

    public setComment(commentText: string) {
        commentText = commentText !== null ? commentText : "";

        let commentElement = document.getElementById("LastComment") as HTMLDivElement;
        commentElement.innerText = commentText;
    }

    public setThinkTime(moveIndex: number, thinkTime: number) {
        let thinkTimeElement = document.getElementById("ThinkTime") as HTMLDivElement;

        let minutes = 0;
        let seconds = thinkTime;
        if (seconds > 60) {
            minutes = Math.floor(seconds / 60);
            seconds %= 60;
        }

        if (minutes > 0) {
            thinkTimeElement.innerText = "Move " + moveIndex + " think time was " + minutes + " minutes and " + seconds + " seconds.";
        }
        else {
            thinkTimeElement.innerText = "Move " + moveIndex + " think time was " + seconds + " seconds.";
        }
    }

    public setBoardStatus(currentMoveIndex: number, moves: number) {
        let statusElement = document.getElementById("status") as HTMLDivElement;
        let status = this.board.GetBoardState();
        let gameStatusMessage = "";

        console.log("currentMoveIndex: " + currentMoveIndex + ", moves: " + moves);
        if (currentMoveIndex !== moves) {
            gameStatusMessage = "Move ";
            gameStatusMessage += currentMoveIndex;
        }

        switch (status) {
            case ChessBoardState.StaleMate:
                gameStatusMessage = "Stalemate";
                break;

            case ChessBoardState.Check:
                gameStatusMessage = "Check => " + gameStatusMessage;
                break;

            case ChessBoardState.CheckMate:
                gameStatusMessage = "Checkmate!";
                break;

            default:
                break;
        }

        statusElement.innerText = gameStatusMessage;
    }

    private moveHistory(direction: number) {
        this.currentMoveNumber += direction;
        console.log("direction: " + direction);
        console.log("currentMoveNumber: " + this.currentMoveNumber);

        if (this.currentMoveNumber < 1) {
            this.currentMoveNumber = 1;
        }
        else if (this.currentMoveNumber > this.game.moves.length) {
            this.currentMoveNumber = this.game.moves.length;
        }
        this.makeNumberOfMoves(this.game, this.currentMoveNumber);
    }

    public firstMove() {
        console.log("to first move");
        this.moveHistory(-999999);
    }

    public previousMove() {
        console.log("previous move");
        this.moveHistory(-1);
    }

    public nextMove() {
        console.log("next move");
        this.moveHistory(1);
    }

    public lastMove() {
        console.log("to last move");
        this.moveHistory(999999);
    }

    public animateNextMove() {
        console.log("animating next move");
        this.moveHistory(1);

        if (this.game.moves.length !== this.currentMoveNumber) {
            setTimeout(() => {
                this.animateNextMove();
            }, 1000);
        }
    }
}
