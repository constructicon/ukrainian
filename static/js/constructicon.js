// with this we make js less forgiving so that we catch
// more hidden errors during development
'use strict';


function build_search_index(record_numbers, records, keys) {
    var search_index = new JsSearch.Search('record');
    for (var key of keys) {
        search_index.addIndex(key);
    }
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
    data.syntactic_function_of_construction_tree = build_tree_for_advanced_search(data.record_numbers, data.records, 'syntactic_function_of_construction');
    data.syntactic_function_of_anchor_tree = build_tree_for_advanced_search(data.record_numbers, data.records, 'syntactic_function_of_anchor');
    data.syntactic_structure_of_anchor_tree = build_tree_for_advanced_search(data.record_numbers, data.records, 'syntactic_structure_of_anchor');
    data.part_of_speech_of_anchor_tree = build_tree_for_advanced_search(data.record_numbers, data.records, 'part_of_speech_of_anchor');

    var keys = ['semantic_roles', 'morphology', 'syntactic_function_of_construction', 'syntactic_function_of_anchor', 'syntactic_structure_of_anchor', 'part_of_speech_of_anchor'];
    data.search_index_advanced = build_search_index(data.record_numbers, data.records, keys);

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
        search_index_advanced: null,
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
        syntactic_function_of_construction_tree: [],
        syntactic_function_of_construction_selected: null,
        syntactic_function_of_anchor_tree: [],
        syntactic_function_of_anchor_selected: null,
        syntactic_structure_of_anchor_tree: [],
        syntactic_structure_of_anchor_selected: null,
        part_of_speech_of_anchor_tree: [],
        part_of_speech_of_anchor_selected: null,
    },
    created: function() {
        fetch_data(this, 'https://raw.githubusercontent.com/constructicon/russian-data/master/');

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
        syntactic_function_of_construction_selected: function(new_, old_) {
            this.advanced_search_debounced();
        },
        syntactic_function_of_anchor_selected: function(new_, old_) {
            this.advanced_search_debounced();
        },
        syntactic_structure_of_anchor_selected: function(new_, old_) {
            this.advanced_search_debounced();
        },
        part_of_speech_of_anchor_selected: function(new_, old_) {
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
            l = l.concat(this.syntactic_function_of_construction_selected);
            l = l.concat(this.syntactic_function_of_anchor_selected);
            l = l.concat(this.syntactic_structure_of_anchor_selected);
            l = l.concat(this.part_of_speech_of_anchor_selected);

            var search_string = '"' + l.join('" "') + '"';
            for (var result of this.search_index_advanced.search(search_string)) {
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
