var { psc, bot } = require('../../index.js');
var { colors, emojis } = require('../assets');
var { Clanner, Catch } = require('../classes');
const { Soup } = require('stews');


async function data(ctx, cmd) {
	if ( Catch( cmd.onCooldown, { 
		head: `Woah there!  :face_with_spiral_eyes:`,
		text: `You can use this command again ${ cmd.cooldown.relative }`,
		time: cmd.cooldown.time
	}) ) return;

	let clans = new Clanner();
    let args = Soup.from(cmd.args);


    /* args formatting */
	var [type, id] = args;
    args.scoop(0, 1);
    var stuff = args.join(",").split(",").filter( (v) => {return v != ""});

	stuff = stuff.filter( (v) => {
		return clans.has(v, ctx.guild.id);
	});


    // !set name id value

    
    /* handling */

    if (
        Catch( !clans.has(id, ctx.guild.id) && !clans.has(type, ctx.guild.id), { text: "There is no clan with that ID." }) ||


        Catch( function() {
            if (clans.has(id, ctx.guild.id)) {
                let clan = clans.fetch(id);

                return !clan.ops.includes(ctx.author.id) && ctx.author.id != clan.owner;
            }
            else if (clans.has(type, ctx.guild.id)) {
				[type, id] = [id, type];
                let clan = clans.fetch(id);

                return !clan.ops.includes(ctx.author.id) && ctx.author.id != clan.owner;
            }
        }(),
        { text: "Only operators of the clan can edit alliances."}) ||

        Catch( !id, { text: 'Please put a clan ID.' }) ||
		
        Catch( 
			(!type || !["add", "remove"].includes(type.toLowerCase())) &&
			(!["add", "remove"].includes(id.toLowerCase())), 	
		{ text: 'Please put either add or remove.' }) ||
		
        Catch( stuff.join("") == "", { text: 'Clans to add/remove are missing or invalid.' })

    ) return;


    /* embed stuff */
    var rawEmbed = {
        title: `Clan Alliances 🛡️`,
        color: colors.success,
        footer: `( id: ${id} )`
    }

	var clan = clans.fetch(id);

    // remove
    if (type.toLowerCase() == "remove") {
		var msgStuff = [];

		clan.allies.forEach( (v) => {
			if (stuff.includes(v) && !msgStuff.includes(v)) msgStuff.push(v);
		});
		
		let filtered = clan.allies.filter( (v) => { 
			return !stuff.includes(v); 
		});

		msgStuff = msgStuff.map( (v) => {
			let clanStuff = clans.fetch(v, ctx.guild.id);
			return `***${clanStuff.name}*** (${"`"+v+"`"})`;
		});
		
		if (msgStuff.length > 1) msgStuff[msgStuff.length-1] = `and ${msgStuff[msgStuff.length-1]}`

		if (Catch( msgStuff.join("") == "", { text: 'Clans to add/remove are missing invalid or already removed.' })) return
        
		clans.set(id, "allies", filtered, ctx.guild.id);
        
		rawEmbed.description = `${emojis.success} Removed ${ (msgStuff.length == 1) ? "alliance" : "alliances" } ${msgStuff.join(", ")}`;
    }

    // add
    else if (type.toLowerCase() == "add") {
        var msgStuff = [];

		stuff.forEach( (v) => {
			if (!clan.allies.includes(v) && !msgStuff.includes(v)) {
				msgStuff.push(v);
				clan.allies.push(v);
			}
		});

		msgStuff = msgStuff.map( (v) => {
			let clanStuff = clans.fetch(v, ctx.guild.id);
			return `***${clanStuff.name}*** (${"`"+v+"`"})`;
		});
		
		if (msgStuff.length > 1) msgStuff[msgStuff.length-1] = `and ${msgStuff[msgStuff.length-1]}`

		if (
			Catch( msgStuff.join("") == "", { text: 'Clans to add/remove are missing invalid or are already added.' }) ||
			Catch( stuff.includes(id), { text: "You can't add your own clan."})
		) return
        
		clans.set(id, "allies", clan.allies, ctx.guild.id);
        
		rawEmbed.description = `${emojis.success} Added ${ (msgStuff.length == 1) ? "alliance" : "alliances" } ${msgStuff.join(", ")}`;
    }
	

	let embed = new psc.Embed(rawEmbed);

	ctx.reply({ embeds: [embed] }).catch(e=>{});
}

psc.command({ name: "allies", aliases: ["alliances"]}, data);
