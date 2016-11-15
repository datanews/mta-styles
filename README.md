# MTA Styles

The [colors of the MTA](http://web.mta.info/developers/resources/line_colors.htm) in a easy to include CSS/SASS/LESS/JSON library.  The source data for this library is from this [CSV](http://web.mta.info/developers/data/colors.csv) provided by the MTA.

## Install

Easily include with a package manager:

* `npm install mta-styles`
* Or `bower install mta-styles`

Or, you could use this in your HTML directly (though note that this CDN is not guaranteed to be up).

```html
<link rel="stylesheet" href="//cdn.rawgit.com/datanews/mta-styles/0.0.2/dist/mta-styles.css">
```

## Use

### Styles

With the CSS, SASS, and LESS files, the following styles are available.

* Subway line symbols with `<i class="mta mta-symbol subway-n"><i>`
* Background colors can be set using `class="mta subway-a"`
    * The format is `mta-<mode>-<line>`
    * Note that this style is marked as `!important`.
* Foreground colors can be set using `class="mta lirr-montauk-fg"`
    * The format is `mta-<mode>-<line>-fg`
    * Note that this style is marked as `!important`.

### LESS and SASS

The LESS and SASS files also provide variables to use.

* For LESS: `@mta-subway-5`
    * Format is `@mta-<mode>-<line>`
* For SASS: `$mta-subway-5`
    * Format is `$mta-<mode>-<line>`

### JSON

The JSON file describing what lines are what colors can useful for styling in different applications or data visualizations.  The JSON is an array of each set of lines.

```js
{
  "mode": "subway",
  "modeName": "NYC Subway Lines",
  "lines": [
    "a",
    "c",
    "e"
  ],
  "linesName": "A,C,E",
  "linesIds": [
    "subway-a",
    "subway-c",
    "subway-e"
  ],
  "hex": "#0039A6"
}
```

## Development

1. Get code: `git clone https://github.com/datanews/mta-styles.git && cd mta-styles`
1. Install dependencies: `npm install`

* The main logic that compiles the output files is in: `mta-styles/mta-styles.js`
* To actually compile the output files, run: `npm run build`

## Publish

1. Update `package.json`, `bower.json`, `README.md` with the new version.
1. `git tag X.X.X`
1. `git push origin master --tags`
1. `npm publish`

## Attribution

* All colors from the [MTA](http://web.mta.info/developers/resources/line_colors.htm).  Though none of those are included here, the use of MTA logos, maps, and symbols requires a license.
* Social image from [Wikipedia](https://commons.wikimedia.org/wiki/File:New_York_City_Transit_Sign_Shop_(15370608428).jpg)
