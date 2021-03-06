var $ = jQuery.noConflict();
var loaddata_clrs = [['b','b','r','r','b','b'],['y','y','b','b','y','y'],['p','p','y','y','p','p'],['g','g','r','r','g','g'],['r','r','b','b','r','r']]

var def_clrs = ['r','g','b','p','p','p','p','y']; //紅,綠,藍,紫,黃
var dim_x = 6; //盤面x顆數
var dim_y = 5; //盤面y顆數
var tile_w = 60; //每塊寬px
var tile_h = 80; //每塊高px
var tile_b = 1; //每塊框線px

var sky_speed = 800; // 天降珠的速度
var grav_speed = 800; // 自然落珠的速度
var move_speed = 160; // 移動珠子的速度
var gone_speed = 300; // 珠子消除的速度
var myrng = new Math.seedrandom('cits');
var combo_cnt;

//隨機挑色
var pickRandColor = function(){
    console.log(myrng.quick())
    var r = Math.floor(myrng()*def_clrs.length);
    return def_clrs[r];
}       
var loadColor = function(i,j){
    return loaddata_clrs[i][j];
}

//初始化盤面
var init = function(){
    //盤面大小
    $('.demo').css('width', dim_x*tile_w).css('height', dim_y*tile_h);
    //產生珠子並指定位置、顏色
    for(i=0; i<dim_y; i++){
        for(j=0; j<dim_x; j++){
            //var clr = pickRandColor();
            var clr = loadColor(i,j);
            $('.demo').append('<div id="'+j+'-'+i+'" data-clr="'+clr+'" class="'+clr+' tile" style="left:'+j*tile_w+'px; top:'+i*tile_h+'px;"></div>');
        }
    }



    //設定所有珠子的尺寸及框線
    $('.tile').css('width', tile_w-tile_b*2);
    $('.tile').css('height', tile_h-tile_b*2);
    $('.tile').css('border', tile_b+'px solid #333');
    combo_cnt=0;
}

$(function() {
    init();

    $(".tile").draggable({
        grid: [parseInt(tile_w), parseInt(tile_h)], //拖曳時移動單位(以一個珠子的尺寸為移動單位)
        drag: function(e, ui){
            combo_cnt=0;
            $('#combo').val(combo_cnt);
            $(this).addClass('sel'); //拖曳中珠子的樣式
            selLeft = Math.abs(ui.offset.left);
            selTop = ui.offset.top;
            pos_x = selLeft/tile_w;
            pos_y = selTop/tile_h;
            var cur_n = pos_x+'-'+pos_y; //拖曳中珠子的位置 "x-y"，與ID相同
            //目標位置與ID不同時，表示被移動了
            if (cur_n!=$(this).attr('id')){
                var ori = $(this).attr('id'); //原本的ID(即原本的位置)
                moveTo(cur_n, ori); //將目標位置的珠子移到原本拖曳中珠子的位置
                $(this).attr('id', cur_n); //拖曳中珠子標示為新位罝ID
            }
        },
        stop: function(e, ui){
            $(this).removeClass('sel');//停止拖曳就取消拖曳中樣式
            makeChain();//開始計算要消除的Chain
        },
        containment: ".demo", //限制珠子的移動範圍
    });
});

//移動珠子
function moveTo(id, pos){
    var aryPos = pos.split("-");
    var x = aryPos[0]*tile_w;
    var y = aryPos[1]*tile_h;
    $('#'+id).animate({'top':y, 'left':x}, {'duration':move_speed});
    //$('#'+id).offset({top:y, left:x});
    $('#'+id).attr('id',pos);
}

//記錄成為Chain的珠子，分別在X和Y軸有多少相同的珠子
function repeatMap(repeatX, repeatY, clr, xn, yn) {
    this.repeatX = repeatX;
    this.repeatY = repeatY;
    this.clr = clr;
    this.xn = xn;
    this.yn = yn;
    return this;
}

