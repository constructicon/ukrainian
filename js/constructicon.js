// with this we make js less forgiving so that we catch
// more hidden errors during development
'use strict';


async function add_data(url_prefix) {
    var records = {};

    const responses = await Promise.all([
        axios.get(url_prefix + '0112.yml'),
        axios.get(url_prefix + '0117.yml')
    ]);

    for (var response of responses) {
        var json_data = jsyaml.load(response.data);
        records[json_data.record] = json_data;
    }

    console.log(records);
}


add_data('https://raw.githubusercontent.com/bast/constructicon/1cea1189525a77aac88ae77ae8e197556965bbb8/data/');


var app = new Vue({
    el: '#app',
    data: {
        something: 'anything'
    }
})
