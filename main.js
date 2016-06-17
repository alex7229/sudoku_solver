'use strict';



class SubDomainAjax {

    constructor (url) {
        this.url = url;
    }

    getHTML () {
        return new Promise ( (resolve) => {
                $.post( "/getPageHTML", { pageUri: this.url} )
                .done( data => {
                resolve (data)
            });
    });
    }

}



class Parse {

    constructor (html) {
        this.html = html;
        this.tableWithNumbers = [];
        this.table = []
    }

    findSudokuCells () {
        let regExp = /sc(\d)-(\d)" colspan="5" class="const">(\d)/g;
        let regExpResult;
        let tableWithNumbers = [];
        while ((regExpResult = regExp.exec(this.html)) !== null) {
            let cell = {
                row: regExpResult[1],
                column: regExpResult[2],
                value: regExpResult[3]
            };
            this.tableWithNumbers.push(cell)
        }
    }

    transformTable () {
        for (let row=0; row<9; row++) {
            this.table[row] = [];
            for (let column=0; column<9; column++) {
                this.table[row].push(this.findCellNumber(row, column))
            }
        }
    }

    findCellNumber (row, column) {
        let number;
        this.tableWithNumbers.forEach(cell => {
            if ((cell.column == column) && (cell.row == row)) {
                number = parseInt(cell.value)
            }
        });
        return number
    }
}

class Sudoku {

    constructor (table) {
        this.table = table;
        this.backupTable = [];
        this.numbers = [];
        this.possibleNumberInRow = [];
        this.possibleNumberInColumn = [];
        this.possibleNumberInSquare = []
    }

    calculateField () {
        for (let i=0; i<9; i++) {
            for (let j = 0; j < 9; j++) {
                this.findNumberInCell(i, j)
            }
        }
    }

    makeBackupField () {
        this.backupTable = [];
        for (let row =0; row<9; row++) {
            this.backupTable[row] = [];
            for (let column=0; column<9; column++) {
                this.backupTable[row][column] = this.table[row][column]
            }
        }
    }

    getBackupField () {
        this.table = [];
        for (let row =0; row<9; row++) {
            this.table[row] = [];
            for (let column=0; column<9; column++) {
                this.table[row][column] = this.backupTable[row][column]
            }
        }
    }

    findNumberInCell (row, column) {
        if (!this.table[row][column]) {
            this.findPossibleNumbersInCell(row,column);
            let possibleNumbers = [];
            this.possibleNumberInRow.forEach( number => {
                let possibleInColumn = false;
                let possibleInSquare = false;
                this.possibleNumberInColumn.forEach( numberInColumn => {
                    if (number === numberInColumn) {
                        possibleInColumn = true
                    }
                });
                this.possibleNumberInSquare.forEach( numberInSquare => {
                    if (number === numberInSquare) {
                        possibleInSquare = true
                    }
                });
                if (possibleInColumn && possibleInSquare) {
                    possibleNumbers.push(number)
                }
            });
            if (possibleNumbers.length === 1 ) {
                console.log(`row is ${row}, column is ${column}, should be ${possibleNumbers[0]}`);
                    this.table[row][column] = possibleNumbers[0]
            } else if (possibleNumbers.length === 0) {
                console.log(`row is ${row}, column is ${column}`);
                throw new Error ('cannot solve - there cannot be any number')
            } else if (possibleNumbers.length === 2) {
                //try first number, then second
                this.makeBackupField();
                this.table[row][column]  = possibleNumbers[0];
                try {
                    this.calculateField()
                } catch (err) {
                    console.log('find errors');
                    this.getBackupField();
                    this.table[row][column] = possibleNumbers[1]
                }
            }
        }
    }

    findPossibleNumbersInCell (row, column) {
        this.findNumbersInRow(row);
        this.possibleNumberInRow = this.reverseNumbers();
        this.findNumbersInColumn(column);
        this.possibleNumberInColumn = this.reverseNumbers();
        this.findNumbersInSquare(row, column);
        this.possibleNumberInSquare = this.reverseNumbers();
    }

    reverseNumbers () {
        let notUsedNumbers = [];
        for (let i=1; i<10; i++) {
            let isUsed = false;
            this.numbers.forEach( number => {
                if (number === i) {
                    isUsed = true
                }
            });
            if (!isUsed) {
                notUsedNumbers.push(i)
            }
        }
        this.numbers = [];
        return notUsedNumbers
    }

    findNumbersInRow (row) {
        this.table[row].forEach( cell => {
            if (cell) {
                this.numbers.push(cell)
            }
        });
    }

    findNumbersInColumn (column) {
        for (let row=0; row<9; row++) {
            if (this.table[row][column]) {
                this.numbers.push(this.table[row][column])
            }
        }
    }

    findNumbersInSquare (row, column) {
        let [firstRow, lastRow] = Sudoku.findSquareSideStartFinish(row);
        let [firstColumn, lastColumn] = Sudoku.findSquareSideStartFinish(column);
        for (row=firstRow; row<=lastRow; row++) {
            for (column=firstColumn; column<=lastColumn; column++) {
                if (this.table[row][column]) {
                    this.numbers.push(this.table[row][column])
                }
            }
        }
    }

    static findSquareSideStartFinish (rowOrColumn) {
        let [start, finish] = [0,2];
        if (rowOrColumn>2) {
            while(!(rowOrColumn%3 === 0)) {
                rowOrColumn--
            }
            [start, finish] = [rowOrColumn, rowOrColumn+2]
        }
        return [start,finish]
    }

}

class Draw {
    constructor (table) {
        this.table = table
    }
    
    drawTable () {
        let html = ``;
        this.table.forEach(row => {
            for (let i=0; i<9; i++) {
                let cssClass = 'cell';
                if (i===0) {
                    cssClass+= ' firstCell'
                }
                if (row[i]) {
                    html+= `<div class="${cssClass}">${row[i]}</div>`
                } else {
                    html+= `<div class="${cssClass}"></div>`
                }
            }
        });
        $('#gameContainer').html(html)
    }
    
}

let cors = new SubDomainAjax('http://japonskie.ru/sudoku/id/1341');
cors.getHTML()
    .then(result => {

        let parse = new Parse(result);
        parse.findSudokuCells();
        parse.transformTable();

        let sudoku = new Sudoku(parse.table);
        sudoku.calculateField();



        let table = new Draw(sudoku.table);
        table.drawTable();



    });