//消除成為Chain的珠子
function makeChain() {
    //flagMatrix記錄每個珠子XY軸有多少相同珠，"2,3"表示X相鄰有2顆、Y相鄰有3顆 (Chain的例子)
    var flagMatrix = new Array();
    for ( i = 0; i < dim_x; i++) {
        flagMatrix[i] = new Array();
    }
    //開始統計Chain，由左至右，由上而下的visit每一顆，記錄它的X,Y軸的鄰居擁有同色珠的數目(是否成為可消的Chain)
    for (  y = 0; y < dim_y; y++) {
        for ( x = 0; x < dim_x; x++) {
            var repeatX = 0;
            var repeatY = 0;
            var clr = '';
            var xn = 0;
            var yn = 0;
            
            if (x > 0) {
                var curX_TileClr = $('#'+x+'-'+y).attr('data-clr');
                var lasX_TileClr = $('#'+(x-1)+'-'+y).attr('data-clr');
                //目前X軸這顆的顏色 和 X軸上一顆的顏色 相同，repeatX+1
                if (curX_TileClr == lasX_TileClr){
                    repeatX = flagMatrix[x-1][y].repeatX+1;
                }else{
                    repeatX = 0;
                }
                clr = curX_TileClr;
                //repeatX>1表示有三顆相同，成為Chain了                
                if (repeatX > 1) {
                    var i = repeatX;
                    //將X Chain上的每一顆都標上此Chain的總顆數
                    for (i; i > 0; i--) {
                        flagMatrix[x-i][y].repeatX = repeatX;
                        flagMatrix[x-i][y].clr = clr;
                        flagMatrix[x-i][y].xn = i;
                    }
                }
            }
            if (y > 0) {
                var curY_TileClr = $('#'+x+'-'+y).attr('data-clr');
                var lasY_TileClr = $('#'+x+'-'+(y-1)).attr('data-clr');
                //目前X軸這顆的顏色 和 X軸上一顆的顏色 相同，repeatY+1
                if (curY_TileClr == lasY_TileClr){
                    repeatY = flagMatrix[x][y-1].repeatY+1;
                }else{
                    repeatY = 0;
                }
                clr = curY_TileClr;
                //repeatY>1表示有三顆相同，成為Chain了     
                if (repeatY > 1) {
                    var i = repeatY;
                    for (i; i > 0; i--) {
                        flagMatrix[x][y - i].repeatY = repeatY;
                        flagMatrix[x][y - i].clr = clr;
                        flagMatrix[x][y - i].yn = i;
                    }
                }
            }
            flagMatrix[x][y] = new repeatMap(repeatX, repeatY, clr, xn, yn);
            //$('#'+x+'-'+y).html(flagMatrix[x][y].repeatX+':'+flagMatrix[x][y].repeatY);
        }
    }
    // 記錄完Chain了，開始準備消除珠子
    var flag = false;
    var aryChk = new Array();
    var aryChains = new Array();
    var aryCombo = new Array();
    //收集combo group
    for ( x = 0; x < dim_x; x++) {
        for ( y = 0; y < dim_y; y++) {
            if (flagMatrix[x][y].repeatX > 1 || flagMatrix[x][y].repeatY > 1) {
                aryChains.push(x+'-'+y);
            }
        }
    }
    console.log(aryChains);
    
    var combo_n = 0;
    for ( var i = 0; i < aryChains.length; i++){
        if (!isChecked(aryChk, aryChains[i])){
            aryChk.push(aryChains[i]);
            aryCombo[combo_n] = new Array();
            aryCombo[combo_n].push(aryChains[i]); //combo head
            ap = aryChains[i].split('-');
            var x = parseInt(ap[0]);
            var y = parseInt(ap[1]);
            rx = flagMatrix[x][y].repeatX;
            ry = flagMatrix[x][y].repeatY;
            if (rx>1){
                var ofs_x = rx - parseInt(flagMatrix[x][y].xn);
                x = x-ofs_x;
                for (var a=0; a<=rx; a++){
                    if (!isChecked(aryChk, (x+a)+'-'+y)){
                        aryChk.push((x+a)+'-'+y);
                        aryCombo[combo_n].push((x+a)+'-'+y);
                        sry = flagMatrix[x+a][y].repeatY;
                        syn = flagMatrix[x+a][y].yn;
                        if (sry > 1){
                            var ofs_y = sry - syn;
                            var sy = y-ofs_y;
                            for (var sb=0; sb<=sry; sb++){
                                if (!isChecked(aryChk, (x+a)+'-'+(sy+sb))){
                                    aryChk.push((x+a)+'-'+(sy+sb));
                                    aryCombo[combo_n].push((x+a)+'-'+(sy+sb));
                                }
                            }
                        }
                    }
                }
            }
            if (ry>1){
                var ofs_y = ry - parseInt(flagMatrix[x][y].yn);
                y = y-ofs_y;
                for (var b=0; b<=ry; b++){
                    if (!isChecked(aryChk, x+'-'+(y+b))){
                        aryChk.push(x+'-'+(y+b));
                        aryCombo[combo_n].push(x+'-'+(y+b));
                        srx = flagMatrix[x][y+b].repeatX;
                        sxn = flagMatrix[x][y+b].xn;
                        if (srx > 1){
                            var ofs_x = srx - sxn;
                            var sx = x-ofs_x;
                            for (var sa=0; sa<=srx; sa++){
                                if (!isChecked(aryChk, (sx+sa)+'-'+(y+b))){
                                    aryChk.push((sx+sa)+'-'+(y+b));
                                    aryCombo[combo_n].push((sx+sa)+'-'+(y+b));
                                }
                            }
                        }
                    }
                }
            }
            combo_n++;
        }
        
    }
    console.log(aryCombo);
    
    //走訪combo chain
    for ( var d = 0; d < aryCombo.length; d++){
        for (var e = 0; e < aryCombo[d].length; e++){
            $('#'+aryCombo[d][e]).addClass('c'+d);
            aryP = aryCombo[d][e].split('-');
            var x = aryP[0];
            var y = aryP[1];
            
        }
        $('#combo').val(++combo_cnt);
        /*
        $('.c'+d).each(function(){
            $(document).queue((function (el) {
                return function () {
                    el.animate({'opacity':0.2}, gone_speed, function () { 
                        $(document).dequeue(); 
                    });
                }; 
            })($(this)) );
        });
        */
    }
    
    
    //console.log(ems);
    //animateElems(ems);
    
    for ( x = 0; x < dim_x; x++) {
        for ( y = 0; y < dim_y; y++) {
            if (flagMatrix[x][y].repeatX > 1 || flagMatrix[x][y].repeatY > 1) {                
                $('#'+x+'-'+y).animate({'opacity':0.2}, gone_speed, function(){
                    $(this).addClass('gone').attr('data-gone', '1');
                    //$('#'+x+'-'+y).html(flagMatrix[x][y].repeatX+':'+flagMatrix[x][y].repeatY);
                });
                flag = true;
            }
            //$('#'+x+'-'+y).html(flagMatrix[x][y].repeatX+':'+flagMatrix[x][y].repeatY+'<br>('+flagMatrix[x][y].clr+') ['+flagMatrix[x][y].xn+'.'+flagMatrix[x][y].yn+']');
        }
    }
    $( ".tile" ).promise().done(function() {
        if (flag){
            $('.tile').css('opacity',1);
            //console.log(flagMatrix);
            gravity();
        }
    });
}

                          
var markChain = function(aryChk, id){
    if (!isChecked(aryChk, id)){
        aryChk.push(id);
        ary_pos = id.split('-');
        var x = parseInt(ary_pos[0]);
        var y = parseInt(ary_pos[1]);
        var p1,p2,p3,p4;
        alert(id);
        if (x>=1 && flagMatrix[x][y].clr == flagMatrix[(x-1)][y].clr){
            if (markChain(aryChk, (x-1)+'-'+y)){
                p1 = true;
            }else{
                return true;
            }
        }
        if (flagMatrix[x][y].clr == flagMatrix[(x+1)][y].clr){
            if (markChain(aryChk, (x+1)+'-'+y)){
                p2 = true;
            }else{
                return true;
            }
        }
        if (y>=1 && flagMatrix[x][y].clr == flagMatrix[(x)][y-1].clr){
            if (markChain(aryChk, x+'-'+(y-1))){
                p3 = true;
            }else{
                return true;
            }
        }
        if (flagMatrix[x][y].clr == flagMatrix[(x)][y+1].clr){
            if (markChain(aryChk, x+'-'+(y+1))){
                p4 = true;
            }else{
                return true;
            }
        }
        if (p1 && p2 && p3 && p4){
            return true;
        }else{
            return false;
        }
    }else{
        return true;
    }

}

