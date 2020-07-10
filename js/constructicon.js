// with this we make js less forgiving so that we catch
// more hidden errors during development
'use strict';


axios.get('https://raw.githubusercontent.com/bast/constructicon/gh-pages/data/example.yml')
    .then(function(response) {
        var doc = jsyaml.load(response.data);
        console.log(doc);
    });
