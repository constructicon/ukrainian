// with this we make js less forgiving so that we catch
// more hidden errors during development
'use strict';


function build_search_index(record_numbers, records) {
    var search_index = new JsSearch.Search('record');
    search_index.addIndex('semantic_roles');
    search_index.addIndex('morphology');
    for (var record_number of record_numbers) {
        search_index.addDocuments([records[record_number]]);
    }
    return search_index;
}


function build_tree_for_advanced_search(record_numbers, records, key) {
    var s = new Set();
    for (var record_number of record_numbers) {
        for (var element of records[record_number][key]) {
            s.add(element);
        }
    }

    var tree = [];
    for (var element of Array.from(s)) {
        tree.push({
            id: element,
            label: element
        });
    }

    return tree;
}


async function fetch_data(data, url_prefix) {
    var arr = [];
    for (var record of ['0003', '0013', '0017', '0112', '0117', '0165', '0166', '0231', '0270', '0338']) {
        arr.push(axios.get(url_prefix + record + '.yml'));
    }
    let responses = await axios.all(arr);

    var records = {};
    var record_numbers = [];
    var levels = new Set();

    for (var response of responses) {
        var json_data = jsyaml.load(response.data);
        records[json_data.record] = json_data;
        record_numbers.push(json_data.record);
        levels.add(json_data.cefr_level);
    }

    data.records = records;
    data.record_numbers = record_numbers;

    data.levels = Array.from(levels);
    data.levels.sort();

    data.semantic_roles_tree = build_tree_for_advanced_search(data.record_numbers, data.records, 'semantic_roles');
    data.morphology_tree = build_tree_for_advanced_search(data.record_numbers, data.records, 'morphology');

    data.search_index = build_search_index(data.record_numbers, data.records);

    data.all_data_loaded = true;
}


// based on https://stackoverflow.com/a/19270021 (CC-BY-SA 3.0)
function random_selection(arr, n_max) {
    var len = arr.length;
    var n = Math.min(n_max, len);
    var result = new Array(n);
    var taken = new Array(len);
    while (n--) {
        var x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
}


Vue.component('treeselect', VueTreeselect.Treeselect);


var app = new Vue({
    el: '#app',
    delimiters: ['{[', ']}'],
    data: {
        search_index: null,
        all_data_loaded: false,
        current_record_number: null,
        record_numbers: [],
        record_numbers_matching_search: [],
        records: {},
        daily_dose_level: 'A1',
        search_string_names: '',
        search_string_illustrations: '',
        levels: [],
        semantic_roles_tree: [],
        semantic_roles_selected: null,
        morphology_tree: [],
        morphology_selected: null,
    },
    created: function() {
        fetch_data(this, 'https://raw.githubusercontent.com/constructicon/russian-data/46cc47cfcf6862b21c2dc5fc990c7b16eac8568f/');

        // https://lodash.com/docs#debounce
        this.search_debounced = _.debounce(this.search, 500);
        this.advanced_search_debounced = _.debounce(this.advanced_search, 500);
    },
    watch: {
        search_string_names: function(new_, old_) {
            this.search_debounced();
        },
        search_string_illustrations: function(new_, old_) {
            this.search_debounced();
        },
        semantic_roles_selected: function(new_, old_) {
            this.advanced_search_debounced();
        },
        morphology_selected: function(new_, old_) {
            this.advanced_search_debounced();
        },
    },
    methods: {
        // for x={'this': 'that'} returns 'this'
        key: function(x) {
            return Object.keys(x)[0];
        },
        // for x={'this': 'that'} returns 'that'
        value: function(x) {
            return x[Object.keys(x)[0]];
        },
        search: function() {
            var record_numbers_matching_search = [];
            if (this.search_string_names != '' || this.search_string_illustrations != '') {
                var search_string_names_re = new RegExp(this.search_string_names.toLowerCase());
                var search_string_illustrations_re = new RegExp(this.search_string_illustrations.toLowerCase());
                for (var record_number of this.record_numbers) {
                    if (search_string_names_re.test(this.records[record_number].name.toLowerCase())) {
                        if (search_string_illustrations_re.test(this.records[record_number].illustration.toLowerCase())) {
                            record_numbers_matching_search.push(record_number);
                        }
                    }
                }
            }
            this.record_numbers_matching_search = record_numbers_matching_search;
        },
        advanced_search: function() {
            var record_numbers_matching_search = [];
            var l = [];
            l = l.concat(this.semantic_roles_selected);
            l = l.concat(this.morphology_selected);

            var search_string = '"' + l.join('" "') + '"';
            for (var result of this.search_index.search(search_string)) {
                record_numbers_matching_search.push(result.record);
            }
            this.record_numbers_matching_search = record_numbers_matching_search;
        },
        get_random_selection: function() {
            console.log("raooooofff!", this.daily_dose_level);
            var records_with_this_level = [];
            for (var record_number of this.record_numbers) {
                if (this.records[record_number].cefr_level == this.daily_dose_level) {
                    records_with_this_level.push(record_number);
                }
            }
            var selected = random_selection(records_with_this_level, 2);
            selected.sort();
            this.record_numbers_matching_search = selected;
        }
    }
})
