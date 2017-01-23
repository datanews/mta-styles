/**
 * Main build process.
 */

// Dependencies
var fs = require("fs");
var path = require("path");
var request = require("request");
var csv = require("d3-dsv").csv;
var less = require("less");

// Source data
var sourceURL = "http://web.mta.info/developers/data/colors.csv";
var packageInfo = require("../package.json");

// Outputs
var outputPaths = {
  json: path.join(__dirname, "../dist/mta-styles.json"),
  css: path.join(__dirname, "../dist/mta-styles.css"),
  sass: path.join(__dirname, "../dist/mta-styles.scss"),
  less: path.join(__dirname, "../dist/mta-styles.less")
};

// Main build function
function build(message) {
  mtaParse(function(error, colors) {
    // Check for errors
    if (error) {
      throw new Error(error);
    }

    // Create JSON file
    fs.writeFileSync(outputPaths.json, JSON.stringify(colors));

    // Create styles
    fs.writeFileSync(outputPaths.less, buildStyles(colors, "less"));
    fs.writeFileSync(outputPaths.sass, buildStyles(colors, "sass"));
    less.render(buildStyles(colors, "less"), function(error, output) {
      // Check for errors
      if (error) {
        throw new Error(error);
      }

      fs.writeFileSync(outputPaths.css, output.css);

      if (message) {
        console.log(message);
      }
    });
  });
}

// Create LESS or SASS
function buildStyles(colors, type) {
  type = type || "less";
  var varPrefix = type === "less" ? "@mta-" : "$mta-";
  var sections = [];
  var variables = [];
  var backgrounds = [];
  var foregrounds = [];
  var symbols = [];

  // Add headers
  sections.push(buildHeader());

  // Variables
  variables.push("/* Variables: mta-mode-line */");
  colors.forEach(function(c) {
    c.linesIds.forEach(function(l) {
      variables.push(varPrefix + l + ": " + c.hex + ";");
    });
  });
  sections.push(variables.join("\n"));

  // General styles
  sections.push("/* General styling */\n" +
    ".mta {\n" +
    "  font-family: \"HelveticaNeue-Light\", \"Helvetica Neue Light\", \"Helvetica Neue\", Helvetica, Arial, \"Lucida Grande\", sans-serif;\n" +
    "  font-weight: bold;\n" +
    "}");

  // Background colors
  backgrounds.push("/* Background colors: mta mta-mode-line */");
  backgrounds.push(".mta {");
  colors.forEach(function(c) {
    c.linesIds.forEach(function(l) {
      backgrounds.push("  &." + l + " { background-color: " + varPrefix + l + " !important; }");
    });
  });
  backgrounds.push("}");
  sections.push(backgrounds.join("\n"));

  // Foreground colors
  foregrounds.push("/* Foreground colors: mta mta-mode-line-fg */");
  foregrounds.push(".mta {");
  colors.forEach(function(c) {
    c.linesIds.forEach(function(l) {
      foregrounds.push("  &." + l + "-fg { color: " + varPrefix + l + " !important; }");
    });
  });
  foregrounds.push("}");
  sections.push(foregrounds.join("\n"));

  // Symbols
  symbols.push("/* Symbols: mta mta-symbol mta-mode-line-fg */");
  symbols.push(".mta.mta-symbol {\n" +
    "  display: inline-block;\n" +
    "  border-radius: 50%;\n" +
    "  width: 1em;\n" +
    "  height: 1em;\n" +
    "  color: #FFFFFF;\n" +
    "  position: relative;\n" +
    "  vertical-align: middle;\n" +
    "  font-style: normal;\n" +
    "\n"+
    "  &:after {\n" +
    "    position: relative;\n" +
    "    display: block;\n" +
    "    text-align: center;\n" +
    "    width: 100%;\n" +
    "    top: 50%;\n" +
    "    -webkit-transform: translateY(-50%);\n" +
    "    -moz-transform: translateY(-50%);\n" +
    "    -ms-transform: translateY(-50%);\n" +
    "    transform: translateY(-50%);\n" +
    "    font-size: 0.65em;\n" +
    "  }\n" +
    "  &.mta-small {\n" +
    "    font-size: 1.2em;\n" +
    "  }\n" +
        "  &.mta-med {\n" +
    "    font-size: 1.85em;\n" +
    "  }\n" +
        "  &.mta-large {\n" +
    "    font-size: 2.85em;\n" +
    "  }\n" +
    "  &.mta-bottom {\n" +
    "    vertical-align: bottom;\n" +
    "  }\n");
  colors.forEach(function(c) {
    c.linesIds.forEach(function(l, li) {
      var properties = [];

      // For subway, add letters
      if (c.mode === "subway") {
        symbols.push("  &." + l + ":after { content: \"" + c.lines[li].toUpperCase() + "\"; }");

        // There are some exceptions that use a different foreground color
        if (["n", "q", "r", "w"].indexOf(c.lines[li]) !== -1) {
          symbols.push("  &." + l + " { color: #000000; }");
        }
      }
    });
  });
  symbols.push("}");
  sections.push(symbols.join("\n"));

  // Put together sections
  return sections.join("\n\n");
}

