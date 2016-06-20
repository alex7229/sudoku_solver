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
        this.numbers = [];
        this.possibleNumberInRow = [];
        this.possibleNumberInColumn = [];
        this.possibleNumberInSquare = [];
        this.previousUsedNumbers = 0;
        this.currentUsedNumbers = 0;
        this.numberCombinations = [];
        this.backupTable = []
    }

    solve() {
        let i =0;
        while(this.findUsedNumbersCount() !== 81) {
            i++;
            if (i>30) break;
            if (this.previousUsedNumbers !== this.currentUsedNumbers) {
                console.log('use simple calculations');
                this.calculateField()
            } else {
                console.log('use random calculations');
                //work with 1st cell = 2 different options
                if (this.numberCombinations.length !== 0) {
                    let firstOptionIsFine = true;
                    this.makeBackupField();
                    let row = this.numberCombinations[0].row;
                    let column = this.numberCombinations[0].column;
                    let firstValue = this.numberCombinations[0].values[0];
                    let secondValue = this.numberCombinations[0].values[1];
                    this.table[row][column] = firstValue;
                    try {
                        for (let j=0; j<5; j++) {
                            this.calculateField();
                        }
                    } catch (err) {
                        firstOptionIsFine = false;
                    }
                    this.getBackupField();
                    if (firstOptionIsFine) {
                        this.table[row][column] = firstValue;
                    } else {
                        this.table[row][column] = secondValue;
                    }
                }
            }
            this.previousUsedNumbers = this.currentUsedNumbers;
            this.currentUsedNumbers = this.findUsedNumbersCount();
        }

    }

    findErrors() {
        let i =0;
        while(this.findUsedNumbersCount() !== 81) {
            i++;
            if (i>5) break;
            this.calculateField();
        }

    }

    calculateField () {
        this.numberCombinations = [];
        for (let i=0; i<9; i++) {
            for (let j = 0; j < 9; j++) {
                this.solveNumberInCell(i, j);
            }
        }
    }

    /*tryCalculateField() {
        for (let i=0; i<9; i++) {
            for (let j = 0; j < 9; j++) {
                this.solveNumberInCell(i, j)
            }
        }
    }*/

    findUsedNumbersCount () {
        let count = 0;
        this.table.forEach(row => {
            row.forEach( cell => {
                if (cell) {
                    count++
                }
            })
        });
        return count
    }

    findNumberInCell (row, column) {
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
        console.log(possibleNumbers);
            return possibleNumbers;
    }

    solveNumberInCell (row, column) {
        if (!this.table[row][column]) {
            let possibleNumbers = this.findNumberInCell(row, column);
            if (possibleNumbers.length === 0) {
                throw new Error (`cannot solve cell in row ${row}, column ${column}`)
            } else if (possibleNumbers.length === 1) {
                this.table[row][column] = possibleNumbers[0]
            } else if (possibleNumbers.length === 2) {
                let cell = {
                    row: row,
                    column: column,
                    values: []
                };
                possibleNumbers.forEach(number => {
                    cell.values.push(number)
                });
                this.numberCombinations.push(cell);
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
let sudoku = ``;
let cors = new SubDomainAjax('http://japonskie.ru/sudoku/id/785');
cors.getHTML()
    .then(result => {


        let parse = new Parse(result);
        parse.findSudokuCells();
        parse.transformTable();

        sudoku = new Sudoku(parse.table);
        sudoku.findUsedNumbersCount();
        try {
            sudoku.solve();
        } catch (err) {
            console.log(err);
            let table = new Draw(sudoku.table);
            table.drawTable();
        }
        let table = new Draw(sudoku.table);
        table.drawTable();


    });

let pageHTML = ``;
(function setHTML () {
    pageHTML = `<!DOCTYPE html>
<html>
 <head>
 <meta http-equiv="content-type" content="text/html; charset=windows-1251" />
<meta name="viewport" content="width=device-width, initial-scale=1"> <link type="text/css" rel="stylesheet" media="all" href="http://static.japonskie.ru/css/main.css?v=123" />
 <link type="text/css" rel="stylesheet" media="all" href="http://static.japonskie.ru/js/facebox/facebox.css" />
 <link type="text/css" rel="stylesheet" media="only screen and (max-width:1340px)" href="http://static.japonskie.ru/css/1320.css?v=1" />
 <link type="text/css" rel="stylesheet" media="only screen and (max-width:950px)" href="http://static.japonskie.ru/css/smart.css?v=29" />
 <link type="text/css" rel="stylesheet" media="only screen and (max-width:640px)" href="http://static.japonskie.ru/css/small.css?v=31" />
 <script>
 NowPageID=0;
 LastMesID=0;
 </script>
<script async type="text/javascript" src="http://japonskie.ru/lang/ru.js?v=4"></script><link rel="alternate" hreflang="en" href="http://en.japonskie.ru/sudoku/id/288" />
   <title>������ �288</title>
   <meta name="description" content="" />
   <meta property="og:description" content="" />
   <meta name="keywords" content="" />
   		<link rel="canonical" href="http://japonskie.ru/sudoku/id/288" />
   		<link rel="image_src" href="http://japonskie.ru/pics/sudoku/288.gif" />
  	<meta property="og:image" content="http://japonskie.ru/pics/sudoku/288.gif" />
<script>
SiteName='http://japonskie.ru';
</script>
<script type="text/javascript" src="http://static.japonskie.ru/js/jquery-1.11.3.min.js"></script>
<script type="text/javascript" src="http://static.japonskie.ru/js/common.min.js?v=18"></script>
<script type="text/javascript" src="http://japonskie.ru/js/timers.js"></script>
<script async src="//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>

<script type="text/javascript" src="http://static.japonskie.ru/js/sudoku.js?v=12"></script>

  <script type="text/javascript"> 
currentURL='';
CurUser=0;


   jQuery("#full_cross_tbl").mouseleave(function(){
     HLDijits(this,1);
  });

   	FavStat="off";

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function SetHandsAction()
{

    $(".hand").click(function(e){
     if ($(this).hasClass("handup")) var mode=1; else var mode=-1;
     var kid=$(this).attr("abbr");
     var t=$(this).html();
     var dv=this;

	    $.post("http://japonskie.ru/actions.php",{"mode":"komgolos","id":kid,"md":mode}, function(s){
			if (isNumber(s))      {
	    		 t=t.replace(/[0-9]/,s);
	    		 $(dv).html(t);
	    	}  else alert(s);
	    });
    });

}


    jQuery(document).ready(function($) {
    	SetHandsAction();
    	  })

  </script>

<script>
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
  ga('create', 'UA-27450803-1', 'auto');
  ga('send', 'pageview');
</script>


<script type="text/javascript">
function stopError() {
return true;
}
window.onerror = stopError;
</script>



 </head><body>

<div id="top_header">
<a href="http://japonskie.ru/">
<img  id="logo_site" src="http://static.japonskie.ru/img/logo_site.png" alt="����������� ������" /><img  id="logo_txt" src="http://static.japonskie.ru/img/logo_txt.png" alt="����������, ������, ����� � ������ ����������" /></a><div id="langs"><a id="linkru" href="http://japonskie.ru/sudoku/id/288"><img src="http://static.japonskie.ru/img/ru.gif" alt="�������" title="�������"> �������</a>
<a href="http://en.japonskie.ru/sudoku/id/288"><img src="http://static.japonskie.ru/img/en.gif" alt="English" title="English"> English</a></div>
<script>
function ToggleRBlock()
{
	jQuery('#rblock').toggle();
}
</script>
<div id="rblock_but" onclick="ToggleRBlock();"></div>

<div id="right_header">

<form action="http://japonskie.ru/login" method="post">
<img src="//static.japonskie.ru/img/icon/user.png" alt="" /><input style="width:80px;" type="text" value="" name="login" placeholder="�����">
<img src="//static.japonskie.ru/img/icon/pass.png" alt="" /><input style="width:80px;" type="password" value="" name="pass" placeholder="������">
<input class="buttmain" type="submit" value="OK" style="width: 30px;">
<a href="http://japonskie.ru/reg">�����������</a></form>
</div>



</div>


<div id="all">
 <div id="left_panel">

<div class="nav">
<div id="submenucont">
</div>
<ul>
<li class="menu_break">���������� �����������</li>
<li><a href="http://japonskie.ru/nonograms/">�������� ����������</a><li><a href="http://japonskie.ru/puzzle/">����� ������</a>
    </li><li><a href="http://japonskie.ru/filippinskie/">������������</a><li><a href="http://japonskie.ru/sudoku/">������ ������</a><ul class="submenu">
    <li><a href="http://japonskie.ru/sudoku/hard">������� ������</a></li>
    <li><a href="http://japonskie.ru/sudoku/rand">��������� ������</a></li>
    </ul></li><li><a href="http://japonskie.ru/chesspuzzles/">��������� ������</a></li><li class="menu_break">��������� �����������</li><li><a  href="http://japonskie.ru/filvordy/">��������</a> </li><li><a  href="http://japonskie.ru/zagadki/">�������</a><li><a title="��������� ������" href="http://japonskie.ru/scanvordy/">���������</a><li><a  href="http://japonskie.ru/krossvordy/">����������</a></li><li><a  href="http://japonskie.ru/klyuchvordy/">���������</a></li><li class="menu_break">����</li><li><a href="http://japonskie.ru/flash/">���� ����</a></li><li><a href="http://japonskie.ru/grandgames/">���������� ����</a></li>  <li class="menu_break">�������</li>
   <li><a href="http://japonskie.ru/faq">F.A.Q.</a></li>
   <li><a href="http://japonskie.ru/lenta">�����</a></li>
   
    <li><a href="http://japonskie.ru/forum/">�����</a></li>
    <li><a href="http://japonskie.ru/rating/">�������</a></li>
    <li><a href="http://japonskie.ru/news/">�������</a></li>
    <li><a href="http://japonskie.ru/info/">����������</a></li>
 <li class="menu_break">���� �����</li>
<li><a target="_blank" rel="nofollow" href="http://filmyhd720.ru/">������ HD720</a></li>
<li><a target="_blank" rel="nofollow" href="http://2d.by/">���� �� ������� ����</a></li>

</ul>

<hr />


<div id="under_menu"> <form target="_blank" method=post id="GolosForm" action="http://japonskie.ru/opros/27"><table class="g_form"><tr><th>����������� �� �� ������������� ������� �������� (������ F11 �� ����������) ��� ������������ ������ � �������� �����������?</th></tr><tr><td><input class='radioinput' type='radio' name='gval'  value='93'/> ��</td></tr><tr><td><input class='radioinput' type='radio' name='gval'  value='95'/> �� ����(�) � ����� �����������, ������ ���� ������������.</td></tr><tr><td><input class='radioinput' type='radio' name='gval'  value='94'/> ���</td></tr><tr><td><input class='radioinput' type='radio' name='gval'  value='96'/> � �� ���������� ��� � �����.</td></tr></table>
<input type="submit" value="�������������" style="margin-left: 10px; width: 150px;" />
</form><hr><div id="anek">BORMAN64:
� ���� ����� �������� ����� ��������� ����������. 
��������� ������� ������ ���� ����������� � ��������, � ����� ������� � �����, ��� � ������������ ������ ������� ������� ����������� ��� ������� ���������� � ������ ������.
</div><hr />
</div>
</div>   <!-- nav -->
</div>  <!-- left_panel -->


 <div id="right_panel">

<div id="rblock"><div class="rblock_t">����� �� �����</div> 
		<div class="rblock_h">������ �11902</div>
		<div class="rblock_div">
		<a href="http://japonskie.ru/sudoku/id/11902"><img src="http://japonskie.ru/pics/sudoku/11902.gif" alt=""></a>
		</div>
		<div class="rblock_h">������ �11903</div>
		<div class="rblock_div">
		<a href="http://japonskie.ru/sudoku/id/11903"><img src="http://japonskie.ru/pics/sudoku/11903.gif" alt=""></a>
		</div>
		<div class="rblock_h">������ �11904</div>
		<div class="rblock_div">
		<a href="http://japonskie.ru/sudoku/id/11904"><img src="http://japonskie.ru/pics/sudoku/11904.gif" alt=""></a>
		</div>
		<div class="rblock_h">������ �11905</div>
		<div class="rblock_div">
		<a href="http://japonskie.ru/sudoku/id/11905"><img src="http://japonskie.ru/pics/sudoku/11905.gif" alt=""></a>
		</div>
		<div class="rblock_h">������ �11906</div>
		<div class="rblock_div">
		<a href="http://japonskie.ru/sudoku/id/11906"><img src="http://japonskie.ru/pics/sudoku/11906.gif" alt=""></a>
		</div></div>


 <div id="rb_cont">

<h1>������ �288</h1><div id="top_navigation"><a href="http://japonskie.ru/">�����������</a>  &gt; <a href="http://japonskie.ru/sudoku/">������ ������</a> &gt; ������ �288</div><div style="width: 820px;margin-left:10px;" class="yandex_top FullAds"><!-- ������.������ -->
<div id="yandex_ad12"></div>
<script type="text/javascript">
(function(w, d, n, s, t) {
    w[n] = w[n] || [];
    w[n].push(function() {
        Ya.Direct.insertInto(87836, "yandex_ad12", {
            stat_id: 12,
            ad_format: "direct",
            font_size: 0.8,
            font_family: "tahoma",
            type: "horizontal",
            border_type: "ad",
            limit: 2,
            title_font_size: 1,
            border_radius: true,
            links_underline: false,
            site_bg_color: "FFFFFF",
            header_bg_color: "CCCCCC",
            bg_color: "DDDDDD",
            border_color: "EEEEEE",
            title_color: "004477",
            url_color: "004477",
            favicon: true,
            text_color: "000000",
            hover_color: "666666",
            no_sitelinks: true
        });
    });
    t = d.getElementsByTagName("script")[0];
    s = d.createElement("script");
    s.src = "//an.yandex.ru/system/context.js";
    s.type = "text/javascript";
    s.async = true;
    t.parentNode.insertBefore(s, t);
})(window, document, "yandex_context_callbacks");
</script>



</div>	<script>
	function GetFrameCode()
	{
		$.post('/actions.php',{'mode':'iframecode'},function(s)
		{

			jQuery.facebox(s);
		})
	}
	</script>
	<script type="text/javascript">
SudokuID=288
$('#sudoku_mt').ready(function () {



});
</script>


<script type="text/javascript">(function(w,doc) {
if (!w.__utlWdgt ) {
    w.__utlWdgt = true;
    var d = doc, s = d.createElement('script'), g = 'getElementsByTagName';
    s.type = 'text/javascript'; s.charset='UTF-8'; s.async = true;
    s.src = ('https:' == w.location.protocol ? 'https' : 'http')  + '://w.uptolike.com/widgets/v1/uptolike.js';
    var h=d[g]('body')[0];
    h.appendChild(s);
}})(window,document);
</script>

<div style="padding:5px 0 5px 10px; " class="soc_but">
<div data-mobile-view="false" data-share-size="30" data-like-text-enable="false" data-background-alpha="0.0"
 data-pid="38834" data-mode="share" data-background-color="#ededed" data-share-shape="round-rectangle" data-share-counter-size="12" data-icon-color="#ffffff" data-mobile-sn-ids="fb.vk.tw.wh.ok.gp." data-text-color="#000000" data-buttons-color="#ff9300" data-counter-background-color="#ffffff" data-share-counter-type="common" data-orientation="horizontal" data-following-enable="false" data-sn-ids="fb.tw.ok.vk.gp.mr.lj.ip.em." data-preview-mobile="false" data-selection-enable="false" data-exclude-show-more="false" data-share-style="1" data-counter-background-alpha="1.0" data-top-button="false" class="uptolike-buttons" >
</div>
</div>
<div class="txt">������ ������: <b>49</b>; �������: <img src="http://japonskie.ru/img/stars/5.png" alt="" />;
���������: <img src="http://japonskie.ru/img/stars/h2.png"  alt="" /> ;
 <span>��������</span>: <b>31m.11s.</b> <br><a class="ulink" href="javascript:ShowSudokuTop('288');">�������� �� ��������</a> | <a class="ulink" target="_blank" href="http://japonskie.ru/sudoku/help">������� �� ����������</a></div><div  id="gbuts"><table><tr><td><button onclick="CheckSudoku(288);"><img src="http://japonskie.ru/img/icon/proverka.png" class="but_img" alt="" /> ���������</button></td><td><button id="save_el" onclick="alert(LG['onlyreg']);"><img  src="http://japonskie.ru/img/icon/save.png" class="but_img" alt="" /> ���������</button></td><td><button onclick="alert(LG['onlyreg']);"><img src="http://japonskie.ru/img/icon/open.png" class="but_img" alt="" /> ���������</button></td>
<td><button onclick="ClearSudoku();"><img src="http://japonskie.ru/img/icon/clean.png" class="but_img" alt="" /> ��������</button></td><td><button onclick="alert(LG['onlyreg']);"><img src="http://japonskie.ru/img/icon/money.png" class="but_img" alt="" /> ����������</button></td><td><button onclick="GetFrameCode();"><img src="http://japonskie.ru/img/icon/code.png" class="but_img" alt="" /> �������� ���</button></td></tr></table></div><table class="sudoku_n_tbl"  oncontextmenu="return false;"><tr><td style="background-color:#BDB">1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td><td>7</td><td>8</td><td>9</td><td></td></tr></table><br/><table class="sudoku_tbl" id="sudoku_mt"  oncontextmenu="return false;"><tr><td id="s0-0">
        <table class="in_tbl">
        <tr><td></td><td id="sc0-0-1" class="nn">1</td><td id="sc0-0-2" class="nn">2</td><td id="sc0-0-3" class="nn">3</td><td id="sc0-0-4" class="nn">4</td></tr>
        <tr><td id="sc0-0" colspan="5" class="norm"></td></tr>
        <tr><td id="sc0-0-5" class="nn">5</td><td id="sc0-0-6" class="nn">6</td><td id="sc0-0-7" class="nn">7</td><td id="sc0-0-8" class="nn">8</td><td id="sc0-0-9" class="nn">9</td></tr>
        </table>
        </td><td id="s0-1">
        <table class="in_tbl">
        <tr><td></td><td id="sc0-1-1" class="nn">1</td><td id="sc0-1-2" class="nn">2</td><td id="sc0-1-3" class="nn">3</td><td id="sc0-1-4" class="nn">4</td></tr>
        <tr><td id="sc0-1" colspan="5" class="norm"></td></tr>
        <tr><td id="sc0-1-5" class="nn">5</td><td id="sc0-1-6" class="nn">6</td><td id="sc0-1-7" class="nn">7</td><td id="sc0-1-8" class="nn">8</td><td id="sc0-1-9" class="nn">9</td></tr>
        </table>
        </td><td id="s0-2">
        <table class="in_tbl">
        <tr><td></td><td id="sc0-2-1" class="nn">1</td><td id="sc0-2-2" class="nn">2</td><td id="sc0-2-3" class="nn">3</td><td id="sc0-2-4" class="nn">4</td></tr>
        <tr><td id="sc0-2" colspan="5" class="norm"></td></tr>
        <tr><td id="sc0-2-5" class="nn">5</td><td id="sc0-2-6" class="nn">6</td><td id="sc0-2-7" class="nn">7</td><td id="sc0-2-8" class="nn">8</td><td id="sc0-2-9" class="nn">9</td></tr>
        </table>
        </td><td id="s0-3">
        <table class="in_tbl">
        <tr><td></td><td id="sc0-3-1" class="nn">1</td><td id="sc0-3-2" class="nn">2</td><td id="sc0-3-3" class="nn">3</td><td id="sc0-3-4" class="nn">4</td></tr>
        <tr><td id="sc0-3" colspan="5" class="norm"></td></tr>
        <tr><td id="sc0-3-5" class="nn">5</td><td id="sc0-3-6" class="nn">6</td><td id="sc0-3-7" class="nn">7</td><td id="sc0-3-8" class="nn">8</td><td id="sc0-3-9" class="nn">9</td></tr>
        </table>
        </td><td id="s0-4">
        <table class="in_tbl">
        <tr><td></td><td id="sc0-4-1" class="nn">1</td><td id="sc0-4-2" class="nn">2</td><td id="sc0-4-3" class="nn">3</td><td id="sc0-4-4" class="nn">4</td></tr>
        <tr><td id="sc0-4" colspan="5" class="norm"></td></tr>
        <tr><td id="sc0-4-5" class="nn">5</td><td id="sc0-4-6" class="nn">6</td><td id="sc0-4-7" class="nn">7</td><td id="sc0-4-8" class="nn">8</td><td id="sc0-4-9" class="nn">9</td></tr>
        </table>
        </td><td id="s0-5">
        <table class="in_tbl">
        <tr><td></td><td id="sc0-5-1" class="nn">1</td><td id="sc0-5-2" class="nn">2</td><td id="sc0-5-3" class="nn">3</td><td id="sc0-5-4" class="nn">4</td></tr>
        <tr><td id="sc0-5" colspan="5" class="norm"></td></tr>
        <tr><td id="sc0-5-5" class="nn">5</td><td id="sc0-5-6" class="nn">6</td><td id="sc0-5-7" class="nn">7</td><td id="sc0-5-8" class="nn">8</td><td id="sc0-5-9" class="nn">9</td></tr>
        </table>
        </td><td id="s0-6">
        <table class="in_tbl">
        <tr><td></td><td id="sc0-6-1" class="nn">1</td><td id="sc0-6-2" class="nn">2</td><td id="sc0-6-3" class="nn">3</td><td id="sc0-6-4" class="nn">4</td></tr>
        <tr><td id="sc0-6" colspan="5" class="const">3</td></tr>
        <tr><td id="sc0-6-5" class="nn">5</td><td id="sc0-6-6" class="nn">6</td><td id="sc0-6-7" class="nn">7</td><td id="sc0-6-8" class="nn">8</td><td id="sc0-6-9" class="nn">9</td></tr>
        </table>
        </td><td id="s0-7">
        <table class="in_tbl">
        <tr><td></td><td id="sc0-7-1" class="nn">1</td><td id="sc0-7-2" class="nn">2</td><td id="sc0-7-3" class="nn">3</td><td id="sc0-7-4" class="nn">4</td></tr>
        <tr><td id="sc0-7" colspan="5" class="norm"></td></tr>
        <tr><td id="sc0-7-5" class="nn">5</td><td id="sc0-7-6" class="nn">6</td><td id="sc0-7-7" class="nn">7</td><td id="sc0-7-8" class="nn">8</td><td id="sc0-7-9" class="nn">9</td></tr>
        </table>
        </td><td id="s0-8">
        <table class="in_tbl">
        <tr><td></td><td id="sc0-8-1" class="nn">1</td><td id="sc0-8-2" class="nn">2</td><td id="sc0-8-3" class="nn">3</td><td id="sc0-8-4" class="nn">4</td></tr>
        <tr><td id="sc0-8" colspan="5" class="norm"></td></tr>
        <tr><td id="sc0-8-5" class="nn">5</td><td id="sc0-8-6" class="nn">6</td><td id="sc0-8-7" class="nn">7</td><td id="sc0-8-8" class="nn">8</td><td id="sc0-8-9" class="nn">9</td></tr>
        </table>
        </td></tr><tr><td id="s1-0">
        <table class="in_tbl">
        <tr><td></td><td id="sc1-0-1" class="nn">1</td><td id="sc1-0-2" class="nn">2</td><td id="sc1-0-3" class="nn">3</td><td id="sc1-0-4" class="nn">4</td></tr>
        <tr><td id="sc1-0" colspan="5" class="const">4</td></tr>
        <tr><td id="sc1-0-5" class="nn">5</td><td id="sc1-0-6" class="nn">6</td><td id="sc1-0-7" class="nn">7</td><td id="sc1-0-8" class="nn">8</td><td id="sc1-0-9" class="nn">9</td></tr>
        </table>
        </td><td id="s1-1">
        <table class="in_tbl">
        <tr><td></td><td id="sc1-1-1" class="nn">1</td><td id="sc1-1-2" class="nn">2</td><td id="sc1-1-3" class="nn">3</td><td id="sc1-1-4" class="nn">4</td></tr>
        <tr><td id="sc1-1" colspan="5" class="norm"></td></tr>
        <tr><td id="sc1-1-5" class="nn">5</td><td id="sc1-1-6" class="nn">6</td><td id="sc1-1-7" class="nn">7</td><td id="sc1-1-8" class="nn">8</td><td id="sc1-1-9" class="nn">9</td></tr>
        </table>
        </td><td id="s1-2">
        <table class="in_tbl">
        <tr><td></td><td id="sc1-2-1" class="nn">1</td><td id="sc1-2-2" class="nn">2</td><td id="sc1-2-3" class="nn">3</td><td id="sc1-2-4" class="nn">4</td></tr>
        <tr><td id="sc1-2" colspan="5" class="const">5</td></tr>
        <tr><td id="sc1-2-5" class="nn">5</td><td id="sc1-2-6" class="nn">6</td><td id="sc1-2-7" class="nn">7</td><td id="sc1-2-8" class="nn">8</td><td id="sc1-2-9" class="nn">9</td></tr>
        </table>
        </td><td id="s1-3">
        <table class="in_tbl">
        <tr><td></td><td id="sc1-3-1" class="nn">1</td><td id="sc1-3-2" class="nn">2</td><td id="sc1-3-3" class="nn">3</td><td id="sc1-3-4" class="nn">4</td></tr>
        <tr><td id="sc1-3" colspan="5" class="norm"></td></tr>
        <tr><td id="sc1-3-5" class="nn">5</td><td id="sc1-3-6" class="nn">6</td><td id="sc1-3-7" class="nn">7</td><td id="sc1-3-8" class="nn">8</td><td id="sc1-3-9" class="nn">9</td></tr>
        </table>
        </td><td id="s1-4">
        <table class="in_tbl">
        <tr><td></td><td id="sc1-4-1" class="nn">1</td><td id="sc1-4-2" class="nn">2</td><td id="sc1-4-3" class="nn">3</td><td id="sc1-4-4" class="nn">4</td></tr>
        <tr><td id="sc1-4" colspan="5" class="norm"></td></tr>
        <tr><td id="sc1-4-5" class="nn">5</td><td id="sc1-4-6" class="nn">6</td><td id="sc1-4-7" class="nn">7</td><td id="sc1-4-8" class="nn">8</td><td id="sc1-4-9" class="nn">9</td></tr>
        </table>
        </td><td id="s1-5">
        <table class="in_tbl">
        <tr><td></td><td id="sc1-5-1" class="nn">1</td><td id="sc1-5-2" class="nn">2</td><td id="sc1-5-3" class="nn">3</td><td id="sc1-5-4" class="nn">4</td></tr>
        <tr><td id="sc1-5" colspan="5" class="norm"></td></tr>
        <tr><td id="sc1-5-5" class="nn">5</td><td id="sc1-5-6" class="nn">6</td><td id="sc1-5-7" class="nn">7</td><td id="sc1-5-8" class="nn">8</td><td id="sc1-5-9" class="nn">9</td></tr>
        </table>
        </td><td id="s1-6">
        <table class="in_tbl">
        <tr><td></td><td id="sc1-6-1" class="nn">1</td><td id="sc1-6-2" class="nn">2</td><td id="sc1-6-3" class="nn">3</td><td id="sc1-6-4" class="nn">4</td></tr>
        <tr><td id="sc1-6" colspan="5" class="norm"></td></tr>
        <tr><td id="sc1-6-5" class="nn">5</td><td id="sc1-6-6" class="nn">6</td><td id="sc1-6-7" class="nn">7</td><td id="sc1-6-8" class="nn">8</td><td id="sc1-6-9" class="nn">9</td></tr>
        </table>
        </td><td id="s1-7">
        <table class="in_tbl">
        <tr><td></td><td id="sc1-7-1" class="nn">1</td><td id="sc1-7-2" class="nn">2</td><td id="sc1-7-3" class="nn">3</td><td id="sc1-7-4" class="nn">4</td></tr>
        <tr><td id="sc1-7" colspan="5" class="norm"></td></tr>
        <tr><td id="sc1-7-5" class="nn">5</td><td id="sc1-7-6" class="nn">6</td><td id="sc1-7-7" class="nn">7</td><td id="sc1-7-8" class="nn">8</td><td id="sc1-7-9" class="nn">9</td></tr>
        </table>
        </td><td id="s1-8">
        <table class="in_tbl">
        <tr><td></td><td id="sc1-8-1" class="nn">1</td><td id="sc1-8-2" class="nn">2</td><td id="sc1-8-3" class="nn">3</td><td id="sc1-8-4" class="nn">4</td></tr>
        <tr><td id="sc1-8" colspan="5" class="const">8</td></tr>
        <tr><td id="sc1-8-5" class="nn">5</td><td id="sc1-8-6" class="nn">6</td><td id="sc1-8-7" class="nn">7</td><td id="sc1-8-8" class="nn">8</td><td id="sc1-8-9" class="nn">9</td></tr>
        </table>
        </td></tr><tr><td id="s2-0">
        <table class="in_tbl">
        <tr><td></td><td id="sc2-0-1" class="nn">1</td><td id="sc2-0-2" class="nn">2</td><td id="sc2-0-3" class="nn">3</td><td id="sc2-0-4" class="nn">4</td></tr>
        <tr><td id="sc2-0" colspan="5" class="norm"></td></tr>
        <tr><td id="sc2-0-5" class="nn">5</td><td id="sc2-0-6" class="nn">6</td><td id="sc2-0-7" class="nn">7</td><td id="sc2-0-8" class="nn">8</td><td id="sc2-0-9" class="nn">9</td></tr>
        </table>
        </td><td id="s2-1">
        <table class="in_tbl">
        <tr><td></td><td id="sc2-1-1" class="nn">1</td><td id="sc2-1-2" class="nn">2</td><td id="sc2-1-3" class="nn">3</td><td id="sc2-1-4" class="nn">4</td></tr>
        <tr><td id="sc2-1" colspan="5" class="const">2</td></tr>
        <tr><td id="sc2-1-5" class="nn">5</td><td id="sc2-1-6" class="nn">6</td><td id="sc2-1-7" class="nn">7</td><td id="sc2-1-8" class="nn">8</td><td id="sc2-1-9" class="nn">9</td></tr>
        </table>
        </td><td id="s2-2">
        <table class="in_tbl">
        <tr><td></td><td id="sc2-2-1" class="nn">1</td><td id="sc2-2-2" class="nn">2</td><td id="sc2-2-3" class="nn">3</td><td id="sc2-2-4" class="nn">4</td></tr>
        <tr><td id="sc2-2" colspan="5" class="norm"></td></tr>
        <tr><td id="sc2-2-5" class="nn">5</td><td id="sc2-2-6" class="nn">6</td><td id="sc2-2-7" class="nn">7</td><td id="sc2-2-8" class="nn">8</td><td id="sc2-2-9" class="nn">9</td></tr>
        </table>
        </td><td id="s2-3">
        <table class="in_tbl">
        <tr><td></td><td id="sc2-3-1" class="nn">1</td><td id="sc2-3-2" class="nn">2</td><td id="sc2-3-3" class="nn">3</td><td id="sc2-3-4" class="nn">4</td></tr>
        <tr><td id="sc2-3" colspan="5" class="const">8</td></tr>
        <tr><td id="sc2-3-5" class="nn">5</td><td id="sc2-3-6" class="nn">6</td><td id="sc2-3-7" class="nn">7</td><td id="sc2-3-8" class="nn">8</td><td id="sc2-3-9" class="nn">9</td></tr>
        </table>
        </td><td id="s2-4">
        <table class="in_tbl">
        <tr><td></td><td id="sc2-4-1" class="nn">1</td><td id="sc2-4-2" class="nn">2</td><td id="sc2-4-3" class="nn">3</td><td id="sc2-4-4" class="nn">4</td></tr>
        <tr><td id="sc2-4" colspan="5" class="norm"></td></tr>
        <tr><td id="sc2-4-5" class="nn">5</td><td id="sc2-4-6" class="nn">6</td><td id="sc2-4-7" class="nn">7</td><td id="sc2-4-8" class="nn">8</td><td id="sc2-4-9" class="nn">9</td></tr>
        </table>
        </td><td id="s2-5">
        <table class="in_tbl">
        <tr><td></td><td id="sc2-5-1" class="nn">1</td><td id="sc2-5-2" class="nn">2</td><td id="sc2-5-3" class="nn">3</td><td id="sc2-5-4" class="nn">4</td></tr>
        <tr><td id="sc2-5" colspan="5" class="const">4</td></tr>
        <tr><td id="sc2-5-5" class="nn">5</td><td id="sc2-5-6" class="nn">6</td><td id="sc2-5-7" class="nn">7</td><td id="sc2-5-8" class="nn">8</td><td id="sc2-5-9" class="nn">9</td></tr>
        </table>
        </td><td id="s2-6">
        <table class="in_tbl">
        <tr><td></td><td id="sc2-6-1" class="nn">1</td><td id="sc2-6-2" class="nn">2</td><td id="sc2-6-3" class="nn">3</td><td id="sc2-6-4" class="nn">4</td></tr>
        <tr><td id="sc2-6" colspan="5" class="const">6</td></tr>
        <tr><td id="sc2-6-5" class="nn">5</td><td id="sc2-6-6" class="nn">6</td><td id="sc2-6-7" class="nn">7</td><td id="sc2-6-8" class="nn">8</td><td id="sc2-6-9" class="nn">9</td></tr>
        </table>
        </td><td id="s2-7">
        <table class="in_tbl">
        <tr><td></td><td id="sc2-7-1" class="nn">1</td><td id="sc2-7-2" class="nn">2</td><td id="sc2-7-3" class="nn">3</td><td id="sc2-7-4" class="nn">4</td></tr>
        <tr><td id="sc2-7" colspan="5" class="norm"></td></tr>
        <tr><td id="sc2-7-5" class="nn">5</td><td id="sc2-7-6" class="nn">6</td><td id="sc2-7-7" class="nn">7</td><td id="sc2-7-8" class="nn">8</td><td id="sc2-7-9" class="nn">9</td></tr>
        </table>
        </td><td id="s2-8">
        <table class="in_tbl">
        <tr><td></td><td id="sc2-8-1" class="nn">1</td><td id="sc2-8-2" class="nn">2</td><td id="sc2-8-3" class="nn">3</td><td id="sc2-8-4" class="nn">4</td></tr>
        <tr><td id="sc2-8" colspan="5" class="norm"></td></tr>
        <tr><td id="sc2-8-5" class="nn">5</td><td id="sc2-8-6" class="nn">6</td><td id="sc2-8-7" class="nn">7</td><td id="sc2-8-8" class="nn">8</td><td id="sc2-8-9" class="nn">9</td></tr>
        </table>
        </td></tr><tr><td id="s3-0">
        <table class="in_tbl">
        <tr><td></td><td id="sc3-0-1" class="nn">1</td><td id="sc3-0-2" class="nn">2</td><td id="sc3-0-3" class="nn">3</td><td id="sc3-0-4" class="nn">4</td></tr>
        <tr><td id="sc3-0" colspan="5" class="norm"></td></tr>
        <tr><td id="sc3-0-5" class="nn">5</td><td id="sc3-0-6" class="nn">6</td><td id="sc3-0-7" class="nn">7</td><td id="sc3-0-8" class="nn">8</td><td id="sc3-0-9" class="nn">9</td></tr>
        </table>
        </td><td id="s3-1">
        <table class="in_tbl">
        <tr><td></td><td id="sc3-1-1" class="nn">1</td><td id="sc3-1-2" class="nn">2</td><td id="sc3-1-3" class="nn">3</td><td id="sc3-1-4" class="nn">4</td></tr>
        <tr><td id="sc3-1" colspan="5" class="norm"></td></tr>
        <tr><td id="sc3-1-5" class="nn">5</td><td id="sc3-1-6" class="nn">6</td><td id="sc3-1-7" class="nn">7</td><td id="sc3-1-8" class="nn">8</td><td id="sc3-1-9" class="nn">9</td></tr>
        </table>
        </td><td id="s3-2">
        <table class="in_tbl">
        <tr><td></td><td id="sc3-2-1" class="nn">1</td><td id="sc3-2-2" class="nn">2</td><td id="sc3-2-3" class="nn">3</td><td id="sc3-2-4" class="nn">4</td></tr>
        <tr><td id="sc3-2" colspan="5" class="const">6</td></tr>
        <tr><td id="sc3-2-5" class="nn">5</td><td id="sc3-2-6" class="nn">6</td><td id="sc3-2-7" class="nn">7</td><td id="sc3-2-8" class="nn">8</td><td id="sc3-2-9" class="nn">9</td></tr>
        </table>
        </td><td id="s3-3">
        <table class="in_tbl">
        <tr><td></td><td id="sc3-3-1" class="nn">1</td><td id="sc3-3-2" class="nn">2</td><td id="sc3-3-3" class="nn">3</td><td id="sc3-3-4" class="nn">4</td></tr>
        <tr><td id="sc3-3" colspan="5" class="norm"></td></tr>
        <tr><td id="sc3-3-5" class="nn">5</td><td id="sc3-3-6" class="nn">6</td><td id="sc3-3-7" class="nn">7</td><td id="sc3-3-8" class="nn">8</td><td id="sc3-3-9" class="nn">9</td></tr>
        </table>
        </td><td id="s3-4">
        <table class="in_tbl">
        <tr><td></td><td id="sc3-4-1" class="nn">1</td><td id="sc3-4-2" class="nn">2</td><td id="sc3-4-3" class="nn">3</td><td id="sc3-4-4" class="nn">4</td></tr>
        <tr><td id="sc3-4" colspan="5" class="norm"></td></tr>
        <tr><td id="sc3-4-5" class="nn">5</td><td id="sc3-4-6" class="nn">6</td><td id="sc3-4-7" class="nn">7</td><td id="sc3-4-8" class="nn">8</td><td id="sc3-4-9" class="nn">9</td></tr>
        </table>
        </td><td id="s3-5">
        <table class="in_tbl">
        <tr><td></td><td id="sc3-5-1" class="nn">1</td><td id="sc3-5-2" class="nn">2</td><td id="sc3-5-3" class="nn">3</td><td id="sc3-5-4" class="nn">4</td></tr>
        <tr><td id="sc3-5" colspan="5" class="const">7</td></tr>
        <tr><td id="sc3-5-5" class="nn">5</td><td id="sc3-5-6" class="nn">6</td><td id="sc3-5-7" class="nn">7</td><td id="sc3-5-8" class="nn">8</td><td id="sc3-5-9" class="nn">9</td></tr>
        </table>
        </td><td id="s3-6">
        <table class="in_tbl">
        <tr><td></td><td id="sc3-6-1" class="nn">1</td><td id="sc3-6-2" class="nn">2</td><td id="sc3-6-3" class="nn">3</td><td id="sc3-6-4" class="nn">4</td></tr>
        <tr><td id="sc3-6" colspan="5" class="const">2</td></tr>
        <tr><td id="sc3-6-5" class="nn">5</td><td id="sc3-6-6" class="nn">6</td><td id="sc3-6-7" class="nn">7</td><td id="sc3-6-8" class="nn">8</td><td id="sc3-6-9" class="nn">9</td></tr>
        </table>
        </td><td id="s3-7">
        <table class="in_tbl">
        <tr><td></td><td id="sc3-7-1" class="nn">1</td><td id="sc3-7-2" class="nn">2</td><td id="sc3-7-3" class="nn">3</td><td id="sc3-7-4" class="nn">4</td></tr>
        <tr><td id="sc3-7" colspan="5" class="const">8</td></tr>
        <tr><td id="sc3-7-5" class="nn">5</td><td id="sc3-7-6" class="nn">6</td><td id="sc3-7-7" class="nn">7</td><td id="sc3-7-8" class="nn">8</td><td id="sc3-7-9" class="nn">9</td></tr>
        </table>
        </td><td id="s3-8">
        <table class="in_tbl">
        <tr><td></td><td id="sc3-8-1" class="nn">1</td><td id="sc3-8-2" class="nn">2</td><td id="sc3-8-3" class="nn">3</td><td id="sc3-8-4" class="nn">4</td></tr>
        <tr><td id="sc3-8" colspan="5" class="norm"></td></tr>
        <tr><td id="sc3-8-5" class="nn">5</td><td id="sc3-8-6" class="nn">6</td><td id="sc3-8-7" class="nn">7</td><td id="sc3-8-8" class="nn">8</td><td id="sc3-8-9" class="nn">9</td></tr>
        </table>
        </td></tr><tr><td id="s4-0">
        <table class="in_tbl">
        <tr><td></td><td id="sc4-0-1" class="nn">1</td><td id="sc4-0-2" class="nn">2</td><td id="sc4-0-3" class="nn">3</td><td id="sc4-0-4" class="nn">4</td></tr>
        <tr><td id="sc4-0" colspan="5" class="norm"></td></tr>
        <tr><td id="sc4-0-5" class="nn">5</td><td id="sc4-0-6" class="nn">6</td><td id="sc4-0-7" class="nn">7</td><td id="sc4-0-8" class="nn">8</td><td id="sc4-0-9" class="nn">9</td></tr>
        </table>
        </td><td id="s4-1">
        <table class="in_tbl">
        <tr><td></td><td id="sc4-1-1" class="nn">1</td><td id="sc4-1-2" class="nn">2</td><td id="sc4-1-3" class="nn">3</td><td id="sc4-1-4" class="nn">4</td></tr>
        <tr><td id="sc4-1" colspan="5" class="norm"></td></tr>
        <tr><td id="sc4-1-5" class="nn">5</td><td id="sc4-1-6" class="nn">6</td><td id="sc4-1-7" class="nn">7</td><td id="sc4-1-8" class="nn">8</td><td id="sc4-1-9" class="nn">9</td></tr>
        </table>
        </td><td id="s4-2">
        <table class="in_tbl">
        <tr><td></td><td id="sc4-2-1" class="nn">1</td><td id="sc4-2-2" class="nn">2</td><td id="sc4-2-3" class="nn">3</td><td id="sc4-2-4" class="nn">4</td></tr>
        <tr><td id="sc4-2" colspan="5" class="norm"></td></tr>
        <tr><td id="sc4-2-5" class="nn">5</td><td id="sc4-2-6" class="nn">6</td><td id="sc4-2-7" class="nn">7</td><td id="sc4-2-8" class="nn">8</td><td id="sc4-2-9" class="nn">9</td></tr>
        </table>
        </td><td id="s4-3">
        <table class="in_tbl">
        <tr><td></td><td id="sc4-3-1" class="nn">1</td><td id="sc4-3-2" class="nn">2</td><td id="sc4-3-3" class="nn">3</td><td id="sc4-3-4" class="nn">4</td></tr>
        <tr><td id="sc4-3" colspan="5" class="norm"></td></tr>
        <tr><td id="sc4-3-5" class="nn">5</td><td id="sc4-3-6" class="nn">6</td><td id="sc4-3-7" class="nn">7</td><td id="sc4-3-8" class="nn">8</td><td id="sc4-3-9" class="nn">9</td></tr>
        </table>
        </td><td id="s4-4">
        <table class="in_tbl">
        <tr><td></td><td id="sc4-4-1" class="nn">1</td><td id="sc4-4-2" class="nn">2</td><td id="sc4-4-3" class="nn">3</td><td id="sc4-4-4" class="nn">4</td></tr>
        <tr><td id="sc4-4" colspan="5" class="norm"></td></tr>
        <tr><td id="sc4-4-5" class="nn">5</td><td id="sc4-4-6" class="nn">6</td><td id="sc4-4-7" class="nn">7</td><td id="sc4-4-8" class="nn">8</td><td id="sc4-4-9" class="nn">9</td></tr>
        </table>
        </td><td id="s4-5">
        <table class="in_tbl">
        <tr><td></td><td id="sc4-5-1" class="nn">1</td><td id="sc4-5-2" class="nn">2</td><td id="sc4-5-3" class="nn">3</td><td id="sc4-5-4" class="nn">4</td></tr>
        <tr><td id="sc4-5" colspan="5" class="norm"></td></tr>
        <tr><td id="sc4-5-5" class="nn">5</td><td id="sc4-5-6" class="nn">6</td><td id="sc4-5-7" class="nn">7</td><td id="sc4-5-8" class="nn">8</td><td id="sc4-5-9" class="nn">9</td></tr>
        </table>
        </td><td id="s4-6">
        <table class="in_tbl">
        <tr><td></td><td id="sc4-6-1" class="nn">1</td><td id="sc4-6-2" class="nn">2</td><td id="sc4-6-3" class="nn">3</td><td id="sc4-6-4" class="nn">4</td></tr>
        <tr><td id="sc4-6" colspan="5" class="const">7</td></tr>
        <tr><td id="sc4-6-5" class="nn">5</td><td id="sc4-6-6" class="nn">6</td><td id="sc4-6-7" class="nn">7</td><td id="sc4-6-8" class="nn">8</td><td id="sc4-6-9" class="nn">9</td></tr>
        </table>
        </td><td id="s4-7">
        <table class="in_tbl">
        <tr><td></td><td id="sc4-7-1" class="nn">1</td><td id="sc4-7-2" class="nn">2</td><td id="sc4-7-3" class="nn">3</td><td id="sc4-7-4" class="nn">4</td></tr>
        <tr><td id="sc4-7" colspan="5" class="const">9</td></tr>
        <tr><td id="sc4-7-5" class="nn">5</td><td id="sc4-7-6" class="nn">6</td><td id="sc4-7-7" class="nn">7</td><td id="sc4-7-8" class="nn">8</td><td id="sc4-7-9" class="nn">9</td></tr>
        </table>
        </td><td id="s4-8">
        <table class="in_tbl">
        <tr><td></td><td id="sc4-8-1" class="nn">1</td><td id="sc4-8-2" class="nn">2</td><td id="sc4-8-3" class="nn">3</td><td id="sc4-8-4" class="nn">4</td></tr>
        <tr><td id="sc4-8" colspan="5" class="norm"></td></tr>
        <tr><td id="sc4-8-5" class="nn">5</td><td id="sc4-8-6" class="nn">6</td><td id="sc4-8-7" class="nn">7</td><td id="sc4-8-8" class="nn">8</td><td id="sc4-8-9" class="nn">9</td></tr>
        </table>
        </td></tr><tr><td id="s5-0">
        <table class="in_tbl">
        <tr><td></td><td id="sc5-0-1" class="nn">1</td><td id="sc5-0-2" class="nn">2</td><td id="sc5-0-3" class="nn">3</td><td id="sc5-0-4" class="nn">4</td></tr>
        <tr><td id="sc5-0" colspan="5" class="norm"></td></tr>
        <tr><td id="sc5-0-5" class="nn">5</td><td id="sc5-0-6" class="nn">6</td><td id="sc5-0-7" class="nn">7</td><td id="sc5-0-8" class="nn">8</td><td id="sc5-0-9" class="nn">9</td></tr>
        </table>
        </td><td id="s5-1">
        <table class="in_tbl">
        <tr><td></td><td id="sc5-1-1" class="nn">1</td><td id="sc5-1-2" class="nn">2</td><td id="sc5-1-3" class="nn">3</td><td id="sc5-1-4" class="nn">4</td></tr>
        <tr><td id="sc5-1" colspan="5" class="norm"></td></tr>
        <tr><td id="sc5-1-5" class="nn">5</td><td id="sc5-1-6" class="nn">6</td><td id="sc5-1-7" class="nn">7</td><td id="sc5-1-8" class="nn">8</td><td id="sc5-1-9" class="nn">9</td></tr>
        </table>
        </td><td id="s5-2">
        <table class="in_tbl">
        <tr><td></td><td id="sc5-2-1" class="nn">1</td><td id="sc5-2-2" class="nn">2</td><td id="sc5-2-3" class="nn">3</td><td id="sc5-2-4" class="nn">4</td></tr>
        <tr><td id="sc5-2" colspan="5" class="const">7</td></tr>
        <tr><td id="sc5-2-5" class="nn">5</td><td id="sc5-2-6" class="nn">6</td><td id="sc5-2-7" class="nn">7</td><td id="sc5-2-8" class="nn">8</td><td id="sc5-2-9" class="nn">9</td></tr>
        </table>
        </td><td id="s5-3">
        <table class="in_tbl">
        <tr><td></td><td id="sc5-3-1" class="nn">1</td><td id="sc5-3-2" class="nn">2</td><td id="sc5-3-3" class="nn">3</td><td id="sc5-3-4" class="nn">4</td></tr>
        <tr><td id="sc5-3" colspan="5" class="const">6</td></tr>
        <tr><td id="sc5-3-5" class="nn">5</td><td id="sc5-3-6" class="nn">6</td><td id="sc5-3-7" class="nn">7</td><td id="sc5-3-8" class="nn">8</td><td id="sc5-3-9" class="nn">9</td></tr>
        </table>
        </td><td id="s5-4">
        <table class="in_tbl">
        <tr><td></td><td id="sc5-4-1" class="nn">1</td><td id="sc5-4-2" class="nn">2</td><td id="sc5-4-3" class="nn">3</td><td id="sc5-4-4" class="nn">4</td></tr>
        <tr><td id="sc5-4" colspan="5" class="const">4</td></tr>
        <tr><td id="sc5-4-5" class="nn">5</td><td id="sc5-4-6" class="nn">6</td><td id="sc5-4-7" class="nn">7</td><td id="sc5-4-8" class="nn">8</td><td id="sc5-4-9" class="nn">9</td></tr>
        </table>
        </td><td id="s5-5">
        <table class="in_tbl">
        <tr><td></td><td id="sc5-5-1" class="nn">1</td><td id="sc5-5-2" class="nn">2</td><td id="sc5-5-3" class="nn">3</td><td id="sc5-5-4" class="nn">4</td></tr>
        <tr><td id="sc5-5" colspan="5" class="norm"></td></tr>
        <tr><td id="sc5-5-5" class="nn">5</td><td id="sc5-5-6" class="nn">6</td><td id="sc5-5-7" class="nn">7</td><td id="sc5-5-8" class="nn">8</td><td id="sc5-5-9" class="nn">9</td></tr>
        </table>
        </td><td id="s5-6">
        <table class="in_tbl">
        <tr><td></td><td id="sc5-6-1" class="nn">1</td><td id="sc5-6-2" class="nn">2</td><td id="sc5-6-3" class="nn">3</td><td id="sc5-6-4" class="nn">4</td></tr>
        <tr><td id="sc5-6" colspan="5" class="norm"></td></tr>
        <tr><td id="sc5-6-5" class="nn">5</td><td id="sc5-6-6" class="nn">6</td><td id="sc5-6-7" class="nn">7</td><td id="sc5-6-8" class="nn">8</td><td id="sc5-6-9" class="nn">9</td></tr>
        </table>
        </td><td id="s5-7">
        <table class="in_tbl">
        <tr><td></td><td id="sc5-7-1" class="nn">1</td><td id="sc5-7-2" class="nn">2</td><td id="sc5-7-3" class="nn">3</td><td id="sc5-7-4" class="nn">4</td></tr>
        <tr><td id="sc5-7" colspan="5" class="norm"></td></tr>
        <tr><td id="sc5-7-5" class="nn">5</td><td id="sc5-7-6" class="nn">6</td><td id="sc5-7-7" class="nn">7</td><td id="sc5-7-8" class="nn">8</td><td id="sc5-7-9" class="nn">9</td></tr>
        </table>
        </td><td id="s5-8">
        <table class="in_tbl">
        <tr><td></td><td id="sc5-8-1" class="nn">1</td><td id="sc5-8-2" class="nn">2</td><td id="sc5-8-3" class="nn">3</td><td id="sc5-8-4" class="nn">4</td></tr>
        <tr><td id="sc5-8" colspan="5" class="norm"></td></tr>
        <tr><td id="sc5-8-5" class="nn">5</td><td id="sc5-8-6" class="nn">6</td><td id="sc5-8-7" class="nn">7</td><td id="sc5-8-8" class="nn">8</td><td id="sc5-8-9" class="nn">9</td></tr>
        </table>
        </td></tr><tr><td id="s6-0">
        <table class="in_tbl">
        <tr><td></td><td id="sc6-0-1" class="nn">1</td><td id="sc6-0-2" class="nn">2</td><td id="sc6-0-3" class="nn">3</td><td id="sc6-0-4" class="nn">4</td></tr>
        <tr><td id="sc6-0" colspan="5" class="norm"></td></tr>
        <tr><td id="sc6-0-5" class="nn">5</td><td id="sc6-0-6" class="nn">6</td><td id="sc6-0-7" class="nn">7</td><td id="sc6-0-8" class="nn">8</td><td id="sc6-0-9" class="nn">9</td></tr>
        </table>
        </td><td id="s6-1">
        <table class="in_tbl">
        <tr><td></td><td id="sc6-1-1" class="nn">1</td><td id="sc6-1-2" class="nn">2</td><td id="sc6-1-3" class="nn">3</td><td id="sc6-1-4" class="nn">4</td></tr>
        <tr><td id="sc6-1" colspan="5" class="const">7</td></tr>
        <tr><td id="sc6-1-5" class="nn">5</td><td id="sc6-1-6" class="nn">6</td><td id="sc6-1-7" class="nn">7</td><td id="sc6-1-8" class="nn">8</td><td id="sc6-1-9" class="nn">9</td></tr>
        </table>
        </td><td id="s6-2">
        <table class="in_tbl">
        <tr><td></td><td id="sc6-2-1" class="nn">1</td><td id="sc6-2-2" class="nn">2</td><td id="sc6-2-3" class="nn">3</td><td id="sc6-2-4" class="nn">4</td></tr>
        <tr><td id="sc6-2" colspan="5" class="const">9</td></tr>
        <tr><td id="sc6-2-5" class="nn">5</td><td id="sc6-2-6" class="nn">6</td><td id="sc6-2-7" class="nn">7</td><td id="sc6-2-8" class="nn">8</td><td id="sc6-2-9" class="nn">9</td></tr>
        </table>
        </td><td id="s6-3">
        <table class="in_tbl">
        <tr><td></td><td id="sc6-3-1" class="nn">1</td><td id="sc6-3-2" class="nn">2</td><td id="sc6-3-3" class="nn">3</td><td id="sc6-3-4" class="nn">4</td></tr>
        <tr><td id="sc6-3" colspan="5" class="norm"></td></tr>
        <tr><td id="sc6-3-5" class="nn">5</td><td id="sc6-3-6" class="nn">6</td><td id="sc6-3-7" class="nn">7</td><td id="sc6-3-8" class="nn">8</td><td id="sc6-3-9" class="nn">9</td></tr>
        </table>
        </td><td id="s6-4">
        <table class="in_tbl">
        <tr><td></td><td id="sc6-4-1" class="nn">1</td><td id="sc6-4-2" class="nn">2</td><td id="sc6-4-3" class="nn">3</td><td id="sc6-4-4" class="nn">4</td></tr>
        <tr><td id="sc6-4" colspan="5" class="norm"></td></tr>
        <tr><td id="sc6-4-5" class="nn">5</td><td id="sc6-4-6" class="nn">6</td><td id="sc6-4-7" class="nn">7</td><td id="sc6-4-8" class="nn">8</td><td id="sc6-4-9" class="nn">9</td></tr>
        </table>
        </td><td id="s6-5">
        <table class="in_tbl">
        <tr><td></td><td id="sc6-5-1" class="nn">1</td><td id="sc6-5-2" class="nn">2</td><td id="sc6-5-3" class="nn">3</td><td id="sc6-5-4" class="nn">4</td></tr>
        <tr><td id="sc6-5" colspan="5" class="const">8</td></tr>
        <tr><td id="sc6-5-5" class="nn">5</td><td id="sc6-5-6" class="nn">6</td><td id="sc6-5-7" class="nn">7</td><td id="sc6-5-8" class="nn">8</td><td id="sc6-5-9" class="nn">9</td></tr>
        </table>
        </td><td id="s6-6">
        <table class="in_tbl">
        <tr><td></td><td id="sc6-6-1" class="nn">1</td><td id="sc6-6-2" class="nn">2</td><td id="sc6-6-3" class="nn">3</td><td id="sc6-6-4" class="nn">4</td></tr>
        <tr><td id="sc6-6" colspan="5" class="norm"></td></tr>
        <tr><td id="sc6-6-5" class="nn">5</td><td id="sc6-6-6" class="nn">6</td><td id="sc6-6-7" class="nn">7</td><td id="sc6-6-8" class="nn">8</td><td id="sc6-6-9" class="nn">9</td></tr>
        </table>
        </td><td id="s6-7">
        <table class="in_tbl">
        <tr><td></td><td id="sc6-7-1" class="nn">1</td><td id="sc6-7-2" class="nn">2</td><td id="sc6-7-3" class="nn">3</td><td id="sc6-7-4" class="nn">4</td></tr>
        <tr><td id="sc6-7" colspan="5" class="const">3</td></tr>
        <tr><td id="sc6-7-5" class="nn">5</td><td id="sc6-7-6" class="nn">6</td><td id="sc6-7-7" class="nn">7</td><td id="sc6-7-8" class="nn">8</td><td id="sc6-7-9" class="nn">9</td></tr>
        </table>
        </td><td id="s6-8">
        <table class="in_tbl">
        <tr><td></td><td id="sc6-8-1" class="nn">1</td><td id="sc6-8-2" class="nn">2</td><td id="sc6-8-3" class="nn">3</td><td id="sc6-8-4" class="nn">4</td></tr>
        <tr><td id="sc6-8" colspan="5" class="const">1</td></tr>
        <tr><td id="sc6-8-5" class="nn">5</td><td id="sc6-8-6" class="nn">6</td><td id="sc6-8-7" class="nn">7</td><td id="sc6-8-8" class="nn">8</td><td id="sc6-8-9" class="nn">9</td></tr>
        </table>
        </td></tr><tr><td id="s7-0">
        <table class="in_tbl">
        <tr><td></td><td id="sc7-0-1" class="nn">1</td><td id="sc7-0-2" class="nn">2</td><td id="sc7-0-3" class="nn">3</td><td id="sc7-0-4" class="nn">4</td></tr>
        <tr><td id="sc7-0" colspan="5" class="norm"></td></tr>
        <tr><td id="sc7-0-5" class="nn">5</td><td id="sc7-0-6" class="nn">6</td><td id="sc7-0-7" class="nn">7</td><td id="sc7-0-8" class="nn">8</td><td id="sc7-0-9" class="nn">9</td></tr>
        </table>
        </td><td id="s7-1">
        <table class="in_tbl">
        <tr><td></td><td id="sc7-1-1" class="nn">1</td><td id="sc7-1-2" class="nn">2</td><td id="sc7-1-3" class="nn">3</td><td id="sc7-1-4" class="nn">4</td></tr>
        <tr><td id="sc7-1" colspan="5" class="const">4</td></tr>
        <tr><td id="sc7-1-5" class="nn">5</td><td id="sc7-1-6" class="nn">6</td><td id="sc7-1-7" class="nn">7</td><td id="sc7-1-8" class="nn">8</td><td id="sc7-1-9" class="nn">9</td></tr>
        </table>
        </td><td id="s7-2">
        <table class="in_tbl">
        <tr><td></td><td id="sc7-2-1" class="nn">1</td><td id="sc7-2-2" class="nn">2</td><td id="sc7-2-3" class="nn">3</td><td id="sc7-2-4" class="nn">4</td></tr>
        <tr><td id="sc7-2" colspan="5" class="norm"></td></tr>
        <tr><td id="sc7-2-5" class="nn">5</td><td id="sc7-2-6" class="nn">6</td><td id="sc7-2-7" class="nn">7</td><td id="sc7-2-8" class="nn">8</td><td id="sc7-2-9" class="nn">9</td></tr>
        </table>
        </td><td id="s7-3">
        <table class="in_tbl">
        <tr><td></td><td id="sc7-3-1" class="nn">1</td><td id="sc7-3-2" class="nn">2</td><td id="sc7-3-3" class="nn">3</td><td id="sc7-3-4" class="nn">4</td></tr>
        <tr><td id="sc7-3" colspan="5" class="norm"></td></tr>
        <tr><td id="sc7-3-5" class="nn">5</td><td id="sc7-3-6" class="nn">6</td><td id="sc7-3-7" class="nn">7</td><td id="sc7-3-8" class="nn">8</td><td id="sc7-3-9" class="nn">9</td></tr>
        </table>
        </td><td id="s7-4">
        <table class="in_tbl">
        <tr><td></td><td id="sc7-4-1" class="nn">1</td><td id="sc7-4-2" class="nn">2</td><td id="sc7-4-3" class="nn">3</td><td id="sc7-4-4" class="nn">4</td></tr>
        <tr><td id="sc7-4" colspan="5" class="norm"></td></tr>
        <tr><td id="sc7-4-5" class="nn">5</td><td id="sc7-4-6" class="nn">6</td><td id="sc7-4-7" class="nn">7</td><td id="sc7-4-8" class="nn">8</td><td id="sc7-4-9" class="nn">9</td></tr>
        </table>
        </td><td id="s7-5">
        <table class="in_tbl">
        <tr><td></td><td id="sc7-5-1" class="nn">1</td><td id="sc7-5-2" class="nn">2</td><td id="sc7-5-3" class="nn">3</td><td id="sc7-5-4" class="nn">4</td></tr>
        <tr><td id="sc7-5" colspan="5" class="const">9</td></tr>
        <tr><td id="sc7-5-5" class="nn">5</td><td id="sc7-5-6" class="nn">6</td><td id="sc7-5-7" class="nn">7</td><td id="sc7-5-8" class="nn">8</td><td id="sc7-5-9" class="nn">9</td></tr>
        </table>
        </td><td id="s7-6">
        <table class="in_tbl">
        <tr><td></td><td id="sc7-6-1" class="nn">1</td><td id="sc7-6-2" class="nn">2</td><td id="sc7-6-3" class="nn">3</td><td id="sc7-6-4" class="nn">4</td></tr>
        <tr><td id="sc7-6" colspan="5" class="const">8</td></tr>
        <tr><td id="sc7-6-5" class="nn">5</td><td id="sc7-6-6" class="nn">6</td><td id="sc7-6-7" class="nn">7</td><td id="sc7-6-8" class="nn">8</td><td id="sc7-6-9" class="nn">9</td></tr>
        </table>
        </td><td id="s7-7">
        <table class="in_tbl">
        <tr><td></td><td id="sc7-7-1" class="nn">1</td><td id="sc7-7-2" class="nn">2</td><td id="sc7-7-3" class="nn">3</td><td id="sc7-7-4" class="nn">4</td></tr>
        <tr><td id="sc7-7" colspan="5" class="const">6</td></tr>
        <tr><td id="sc7-7-5" class="nn">5</td><td id="sc7-7-6" class="nn">6</td><td id="sc7-7-7" class="nn">7</td><td id="sc7-7-8" class="nn">8</td><td id="sc7-7-9" class="nn">9</td></tr>
        </table>
        </td><td id="s7-8">
        <table class="in_tbl">
        <tr><td></td><td id="sc7-8-1" class="nn">1</td><td id="sc7-8-2" class="nn">2</td><td id="sc7-8-3" class="nn">3</td><td id="sc7-8-4" class="nn">4</td></tr>
        <tr><td id="sc7-8" colspan="5" class="const">2</td></tr>
        <tr><td id="sc7-8-5" class="nn">5</td><td id="sc7-8-6" class="nn">6</td><td id="sc7-8-7" class="nn">7</td><td id="sc7-8-8" class="nn">8</td><td id="sc7-8-9" class="nn">9</td></tr>
        </table>
        </td></tr><tr><td id="s8-0">
        <table class="in_tbl">
        <tr><td></td><td id="sc8-0-1" class="nn">1</td><td id="sc8-0-2" class="nn">2</td><td id="sc8-0-3" class="nn">3</td><td id="sc8-0-4" class="nn">4</td></tr>
        <tr><td id="sc8-0" colspan="5" class="norm"></td></tr>
        <tr><td id="sc8-0-5" class="nn">5</td><td id="sc8-0-6" class="nn">6</td><td id="sc8-0-7" class="nn">7</td><td id="sc8-0-8" class="nn">8</td><td id="sc8-0-9" class="nn">9</td></tr>
        </table>
        </td><td id="s8-1">
        <table class="in_tbl">
        <tr><td></td><td id="sc8-1-1" class="nn">1</td><td id="sc8-1-2" class="nn">2</td><td id="sc8-1-3" class="nn">3</td><td id="sc8-1-4" class="nn">4</td></tr>
        <tr><td id="sc8-1" colspan="5" class="norm"></td></tr>
        <tr><td id="sc8-1-5" class="nn">5</td><td id="sc8-1-6" class="nn">6</td><td id="sc8-1-7" class="nn">7</td><td id="sc8-1-8" class="nn">8</td><td id="sc8-1-9" class="nn">9</td></tr>
        </table>
        </td><td id="s8-2">
        <table class="in_tbl">
        <tr><td></td><td id="sc8-2-1" class="nn">1</td><td id="sc8-2-2" class="nn">2</td><td id="sc8-2-3" class="nn">3</td><td id="sc8-2-4" class="nn">4</td></tr>
        <tr><td id="sc8-2" colspan="5" class="const">2</td></tr>
        <tr><td id="sc8-2-5" class="nn">5</td><td id="sc8-2-6" class="nn">6</td><td id="sc8-2-7" class="nn">7</td><td id="sc8-2-8" class="nn">8</td><td id="sc8-2-9" class="nn">9</td></tr>
        </table>
        </td><td id="s8-3">
        <table class="in_tbl">
        <tr><td></td><td id="sc8-3-1" class="nn">1</td><td id="sc8-3-2" class="nn">2</td><td id="sc8-3-3" class="nn">3</td><td id="sc8-3-4" class="nn">4</td></tr>
        <tr><td id="sc8-3" colspan="5" class="norm"></td></tr>
        <tr><td id="sc8-3-5" class="nn">5</td><td id="sc8-3-6" class="nn">6</td><td id="sc8-3-7" class="nn">7</td><td id="sc8-3-8" class="nn">8</td><td id="sc8-3-9" class="nn">9</td></tr>
        </table>
        </td><td id="s8-4">
        <table class="in_tbl">
        <tr><td></td><td id="sc8-4-1" class="nn">1</td><td id="sc8-4-2" class="nn">2</td><td id="sc8-4-3" class="nn">3</td><td id="sc8-4-4" class="nn">4</td></tr>
        <tr><td id="sc8-4" colspan="5" class="const">1</td></tr>
        <tr><td id="sc8-4-5" class="nn">5</td><td id="sc8-4-6" class="nn">6</td><td id="sc8-4-7" class="nn">7</td><td id="sc8-4-8" class="nn">8</td><td id="sc8-4-9" class="nn">9</td></tr>
        </table>
        </td><td id="s8-5">
        <table class="in_tbl">
        <tr><td></td><td id="sc8-5-1" class="nn">1</td><td id="sc8-5-2" class="nn">2</td><td id="sc8-5-3" class="nn">3</td><td id="sc8-5-4" class="nn">4</td></tr>
        <tr><td id="sc8-5" colspan="5" class="const">6</td></tr>
        <tr><td id="sc8-5-5" class="nn">5</td><td id="sc8-5-6" class="nn">6</td><td id="sc8-5-7" class="nn">7</td><td id="sc8-5-8" class="nn">8</td><td id="sc8-5-9" class="nn">9</td></tr>
        </table>
        </td><td id="s8-6">
        <table class="in_tbl">
        <tr><td></td><td id="sc8-6-1" class="nn">1</td><td id="sc8-6-2" class="nn">2</td><td id="sc8-6-3" class="nn">3</td><td id="sc8-6-4" class="nn">4</td></tr>
        <tr><td id="sc8-6" colspan="5" class="const">9</td></tr>
        <tr><td id="sc8-6-5" class="nn">5</td><td id="sc8-6-6" class="nn">6</td><td id="sc8-6-7" class="nn">7</td><td id="sc8-6-8" class="nn">8</td><td id="sc8-6-9" class="nn">9</td></tr>
        </table>
        </td><td id="s8-7">
        <table class="in_tbl">
        <tr><td></td><td id="sc8-7-1" class="nn">1</td><td id="sc8-7-2" class="nn">2</td><td id="sc8-7-3" class="nn">3</td><td id="sc8-7-4" class="nn">4</td></tr>
        <tr><td id="sc8-7" colspan="5" class="norm"></td></tr>
        <tr><td id="sc8-7-5" class="nn">5</td><td id="sc8-7-6" class="nn">6</td><td id="sc8-7-7" class="nn">7</td><td id="sc8-7-8" class="nn">8</td><td id="sc8-7-9" class="nn">9</td></tr>
        </table>
        </td><td id="s8-8">
        <table class="in_tbl">
        <tr><td></td><td id="sc8-8-1" class="nn">1</td><td id="sc8-8-2" class="nn">2</td><td id="sc8-8-3" class="nn">3</td><td id="sc8-8-4" class="nn">4</td></tr>
        <tr><td id="sc8-8" colspan="5" class="const">7</td></tr>
        <tr><td id="sc8-8-5" class="nn">5</td><td id="sc8-8-6" class="nn">6</td><td id="sc8-8-7" class="nn">7</td><td id="sc8-8-8" class="nn">8</td><td id="sc8-8-9" class="nn">9</td></tr>
        </table>
        </td></tr></table>
<!-- ������.������ -->
<div class="FullAds" id="yandex_ad10"></div>
<script type="text/javascript">
(function(w, d, n, s, t) {
    w[n] = w[n] || [];
    w[n].push(function() {
        Ya.Direct.insertInto(87836, "yandex_ad10", {
            ad_format: "direct",
            type: "posterHorizontal",
            border_type: "block",
            stat_id: 10,
            limit: 3,
            title_font_size: 3,
            border_radius: true,
            links_underline: true,
            site_bg_color: "FFFFFF",
            border_color: "FBE5C0",
            title_color: "0000CC",
            url_color: "006600",
            text_color: "000000",
            hover_color: "0066FF",
            sitelinks_color: "0000CC",
            favicon: true,
            no_sitelinks: false
        });
    });
    t = d.getElementsByTagName("script")[0];
    s = d.createElement("script");
    s.src = "//an.yandex.ru/system/context.js";
    s.type = "text/javascript";
    s.async = true;
    t.parentNode.insertBefore(s, t);
})(window, document, "yandex_context_callbacks");
</script>



<div class="komments"></div><!-- ################################# -->
<div id="socials_new" style="display: none;">

<h2>�����������!!</h2>
<p style="text-indent: 0;">�� ������� ���������� � ������������!</p>
<div class="yashare-auto-init" data-yashareL10n="ru" data-yashareType="icon" data-yashareQuickServices="yaru,vkontakte,facebook,twitter,odnoklassniki,moimir,lj,friendfeed,moikrug,gplus,pinterest,surfingbird"></div>
<hr />
<p style="text-align: justify;">�������� �����������? ���������� � �������� ��������� ������ ���. �����! </p>
<hr /><h2>�������������� �����������</h2>
<p>������ <a target="_blank" href="http://japonskie.ru/reg">������������ �����������</a> (<b>������ ���� ������</b>, ����� ������ ����� � ������),
�� �������� ����������� ���������, ���������, ��������� �� ������ �����������, ����������� � ���������, ��������� ����������� � �������� �� ������.</p>
<div id="send_levels">
<h2>���� ������:</h2>
<form method=post name="vform" id="ilevel" action="" style="font-size: 11px;">
<table><tr><td style="width: 150px;">�����������?:</td><td style="width: 110px;">
<select id="islikedd" name="islike" style="width: 100px;">
<option value="0">�� �������</option>
<option value="1">1 - ������</option>
<option value="2">2 - �����</option>
<option value="3">3 - ���������</option>
<option value="4">4 - ������</option>
<option value="5">5 - �����������</option></select></td><td></td></tr>
<tr><td>���������:</td><td>
<select name="level" id="level" style="width: 100px;">
<option value="0">�� �������</option>
<option value="1">1 - �������</option>
<option value="2">2 - ����������</option>
<option value="3">3 - �������</option>
</select></td><td><input type="submit" class="buttmain" id="cbut" value="OK" /></td></tr></table></form>
</div>
</div> 


<!-- ################################# -->

<div id="showtop" style="display: none;"></div>
</div>
<div style="clear: both;"></div>

<script>
function ReplaceSM()
{
	var sz=document.body.clientWidth;
	if ((sz>640)&(sz<=950))
	{
		var sm = jQuery(".submenu").appendTo("#submenucont");
	}
}

ReplaceSM();

jQuery(document).ready(function() {
    jQuery(window).resize(function () {
		ReplaceSM();
    });
});


function ToggleMenu()
{
 	var d=jQuery('#left_panel').css('display');
 	if (d=='none')
 	{
 		jQuery('#left_panel').css('display','block');
 		jQuery('html, body').animate({scrollLeft: 0, scrollTop:jQuery('#left_panel').offset().top}, 500);
 	}
 	else jQuery('#left_panel').css('display','none');
}
</script>


<div id="menutoggle" onclick="ToggleMenu();">
</div>

</div>


</div>
<div style="clear: both;"></div>
<div id="footer">

 <div style="float: left; width: 100px; margin: 2px 5px 2px 10px;">
<!-- Yandex.Metrika informer -->
<a href="https://metrika.yandex.ru/stat/?id=17784436&amp;from=informer" target="_blank" rel="nofollow"><img src="https://informer.yandex.ru/informer/17784436/3_1_FFFFFFFF_EFEFEFFF_0_pageviews" style="width:88px; height:31px; border:0;" alt="������.�������" title="������.�������: ������ �� ������� (���������, ������ � ���������� ����������)" onclick="try{Ya.Metrika.informer({i:this,id:17784436,lang:'ru'});return false}catch(e){}" /></a>
<!-- /Yandex.Metrika informer -->
</div>

<p>Japonskie.ru - �����, ��������, ���������, ��������, ���� ����, ������, <br>������������, ��������, ����������, ������������ ���������� � ������ ����������� ������.<br />
   �����������, ����������� � ������ ������������� ���������� ����� �������� ������ �� ������������ � ��������������.<br />
   ��� ����������� ������������ �� ����� ���������� ������� �� ��������� �����. � 2011-2016.<br />
   <small>����������, ��������� ����������� � ��������� ����� - <a target="_blank" href="//japonskie.ru/user/memo">Memo</a> | <a href="http://japonskie.ru/peoples">������ �����</a> | <a href="http://japonskie.ru/contact">�������� �����</a> | <a title="�������" href="http://japonskie.ru/news/">�������</a></small></p></div>

<script>
if (document.body.clientWidth<=1320)
{
	jQuery('#adsright').remove();
}
else
{
	(adsbygoogle = window.adsbygoogle || []).push({});

}

jQuery(document).ready(function() {
    jQuery(window).resize(function () {
		if (document.body.clientWidth<=1320)
		{
			jQuery('#adsright').remove();
		}
    });
});
</script>

<script>
(adsbygoogle = window.adsbygoogle || []).push({});
</script>


<script type="text/javascript" src="http://japonskie.ru/js/scroll.js"></script>
<script type="text/javascript" src="http://japonskie.ru/js/facebox/facebox.js"></script>
<script type="text/javascript">
function FB()
{
     jQuery('a[rel*=facebox]').facebox({
        loadingImage : 'http://japonskie.ru/js/facebox/loading.gif',
        closeImage   : 'http://japonskie.ru/js/facebox/closelabel.png'
      	});
}
FB();
</script>

<!-- Yandex.Metrika counter -->
<script type="text/javascript"> (function (d, w, c) { (w[c] = w[c] || []).push(function() { try { w.yaCounter17784436 = new Ya.Metrika({ id:17784436, clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:true }); } catch(e) { } }); var n = d.getElementsByTagName("script")[0], s = d.createElement("script"), f = function () { n.parentNode.insertBefore(s, n); }; s.type = "text/javascript"; s.async = true; s.src = "https://mc.yandex.ru/metrika/watch.js"; if (w.opera == "[object Opera]") { d.addEventListener("DOMContentLoaded", f, false); } else { f(); } })(document, window, "yandex_metrika_callbacks"); </script> <noscript><div><img src="https://mc.yandex.ru/watch/17784436" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
<!-- /Yandex.Metrika counter -->


</body>
</html>
`
}());

/*let parse = new Parse(pageHTML);
parse.findSudokuCells();
parse.transformTable();

let sudoku = new Sudoku(parse.table);
sudoku.table[0][2] = 8;
sudoku.table[8][3] = 4;
sudoku.findUsedNumbersCount();
sudoku.solve();


function defer() {
    setTimeout(function () {
        let table = new Draw(sudoku.table);
        table.drawTable();
    }, 0)
}
defer();*/
