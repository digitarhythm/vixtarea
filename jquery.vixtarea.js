//######################################################################################################################
// vi key bind on textarea for jQuery
// 2014.01.30 coded by Kow Sakazaki
//######################################################################################################################
// 2キー処理ではないキーの各処理の最後にmodifyCode=0を入れておくこと。
(function($) {
    $.fn.vixtarea = function(options){
       var options = jQuery.extend({
            size: '14px',
            color: 'black',
            backgroundColor: 'white',
            method: undefined
        }, options);

        if (undobuffer != undefined) {
            return;
        }

        var permitKeyCode = [122, 188, 27, 46, 16, 186, 191, 60, 62, 65, 67, 87, 68, 79, 73, 88, 85, 90, 72, 74, 75, 76, 89, 71, 82, 52, 54, 80, 77, 222, 192, 69, 219, 190];

        var MAXUNDO = 256 + 1;

        var method = options.method;
        var mode = "view";
        var modifyCode = 0;
        var undobuffer = [this.val()];
        var undopoint = 0;
        var undotop = 0;
        var undonew = 0;
        var prevKey = 0;
        var yankbuffer = "";
        var yankbuffermode = -1;
        var horizontal = 0;
        var memoryline = [];
        var topmargin = 3;
        var bottommargin = 3;
        var startLine = 0;
        var lastcommand = "";
        var keybuffer = "";

        this.css("font-size", options.size);
        this.css("line-height", options.size);
        this.css("font-family", "Osaka-Mono");
        this.css("color", options.color);
        this.css("background-color", options.backgroundColor);
        this.css("word-break", "break-all");
        this.css("word-wrap", "break-word");

        var vline = parseInt(this.css("height")) / parseInt(options.size);
        var hchar = parseInt(this.css("width")) / parseInt(options.size);

        // keyup ######################################################################################################
        this.keyup(function(e) {
            if (prevKey == 17 && e.keyCode == 17) {
                prevKey = 0;
            }
            //console.log("prevKey="+prevKey+", keyup:"+e.keyCode);
        });

        // keydown ######################################################################################################
        this.keydown(function(e) {
            //console.log("keydown="+e.keyCode);
            var elm = e.target;
            var pos = elm.selectionStart;
            switch (mode) {
                case "view":
                    var tl = getLineText(this);
                    permit = permitKeyCode.indexOf(e.keyCode);
                    //if (permit == -1 && modifyCode != 109 && modifyCode != 222 && lastcommand == "") {
                    if (permit == -1 && prevKey != 82) {
                        //console.log("preventDefault:"+e.keyCode);
                        e.preventDefault();
                    }

                    if (e.keyCode == 222) { // '
                        modifyCode = e.keyCode;
                        e.preventDefault();
                    }

                    //console.log("keyCode="+e.keyCode+", modifyCode="+modifyCode+", prevKey="+prevKey);
                    if (prevKey == 17 && e.keyCode != 82) { // ctrl+!r
                        //console.log("keyCode="+e.keyCode);
                        e.preventDefault();
                        switch (e.keyCode) {
                            case 68: // ctrl+d
                                var jump = pos - tl.currLineText.length;
                                var loop = tl.currLine + parseInt(vline / 2);
                                if (loop < tl.maxLine) {
                                    for (i = tl.currLine; i < loop; i++) {
                                        jump += tl.allLines[i].length + 1;
                                    }
                                    elm.setSelectionRange(jump, jump);
                                    var tl2 = getLineText(this);
                                    if (startLine + parseInt(vline / 2) * 3 < tl.maxLine) {
                                        startLine += parseInt((vline - 1) / 2);
                                        var startPos = startLine * parseFloat(jQuery(this).css("line-height"));
                                        jQuery(this).scrollTop(startPos);
                                    }
                                    e.keyCode = 0;
                                }
                                break;

                            case 85: // ctrl+u
                                var jump = pos - tl.currLineText.length;
                                var loop = tl.currLine - parseInt(vline / 2);
                                if (loop > 0) {
                                    for (i = tl.currLine; i > loop; i--) {
                                        jump -= (tl.allLines[i].length + 1);
                                    }
                                    elm.setSelectionRange(jump, jump);
                                    var tl2 = getLineText(this);
                                    startLine = tl2.currLine - parseInt(vline / 2);
                                    if (startLine < 0) {
                                        startLine = 0;
                                    }
                                    var startPos = startLine * parseFloat(jQuery(this).css("line-height"));
                                    jQuery(this).scrollTop(startPos);
                                    e.keyCode = 0;
                                }
                                break;

                            case 69: // ctrl+e
                                startLine++;
                                if (tl.currLine < startLine + topmargin) {
                                    var nextpos = (pos - tl.currLineText.length) + tl.currLineTextAll.length + 1;
                                    elm.setSelectionRange(nextpos, nextpos);
                                }
                                var startPos = startLine * parseFloat(jQuery(this).css("line-height"));
                                jQuery(this).scrollTop(startPos);
                                modifyCode = 0;
                                break;

                            case 89: // ctrl+y
                                startLine--;
                                if (tl.currLine > startLine + ((vline - 1) - bottommargin)) {
                                    var nextpos = (pos - tl.currLineText.length - tl.prevLineText.length) - 1;
                                    elm.setSelectionRange(nextpos, nextpos);
                                }
                                var startPos = startLine * parseFloat(jQuery(this).css("line-height"));
                                jQuery(this).scrollTop(startPos);
                                modifyCode = 0;
                                break;
                        }
                    } else {
                        if (prevKey != 16) {
                            prevKey = e.keyCode;
                        }
                    }

                    break;

                // 編集モード ##############################################################
                case "edit":
                    //prevKey = e.keyCode;
                    if (e.keyCode === 9) { // TAB
                        e.preventDefault();
                        var tl = getLineText(this);
                        var val = elm.value;
                        var spc = "    ";
                        var addspc = spc.substr(tl.currLineText.length % 4);
                        setElementValue(this, val.substr(0, pos) + addspc + val.substr(pos, val.length));
                        elm.setSelectionRange(pos + (4 - tl.currLineText.length % 4), pos + (4 - tl.currLineText.length % 4));
                    }

                    break;

                case "command":
                    break;
            }

            //console.log("keyCode="+e.keyCode+", modifyCode="+modifyCode+", prevKey="+prevKey);
            // エスケープを押した
            if (e.keyCode == 27 || (prevKey == 17 && e.keyCode == 219) || (prevKey == 192 && prevKey != 16 && e.keyCode == 192) && (mode == "edit" || mode == "command")) {
                //console.log("ESC");
                modifyCode = 0;
                switch (mode) {
                    case "edit":
                        if (++undopoint == MAXUNDO) {
                            undopoint = 0;
                        }
                        undonew = undopoint;
                        if (undopoint == undotop) {
                            if (++undotop == MAXUNDO) {
                                undotop = 0;
                            }
                        }
                        undobuffer[undopoint] = elm.value;
                        var val = elm.value;
                        var pos = elm.selectionStart;
                        ch = val.substr(pos - 1, 1);
                        code = ch.charCodeAt(0);
                        if (code != 10) {
                            pos--;
                            elm.setSelectionRange(pos, pos);
                        }

                        keybuffer = val.substr(editstartpos, pos - editstartpos + 1);
                        //console.log("keybuffer="+keybuffer);
                        break;

                    case "view":
                        break;
                }
                mode = "view";
            } else {
                if (prevKey != 17 && prevKey != 190) {
                    prevKey = e.keyCode;
                }
            }
        });
    
        // keypress ######################################################################################################
        this.keypress(function(e) {
            //console.log("keyCode="+e.keyCode+", modifyCode="+modifyCode+", prevKey="+prevKey);
            //console.log("keypress="+e.keyCode);
            var elm = e.target;
            var pos = elm.selectionStart;
            //console.log("currLine="+tl.currLine);
            switch (mode) {
                case "edit":
                    switch (e.keyCode) {
                        case 126: // ~
                            break;
                    }
                    break;
                case "view":
                    var tl = getLineText(this);

                    if (modifyCode != 114) { // r
                        e.preventDefault();
                    }

                    // 2ストロークオペレーション #########################################################
                    if (modifyCode != 0) {
                        if (modifyCode == 114) { // r
                            if (++undopoint == MAXUNDO) {
                                undopoint = 0;
                            }
                            undonew = undopoint;
                            if (undopoint == undotop) {
                                if (++undotop == MAXUNDO) {
                                    undotop = 0;
                                }
                            }
                            lastcommand = "replace_character"
                            var val = elm.value;
                            yankbuffer = val.substr(pos, 1);
                            yankbuffermode = 1;
                            keyBuffer = String.fromCharCode(e.keyCode);
                            setElementValue(this, val.substr(0, pos) + String.fromCharCode(e.keyCode) + val.substr(pos + 1));
                            elm.setSelectionRange(pos, pos);
                            undobuffer[undopoint] = elm.value
                        } else if (modifyCode == 109) {
                            // 行記憶
                            memoryline[e.keyCode] = {pos: pos - tl.currLineText.length, line: tl.currLine};
                            modifyCode = 0;
                            e.keyCode = 0;
                        //} else if (modifyCode == 222 && e.keyCode >= 97 && e.keyCode <= 122) {
                        } else if (modifyCode == 222) {
                            // 行復帰
                            if (memoryline[e.keyCode] != undefined) {
                                linenum = memoryline[e.keyCode].line;
                                jump = memoryline[e.keyCode].pos;
                                elm.setSelectionRange(jump, jump);
                                startLine = linenum - parseInt(vline / 2);
                                var startPos = startLine * parseFloat(jQuery(this).css("line-height"));
                                jQuery(this).scrollTop(startPos);
                            }
                            modifyCode = 0;
                            e.keyCode = 0;
                        } else {
                            switch (e.keyCode) {
                                case 122: // zz
                                    modifyCode = 0;
                                    startLine = tl.currLine - parseInt(vline / 2);
                                    if (startLine < 0) {
                                        startLine = 0;
                                    }
                                    var startPos = startLine * parseFloat(jQuery(this).css("line-height"));
                                    jQuery(this).scrollTop(startPos);
                                    break;

                                case 62: // >
                                    lastcommand = "indent_increment";
                                    keybuffer = "";
                                    if (++undopoint == MAXUNDO) {
                                        undopoint = 0;
                                    }
                                    undonew = undopoint;
                                    if (undopoint == undotop) {
                                        if (++undotop == MAXUNDO) {
                                            undotop = 0;
                                        }
                                    }
                                    var pos2 = pos - tl.currLineText.length;
                                    var val = elm.value;
                                    setElementValue(this, val.substr(0, pos2) + '    ' + val.substr(pos2, val.length));
                                    elm.setSelectionRange(pos2, pos2);
                                    undobuffer[undopoint] = elm.value
                                    break;

                                case 60: // <
                                    lastcommand = "indent_decrement";
                                    keybuffer = "";
                                    if (++undopoint == MAXUNDO) {
                                        undopoint = 0;
                                    }
                                    undonew = undopoint;
                                    if (undopoint == undotop) {
                                        if (++undotop == MAXUNDO) {
                                            undotop = 0;
                                        }
                                    }
                                    var val = elm.value;
                                    var str = tl.currLineTextAll.replace(/^    /, "");
                                    var start = pos - tl.currLineText.length;
                                    var end = start + tl.currLineTextAll.length;
                                    setElementValue(this, val.substr(0, start) + str + val.substr(end))
                                    elm.setSelectionRange(start, start);
                                    undobuffer[undopoint] = elm.value
                                    break;

                                case 103: // gg
                                    if (modifyCode == 103) {
                                        elm.setSelectionRange(0, 0);
                                        startLine = 0;
                                    }
                                    break;

                                case 121: // yy
                                    if (modifyCode == 121) {
                                        var val = elm.value;
                                        yankbuffer = val.substr(pos - tl.currLineText.length, tl.currLineTextAll.length + 1);
                                        yankbuffermode = 0;
                                    }
                                    break;

                                case 100: // dd
                                    if (modifyCode == 100) {
                                        lastcommand = "delete_line";
                                        keybuffer = "";
                                        if (++undopoint == MAXUNDO) {
                                            undopoint = 0;
                                        }
                                        undonew = undopoint;
                                        if (undopoint == undotop) {
                                            if (++undotop == MAXUNDO) {
                                                undotop = 0;
                                            }
                                        }
                                        var nl = pos - tl.currLineText.length;
                                        var nl2 = pos - tl.currLineText.length + tl.currLineTextAll.length + 1;
                                        var val = elm.value;
                                        yankbuffer = val.substr(pos - tl.currLineText.length, tl.currLineTextAll.length + 1);
                                        yankbuffermode = 0;
                                        setElementValue(this, val.substr(0, nl) + val.substr(nl2, val.length));
                                        elm.setSelectionRange(nl, nl);
                                        undobuffer[undopoint] = elm.value
                                    }
                                    break;

                                case 119: // cw
                                    keybuffer = "";
                                    if (modifyCode == 99) {
                                        editstartpos = pos;
                                        lastcommand = "change_word";
                                        var val = elm.value;
                                        if (++undopoint == MAXUNDO) {
                                            undopoint = 0;
                                        }
                                        undonew = undopoint;
                                        if (undopoint == undotop) {
                                            if (++undotop == MAXUNDO) {
                                                undotop = 0;
                                            }
                                        }
                                        var after = tl.currLineTextAll.substr(tl.currLineText.length);
                                        if ((mtc = after.match(/(\ {2,}).+/)) != null) {
                                            var pos2 = pos + mtc[1].length;
                                            yankbuffer = val.substr(pos, mtc[1].length);
                                        } else if ((mtc = after.match(/(.*?)[\b\.,\/:;\'\"@\(\)\[\]\{\}|\<\>\-\n\=\ ]/)) != null) {
                                            var pos2 = pos + mtc[1].length;
                                            yankbuffer = val.substr(pos, mtc[1].length);
                                        } else {
                                            var pos2 = pos + tl.currLineTextAll.length - tl.currLineText.length;
                                            yankbuffer = val.substr(pos, tl.currLineTextAll.length - tl.currLineText.length);
                                        }
                                        yankbuffermode = 1;
                                        setElementValue(this, val.substr(0, pos) + val.substr(pos2));
                                        elm.setSelectionRange(pos, pos);
                                        undobuffer[undopoint] = elm.value
                                        mode = "edit";
                                    }
                                    break;

                            }

                        }
                        modifyCode = 0;
                    } else {
                        switch (e.keyCode) {
                            case 46: // .
                                switch (lastcommand) {
                                    case "replace_character":
                                        if (++undopoint == MAXUNDO) {
                                            undopoint = 0;
                                        }
                                        undonew = undopoint;
                                        if (undopoint == undotop) {
                                            if (++undotop == MAXUNDO) {
                                                undotop = 0;
                                            }
                                        }
                                        var val = elm.value;
                                        yankbuffer = val.substr(pos, 1);
                                        yankbuffermode = 1;
                                        setElementValue(this, val.substr(0, pos) + keyBuffer + val.substr(pos + 1));
                                        elm.setSelectionRange(pos, pos);
                                        undobuffer[undopoint] = elm.value
                                        break;

                                    case "delete_line":
                                        modifyCode = 100;
                                        jQuery(this).trigger(
                                            jQuery.Event( 'keypress', { keyCode: 100, which: 100 } )
                                        );
                                        break;

                                    case "insert_string":
                                        if (++undopoint == MAXUNDO) {
                                            undopoint = 0;
                                        }
                                        undonew = undopoint;
                                        if (undopoint == undotop) {
                                            if (++undotop == MAXUNDO) {
                                                undotop = 0;
                                            }
                                        }
                                        var val = elm.value;
                                        setElementValue(this, val.substr(0, pos) + keybuffer + val.substr(pos, val.length));
                                        elm.setSelectionRange(pos + keybuffer.length, pos + keybuffer.length);
                                        undobuffer[undopoint] = elm.value;
                                        break;

                                    case "append_string":
                                        if (++undopoint == MAXUNDO) {
                                            undopoint = 0;
                                        }
                                        undonew = undopoint;
                                        if (undopoint == undotop) {
                                            if (++undotop == MAXUNDO) {
                                                undotop = 0;
                                            }
                                        }
                                        var val = elm.value;
                                        setElementValue(this, val.substr(0, pos + 1) + keybuffer + val.substr(pos + 1, val.length));
                                        elm.setSelectionRange(pos + keybuffer.length, pos + keybuffer.length);
                                        undobuffer[undopoint] = elm.value;
                                        break;

                                    case "append_string_top":
                                        var addpos = pos - tl.currLineText.length;
                                        var val = elm.value;
                                        setElementValue(this, val.substr(0, addpos) + keybuffer + val.substr(addpos, val.length));
                                        elm.setSelectionRange(addpos, addpos);
                                        break;

                                    case "append_line":
                                        if (++undopoint == MAXUNDO) {
                                            undopoint = 0;
                                        }
                                        undonew = undopoint;
                                        if (undopoint == undotop) {
                                            if (++undotop == MAXUNDO) {
                                                undotop = 0;
                                            }
                                        }
                                        var nl = pos - tl.currLineText.length + tl.currLineTextAll.length + 1;
                                        var val = elm.value;
                                        if (val.charCodeAt(nl - 1) != 10) {
                                            var addstr = val.substr(0, nl) + '\n' + keybuffer + '\n' + val.substr(nl, val.length)
                                        } else {
                                            var addstr = val.substr(0, nl) + keybuffer + '\n' + val.substr(nl, val.length)
                                        }
                                        setElementValue(this, addstr);
                                        elm.setSelectionRange(nl, nl);
                                        undobuffer[undopoint] = elm.value;
                                        break;

                                    case "insert_line":
                                        var nl = pos - tl.currLineText.length;
                                        var val = elm.value;
                                        setElementValue(this, val.substr(0, nl) + keybuffer + '\n' + val.substr(nl, val.length));
                                        elm.setSelectionRange(nl, nl);
                                        break;

                                    case "append_buffer":
                                        jQuery(this).trigger(
                                            jQuery.Event( 'keypress', { keyCode: 112, which: 112 } )
                                        );
                                        break;

                                    case "insert_buffer":
                                        jQuery(this).trigger(
                                            jQuery.Event( 'keypress', { keyCode: 80, which: 80 } )
                                        );
                                        break;

                                    case "delete_character":
                                        jQuery(this).trigger(
                                            jQuery.Event( 'keypress', { keyCode: 120, which: 120 } )
                                        );
                                        break;

                                    case "joinline":
                                        jQuery(this).trigger(
                                            jQuery.Event( 'keypress', { keyCode: 74, which: 74 } )
                                        );
                                        break;

                                    case "indent_increment":
                                        if (++undopoint == MAXUNDO) {
                                            undopoint = 0;
                                        }
                                        undonew = undopoint;
                                        if (undopoint == undotop) {
                                            if (++undotop == MAXUNDO) {
                                                undotop = 0;
                                            }
                                        }
                                        var pos2 = pos - tl.currLineText.length;
                                        var val = elm.value;
                                        setElementValue(this, val.substr(0, pos2) + '    ' + val.substr(pos2, val.length));
                                        elm.setSelectionRange(pos2, pos2);
                                        undobuffer[undopoint] = elm.value
                                        break;

                                    case "indent_decrement":
                                        if (++undopoint == MAXUNDO) {
                                            undopoint = 0;
                                        }
                                        undonew = undopoint;
                                        if (undopoint == undotop) {
                                            if (++undotop == MAXUNDO) {
                                                undotop = 0;
                                            }
                                        }
                                        var val = elm.value;
                                        var str = tl.currLineTextAll.replace(/^    /, "");
                                        var start = pos - tl.currLineText.length;
                                        var end = start + tl.currLineTextAll.length;
                                        setElementValue(this, val.substr(0, start) + str + val.substr(end))
                                        elm.setSelectionRange(start, start);
                                        undobuffer[undopoint] = elm.value
                                        break;

                                    case "change_word":
                                        var val = elm.value;
                                        if (++undopoint == MAXUNDO) {
                                            undopoint = 0;
                                        }
                                        undonew = undopoint;
                                        if (undopoint == undotop) {
                                            if (++undotop == MAXUNDO) {
                                                undotop = 0;
                                            }
                                        }
                                        var after = tl.currLineTextAll.substr(tl.currLineText.length);
                                        if ((mtc = after.match(/(\ {2,}).+/)) != null) {
                                            var pos2 = pos + mtc[1].length;
                                            yankbuffer = val.substr(pos, mtc[1].length);
                                        } else if ((mtc = after.match(/(.*?)[\b\.,\/:;\'\"@\(\)\[\]\{\}|\<\>\-\n\=\ ]/)) != null) {
                                            var pos2 = pos + mtc[1].length;
                                            yankbuffer = val.substr(pos, mtc[1].length);
                                        } else {
                                            var pos2 = pos + tl.currLineTextAll.length - tl.currLineText.length;
                                            yankbuffer = val.substr(pos, tl.currLineTextAll.length - tl.currLineText.length);
                                        }
                                        yankbuffermode = 1;
                                        setElementValue(this, val.substr(0, pos) + keybuffer + val.substr(pos2));
                                        elm.setSelectionRange(pos, pos);
                                        undobuffer[undopoint] = elm.value
                                        break;

                                    case "delete_lineend":
                                        if (++undopoint == MAXUNDO) {
                                            undopoint = 0;
                                        }
                                        undonew = undopoint;
                                        if (undopoint == undotop) {
                                            if (++undotop == MAXUNDO) {
                                                undotop = 0;
                                            }
                                        }
                                        var val = elm.value;
                                        var pos2 = pos - tl.currLineText.length + tl.currLineTextAll.length;
                                        yankbuffer = val.substr(pos, tl.currLineTextAll.length - tl.currLineText.length);
                                        yankbuffermode = 1;
                                        setElementValue(this, val.substr(0, pos) + val.substr(pos2, val.length));
                                        elm.setSelectionRange(pos-1, pos-1);
                                        undobuffer[undopoint] = elm.value
                                        break;

                                    case "delete_edit_lineend":
                                        if (++undopoint == MAXUNDO) {
                                            undopoint = 0;
                                        }
                                        undonew = undopoint;
                                        if (undopoint == undotop) {
                                            if (++undotop == MAXUNDO) {
                                                undotop = 0;
                                            }
                                        }
                                        var val = elm.value;
                                        var pos2 = pos - tl.currLineText.length + tl.currLineTextAll.length;
                                        yankbuffer = val.substr(pos, tl.currLineTextAll.length - tl.currLineText.length);
                                        yankbuffermode = 1;
                                        setElementValue(this, val.substr(0, pos) + keybuffer + val.substr(pos2, val.length));
                                        elm.setSelectionRange(pos + keybuffer.length, pos + keybuffer.length);
                                        undobuffer[undopoint] = elm.value
                                        break;
                                }
                                break;

                            // エディター操作 ##################################################
                            case 103: // g
                                modifyCode = e.keyCode;
                                break;
                            case 121: // y
                                modifyCode = e.keyCode;
                                break;
                            case 100: // d
                                modifyCode = e.keyCode;
                                break;
                            case 99:  // c
                                modifyCode = e.keyCode;
                                break;
                            case 114: // r
                                modifyCode = e.keyCode;
                                break;
                            case 109: // m
                                modifyCode = e.keyCode;
                                break;
                            case 60: // <
                                modifyCode = e.keyCode;
                                break;
                            case 62: // >
                                modifyCode = e.keyCode;
                                break;
                            case 122: // z
                                modifyCode = e.keyCode;
                                break;

                                
                            case 104: // h
                                elm.focus();
                                horizontal = tl.currLineText.length;
                                var val = elm.value;
                                ch = val.substr(pos - 1, 1);
                                code = ch.charCodeAt(0);
                                if (code != 10) {
                                    elm.setSelectionRange(elm.value.length, pos - 1);
                                }
                                modifyCode = 0;
                                break;

                            case 106: // j
                                if (tl.nextLineText != undefined) {
                                    var move = pos - tl.currLineText.length + tl.currLineTextAll.length + 1;
                                    if (horizontal < tl.nextLineText.length) {
                                        move += horizontal;
                                    } else {
                                        if (tl.nextLineText.length == 0) {
                                            move += tl.nextLineText.length;
                                        } else {
                                            move += tl.nextLineText.length - 1;
                                        }
                                    }
                                    elm.focus();
                                    elm.setSelectionRange(move, move);
                                }
                                modifyCode = 0;
                                break;

                            case 107: // k
                                if (tl.prevLineText != undefined) {
                                    var move = pos - tl.currLineText.length - tl.prevLineText.length - 1;
                                    if (horizontal < tl.prevLineText.length) {
                                        move += horizontal;
                                    } else {
                                        if (tl.prevLineText.length == 0) {
                                            move += tl.prevLineText.length;
                                        } else {
                                            move += tl.prevLineText.length - 1;
                                        }
                                    }
                                    elm.focus();
                                    elm.setSelectionRange(move, move);
                                }
                                modifyCode = 0;
                                break;

                            case 108: // l
                                elm.focus();
                                horizontal = tl.currLineText.length;
                                var val = elm.value;
                                ch1 = val.substr(pos, 1);
                                ch2 = val.substr(pos + 1, 1);
                                code1 = ch1.charCodeAt(0);
                                code2 = ch2.charCodeAt(0);
                                if (code1 != 10 && code2 != 10) {
                                    elm.setSelectionRange(elm.value.length, pos + 1);
                                }
                                modifyCode = 0;
                                break;

                            case 72: // shift+h
                                var jump = pos - tl.currLineText.length;
                                var loop = startLine + topmargin;
                                for (i = tl.currLine - 1; i > loop; i--) {
                                    jump -= (tl.allLines[i].length + 1);
                                }
                                elm.setSelectionRange(jump, jump);
                                modifyCode = 0;
                                break;

                            case 76: // shift+l
                                var jump = pos - tl.currLineText.length;
                                var loop = startLine + (vline - 1) - bottommargin;
                                if (loop > tl.maxLine) {
                                    loop = tl.maxLine;
                                }
                                for (i = tl.currLine; i < loop; i++) {
                                    jump += (tl.allLines[i].length + 1);
                                }
                                elm.setSelectionRange(jump, jump);
                                modifyCode = 0;
                                break;

                            case 77: // shift+m
                                var jump = pos - tl.currLineText.length;
                                var loop = startLine + parseInt(vline / 2);
                                if (loop > tl.currLine) {
                                    for (i = tl.currLine; i < loop; i++) {
                                        jump += (tl.allLines[i].length + 1);
                                    }
                                } else {
                                    for (i = tl.currLine - 1; i > loop; i--) {
                                        jump -= (tl.allLines[i].length + 1);
                                    }
                                }
                                elm.setSelectionRange(jump, jump);
                                modifyCode = 0;
                                break;

                            case 58: // :
                                modifyCode = 0;
                                if (method != undefined) {
                                    method();
                                }
                                break;

                            case 36: // shift+4
                                tl = getLineText(this);
                                horizontal = tl.currLineTextAll.length;
                                var nl = pos + tl.currLineTextAll.length - tl.currLineText.length;
                                elm.setSelectionRange(nl - 1, nl - 1);
                                modifyCode = 0;
                                break;

                            case 94: // shift+6
                                tl = getLineText(this);
                                horizontal = 0;
                                var nl = pos - tl.currLineText.length;
                                elm.setSelectionRange(nl, nl);
                                modifyCode = 0;
                                break;

                            case 71: // shift+g
                                pos = elm.value.length;
                                elm.setSelectionRange(pos, pos);
                                modifyCode = 0;
                                break;

                            // 編集操作 #########################################################

                            case 105: // i
                                mode = "edit";
                                lastcommand = "insert_string";
                                keybuffer = "";
                                editstartpos = pos;
                                modifyCode = 0;
                                break;

                            case 65: // A
                                mode = "edit";
                                lastcommand = "append_string_top";
                                keybuffer = "";
                                var addpos = pos - tl.currLineText.length;
                                elm.setSelectionRange(addpos, addpos);
                                editstartpos = addpos;
                                modifyCode = 0;
                                break;

                            case 97: // a
                                mode = "edit";
                                lastcommand = "append_string";
                                keybuffer = "";
                                var val = elm.value;
                                ch = val.substr(pos, 1);
                                code = ch.charCodeAt(0);
                                addpos = pos;
                                if (code != 10) {
                                    addpos++;
                                }
                                elm.setSelectionRange(addpos, addpos);
                                editstartpos = addpos;
                                modifyCode = 0;
                                break;

                            case 111: // o
                                mode = "edit";
                                lastcommand = "append_line";
                                keybuffer = "";
                                var nl = pos - tl.currLineText.length + tl.currLineTextAll.length + 1;
                                var val = elm.value;
                                setElementValue(this, val.substr(0, nl) + '\n' + val.substr(nl, val.length));
                                elm.setSelectionRange(nl, nl);
                                editstartpos = nl;
                                modifyCode = 0;
                                break;

                            case 79: // O
                                mode = "edit";
                                lastcommand = "insert_line";
                                keybuffer = "";
                                var nl = pos - tl.currLineText.length;
                                var val = elm.value;
                                setElementValue(this, val.substr(0, nl) + '\n' + val.substr(nl, val.length));
                                elm.setSelectionRange(nl, nl);
                                editstartpos = nl;
                                modifyCode = 0;
                                break;

                            case 67: // C shift+c
                                editstartpos = pos;
                                lastcommand = "delete_edit_lineend";
                                if (++undopoint == MAXUNDO) {
                                    undopoint = 0;
                                }
                                undonew = undopoint;
                                if (undopoint == undotop) {
                                    if (++undotop == MAXUNDO) {
                                        undotop = 0;
                                    }
                                }
                                var val = elm.value;
                                var pos2 = pos - tl.currLineText.length + tl.currLineTextAll.length;
                                yankbuffer = val.substr(pos, tl.currLineTextAll.length - tl.currLineText.length);
                                yankbuffermode = 1;
                                setElementValue(this, val.substr(0, pos) + val.substr(pos2, val.length));
                                elm.setSelectionRange(pos, pos);
                                undobuffer[undopoint] = elm.value
                                mode = "edit";
                                modifyCode = 0;
                                break;

                            case 68: // D shift+d
                                editstartpos = pos;
                                lastcommand = "delete_lineend";
                                if (++undopoint == MAXUNDO) {
                                    undopoint = 0;
                                }
                                undonew = undopoint;
                                if (undopoint == undotop) {
                                    if (++undotop == MAXUNDO) {
                                        undotop = 0;
                                    }
                                }
                                var val = elm.value;
                                var pos2 = pos - tl.currLineText.length + tl.currLineTextAll.length;
                                yankbuffer = val.substr(pos, tl.currLineTextAll.length - tl.currLineText.length);
                                yankbuffermode = 1;
                                setElementValue(this, val.substr(0, pos) + val.substr(pos2, val.length));
                                elm.setSelectionRange(pos-1, pos-1);
                                undobuffer[undopoint] = elm.value
                                modifyCode = 0;
                                break;

                            case 112: // p
                                lastcommand = "append_buffer";
                                keybuffer = "";
                                if (++undopoint == MAXUNDO) {
                                    undopoint = 0;
                                }
                                undonew = undopoint;
                                if (undopoint == undotop) {
                                    if (++undotop == MAXUNDO) {
                                        undotop = 0;
                                    }
                                }
                                var val = elm.value;
                                if (yankbuffermode == 0) {
                                    var nl = pos - tl.currLineText.length + tl.currLineTextAll.length + 1;
                                    //elm.value = val.substr(0, nl) + yankbuffer + val.substr(nl, val.length);
                                    setElementValue(this, val.substr(0, nl) + yankbuffer + val.substr(nl, val.length));
                                    elm.setSelectionRange(nl, nl);
                                } else {
                                    //elm.value = val.substr(0, pos + 1) + yankbuffer + val.substr(pos + 1, val.length);
                                    setElementValue(this, val.substr(0, pos + 1) + yankbuffer + val.substr(pos + 1, val.length));
                                    elm.setSelectionRange(pos, pos);
                                }
                                undobuffer[undopoint] = elm.value
                                modifyCode = 0;
                                break;

                            case 80: // P
                                lastcommand = "insert_buffer";
                                keybuffer = "";
                                if (++undopoint == MAXUNDO) {
                                    undopoint = 0;
                                }
                                undonew = undopoint;
                                if (undopoint == undotop) {
                                    if (++undotop == MAXUNDO) {
                                        undotop = 0;
                                    }
                                }
                                var val = elm.value;
                                if (yankbuffermode == 0) {
                                    toppos = pos - tl.currLineText.length;
                                    setElementValue(this, val.substr(0, toppos) + yankbuffer + val.substr(toppos, val.length));
                                    elm.setSelectionRange(toppos, toppos);
                                } else {
                                    setElementValue(this, val.substr(0, pos) + yankbuffer + val.substr(pos, val.length));
                                    elm.setSelectionRange(pos, pos);
                                }
                                undobuffer[undopoint] = elm.value
                                modifyCode = 0;
                                break;

                            case 120: // x
                                lastcommand = "delete_character";
                                keybuffer = "";
                                var val = elm.value;
                                ch = val.substr(pos, 1);
                                code = ch.charCodeAt(0);
                                if (code != 10) {
                                    if (++undopoint == MAXUNDO) {
                                        undopoint = 0;
                                    }
                                    undonew = undopoint;
                                    if (undopoint == undotop) {
                                        if (++undotop == MAXUNDO) {
                                            undotop = 0;
                                        }
                                    }
                                    setElementValue(this, val.substr(0, pos) + val.substr(pos + 1, val.length));
                                    elm.setSelectionRange(pos, pos);
                                    undobuffer[undopoint] = elm.value;
                                }
                                modifyCode = 0;
                                break;

                            case 74: // J shift+j
                                editstartpos = pos;
                                lastcommand = "joinline";
                                if (++undopoint == MAXUNDO) {
                                    undopoint = 0;
                                }
                                undonew = undopoint;
                                if (undopoint == undotop) {
                                    if (++undotop == MAXUNDO) {
                                        undotop = 0;
                                    }
                                }
                                var val = elm.value;
                                var lineend = pos - tl.currLineText.length + tl.currLineTextAll.length;
                                setElementValue(this, val.substr(0, lineend) + ' ' + val.substr(lineend + 1, val.length));
                                elm.setSelectionRange(lineend, lineend);
                                undobuffer[undopoint] = elm.value;
                                modifyCode = 0;
                                break;

                            case 117: // u
                                if (undopoint != undotop) {
                                    if (--undopoint < 0) {
                                        undopoint = MAXUNDO - 1;
                                    }
                                    var str = undobuffer[undopoint];
                                    if (str != undefined) {
                                        setElementValue(this, str);
                                        elm.setSelectionRange(pos, pos);
                                    } else {
                                        if (++undopoint == MAXUNDO) {
                                            undopoint = 0;
                                        }
                                    }
                                } else {
                                    var str = undobuffer[undopoint];
                                    setElementValue(this, str);
                                    elm.setSelectionRange(pos, pos);
                                }
                                modifyCode = 0;
                                break;

                            case 18: // ctrl+r
                                if (undopoint != undonew) {
                                    if (++undopoint == MAXUNDO) {
                                        undopoint = 0;
                                    }
                                    setElementValue(this, undobuffer[undopoint]);
                                    elm.setSelectionRange(pos, pos);
                                }
                                prevKey = 17;
                                modifyCode = 0;
                                break;

                        }
                        break;
                    }

                    // コマンドモード ##########################################################
                    case "command":
                        e.preventDefault();
                        break;
            }

            tl = getLineText(this);
            if (e.keyCode != 0 && (startLine + (vline - 1) - bottommargin) < tl.vcurrLine) {
                startLine = tl.vcurrLine - ((vline - 1) - bottommargin);
                if (startLine < 0) {
                    startLine = 0;
                }
                var startPos = startLine * parseFloat(jQuery(this).css("line-height"));
                jQuery(this).scrollTop(startPos);
            }
            if (e.keyCode != 0 && (startLine + topmargin) > tl.vcurrLine) {
                startLine = tl.vcurrLine - topmargin;
                if (startLine < 0) {
                    startLine = 0;
                }
                var startPos = startLine * parseFloat(jQuery(this).css("line-height"));
                jQuery(this).scrollTop(startPos);
            }
        });
        return this;
    }

    var setElementValue = function(object, text) {
        jQuery(object).val(text)
    }

    var getLineText = function(object) {
        var textAreaElement = jQuery(object)[0];
        textAreaElement.selectionStart = 0;
        var sel = document.getSelection() + "";
        textAreaElement.selectionStart = textAreaElement.selectionEnd;
        var retvalue = [];

        var lines = sel.split("\n");
        var width = parseInt(jQuery(object).css('width'));
        var size = parseInt(jQuery(object).css('line-height'));
        var hchar = Math.floor(width / size) * 2;
        var llength = 0;
        for (var i = 0; i < lines.length; i++) {
            var l = lines[i];
            var ladd = Math.ceil(l.length / hchar) - 1
            if (ladd < 0) {
                ladd = 0;
            };
            llength += ladd;
        }

        var alllines = jQuery(object).val().split("\n");
        var allllength = 0;
        for (var i = 0; i < alllines.length; i++) {
            var l = alllines[i];
            var ladd = Math.ceil(l.length / hchar) - 1
            if (ladd < 0) {
                ladd = 0;
            };
            allllength += ladd;
        }

        retvalue['currLine'] = lines.length - 1;
        retvalue['maxLine'] = alllines.length - 1;
        retvalue['vcurrLine'] = lines.length + llength - 1;
        retvalue['vmaxLine'] = alllines.length + allllength - 1;
        retvalue['prevLineText'] = lines[retvalue.currLine - 1];
        retvalue['currLineText'] = lines[retvalue.currLine];
        retvalue['currLineTextAll'] = alllines[retvalue.currLine];
        retvalue['nextLineText'] = alllines[retvalue.currLine + 1];
        retvalue['allLines'] = alllines;
        return retvalue;
    }

})(jQuery);

