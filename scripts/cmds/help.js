const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");
const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;
const characters = "━━━━━━━━━━━━━";
/** 
* @author NTKhang
* @author: do not delete it
* @message if you delete or edit it you will get a global ban
*/

module.exports = {
	config: {
		name: "help",
		version: "1.2",
		author: "NTKhang",
		countDown: 5,
		role: 0,
		shortDescription: {
			vi: "Xem cách dùng lệnh",
			en: "View command usage"
		},
		longDescription: {
			vi: "Xem cách sử dụng của các lệnh",
			en: "View command usage"
		},
		category: "info",
		guide: {
			vi: "{pn} [để trống | <số trang> | <tên lệnh>]",
			en: "{pn} [empty | <page number> | <command name>]"
		},
		priority: 1
	},

	langs: {
		vi: {
			doNotDelete: "[ 🐐 | Goat Bot ]",
			help: "%1\n%2\n%1\nTrang [ %3/%4 ]\nHiện tại bot có %5 lệnh có thể sử dụng\n» Gõ %6help để xem danh sách lệnh\n» Gõ %6help để xem chi tiết cách sử dụng lệnh đó\n%1\n%7",
			help2: "%1%2\n» Hiện tại bot có %3 lệnh có thể sử dụng, gõ %4help <tên lệnh> để xem chi tiết cách sử dụng lệnh đó\n%2\n%5",
			commandNotFound: "Lệnh \"%1\" không tồn tại",
			getInfoCommand: "%1\n» Mô tả: %2\n» Các tên gọi khác: %3\n» Các tên gọi khác trong nhóm bạn: %4\n» Version: %5\n» Role: %6\n» Thời gian mỗi lần dùng lệnh: %7s\n» Author: %8\n» Hướng dẫn sử dụng:\n\n%9\n» Chú thích:\n• Nội dung bên trong <XXXXX> là có thể thay đổi\n• Nội dung bên trong [a|b|c] là a hoặc b hoặc c",
			doNotHave: "Không có",
			roleText0: "0 (Tất cả người dùng)",
			roleText1: "1 (Quản trị viên nhóm)",
			roleText2: "2 (Admin bot)"
		},
		en: {
			doNotDelete: "[ 🐐 | Goat Bot ]",
			help: "%1\n%2\n%1\nPage [ %3/%4 ]\nCurrently, the bot has %5 commands that can be used\n» Type %6help to view the command list\n» Type %6help to view the details of how to use that command\n%1\n%7",
			help2: "%1%2\n» Currently, the bot has %3 commands that can be used, type %3help <command name> to view the details of how to use that command\n%2\n%4",
			commandNotFound: "Command \"%1\" does not exist",
			getInfoCommand: "%1\n» Description: %2\n» Other names: %3\n» Other names in your group: %4\n» Version: %5\n» Role: %6\n» Time per command: %7s\n» Author: %8\n» Usage guide:\n\n%9",
			doNotHave: "Do not have",
			roleText0: "0 (All users)",
			roleText1: "1 (Group administrators)",
			roleText2: "2 (Admin bot)"
		}
	},

	onStart: async function ({ message, args, event, threadsData, getLang }) {
		const langCode = await threadsData.get(event.threadID, "data.lang") || global.GoatBot.config.languege;
		let customLang;
		if (fs.existsSync(`${path.join(__dirname, "..", "..", "languages", "cmds", `${langCode}.js`)}`))
			customLang = require(`${path.join(__dirname, "..", "..", "languages", "cmds", `${langCode}.js`)}`);
		else
			customLang = {};
		const { threadID } = event;
		const threadData = await threadsData.get(threadID);
		const prefix = getPrefix(threadID);
		let sortHelp = threadData.settings.sortHelp || "name";
		if (!["category", "name"].includes(sortHelp))
			sortHelp = "name";
		const commandName = (args[0] || "").toLowerCase();
		const command = commands.get(commandName) || commands.get(aliases.get(commandName));
		// ———————————————— LIST ALL COMMAND ——————————————— //
		if (!command && !args[0] || !isNaN(args[0])) {
			const arrayInfo = [];
			let msg = "";
			if (sortHelp == "name") {
				const page = parseInt(args[0]) || 1;
				const numberOfOnePage = 30;
				for (const [name, value] of commands) {
					let describe = name;
					let shortDescription;
					const shortDescriptionCustomLang = customLang[name]?.shortDescription;
					if (shortDescriptionCustomLang != undefined)
						shortDescription = checkLangObject(shortDescriptionCustomLang, langCode);
					else if (value.config.shortDescription)
						shortDescription = checkLangObject(value.config.shortDescription, langCode);
					if (shortDescription && shortDescription.length < 40)
						describe += `: ${shortDescription.charAt(0).toUpperCase() + shortDescription.slice(1)}`;
					arrayInfo.push({
						data: describe,
						priority: value.priority || 0
					});
				}
				arrayInfo.sort((a, b) => a.data - b.data);
				arrayInfo.sort((a, b) => a.priority > b.priority ? -1 : 1);
				const { allPage, totalPage } = global.utils.splitPage(arrayInfo, numberOfOnePage);
				const returnArray = allPage[page - 1];
				msg += (returnArray || []).reduce((text, item, index) => text += `${index + 1}/ ${item.data}\n`, '');
				await message.reply(getLang("help", characters, msg, page, totalPage, commands.size, prefix, getLang("doNotDelete")));
			}
			else if (sortHelp == "category") {
				for (const [, value] of commands) {
					if (arrayInfo.some(item => item.category == value.config.category.toLowerCase())) {
						const index = arrayInfo.findIndex(item => item.category == value.config.category.toLowerCase());
						arrayInfo[index].names.push(value.config.name);
					}
					else
						arrayInfo.push({
							category: value.config.category.toLowerCase(),
							names: [value.config.name]
						});
				}
				arrayInfo.sort((a, b) => (a.category < b.category ? -1 : 1));
				for (const data of arrayInfo) {
					const categoryUpcase = `━━━ ${data.category.toUpperCase()} ━━━`;
					data.names.sort();
					msg += `${categoryUpcase}\n${data.names.join(", ")}\n\n`;
				}
				message.reply(getLang("help2", msg, characters, commands.size, prefix, getLang("doNotDelete")));
			}
		}
		// ———————————— COMMAND DOES NOT EXIST ———————————— //
		else if (!command && args[0]) {
			return message.reply(getLang("commandNotFound", args[0]));
		}
		// ————————————————— INFO COMMAND ————————————————— //
		else {
			const configCommand = command.config;
			const author = configCommand.author;

			const nameUpperCase = configCommand.name.toUpperCase();
			const title = `${characters}\n${nameUpperCase}\n${characters}`;

			const descriptionCustomLang = customLang[configCommand.name]?.longDescription;
			let description;
			if (descriptionCustomLang != undefined)
				description = '\n' + checkLangObject(descriptionCustomLang, langCode);
			else if (configCommand.longDescription)
				description = '\n' + checkLangObject(configCommand.description, langCode);
			const aliasesString = configCommand.aliases ? configCommand.aliases.join(", ") : getLang("doNotHave");
			const aliasesThisGroup = threadData.data.aliases ? (threadData.data.aliases[configCommand.name] || []).join(", ") : getLang("doNotHave");
			const roleText = configCommand.role == 0 ?
				getLang("roleText0") :
				configCommand.role == 1 ?
					getLang("roleText1") :
					getLang("roleText2");

			let guide;
			if (customLang[configCommand.name]?.guide != undefined)
				guide = customLang[configCommand.name].guide;
			else
				guide = configCommand.guide[langCode] || configCommand.guide["en"];
			guide = guide || {
				body: ""
			};
			if (typeof (guide) == "string")
				guide = { body: guide };
			const guideBody = guide.body
				.replace(/\{prefix\}|\{p\}/g, `${prefix}`)
				.replace(/\{name\}|\{n\}/g, `${configCommand.name}`)
				.replace(/\{pn\}/g, prefix + `${configCommand.name}`);

			const formSendMessage = {
				body: getLang("infoCommand", title, description, aliasesString, aliasesThisGroup, configCommand.version, roleText, configCommand.countDown || 1, author || "", guideBody)
			};

			if (guide.attachment) {
				if (typeof guide.attachment == "object") {
					formSendMessage.attachment = [];
					for (const pathFile in guide.attachment) {
						const cutFullPath = pathFile.split("/");
						cutFullPath.pop();
						for (let i = 0; i < cutFullPath.length; i++) {
							const path = `${__dirname}/${cutFullPath.slice(0, i + 1).join('/')}`;
							if (!fs.existsSync(path))
								fs.mkdirSync(path);
						}
						const getFile = await axios.get(guide.attachment[pathFile], { responseType: 'arraybuffer' });
						fs.writeFileSync(pathFile, Buffer.from(getFile.data));
					}
				}
			}
			return message.reply(formSendMessage);
		}
	}
};

function checkLangObject(data, langCode) {
	if (typeof data == "string")
		return data;
	if (typeof data == "object" && !Array.isArray(data))
		return data[langCode] || data.en || "";
	return "";
}