var isChecked = function(aryChk, id){
    for (s = 0; s < aryChk.length; s++) {
		thisEntry = aryChk[s].toString();
		if (thisEntry == id) {
			return true;
        }
	}
    return false;
}
//交換珠子
function tileExchange(oid,nid){
    if (oid!=nid && 
        ( $('#'+oid).attr('data-gone')=='1' || $('#'+nid).attr('data-gone')=='1' ) && 
        $('#'+oid).not(':animated') || $('#'+nid).not(':animated') ){
        var pos_o = oid.split("-");
        var pos_n = nid.split("-");
        var ox = pos_o[0]*tile_w;
        var oy = pos_o[1]*tile_h;
        var nx = pos_n[0]*tile_w;
        var ny = pos_n[1]*tile_h;

        $('#'+oid).animate({'top':ny, 'left':nx}, {'duration':grav_speed});
        //$('#'+oid).offset({top:ny, left:nx});
        $('#'+nid).offset({top:oy, left:ox});
        
        $('#'+oid).attr('name',oid);
        $('#'+nid).attr('name',nid);
        
        $('#'+oid).attr('id',nid);
        $('div[name='+nid+']').attr('id',oid);
        
        $('#'+oid).attr('name','');
        $('#'+nid).attr('name','');
    }
}

//自然落珠+天降新珠
function gravity() {
    //計算被消除的珠子產生的hole有多少，再把上方的珠子和被消除的珠子交換位置
    for ( x = 0; x < dim_x; x++) {
        var hole = 0;
        for ( y = dim_y - 1; y >= 0; y--) {
            
            if ('1'==$('#'+x+'-'+y).attr('data-gone')) {
                hole++;
            } else {
                oldPos = x+'-'+y;
                newPos = x+'-'+(y+hole);
                tileExchange(oldPos, newPos);
            }
        }
    }
    // 讓被消除掉的珠子重生
    $('.tile[data-gone=1]').each(function(){

        var clr = pickRandColor();
        $(this).removeClass('r g b p y gone');
        $(this).addClass(clr);
        $(this).attr('data-clr',clr);
        
        $(this).removeAttr('data-gone');
        oset = $(this).offset();
        ol = oset.left;
        ot = oset.top;
        $(this).css('z-index',999);
        $(this).offset({top:ot-300});
        $(this).animate({'top':ot, 'left':ol}, sky_speed);
    });
    setTimeout(makeChain,sky_speed+100);
}