// Main scraping function
function mtaParse(done) {
  // Get source data
  request.get(sourceURL, function(error, response, body) {
    var input;
    var output = [];

    // Check for errors
    if (error || response.statusCode >= 300) {
      done(error || response.statusCode);
    }

    // Parse csv.  The first two rows are not needed
    input = body.split("\n").slice(2, -1);
    input = csv.parse(input.join("\n"));

    // Manual alterations
    input = input.map(function(l) {
      // Temporarily add "W" train to the N/Q/R definition since it's not yet
      // part of MTA's colors.csv
      if (l['Line/Branch'] === 'N/Q/R') {
        l['Line/Branch'] = 'N/Q/R/W';
      }

      return l;
    });

    // Manual additions
    // Manually add T as its not yet finished.  The color is not official.
    input.push({
      'MTA Mode': 'NYCT Subway',
      'Line/Branch': 'T',
      'RGB Hex': '1E9DBF',
      'Pantone CVC': '',
      CMYK: ''
    });

    // Go through
    input.forEach(function(i) {
      var lines, mode;

      // Ignore empty rows and non-translations
      if (!i["MTA Mode"] || !translateMode(i["MTA Mode"])) {
        return;
      }

      // Get lines and mode
      mode = translateMode(i["MTA Mode"]);
      lines = translateLines(i["Line/Branch"], translateMode(i["MTA Mode"])[0]);

      // Create new row
      output.push({
        mode: mode[0],
        modeName: mode[1],
        lines: lines[0],
        linesName: lines[1],
        linesIds: lines[0].map(function(l) {
          return mode[0] + "-" + l;
        }),
        hex: "#" + translateHex(i["RGB Hex"])
      });
    });

    // Sort
    output = output.sort(function(a, b) {
      var ai = a.mode + a.lines;
      var bi = b.mode + b.lines;
      return ai.localeCompare(bi);
    });

    // Return output
    done(null, output);
  });
}

// Translate mode
function translateMode(input) {
  var translations = {
    "NYCT Subway": ["subway", "NYC Subway Lines"],
    "LIRR": ["lirr", "Long Island Rail Road Branches"],
    "Metro-North": ["metro-north", "Metro-North Railroad Lines"]
  };

  return translations[input];
}

// Get lines
function translateLines(input, mode) {
  var lines;

  // For subway, just break apart lines
  if (mode === "subway") {
    lines = input.indexOf("/") !== -1 ? input.split("/") : input.split(" ");
    lines = lines.map(Function.prototype.call, String.prototype.toLowerCase);
    return [lines, lines.map(Function.prototype.call, String.prototype.toUpperCase).join(",")];
  }

  // Otherwise, make an id
  else {
    lines = input.toLowerCase()
      .replace(/branch|zone|line/gi, "")
      .trim()
      .replace(/ /g, "-");

    return [[lines], input];
  }
}

// Fix hex.  There is at least one color missing leading zeros
function translateHex(input) {
  return input.length === 4 ? "00" + input :
    input.length === 5 ? "0" + input : input;
}

// Create header for files
function buildHeader() {
  return "/**\n" +
    " * MTA Styles\n" +
    " * The colors of the MTA in a easy to include library.\n" +
    " * https://github.com/datanews/mta-styles\n" +
    " * \n" +
    " * Version: " + packageInfo.version + "\n" +
    " */\n";
}

// Exports
module.exports = {
  mtaParse: mtaParse,
  build: build,
  sourePath: path.join(__dirname, 'mta-styles.js'),
  outputPaths: outputPaths
};
