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
function parseChordPro(template, transpose) {
	if( typeof transpose == "undefined" ) {
		transpose = false;
	}
	var chordregex= /\[([^\]]*)\]/;
	var inword    = /[a-z]$/;
	var buffer    = [];
	var chords    = [];
	var last_was_lyric = false;
	var transpose_chord = function( chord, trans ) {
		var notes = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
		var regex = /([A-Z][b#]?)/g;
		var modulo = function(n, m) {
				return ((n % m) + m) % m;
		}
		return chord.replace( regex, function( $1 ) {
			if( $1.length > 1 && $1[1] == 'b' ) {
				if( $1[0] == 'A' ) {
					$1 = "G#";
				} else {
					$1 = String.fromCharCode($1[0].charCodeAt() - 1) + '#';
				}
			}
			var index = notes.indexOf( $1 );
			if( index != -1 ) {
				index = modulo( ( index + trans ), notes.length );
				return notes[index];
			}
			return 'XX';
		});
	}
	if (!template) return "";

	template.split("\n").forEach(function(line, linenum) {
		/* Comment, ignore */
		if (line.match(/^#/)) {
			return "";
		}
		/* Chord line */
		if (line.match(chordregex)) {
			if( !buffer.length ) {
				buffer.push('<div class="lyric_block">');
				last_was_lyric = true;
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
					if (word && word.length < chordlen) {
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
					if(transpose !== false) {
						chord = transpose_chord(chord, transpose);
					}
					chordlen = chord.length;
					chords = chords + '<span class="chord" data-original-val="' + chord + '">' + chord + '</span>';
				}
			}, this);
			buffer.push('<span class="line">' + chords + "<br/>\n" + lyrics + "</span><br/>");
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
	return buffer.join("\n");
}

function readTextFile(file) {
    var rawFile = new XMLHttpRequest();
    var allText = "";
    rawFile.open("GET", file);
    rawFile.onreadystatechange = function () {
        if(rawFile.readyState === 4) {
            if(rawFile.status === 200 || rawFile.status == 0) {
                allText = rawFile.responseText;
            }
        }
    }
    rawFile.send(null);
    return allText;
}