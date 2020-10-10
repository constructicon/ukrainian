// with this we make js less forgiving so that we catch
// more hidden errors during development
'use strict';


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


var app = new Vue({
    el: '#app',
    data: {
        all_data_loaded: false,
        current_record_number: null,
        record_numbers: [],
        record_numbers_random_selection: [],
        record_numbers_matching_search: [],
        records: {},
        daily_dose_level: 'A1',
        search_string_names: '',
        search_string_illustrations: '',
        levels: []
    },
    created: function() {
        fetch_data(this, 'https://raw.githubusercontent.com/constructicon/russian-data/46cc47cfcf6862b21c2dc5fc990c7b16eac8568f/');

        // https://lodash.com/docs#debounce
        this.debounced_search = _.debounce(this.search, 500);
    },
    watch: {
        search_string_names: function(new_string, old_string) {
            this.debounced_search()
        },
        search_string_illustrations: function(new_string, old_string) {
            this.debounced_search()
        }
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
        get_random_selection: function() {
            var records_with_this_level = [];
            for (var record_number of this.record_numbers) {
                if (this.records[record_number].cefr_level == this.daily_dose_level) {
                    records_with_this_level.push(record_number);
                }
            }
            var selected = random_selection(records_with_this_level, 2);
            selected.sort();
            this.record_numbers_random_selection = selected;
        }
    }
})
