const Https = require('https')
const Event = require("events");
const Fs = require("fs");

module.exports = class parser extends Event {
	constructor(nickname) {
		super();
		this.nickname = nickname;
		this.userId = 1;
		this.links = [];
		this.currentPost = 1;
		this.post = 1;
	}
	init() {
		Fs.mkdir(`./instagram/${this.nickname}`, {
			recursive: true
		}, (err) => {
			if (err) {
				console.log(err);
			}
		});
	}
	getId() {
		Https.get(`https://www.instagram.com/${this.nickname}/?__a=1`, (res) => {
			var result = "";
			res.on('data', (data) => {
				result += data.toString();
			});
			res.on('end', () => {
				var per = JSON.parse(result);
				this.userId = per.graphql.user.id;
				this.links.push(per.graphql.user.profile_pic_url_hd);
				this.emit("id", this.userId);
			});
		});

	}
	getLinks(after = "") {
		var userInf = "";
		if (after == null) {
			return;
		}
		Https.get(`https://www.instagram.com/graphql/query/?query_id=17888483320059182&variables={"id":"${this.userId}","first":12,"after":"${after}"}`, (res) => {
			res.on("data", function (data) {
				userInf += data.toString();
			});
			res.on("end", () => {
				var currentPage = JSON.parse(userInf);
				after = currentPage.data.user.edge_owner_to_timeline_media.page_info.end_cursor;
				for (var i = 0; i < currentPage.data.user.edge_owner_to_timeline_media.edges.length; i++) {
					this.links.push(currentPage.data.user.edge_owner_to_timeline_media.edges[i].node.thumbnail_src);
					this.post = currentPage.data.user.edge_owner_to_timeline_media.count;
				};
				this.links = this.links.reverse();
				this.downloads(after);
			});
		});
	};
	downloads(after) {
		var photo = [];
		if (this.links.length === 0) {
			return this.getLinks(after);
		}

		Https.get(`${this.links[this.links.length>1?this.links.length-1:0]}`, (res) => {
			res.on("data", function (data) {
				photo.push(data);
			});
			res.on("end", () => {
				var size = 0;
				for (var i = 0; i < photo.length; i++) {
					size += photo[i].length;
				}
				var buf = Buffer.concat(photo, size);
				Fs.writeFile(`./instagram/${this.nickname}/${this.currentPost}.jpg`, buf, (er) => {
					if (er) {
						console.log(er);
					}
					if (this.links.length >= 1) {
						this.links.pop();
						this.currentPost++;
						this.downloads(after);
					} else {
						this.getLinks(after);
					}
					console.clear();
					console.log(`${this.currentPost-1} / ${this.post}`);
					console.log("Scrapper by 5h4dow");
				});
			});
		});
	}
	scrap() {
		this.getId();
		this.init();
		this.on("id", (id) => {
			this.getLinks();
		})
	}
};