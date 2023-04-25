const { Soup } = require('stews');
const { icon, banner } = require('../../config/defaults.json');

class ClanTemplate {
    constructor(ctx, id, name, setIcon, setBanner) {
		var nick = (ctx.member.nickname) ? ctx.member.nickname.split("") : ctx.author.username.split("");
		nick[0] = nick[0].toUpperCase();
		nick = nick.join("");
		
        return new Soup({
            id: id.join(""),
            name: (name) ? name : `${nick}'s Clan`,
            description: "Welcome to your brand new clan!\nUse !set to change parts of the clan to your liking.",

            shout: new Soup({
                content: "You can use !shout to change the shout.",
                author: "1050917862233100508"
            }),
            
            icon: (setIcon) ? setIcon.url : icon,
            banner: (setBanner) ? setBanner.url : banner,
            color: "rank",
            guild: ctx.guild.id,
            owner: ctx.author.id,
            members: [ ctx.author.id ],
            ops: [ ],
            bans: [ ],
            status: 1,
            unlisted: false,
	    	funds: 0,
            gold: false
        });
    }
}

module.exports = { ClanTemplate };