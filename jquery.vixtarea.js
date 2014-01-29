// 2キー処理ではないキーの各処理の最後にmodifyCode=0を入れておくこと。
(function($) {
	$.fn.vixtarea = function(options){
       var options = jQuery.extend({
			size: '14px',
			color: 'black',
			backgroundColor: 'white',
			method: undefined
        }, options);

		var permitKeyCode = [186, 191, 65, 79, 68, 73, 88, 85, 82, 90, 72, 74, 75, 76, 89, 71, 82, 52, 54, 80, 77, 222];

		var MAXUNDO = 256 + 1;

		var mode = "view";
		var modifyCode = 0;
		var undobuffer = [this.val()];
		var undopoint = 0;
		var undotop = 0;
		var undonew = 0;
		var prevKey = 0;
		var yankbuffer = "";
		var horizontal = 0;
		var memoryline = [];

		this.css("font-size", options.size);
		this.css("line-height", options.size);
		this.css("font-family", "Osaka-Mono");
		this.css("color", options.color);
		this.css("background-color", options.backgroundColor);

		// keyup ######################################################################################################
		this.keyup(function(e) {
			if (prevKey == 17 && e.keyCode == 17) {
				prevKey = 0;
			} else if (prevKey == 17) {
				prevKey = 17;
			}
			//console.log("prevKey="+prevKey+", keyup:"+e.keyCode);
		});

		// keydown ######################################################################################################
		this.keydown(function(e) {
			var elm = e.target;
			//console.log("keydown="+e.keyCode);
			switch (mode) {
				case "view":
					permit = permitKeyCode.indexOf(e.keyCode);
					if (permit == -1 && modifyCode != 109 && modifyCode != 222) {
						//console.log("preventDefault:"+e.keyCode);
						e.preventDefault();
					}

					if (e.keyCode == 222 || e.keyCode == 77) {
						modifyCode = e.keyCode;
					}

					if (prevKey == 17 && (e.keyCode != 82)) {
						e.preventDefault();
						prevKey = 17;
					} else {
						prevKey = e.keyCode;
					}
					break;

				// 編集モード ##############################################################
				case "edit":
					if (e.keyCode === 9) { // TAB
						//console.log("tab");
						e.preventDefault();
						var val = elm.value;
						var pos = elm.selectionStart;
						elm.value = val.substr(0, pos) + '\t' + val.substr(pos, val.length);
						elm.setSelectionRange(pos + 1, pos + 1);
					}

					break;

				case "command":
					break;
			}
			if (e.keyCode == 27 && (mode == "edit" || mode == "command")) {
				modifyCode = 0;
				switch (mode) {
					case "edit":
						undopoint++;
						if (undopoint == MAXUNDO) {
							undopoint = 0;
						}
						undonew = undopoint;
						if (undopoint == undotop) {
							undotop++;
							if (undotop == MAXUNDO) {
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
						break;
				}
				mode = "view";
			}
		});
	
		// keypress ######################################################################################################
		this.keypress(function(e) {
			//console.log("keypress="+e.keyCode);
			var elm = e.target;
			switch (mode) {
				case "view":
					e.preventDefault();
					var pos = elm.selectionStart;
					// 行記憶
					if (modifyCode == 109 && e.keyCode >= 97 && e.keyCode <= 122) {
						tl = getLineText(this);
						memoryline[e.keyCode] = {pos: pos - tl.currLineText.length, line: tl.currLine};
						modifyCode = 0;
						e.keyCode = 0;
					}
					// 行復帰
					if (modifyCode == 222 && e.keyCode >= 97 && e.keyCode <= 122) {
						if (memoryline[e.keyCode] != undefined) {
							linenum = memoryline[e.keyCode].line - 5;
							if (linenum < 0) {
								linenum = 0;
							}
							jump = memoryline[e.keyCode].pos;
							elm.setSelectionRange(jump, jump);
							currpos = linenum * parseFloat(jQuery(this).css("line-height"));
							jQuery(this).scrollTop(currpos);
							modifyCode = 0;
							e.keyCode = 0;
						}
					}
					switch (e.keyCode) {
						// エディター操作 ##################################################

						case 104: // h
							elm.focus();
							var tl = getLineText(this);
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
							var tl = getLineText(this);
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
							var tl = getLineText(this);
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
							var tl = getLineText(this);
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

						case 58: // :
							mode = "command";
							modifyCode = 0;
							break;

						case 109: // m
							modifyCode = e.keyCode;
							break;

						// 編集操作 #########################################################

						case 105: // i
							mode = "edit";
							modifyCode = 0;
							break;

						case 97: // a
							mode = "edit";
							elm.setSelectionRange(pos+1, pos+1);
							modifyCode = 0;
							break;

						case 111: // o
							mode = "edit";
							var tl = getLineText(this);
							var nl = pos - tl.currLineText.length + tl.currLineTextAll.length + 1;
							var val = elm.value;
							elm.value = val.substr(0, nl) + '\n' + val.substr(nl, val.length);
							elm.setSelectionRange(nl, nl);
							modifyCode = 0;
							break;

						case 79: // O
							mode = "edit";
							var tl = getLineText(this);
							var nl = pos - tl.currLineText.length;
							var val = elm.value;
							elm.value = val.substr(0, nl) + '\n' + val.substr(nl, val.length);
							elm.setSelectionRange(nl, nl);
							modifyCode = 0;
							break;

						case 121: // y
							if (modifyCode == 121) {
								modifyCode = 0;
								var tl = getLineText(this);
								var val = elm.value;
								yankbuffer = val.substr(pos - tl.currLineText.length, tl.currLineTextAll.length + 1);
							} else {
								modifyCode = e.keyCode;
							}
							break;

						case 100: // dd
							if (modifyCode == 100) {
								modifyCode = 0;
								undopoint++;
								if (undopoint == MAXUNDO) {
									undopoint = 0;
								}
								undonew = undopoint;
								if (undopoint == undotop) {
									undotop++;
									if (undotop == MAXUNDO) {
										undotop = 0;
									}
								}
								var tl = getLineText(this);
								var nl = pos - tl.currLineText.length;
								var nl2 = pos - tl.currLineText.length + tl.currLineTextAll.length + 1;
								var val = elm.value;
								yankbuffer = val.substr(pos - tl.currLineText.length, tl.currLineTextAll.length + 1);
								elm.value = val.substr(0, nl) + val.substr(nl2, val.length);
								elm.setSelectionRange(nl, nl);
								undobuffer[undopoint] = elm.value
							} else {
								modifyCode = e.keyCode;
							}
							break;

						case 112: // p
							e.preventDefault();
							undopoint++;
							if (undopoint == MAXUNDO) {
								undopoint = 0;
							}
							undonew = undopoint;
							if (undopoint == undotop) {
								undotop++;
								if (undotop == MAXUNDO) {
									undotop = 0;
								}
							}
							var tl = getLineText(this);
							var val = elm.value;
							var nl = pos - tl.currLineText.length + tl.currLineTextAll.length + 1;
							elm.value = val.substr(0, nl) + yankbuffer + val.substr(nl, val.length);
							elm.setSelectionRange(nl, nl);
							undobuffer[undopoint] = elm.value
							modifyCode = 0;
							break;

						case 80: // P
							e.preventDefault();
							undopoint++;
							if (undopoint == MAXUNDO) {
								undopoint = 0;
							}
							undonew = undopoint;
							if (undopoint == undotop) {
								undotop++;
								if (undotop == MAXUNDO) {
									undotop = 0;
								}
							}
							var val = elm.value;
							var tl = getLineText(this);
							toppos = pos - tl.currLineText.length;
							elm.value = val.substr(0, toppos) + yankbuffer + val.substr(toppos, val.length);
							elm.setSelectionRange(toppos, toppos);
							undobuffer[undopoint] = elm.value
							modifyCode = 0;
							break;

						case 120: // x
							undopoint++;
							if (undopoint == MAXUNDO) {
								undopoint = 0;
							}
							undonew = undopoint;
							if (undopoint == undotop) {
								undotop++;
								if (undotop == MAXUNDO) {
									undotop = 0;
								}
							}
							var val = elm.value;
							elm.value = val.substr(0, pos) + val.substr(pos + 1, val.length);
							elm.setSelectionRange(pos, pos);
							undobuffer[undopoint] = elm.value;
							modifyCode = 0;
							break;

						case 103: // g
							if (modifyCode == 103) {
								modifyCode = 0;
								elm.setSelectionRange(0, 0);
							} else {
								modifyCode = 103;
							}
							break;

						case 71: // shift+g
							pos = elm.value.length;
							elm.setSelectionRange(pos, pos);
							modifyCode = 0;
							break;

						case 117: // u
							if (undopoint != undotop) {
								if (--undopoint < 0) {
									undopoint = MAXUNDO - 1;
								}
								var str = undobuffer[undopoint];
								if (str != undefined) {
									elm.value = str;
									elm.setSelectionRange(pos, pos);
								} else {
									if (++undopoint == MAXUNDO) {
										undopoint = 0;
									}
								}
							}
							modifyCode = 0;
							break;

						case 18: // ctrl+r
							if (undopoint != undonew) {
								if (++undopoint == MAXUNDO) {
									undopoint = 0;
								}
								elm.value = undobuffer[undopoint];
								elm.setSelectionRange(pos, pos);
							}
							modifyCode = 0;
							break;

						case 36: // shift+4
							tl = getLineText(this);
							var nl = pos + tl.currLineTextAll.length - tl.currLineText.length;
							elm.setSelectionRange(nl, nl);
							modifyCode = 0;
							break;

						case 94: // shift+6
							tl = getLineText(this);
							var nl = pos - tl.currLineText.length;
							elm.setSelectionRange(nl, nl);
							modifyCode = 0;
							break;
							
					}
					break;

				// コマンドモード ##########################################################
				case "command":
					e.preventDefault();
					break;
			}

			if (e.keyCode != 0) {
				var tl = getLineText(this);
				var currLine = tl.currLine - 5;
				if (currLine < 0) {
					currLine = 0;
				}
				currpos = currLine * parseFloat(jQuery(this).css("line-height"));
				jQuery(this).scrollTop(currpos);
			}
		});
		return this;
	}

	var getLineText = function(object) {
		var textAreaElement = jQuery(object)[0];
		textAreaElement.selectionStart = 0;
		var sel = document.getSelection() + "";
		textAreaElement.selectionStart = textAreaElement.selectionEnd;
		var retvalue = [];
		var lines = sel.split("\n");
		var alllines = jQuery(object).val().split("\n");
		retvalue['currLine'] = lines.length - 1;
		retvalue['maxLine'] = alllines.length - 1;
		retvalue['prevLineText'] = lines[retvalue.currLine - 1];
		retvalue['currLineText'] = lines[retvalue.currLine];
		retvalue['currLineTextAll'] = alllines[retvalue.currLine];
		retvalue['nextLineText'] = alllines[retvalue.currLine + 1];
		return retvalue;
	}

})(jQuery);

