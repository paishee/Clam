var { psc, bot } = require('../../index.js');
var { pearl, pearlify, colors, colorify, emojis, infostuffs, isDev } = require('../assets');
var { Clanner, Catch } = require('../classes');

const { Soup } = require('stews');

async function data(ctx, cmd) {
	if ( Catch( cmd.onCooldown, {
		head: `Woah there!  :face_with_spiral_eyes:`,
		text: `You can use this command again ${ cmd.cooldown.relative }`,
		time: cmd.cooldown.time
	}) ) return;


	let clans = new Clanner();
	let id = cmd.args[0];
	
	
	/* handling */
	if (
		Catch( !id, { text: "Please put a clan ID."}) ||
		Catch( !clans.has(id, ctx.guild.id), { text: "There is no clan with that ID." })
		
	) { return }


	/* the stuff */
	let clan = clans.fetch(id, ctx.guild.id);

	try {
		var name = (clan.gold) ? `${clan.name}  ${emojis.gold}` : clan.name;
		var ops = (clan.ops.join(">, <@") == []) ? "None" : `<@${clan.ops.join(">, <@")}>`;
		var status = clans.status(clan.status);
		var shout = `"${clan.shout.content}" - <@${clan.shout.author}> ${clan.shout.timestamp}`;
		
		var icon = Soup.from(clan.icon).replaceAll(" ", "_").join("");
		var banner = Soup.from(clan.banner).replaceAll(" ", "_").join("");
	}
	catch(err) {
		return Catch( true, { text: "A required part of the clan has been removed or altered.", poster: ctx.reply });
	}
	
	
	/* buttons */
	let homeButton = new psc.Button({ id: "clanGet/Home", emoji: "🏡", style: "primary" });
	let statsButton = new psc.Button({ id: "clanGet/Stats", emoji: "📊", style: "secondary" });
	let economyButton = new psc.Button({ id: "clanGet/Economy", emoji: "🛍️", style: "secondary" });
	let alliancesButton = new psc.Button({ id: "clanGet/Alliances", emoji: "⚔️", style: "secondary" });

	let row = new psc.ActionRow([ homeButton, statsButton, economyButton, alliancesButton ]);
	
	
	/* the */
	let embed = new psc.Embed({
			title: name,
			description: `${clan.description}\n\n`,
			
			
			fields: [
				
				{ name:"** **\nShout:", value: shout , inline: false},
				{ name:"** **", value: "** **", inline: false},
				{ name:"Owner", value: `<@${clan.owner}>`, inline: true},
				{ name:"** **", value: "** **", inline: true},
				{ name:"Operators", value: `${ops}`, inline: true},
				{ name:"** **", value: "** **", inline: false},

			],
			
			
			footer: {text: (ctx.guild.id == clan.guild) ? `( id: ${id} )` : `( guild id: ${clan.guild} )\n( clan id: ${id} )`},
			author: {name: `• ${status} •`},
			
			
			color: (clan.color == "rank") ? colorify(clan.funds)[0] : clan.color,
			thumbnail: icon,
			image: banner
	});
	
	
	let a = await ctx.reply( {embeds: [embed], components: [row]} ).catch(e=>{});
	

	infostuffs.push(a.id, [ ctx.author, clan ]);
	setTimeout(() => infostuffs.delete(a.id), 21600000);
}

psc.command("get", data);
