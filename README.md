# Node Cron

[![npm](https://img.shields.io/npm/l/node-cron.svg)](https://github.com/merencia/node-cron/blob/master/LICENSE.md)
[![npm](https://img.shields.io/npm/v/node-cron.svg)](https://img.shields.io/npm/v/node-cron.svg)
[![Coverage Status](https://coveralls.io/repos/github/node-cron/node-cron/badge.svg?branch=master)](https://coveralls.io/github/node-cron/node-cron?branch=master)
[![Code Climate](https://codeclimate.com/github/node-cron/node-cron/badges/gpa.svg)](https://codeclimate.com/github/merencia/node-cron)
[![Build Status](https://travis-ci.org/node-cron/node-cron.svg?branch=master)](https://travis-ci.org/merencia/node-cron)
[![Dependency Status](https://david-dm.org/node-cron/node-cron.svg)](https://david-dm.org/merencia/node-cron)
[![devDependency Status](https://david-dm.org/node-cron/node-cron/dev-status.svg)](https://david-dm.org/merencia/node-cron#info=devDependencies)
[![Backers on Open Collective](https://opencollective.com/node-cron/backers/badge.svg)](#backers) 
[![Sponsors on Open Collective](https://opencollective.com/node-cron/sponsors/badge.svg)](#sponsors) 

The node-cron module is tiny task scheduler in pure JavaScript for node.js based on [GNU crontab](https://www.gnu.org/software/mcron/manual/html_node/Crontab-file.html). This module allows you to schedule task in node.js using full crontab syntax.

[![NPM](https://nodei.co/npm/node-cron.png?downloads=true&downloadRank=true&stars=false)](https://nodei.co/npm/node-cron/)


## Getting Started

Install node-cron using npm:

```console
$ npm install --save node-cron
```

Import node-cron and schedule a task:

```javascript
var cron = require('node-cron');

cron.schedule('* * * * *', () => {
  console.log('running a task every minute');
});
```

## Cron Syntax

This is a quick reference to cron syntax and also shows the options supported by node-cron.

### Allowed fields

```
 # ┌────────────── second (optional)
 # │ ┌──────────── minute
 # │ │ ┌────────── hour
 # │ │ │ ┌──────── day of month
 # │ │ │ │ ┌────── month
 # │ │ │ │ │ ┌──── day of week
 # │ │ │ │ │ │
 # │ │ │ │ │ │
 # * * * * * *
```

### Allowed values

|     field    |        value        |
|--------------|---------------------|
|    second    |         0-59        |
|    minute    |         0-59        |
|     hour     |         0-23        |
| day of month |         1-31        |
|     month    |     1-12 (or names) |
|  day of week |     0-7 (or names, 0 or 7 are sunday)  |


#### Using multiples values

You may use multiples values separated by comma:

```javascript
var cron = require('node-cron');

cron.schedule('1,2,4,5 * * * *', () => {
  console.log('running every minute 1, 2, 4 and 5');
});
```

#### Using ranges

You may also define a range of values:

```javascript
var cron = require('node-cron');

cron.schedule('1-5 * * * *', () => {
  console.log('running every minute to 1 from 5');
});
```

#### Using step values

Step values can be used in conjunction with ranges, following a range with '/' and a number. e.g: `1-10/2` that is the same as `2,4,6,8,10`. Steps are also permitted after an asterisk, so if you want to say “every two minutes”, just use `*/2`.

```javascript
var cron = require('node-cron');

cron.schedule('*/2 * * * *', () => {
  console.log('running a task every two minutes');
});
```

#### Using names

For month and week day you also may use names or short names. e.g:

```javascript
var cron = require('node-cron');

cron.schedule('* * * January,September Sunday', () => {
  console.log('running on Sundays of January and September');
});
```

Or with short names:

```javascript
var cron = require('node-cron');

cron.schedule('* * * Jan,Sep Sun', () => {
  console.log('running on Sundays of January and September');
});
```

## Cron methods

### Schedule

Schedules given task to be executed whenever the cron expression ticks.

Arguments:

- **expression** `string`: Cron expression
- **function** `Function`: Task to be executed
- **options** `Object`: Optional configuration for job scheduling.

#### Options

 - **scheduled**: A `boolean` to set if the created task is scheduled. Default `true`;
 - **timezone**: The timezone that is used for job scheduling;
 
| List of Time Zones      |
| -------------           |
|Europe/Andorra|
|Asia/Dubai|
|Asia/Kabul|
|Europe/Tirane|
|Asia/Yerevan|
|Antarctica/Casey|
|Antarctica/Davis|
|Antarctica/DumontDUrville|
|Antarctica/Mawson|
|Antarctica/Palmer|
|Antarctica/Rothera|
|Antarctica/Syowa|
|Antarctica/Troll|
|Antarctica/Vostok|
|America/Argentina/Buenos_Aires|
|America/Argentina/Cordoba|
|America/Argentina/Salta|
|America/Argentina/Jujuy|
|America/Argentina/Tucuman|
|America/Argentina/Catamarca|
|America/Argentina/La_Rioja|
|America/Argentina/San_Juan|
|America/Argentina/Mendoza|
|America/Argentina/San_Luis|
|America/Argentina/Rio_Gallegos|
|America/Argentina/Ushuaia|
|Pacific/Pago_Pago|
|Europe/Vienna|
|Australia/Lord_Howe|
|Antarctica/Macquarie|
|Australia/Hobart|
|Australia/Currie|
|Australia/Melbourne|
|Australia/Sydney|
|Australia/Broken_Hill|
|Australia/Brisbane|
|Australia/Lindeman|
|Australia/Adelaide|
|Australia/Darwin|
|Australia/Perth|
|Australia/Eucla|
|Asia/Baku|
|America/Barbados|
|Asia/Dhaka|
|Europe/Brussels|
|Europe/Sofia|
|Atlantic/Bermuda|
|Asia/Brunei|
|America/La_Paz|
|America/Noronha|
|America/Belem|
|America/Fortaleza|
|America/Recife|
|America/Araguaina|
|America/Maceio|
|America/Bahia|
|America/Sao_Paulo|
|America/Campo_Grande|
|America/Cuiaba|
|America/Santarem|
|America/Porto_Velho|
|America/Boa_Vista|
|America/Manaus|
|America/Eirunepe|
|America/Rio_Branco|
|America/Nassau|
|Asia/Thimphu|
|Europe/Minsk|
|America/Belize|
|America/St_Johns|
|America/Halifax|
|America/Glace_Bay|
|America/Moncton|
|America/Goose_Bay|
|America/Blanc-Sablon|
|America/Toronto|
|America/Nipigon|
|America/Thunder_Bay|
|America/Iqaluit|
|America/Pangnirtung|
|America/Atikokan|
|America/Winnipeg|
|America/Rainy_River|
|America/Resolute|
|America/Rankin_Inlet|
|America/Regina|
|America/Swift_Current|
|America/Edmonton|
|America/Cambridge_Bay|
|America/Yellowknife|
|America/Inuvik|
|America/Creston|
|America/Dawson_Creek|
|America/Fort_Nelson|
|America/Vancouver|
|America/Whitehorse|
|America/Dawson|
|Indian/Cocos|
|Europe/Zurich|
|Africa/Abidjan|
|Pacific/Rarotonga|
|America/Santiago|
|America/Punta_Arenas|
|Pacific/Easter|
|Asia/Shanghai|
|Asia/Urumqi|
|America/Bogota|
|America/Costa_Rica|
|America/Havana|
|Atlantic/Cape_Verde|
|America/Curacao|
|Indian/Christmas|
|Asia/Nicosia|
|Asia/Famagusta|
|Europe/Prague|
|Europe/Berlin|
|Europe/Copenhagen|
|America/Santo_Domingo|
|Africa/Algiers|
|America/Guayaquil|
|Pacific/Galapagos|
|Europe/Tallinn|
|Africa/Cairo|
|Africa/El_Aaiun|
|Europe/Madrid|
|Africa/Ceuta|
|Atlantic/Canary|
|Europe/Helsinki|
|Pacific/Fiji|
|Atlantic/Stanley|
|Pacific/Chuuk|
|Pacific/Pohnpei|
|Pacific/Kosrae|
|Atlantic/Faroe|
|Europe/Paris|
|Europe/London|
|Asia/Tbilisi|
|America/Cayenne|
|Africa/Accra|
|Europe/Gibraltar|
|America/Godthab|
|America/Danmarkshavn|
|America/Scoresbysund|
|America/Thule|
|Europe/Athens|
|Atlantic/South_Georgia|
|America/Guatemala|
|Pacific/Guam|
|Africa/Bissau|
|America/Guyana|
|Asia/Hong_Kong|
|America/Tegucigalpa|
|America/Port-au-Prince|
|Europe/Budapest|
|Asia/Jakarta|
|Asia/Pontianak|
|Asia/Makassar|
|Asia/Jayapura|
|Europe/Dublin|
|Asia/Jerusalem|
|Asia/Kolkata|
|Indian/Chagos|
|Asia/Baghdad|
|Asia/Tehran|
|Atlantic/Reykjavik|
|Europe/Rome|
|America/Jamaica|
|Asia/Amman|
|Asia/Tokyo|
|Africa/Nairobi|
|Asia/Bishkek|
|Pacific/Tarawa|
|Pacific/Enderbury|
|Pacific/Kiritimati|
|Asia/Pyongyang|
|Asia/Seoul|
|Asia/Almaty|
|Asia/Qyzylorda|
|Asia/Qostanay|
|Asia/Aqtobe|
|Asia/Aqtau|
|Asia/Atyrau|
|Asia/Oral|
|Asia/Beirut|
|Asia/Colombo|
|Africa/Monrovia|
|Europe/Vilnius|
|Europe/Luxembourg|
|Europe/Riga|
|Africa/Tripoli|
|Africa/Casablanca|
|Europe/Monaco|
|Europe/Chisinau|
|Pacific/Majuro|
|Pacific/Kwajalein|
|Asia/Yangon|
|Asia/Ulaanbaatar|
|Asia/Hovd|
|Asia/Choibalsan|
|Asia/Macau|
|America/Martinique|
|Europe/Malta|
|Indian/Mauritius|
|Indian/Maldives|
|America/Mexico_City|
|America/Cancun|
|America/Merida|
|America/Monterrey|
|America/Matamoros|
|America/Mazatlan|
|America/Chihuahua|
|America/Ojinaga|
|America/Hermosillo|
|America/Tijuana|
|America/Bahia_Banderas|
|Asia/Kuala_Lumpur|
|Asia/Kuching|
|Africa/Maputo|
|Africa/Windhoek|
|Pacific/Noumea|
|Pacific/Norfolk|
|Africa/Lagos|
|America/Managua|
|Europe/Amsterdam|
|Europe/Oslo|
|Asia/Kathmandu|
|Pacific/Nauru|
|Pacific/Niue|
|Pacific/Auckland|
|Pacific/Chatham|
|America/Panama|
|America/Lima|
|Pacific/Tahiti|
|Pacific/Marquesas|
|Pacific/Gambier|
|Pacific/Port_Moresby|
|Pacific/Bougainville|
|Asia/Manila|
|Asia/Karachi|
|Europe/Warsaw|
|America/Miquelon|
|Pacific/Pitcairn|
|America/Puerto_Rico|
|Asia/Gaza|
|Asia/Hebron|
|Europe/Lisbon|
|Atlantic/Madeira|
|Atlantic/Azores|
|Pacific/Palau|
|America/Asuncion|
|Asia/Qatar|
|Indian/Reunion|
|Europe/Bucharest|
|Europe/Belgrade|
|Europe/Kaliningrad|
|Europe/Moscow|
|Europe/Simferopol|
|Europe/Kirov|
|Europe/Astrakhan|
|Europe/Volgograd|
|Europe/Saratov|
|Europe/Ulyanovsk|
|Europe/Samara|
|Asia/Yekaterinburg|
|Asia/Omsk|
|Asia/Novosibirsk|
|Asia/Barnaul|
|Asia/Tomsk|
|Asia/Novokuznetsk|
|Asia/Krasnoyarsk|
|Asia/Irkutsk|
|Asia/Chita|
|Asia/Yakutsk|
|Asia/Khandyga|
|Asia/Vladivostok|
|Asia/Ust-Nera|
|Asia/Magadan|
|Asia/Sakhalin|
|Asia/Srednekolymsk|
|Asia/Kamchatka|
|Asia/Anadyr|
|Asia/Riyadh|
|Pacific/Guadalcanal|
|Indian/Mahe|
|Africa/Khartoum|
|Europe/Stockholm|
|Asia/Singapore|
|America/Paramaribo|
|Africa/Juba|
|Africa/Sao_Tome|
|America/El_Salvador|
|Asia/Damascus|
|America/Grand_Turk|
|Africa/Ndjamena|
|Indian/Kerguelen|
|Asia/Bangkok|
|Asia/Dushanbe|
|Pacific/Fakaofo|
|Asia/Dili|
|Asia/Ashgabat|
|Africa/Tunis|
|Pacific/Tongatapu|
|Europe/Istanbul|
|America/Port_of_Spain|
|Pacific/Funafuti|
|Asia/Taipei|
|Europe/Kiev|
|Europe/Uzhgorod|
|Europe/Zaporozhye|
|Pacific/Wake|
|America/New_York|
|America/Detroit|
|America/Kentucky/Louisville|
|America/Kentucky/Monticello|
|America/Indiana/Indianapolis|
|America/Indiana/Vincennes|
|America/Indiana/Winamac|
|America/Indiana/Marengo|
|America/Indiana/Petersburg|
|America/Indiana/Vevay|
|America/Chicago|
|America/Indiana/Tell_City|
|America/Indiana/Knox|
|America/Menominee|
|America/North_Dakota/Center|
|America/North_Dakota/New_Salem|
|America/North_Dakota/Beulah|
|America/Denver|
|America/Boise|
|America/Phoenix|
|America/Los_Angeles|
|America/Anchorage|
|America/Juneau|
|America/Sitka|
|America/Metlakatla|
|America/Yakutat|
|America/Nome|
|America/Adak|
|Pacific/Honolulu|
|America/Montevideo|
|Asia/Samarkand|
|Asia/Tashkent|
|America/Caracas|
|Asia/Ho_Chi_Minh|
|Pacific/Efate|
|Pacific/Wallis|
|Pacific/Apia|
|Africa/Johannesburg|       

 **Example**:

 ```js
  var cron = require('node-cron');

  cron.schedule('0 1 * * *', () => {
    console.log('Running a job at 01:00 at America/Sao_Paulo timezone');
  }, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
  });
 ```

## ScheduledTask methods

### Start

Starts the scheduled task.

```javascript
var cron = require('node-cron');

var task = cron.schedule('* * * * *', () =>  {
  console.log('stopped task');
}, {
  scheduled: false
});

task.start();
```

### Stop

The task won't be executed unless re-started.

```javascript
var cron = require('node-cron');

var task = cron.schedule('* * * * *', () =>  {
  console.log('will execute every minute until stopped');
});

task.stop();
```

### Destroy

The task will be stopped and completely destroyed.

```javascript
var cron = require('node-cron');

var task = cron.schedule('* * * * *', () =>  {
  console.log('will not execute anymore, nor be able to restart');
});

task.destroy();
```

### Validate

Validate that the given string is a valid cron expression.

```javascript
var cron = require('node-cron');

var valid = cron.validate('59 * * * *');
var invalid = cron.validate('60 * * * *');
```

## Issues

Feel free to submit issues and enhancement requests [here](https://github.com/merencia/node-cron/issues).

## Contributing

In general, we follow the "fork-and-pull" Git workflow.

 - Fork the repo on GitHub;
 - Commit changes to a branch in your fork;
 - Pull request "upstream" with your changes;

NOTE: Be sure to merge the latest from "upstream" before making a pull request!

Please do not contribute code you did not write yourself, unless you are certain you have the legal ability to do so. Also ensure all contributed code can be distributed under the ISC License.

## Contributors

This project exists thanks to all the people who contribute. 
<a href="https://github.com/node-cron/node-cron/graphs/contributors"><img src="https://opencollective.com/node-cron/contributors.svg?width=890&button=false" /></a>


## Backers

Thank you to all our backers! 🙏 [[Become a backer](https://opencollective.com/node-cron#backer)]

<a href="https://opencollective.com/node-cron#backers" target="_blank"><img src="https://opencollective.com/node-cron/backers.svg?width=890"></a>


## Sponsors

Support this project by becoming a sponsor. Your logo will show up here with a link to your website. [[Become a sponsor](https://opencollective.com/node-cron#sponsor)]

<a href="https://opencollective.com/node-cron/sponsor/0/website" target="_blank"><img src="https://opencollective.com/node-cron/sponsor/0/avatar.svg"></a>
<a href="https://opencollective.com/node-cron/sponsor/1/website" target="_blank"><img src="https://opencollective.com/node-cron/sponsor/1/avatar.svg"></a>
<a href="https://opencollective.com/node-cron/sponsor/2/website" target="_blank"><img src="https://opencollective.com/node-cron/sponsor/2/avatar.svg"></a>
<a href="https://opencollective.com/node-cron/sponsor/3/website" target="_blank"><img src="https://opencollective.com/node-cron/sponsor/3/avatar.svg"></a>
<a href="https://opencollective.com/node-cron/sponsor/4/website" target="_blank"><img src="https://opencollective.com/node-cron/sponsor/4/avatar.svg"></a>
<a href="https://opencollective.com/node-cron/sponsor/5/website" target="_blank"><img src="https://opencollective.com/node-cron/sponsor/5/avatar.svg"></a>
<a href="https://opencollective.com/node-cron/sponsor/6/website" target="_blank"><img src="https://opencollective.com/node-cron/sponsor/6/avatar.svg"></a>
<a href="https://opencollective.com/node-cron/sponsor/7/website" target="_blank"><img src="https://opencollective.com/node-cron/sponsor/7/avatar.svg"></a>
<a href="https://opencollective.com/node-cron/sponsor/8/website" target="_blank"><img src="https://opencollective.com/node-cron/sponsor/8/avatar.svg"></a>
<a href="https://opencollective.com/node-cron/sponsor/9/website" target="_blank"><img src="https://opencollective.com/node-cron/sponsor/9/avatar.svg"></a>



## License

node-cron is under [ISC License](https://github.com/merencia/node-cron/blob/master/LICENSE.md).
