const Scrapper = require("./scrapper.js");
if (typeof process.argv[2] === "string") {
	var parser = new Scrapper(process.argv[2]);
	parser.scrap();
} else {
	console.log("Имя пользователя не задано или задано неверно")
}