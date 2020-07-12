// with this we make js less forgiving so that we catch
// more hidden errors during development
'use strict';


async function add_data(data, url_prefix) {
    var arr = [];
    for (var record of ['0003', '0112', '0117']) {
        arr.push(axios.get(url_prefix + record + '.yml'));
    }
    let responses = await axios.all(arr);

    var records = {};
    for (var response of responses) {
        var json_data = jsyaml.load(response.data);
        records[json_data.record] = json_data;
    }
    data.records = records;
    data.all_data_loaded = true;
}


var app = new Vue({
    el: '#app',
    data: {
        all_data_loaded: false,
        records: {}
    },
    created: function() {
        add_data(this, 'https://raw.githubusercontent.com/bast/constructicon/1cea1189525a77aac88ae77ae8e197556965bbb8/data/');
    },
    methods: {
        // for x={'this': 'that'} returns 'this'
        key: function(x) {
            return Object.keys(x)[0];
        },
        // for x={'this': 'that'} returns 'that'
        value: function(x) {
            return x[Object.keys(x)[0]];
        }
    }
})
