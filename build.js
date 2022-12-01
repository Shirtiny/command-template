const fs = require("fs");
const path = require("path");
const sass = require("sass");

const commandLine = (lines = [], command, startIndex = 0) => {
  const findIndex = lines
    .slice(startIndex)
    .findIndex((line) => new RegExp(`${command}`).test(line));
  if (findIndex < 0) return -1;
  return findIndex + startIndex;
};

const commandRange = (lines, startValue, endValue) => {
  let lineStart,
    lineEnd = -1;

  lineStart = commandLine(lines, startValue);
  if (lineStart < 0) return [lineStart, lineEnd];
  // 兼容数字的情况
  const endValueIsNum = typeof endValue === "number";
  if (endValueIsNum) {
    // 为step的形式
    lineEnd = lineStart + endValue;
  } else {
    lineEnd = commandLine(lines, endValue, lineStart + 1);
    lineEnd < 0 && (lineEnd = lines.length - 1);
  }
  return [lineStart, lineEnd];
};

const pullRange = (arr = [], min, max) => {
  if (!Array.isArray(arr)) return [];
  return arr.filter((v, i) => i < min || i > max);
};

const COMMANDS = {
  REMOVE: "REMOVE",
  STYLE: "STYLE",
};

const CommandVariants = {
  [COMMANDS.REMOVE]: {
    start: "@SH-Remove",
    end: "@SH-Remove END",
    execute(lines) {
      return this.scopeExec(lines, (lines, lineStart, lineEnd) => {
        return pullRange(lines, lineStart, lineEnd);
      });
    },
  },
  [COMMANDS.STYLE]: {
    start: "@SH-Style",
    end: 0,
    execute(lines) {
      const styleTemplate = `<style type="text/css">/* CSS_CONTENT */</style>`;
      return this.scopeExec(lines, (lines, lineStart, lineEnd) => {
        const stylePath = String(lines[lineStart]).match(
          new RegExp(`${this.start} (.+) `)
        )[1];
        if (!stylePath) return;
        const clone = lines.map((l) => l);
        const content = stylePath.endsWith("scss")
          ? sass.compile(path.resolve(__dirname, stylePath), {
              style: "compressed",
            }).css
          : fs.readFileSync(path.resolve(__dirname, stylePath), {
              encoding: "utf-8",
            });
        clone.splice(
          lineStart,
          lineEnd - lineStart + 1,
          ...styleTemplate.split(`/* CSS_CONTENT */`).join(content).split("\n")
        );
        return clone;
      });
    },
  },
};
Object.keys(CommandVariants).forEach((key) => {
  const that = CommandVariants[key];
  const scopeExec = (lines, cb) => {
    const [lineStart, lineEnd] = commandRange(lines, that.start, that.end);
    if (lineStart > lineEnd || lineStart < 0) return lines;
    const result = cb(lines, lineStart, lineEnd);
    if (!result) return lines;
    return scopeExec(result, cb);
  };
  that.scopeExec = scopeExec;
});

const run = () => {
  const htmlTemplate = fs.readFileSync(
    path.resolve(__dirname, "./index.html"),
    {
      encoding: "utf-8",
    }
  ); //?.

  const commands = Object.keys(COMMANDS).map(
    (key) => CommandVariants[COMMANDS[key]]
  ); //?

  const output = commands
    .reduce((result, command) => {
      if (!command.execute) return result;
      return command.execute(result) || result;
    }, String(htmlTemplate).split("\r\n"))
    .join("\r\n");

  fs.writeFileSync("./output.html", output, { encoding: "utf-8" });
};

run();
