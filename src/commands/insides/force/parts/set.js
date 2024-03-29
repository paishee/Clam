const { AttachmentBuilder } = require('discord.js');
const Canvas = require('@napi-rs/canvas');

var { psc, bot } = require('../../../../../index.js');
var { colors, emojis, isDev, caps, pearl } = require('../../../../assets/index.js');
var { Clanner, Catch } = require('../../../../classes/index.js');
const { Soup } = require('stews');


async function data(ctx, cmd) {
    if ( Catch( cmd.onCooldown, { 
		head: `Woah there!  :face_with_spiral_eyes:`,
		text: `You can use this command again ${ cmd.cooldown.relative }`,
		time: cmd.cooldown.time
	}) ) return;
	

    /* setup */
	let clans = new Clanner();
    let args = Soup.from(cmd.args);


    /* args formatting */
	let [attr, id] = args;
    args.scoop(0, 1);
    let value = args.join(" ");


    // !set name id value

    
    /* handling */

    if (clans.has(attr, ctx.guild.id)) [attr, id] = [id, attr];

    if (
        Catch( !clans.has(id, ctx.guild.id) && !clans.has(attr, ctx.guild.id), { text: "There is no clan with that ID." }) ||


        Catch( !attr, { text: 'Please put an attribute to set.' }) ||
        Catch( !clans.canSet(attr) && !clans.canSet(id), { text: "That is not an attribute you can set."}) ||
        Catch( !id, { text: 'Please put a clan ID.' }) ||
        Catch(
            
            value=="" && // no value
            !["private", "public", "unlisted"].includes(attr.toLowerCase()) && // not a status
            ctx.attachments.size <= 0, // no attachments

            { text: 'Please put a value.' }

        )

    ) return;


    /* embed stuff */
    var rawEmbed = {
        title: `Clan Editing  :tools:`,
        color: colors.success,
        footer: `( id: ${id} )`
    }


    // name
    if (attr.toLowerCase() == "name") {
        clans.set(id, "name", value, ctx.guild.id);
        rawEmbed.description = `${emojis.success} Set clan name to ${"`"+value+"`"}`;
    }

    // description
    else if ( [ "description", "desc" ].includes(attr.toLowerCase()) ) {
        clans.set(id, "description", value, ctx.guild.id);
        rawEmbed.description = `${emojis.success} Set clan description to ${"`"+value+"`"}`;
    }

	// resize
    else if (attr.toLowerCase() == "resize") {
		let bool = ( ["true", "on"].includes(value.toLowerCase()) ) ? true : ( ["false", "off"].includes(value.toLowerCase()) ) ? false : true
        clans.set(id, "resize", bool, ctx.guild.id);
        rawEmbed.description = `${emojis.success} Set icon and banner resizing to ${"`"+bool+"`"}`;
    }

    // shout
    else if (attr.toLowerCase() == "shout") {
        clans.shout(id, value, ctx.author.id, psc.time.now.relative, ctx.guild.id);
        rawEmbed.description = `${emojis.success} Set clan shout to`;
        rawEmbed.fields = [
			{ name:"** **", value: "** **", inline: false},
            { name:"Shout:", value: `"${value}" - <@${ctx.author.id}> ${psc.time.now.relative}` , inline: false},
            { name:"** **", value: "** **", inline: false}
        ];
    }

    // id
    else if (attr.toLowerCase() == "id") {
        var clan = clans.fetch(id);
        value = value.split(" ")[0];

        if (
            Catch( !psc.author.hasPermissions(["admin"]) && !isDev(ctx.author.id), { post: false }) ||
            Catch( clans.has(value, ctx.guild.id), { text: "This server already has a clan with that id." })
        ) return;

        clans.setID(id, value, ctx.guild.id);
        rawEmbed.description = `${emojis.success} Set clan id to ${"`"+value+"`"}`;
        rawEmbed.footer = `( old id: ${id} )`;
        id = value;
    }

	// funds
    else if (attr.toLowerCase() == "funds") {
        var clan = clans.fetch(id);

        if (
            Catch( !psc.author.hasPermissions(["admin"]) && !isDev(ctx.author.id), { post: false }) ||
            Catch( !(parseInt(value)+1), { text: "Value has to be a number."}) ||
			Catch( parseInt(value) > caps.max || parseInt(value) < caps.min, { text: "Value passes the max/min caps."})
        ) return;

        clans.set(id, "funds", parseInt(value), ctx.guild.id);
        rawEmbed.description = `${emojis.success} Set clan funds to ${"`"+pearl+value+"`"}`;
    }

    // color
    else if (attr.toLowerCase() == "color") {
        var color;

        if (Soup.from(colors).includes(value.toLowerCase())) color = colors[value.toLowerCase()];

        else {
            if ( Catch( !value.startsWith("#") && value.toLowerCase() != "rank", { text: "Color must be a hex color or rank: `#FFFFFF or rank`"}) ) return;
            color = value.toLowerCase();
        }

        clans.set(id, "color", color, ctx.guild.id);
        rawEmbed.description = `${emojis.success} Set clan color to ${"`"+color.toUpperCase()+"`"}`;
    }

    // status
    else if ( ["status", "private", "public", "unlisted"].includes(attr.toLowerCase()) ) {
        if (["private", "public", "unlisted"].includes(attr.toLowerCase())) {
            clans.set(id, "status", clans.intStatus(attr.toLowerCase()), ctx.guild.id);

            rawEmbed.description = `${emojis.success} Set clan status to ${clans.status(clans.intStatus(attr.toLowerCase()))}`;
        }
        else {
            clans.set(id, "status", clans.intStatus(value.toLowerCase()), ctx.guild.id);

            rawEmbed.description = `${emojis.success} Set clan status to ${clans.status(clans.intStatus(value.toLowerCase()))}`;
        }
		rawEmbed.footer = `( id: ${id} )`;
    }

    // icon and banner
    else if ( ["icon", "banner"].includes(attr.toLowerCase()) ) {
		var clan = clans.fetch(id);
		
        if (ctx.attachments.size > 0) {
            let attachments = Soup.from(ctx.attachments);

            attachments = attachments.map( (_, v) => { return v.url; });
            attachments = attachments.filter( (_, v) => { 
                let link = v.toLowerCase();
                return link.endsWith(".png") || link.endsWith(".jpg") || link.endsWith(".jpeg") || link.endsWith(".gif") || link.endsWith(".webp"); 
            });

            if ( Catch( attachments.length <= 0, { text: "Files entered aren't useable file types: `.PNG, .JPG, .JPEG, .GIF`", deleteAfter: "4s" }) ) return;
			
            var imageURL = attachments[0];
            let image = await Canvas.loadImage(imageURL);
			
			let width = (clan.resize) ? ((attr.toLowerCase() == "icon") ? 500 : 1500) : image.width;
			let height = (clan.resize) ? 500 : image.height;
			
            const canvas = Canvas.createCanvas(width, height);
            const context = canvas.getContext('2d');

            context.drawImage(image, 0, 0, width, height);

            let attachment = new AttachmentBuilder(canvas.toBuffer("image/png"), { name: `clan-${attr.toLowerCase()}.png` });

            rawEmbed.image = `attachment://${attachment.name}`;
            rawEmbed[attr.toLowerCase()] = attachment;

            rawEmbed.description = `${emojis.success} Set clan ${attr.toLowerCase()} to`;
        }
        else {
            let link = value.toLowerCase();
            if ( 
                Catch( value=="", { text: "Please put an attachment or link to set to."}) ||
                Catch(

                    !link.endsWith(".png") && 
                    !link.endsWith(".jpg") && 
                    !link.endsWith(".jpeg") &&
                    !link.endsWith(".gif") && 
                    !link.endsWith(".webp"),
                        
                    { text: "Files entered aren't useable file types: `.PNG, .JPG, .JPEG, .GIF`" }

                )
            ) return;
			
			let image = await Canvas.loadImage(value);

			let width = (clan.resize) ? ((attr.toLowerCase() == "icon") ? 500 : 1500) : image.width;
			let height = (clan.resize) ? 500 : image.height;
			
            const canvas = Canvas.createCanvas(width, height);
            const context = canvas.getContext('2d');

            context.drawImage(image, 0, 0, width, height);

            let attachment = new AttachmentBuilder(canvas.toBuffer("image/png"), { name: `clan-${attr.toLowerCase()}.png` });

            rawEmbed.image = `attachment://${attachment.name}`;
            rawEmbed[attr.toLowerCase()] = attachment;

            rawEmbed.description = `${emojis.success} Set clan ${attr.toLowerCase()} to`;
        }
    }

    // images
    else if (attr.toLowerCase() == "images") {
		var clan = clans.fetch(id);
		
        if (ctx.attachments.size > 0) {
            let attachments = Soup.from(ctx.attachments);

            attachments = attachments.map( (_, v) => { return v.url; });
            attachments = attachments.filter( (_, v) => {
                let link = v.toLowerCase();
                return link.endsWith(".png") || link.endsWith(".jpg") || link.endsWith(".jpeg") || link.endsWith(".gif") || link.endsWith(".webp"); 
            });

            if ( Catch( attachments.length <= 0, { text: "Files entered aren't useable file types: `.PNG, .JPG, .JPEG, .GIF`", deleteAfter: "4s" }) ) return;

            var iconURL = attachments[0];
            var bannerURL = attachments[1];

			if (iconURL) {
				let image = await Canvas.loadImage(iconURL);
				
				let width = (clan.resize) ? 500 : image.width;
				let height = (clan.resize) ? 500 : image.height;
				
				let canvas = Canvas.createCanvas(width, height);
				let context = canvas.getContext('2d');

				context.drawImage(image, 0, 0, width, height);

				let attachment = new AttachmentBuilder(canvas.toBuffer("image/png"), { name: `clan-icon.png` });

				rawEmbed[ (!bannerURL) ? "image" : "thumbnail" ] = `attachment://${attachment.name}`;
				rawEmbed.icon = attachment;
			}
			if (bannerURL) {
				let image = await Canvas.loadImage(bannerURL);
				
				let width = (clan.resize) ? 1500 : image.width;
				let height = (clan.resize) ? 500 : image.height;
				
				let canvas = Canvas.createCanvas(width, height);
				let context = canvas.getContext('2d');

				context.drawImage(image, 0, 0, width, height);

				let attachment = new AttachmentBuilder(canvas.toBuffer("image/png"), { name: `clan-banner.png` });

				rawEmbed.image = `attachment://${attachment.name}`;
				rawEmbed.banner = attachment;
			}
			
            if (iconURL && bannerURL) rawEmbed.description = `${emojis.success} Set clan icon and banner to`;
        	else if (iconURL && !bannerURL) rawEmbed.description = `${emojis.success} Set clan icon to`;
        }
        else {
            var [ iconURL, bannerURL ] = value.split(" ");
            if (
                Catch( value=="", { text: "Please put an attachment or link to set to."}) ||
                Catch(

                    !iconURL.toLowerCase().endsWith(".png") && 
                    !iconURL.toLowerCase().endsWith(".jpg") && 
                    !iconURL.toLowerCase().endsWith(".jpeg") &&
                    !iconURL.toLowerCase().endsWith(".gif") && 
                    !iconURL.toLowerCase().endsWith(".webp"),
                        
                    { text: "Files entered aren't useable file types: `.PNG, .JPG, .JPEG, .GIF`" }

                )
            ) return;
            if (
                bannerURL &&
                Catch(

                    !bannerURL.toLowerCase().endsWith(".png") && 
                    !bannerURL.toLowerCase().endsWith(".jpg") && 
                    !bannerURL.toLowerCase().endsWith(".jpeg") &&
                    !bannerURL.toLowerCase().endsWith(".gif") && 
                    !bannerURL.toLowerCase().endsWith(".webp"),

                    { text: "Files entered aren't useable file types: `.PNG, .JPG, .JPEG, .GIF`" }

                )
            ) return;

			if (iconURL) {
				let image = await Canvas.loadImage(iconURL);
				
				let width = (clan.resize) ? 500 : image.width;
				let height = (clan.resize) ? 500 : image.height;
				
				let canvas = Canvas.createCanvas(width, height);
				let context = canvas.getContext('2d');

				context.drawImage(image, 0, 0, width, height);

				let attachment = new AttachmentBuilder(canvas.toBuffer("image/png"), { name: `clan-icon.png` });

				rawEmbed[ (!bannerURL) ? "image" : "thumbnail" ] = `attachment://${attachment.name}`;
				rawEmbed.icon = attachment;
			}
			if (bannerURL) {
				let image = await Canvas.loadImage(bannerURL);
				
				let width = (clan.resize) ? 1500 : image.width;
				let height = (clan.resize) ? 500 : image.height;
				
				let canvas = Canvas.createCanvas(width, height);
				let context = canvas.getContext('2d');

				context.drawImage(image, 0, 0, width, height);

				let attachment = new AttachmentBuilder(canvas.toBuffer("image/png"), { name: `clan-banner.png` });

				rawEmbed.image = `attachment://${attachment.name}`;
				rawEmbed.banner = attachment;
			}
			
            if (iconURL && bannerURL) rawEmbed.description = `${emojis.success} Set clan icon and banner to`;
        	else if (iconURL && !bannerURL) rawEmbed.description = `${emojis.success} Set clan icon to`;
        }
    }


    let embed = new psc.Embed(rawEmbed);
	
	let files = (rawEmbed.icon || rawEmbed.banner) ? [
		!!rawEmbed.icon && rawEmbed.icon,
		!!rawEmbed.banner && rawEmbed.banner
	].filter( (v) => { return v != false }) : undefined

	
    let reply = await ctx.reply({
        embeds: [embed],
		files: files
    }).catch(e=>{});

	
	// auuuggghhhhh javascript moment PAIN GOD HELP I SPENT HOURS ON THIS hehehe

	
	let stuff = reply.embeds[0];

	if (rawEmbed.icon && rawEmbed.banner) {
		clans.set(id, "icon", stuff.thumbnail.url, ctx.guild.id);
		clans.set(id, "banner", stuff.image.url, ctx.guild.id);
	}
		
	else if (rawEmbed.icon) clans.set(id, "icon", stuff.image.url, ctx.guild.id);
	else if (rawEmbed.banner) clans.set(id, "banner", stuff.image.url, ctx.guild.id);
}



module.exports = {
    name: "set",
    data: data
};
