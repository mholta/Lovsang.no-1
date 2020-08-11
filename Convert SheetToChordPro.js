/*
 * Copyright (c) 2020 Magnus Holta <magnus.holta@gmail.com>
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


// Convert

function convertSheetToChordPro(sheet) {
  const keys = ["A", "Bb", "B", "Cb", "C", "C#", "Db", "D", "Eb", "E", "F", "F#", "Gb", "G", "Ab"];
  var chordLine = "|A   B|   C| ||"; //legge inn sjekk for dette

  var isChord = function(word) {
    var result = false;
    keys.forEach(function(chord, chordIndex) {
      if (word.startsWith(chord)) result = true
      if (word.length > 1 && word.charAt(0).toLowerCase() == word.charAt(1).toLowerCase()) {
        if (word.startsWith("Bb")) result = true
        if (word.startsWith('Aadd')) result = true
        result = false
      }
    })
    return result;
  }
  
  var isChordLine = function (line) {
    var line = line.trim();
    var lineList = line.replace(/ +/g, ' ').split(' ')
    var onlyChords = true
    lineList.forEach(function(word, wordIndex) {
      word = word.replace(/^\|+/g, ''); // Ignore '|'
      if (! isChord(word) && word != '') onlyChords = false;
    })

    if (line.trim() == '') return false
    if (lineList.length == 0) return false
    if (line.charAt(line.length-1) == ":") return false

    return onlyChords;
  }

  var lines = sheet.split("\n")
  var convertedTemplate = ''
  var lastLineWasChords = false
  var mergedWithNextLine = false

  lines.forEach(function(line, lineIndex) {
    var containsDividers = line.match(/\|+/g) ? true : false
    var nextLine = lines[lineIndex + 1]? lines[lineIndex + 1] : '';
    if (isChordLine(line)) {
      if (nextLine.trim() != '' && ! isChordLine(nextLine)) {
        chordList = line.trim().replace(/ +/g, ' ').split(' ')
        var textLine = lines[lineIndex + 1]
        var delta = 0
        chordList.forEach(function(chord, chordListIndex) {
          var chordOrigIndex = line.indexOf(chord)
          var chordIndex = chordOrigIndex + delta
          delta += chord.length + 2
          var a = textLine.substring(0, chordIndex)
          var b = textLine.substring(chordIndex)
          var insert = '[' + chord + ']'
          textLine = [a, insert, b].join('')
        })
        convertedTemplate += textLine + '\n'
        lastLineWasChords = true
        mergedWithNextLine = true
        
      }

      // If isChordLine(nextLine)
      // if containsDividers
      // if ! containsDividers

      if (line.trim() != '' && nextLine.trim() == '') {
        chordList = line.trim().replace(/ +/g, ' ').split(' ')

        if (containsDividers) {
          var textLine = line
          var delta = 0
          chordList.forEach(function(chord, chordListIndex) {
            chord = chord.replace(/\|+/g, '')
            var chordOrigIndex = line.indexOf(chord)
            var chordIndex = chordOrigIndex + delta
            delta += chord.length + 1
            var a = textLine.substring(0, chordIndex)
            var b = textLine.substring(chordIndex + chord.length)
            var insert = '[' + chord + ']'
            textLine = [a, insert, b].join('')
          })

          convertedTemplate += textLine + '\n'
          lastLineWasChords = true
          mergedWithNextLine = false
        } 
        else {
          var textLine = ''
          var lastIndex = 0
          var spaces = 0
          var chordIndex = 0
          chordList.forEach(function(chord, chordListIndex) {
            chordIndex = line.indexOf(chord)
            spaces = chordIndex - lastIndex - 1
            textLine += new Array(spaces + 1).join(' ') + '[' + chord + ']'
            lastIndex = chordIndex
          })
          convertedTemplate += textLine + '\n'
          lastLineWasChords = true
          mergedWithNextLine = false
        }
      }
    } 
    else {
      if (line == '') convertedTemplate += '\n'
      else if (! mergedWithNextLine) convertedTemplate += line + '\n'
      else if (! lastLineWasChords) {
        convertedTemplate += line + '\n'
      }
      mergedWithNextLine = false
    }
  })
  return convertedTemplate
}
