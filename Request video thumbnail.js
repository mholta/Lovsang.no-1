function parseVidURL (url) {
    // - Supported YouTube URL formats:
    //   - http://www.youtube.com/watch?v=My2FRPA3Gf8
    //   - http://youtu.be/My2FRPA3Gf8
    //   - https://youtube.googleapis.com/v/My2FRPA3Gf8
    //   - https://m.youtube.com/watch?v=My2FRPA3Gf8
    // - Supported Vimeo URL formats:
    //   - http://vimeo.com/25451551
    //   - http://player.vimeo.com/video/25451551
    // - Also supports relative URLs:
    //   - //player.vimeo.com/video/25451551

    url.match(/(http:|https:|)\/\/(player.|www.|m.)?(vimeo\.com|youtu(be\.com|\.be|be\.googleapis\.com))\/(video\/|embed\/|watch\?v=|v\/)?([A-Za-z0-9._%-]*)(\&\S+)?/);

    if (RegExp.$3.indexOf('youtu') > -1) {
        var type = 'youtube';
    } else if (RegExp.$3.indexOf('vimeo') > -1) {
        var type = 'vimeo';
    }

    return {
        type: type,
        id: RegExp.$6
    };
}

function setThumbSRC(url, elem) {
  var videoDetails = parseVidURL(url);
  var videoType = videoDetails.type;
  var videoID = videoDetails.id;
  var thumbSRC = '';
  
  if (videoType == 'youtube') {
    thumbSRC = 'https://img.youtube.com/vi/' + videoID + '/maxresdefault.jpg';
    elem.setAttribute("style", "background-image: url('" + thumbSRC + "')");
  }
  else if (videoType == 'vimeo') {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://vimeo.com/api/v2/video/"+ videoID +".json", true);
    xhr.onload = function (e) {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          var data = xhr.responseText;
          var parsedData = JSON.parse(data);
          thumbSRC = parsedData[0].thumbnail_large;
          elem.setAttribute("style", "background-image: url('" + thumbSRC + "')");
        }
        else {
          console.error('Thumb fetch: ' + xhr.statusText + ' \(' + url +'\)');
        }
      }
    }
    xhr.onerror = function (e) {
      img.classList.add('vid-thumb-blank');
      console.error('Thumb fetch: ' + xhr.statusText);
    }
    xhr.send(null);
  }
}

function getVidThumbs() {
  var elements = document.querySelectorAll('[data-vid-src]')
  if (elements != null) {
    for (var i = 0; i < elements.length; i++) {
      var elem = elements[i];
      var src = elem.getAttribute("data-vid-src");
      setThumbSRC(src, elem);
    };
  };
};
