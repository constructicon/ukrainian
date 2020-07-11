// with this we make js less forgiving so that we catch
// more hidden errors during development
'use strict';


async function add_data(data, url_prefix) {
    var arr = [];
    for (var record of ['0112', '0117']) {
        arr.push(axios.get(url_prefix + record + '.yml'));
    }
    let responses = await axios.all(arr);

    var records = {};
    for (var response of responses) {
        var json_data = jsyaml.load(response.data);
        records[json_data.record] = json_data;
    }
    data.records = records;
}


var app = new Vue({
    el: '#app',
    data: {
        all_data_loaded: false,
        records: {}
    },
    created: function() {
        add_data(this, 'https://raw.githubusercontent.com/bast/constructicon/1cea1189525a77aac88ae77ae8e197556965bbb8/data/');
        this.all_data_loaded = true;
    }
})