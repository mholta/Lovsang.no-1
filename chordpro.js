/*
 * Copyright (c) 2020 David Gulaker <dgulaker@hotmail.com>
 * Copyright (c) 2014-16 Greg Schoppe <gschoppe@gmail.com>
 * Copyright (c) 2011 Jonathan Perkin <jonathan@perkin.org.uk>
 * 
 * 
 * Permission to use, copy, modify, and distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

 //


/* Parse a ChordPro template */
function parseChordPro(template, key, mode=0, transpose=false) { //modes: 0 transpose, 1 lyrics only, 2 nashville cheat, 3 nashville clean
	const validModes = [0,1,2,3];
	if (validModes.indexOf(mode)==-1){
		mode = 0;
	}
	
	const all_keys = ["A", "Bb", "B", "Cb", "C", "C#", "Db", "D", "Eb", "E", "F", "F#", "Gb", "G", "Ab"];
	const sep_keys = [["A", "Bb", "B", "C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab"],["A", "Bb", "Cb", "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab"]];
	const sep_keys_C = [["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"],["C", "Db", "D", "Eb", "E","F", "Gb", "G", "Ab","A", "Bb", "Cb"]];
	const notes = [['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'], ['A', 'Bb', 'Cb', 'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab']];
	const nashville_cheats = ["2</span>m", "3</span>m", "6</span>m", "7</span>dim"]
	var chordregex= /\[([^\]]*)\]/;
	var inword    = /[a-z]$/;
	var buffer    = [];
	var chords    = [];
	var last_was_lyric = false;
	var is_bkey = function(k){
		const bkey = [false, true, false, true, false, false, true, false, true, false, true, false, true, false, true];
		return bkey[all_keys.indexOf(k)];
	}
	var transposed_key = function(k, transp){
		const value = [0, 1, 2, 2, 3, 4, 4, 5, 6, 7, 8, 9, 9, 10, 11];
		var key_value = value[all_keys.indexOf(k)]+transp;
		while(key_value<1) key_value+=12;
		while(key_value>12) key_value-=12;
		return sep_keys[is_bkey(k)?1:0][key_value];
	}
	var transpose_chord = function(chord, trans, use_b) {
		var regex = /([A-Z][b#]?)/g;
		var modulo = function(n, m) {
				return ((n % m) + m) % m;
		}
		return chord.replace( regex, function( $1 ) {
			/**if( $1.length > 1 && $1[1] == 'b' ) {
				if( $1[0] == 'A' ) {
					$1 = "G#";
				} else {
					$1 = String.fromCharCode($1[0].charCodeAt() - 1) + '#';
				}
			}**/
			var index = notes[0].indexOf( $1 );
			if( index == -1 ) index = notes[1].indexOf( $1 );
			if( index != -1 ) {
				index = modulo( ( index + trans ), notes[0].length );
				return notes[use_b?1:0][index];
			}
			return 'XX';
		});
	}
	var nashville_chord = function(chord, mode){
		var regex = /([A-Z][b#]?)/g;
		var new_chord = chord.replace( regex, function( $1 ) {
			return ($1.charCodeAt()-4)%7+1;
		});
		if(mode==3) nashville_cheats.forEach(function(cheat){
				new_chord=new_chord.replace(new RegExp(cheat,"g"), cheat[0]+"</span>");
			});
		return new_chord;
	}

	var wrap_chord = function(chord, mode){
		var regex = /(\/?[A-Z][b#]?)/g;
		if(mode==2||mode==3){
			return chord.replace(regex, function( $1 ) {
				return "<span class='cp-chord-base'>" + $1 + "</span>";
			});
		}
		return "<span class='cp-chord-base'>" + chord + "</span>";
	}
	template = template.trim();
	if (!template) return "";
	var transposed_is_b = is_bkey(transposed_key(key, transpose));
	var passed_blank_line = false;
	var passed_first_section = false;
	var in_lyric_block = false;
	if(mode==2 || mode==3){
		transpose = sep_keys_C[sep_keys_C[0].indexOf(key.substring(0,2)) == -1?1:0].indexOf(key.substring(0,2));
		transposed_is_b=false;
		if (transpose == -1) transpose = sep_keys_C[sep_keys_C[0].indexOf(key[0]) == -1?1:0].indexOf(key[0]);
		if (transpose == -1){
			console.log("Nashville convert key error");
		} else {
			transpose = -transpose;
		}
	}
	template.split("\n").forEach(function(line, linenum) {
		line = line.trim();
		if (!passed_blank_line){
			if (line.length==0){
				passed_blank_line = true;
			}
			return "";
		}
		/* Comment, ignore */
		if (line.match(/^#/)) {
			return "";
		}
		if (line.charAt(line.length-1)==":"){
			if(in_lyric_block){
				buffer.push('</div>');
				in_lyric_block = false;
			}
			if(passed_first_section) buffer.push('</div>');
			else passed_first_section = true;
			buffer.push('<div class="cp-section"><span class="cp-heading">'+line+'</span><br>');
			return "";
		}
		/* Chord line */
		if (line.match(chordregex)) {
			if( !in_lyric_block ) {
				buffer.push('<div class="lyric_block">');
				last_was_lyric = true;
				in_lyric_block = true;
			} else if( !last_was_lyric ) {
				buffer.push('</div><div class="lyric_block">');
				last_was_lyric = true;
			}
			var chords = "";
			var lyrics = "";
			var chordlen = 0;
			line.split(chordregex).forEach(function(word, pos) {
				var dash = 0;
				/* Lyrics */
				if ((pos % 2) == 0) {
					lyrics = lyrics + word.replace(' ', "&nbsp;");
				  /*
				   * Whether or not to add a dash (within a word)
				   */
					if (word.match(this.inword)) {
						dash = 1;
					}
				  /*
				   * Apply padding.  We never want two chords directly adjacent,
				   * so unconditionally add an extra space.
				   */
				   	if (mode==1) {
					} else if (word && word.length < chordlen) {
						chords = chords + "&nbsp;";
						lyrics = (dash == 1) ? lyrics + "-&nbsp;" : lyrics + "&nbsp&nbsp;";
						for (i = chordlen - word.length - dash; i != 0; i--) {
							lyrics = lyrics + "&nbsp;";
						}
					} else if (word && word.length == chordlen) {
						chords = chords + "&nbsp;";
						lyrics = (dash == 1) ? lyrics + "-" : lyrics + "&nbsp;";
					} else if (word && word.length > chordlen) {
						for (i = word.length - chordlen; i != 0; i--) {
							chords = chords + "&nbsp;";
						}
					}
				} else {
					/* Chords */
					chord = word.replace(/[[]]/, "");
					if(transpose !== false) chord = transpose_chord(chord, transpose, transposed_is_b);
					wrapped_chord = wrap_chord(chord, mode);
					if(mode==2 || mode==3) wrapped_chord = nashville_chord(wrapped_chord, mode);
					chordlen = chord.length;
					chords = chords + '<span class="chord" data-original-val="' + chord + '">' + wrapped_chord + '</span>';
				}
			}, this);
			buffer.push('<span class="line">');
			if(mode!=1) buffer.push(chords + "<br/>\n");
			buffer.push(lyrics + "</span><br/>");
			return;
		}
		/* Commands, ignored for now */
		if (line.match(/^{.*}/)) {
			if( !buffer.length ) {
				buffer.push('<div class="command_block">');
				last_was_lyric = false;
			} else if( last_was_lyric ) {
				buffer.push('</div><div class="command_block">');
				last_was_lyric = false;
			}
			//ADD COMMAND PARSING HERE
			//reference: http://tenbyten.com/software/songsgen/help/HtmlHelp/files_reference.htm
			// implement basic formatted text commands
			var matches = line.match(/^{(title|t|subtitle|st|comment|c):\s*(.*)}/, "i");
			if( matches.length >= 3 ) {
				var command = matches[1];
				var text = matches[2];
				var wrap="";
				//add more non-wrapping commands with this switch
				switch( command ) {
					case "title":
					case "t":
						command = "title";
						wrap = "h1";
						break;
					case "subtitle":
					case "st":
						command = "subtitle";
						wrap = "h4";
						break;
					case "comment":
					case "c":
						command = "comment";
						wrap    = "em";
						break;
				}
				if( wrap ) {
					buffer.push('<' + wrap + ' class="' + command + '">' + text + '</' + wrap + '>' );
				}
			}
			// work from here to add wrapping commands
			return;
		}
		/* Anything else */
		buffer.push(line + "<br/>");
	}, this);
	if(passed_first_section){
		buffer.push("</div>")
	}
	return buffer.join("\n");
}