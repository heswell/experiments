'use strict';

export function getJSON(url, callback){

    var json;

    var xhr = new XMLHttpRequest();
     xhr.onreadystatechange = function() {
        if(xhr.readyState === 4){
            // TODO create a custom reader for the JSON, which can supply defaults etc
            var json = JSON.parse(xhr.responseText); 
            callback(json);
        }
    };
    
    xhr.open("GET", url, true);
    xhr.send(null);       

}

